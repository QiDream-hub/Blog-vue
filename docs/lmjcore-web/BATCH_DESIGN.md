# 批量操作设计

本文描述 `GET /batch` 与 `POST /batch` 的事务语义、`vars` 替换规则与错误模型。请求/响应报文格式见 [API_REFERENCE.md - 批量操作 API](./API_REFERENCE.md#批量操作-api)；链式查询在批量中的协作方式见 [QUERY_DESIGN.md - 事务与批量契约](./QUERY_DESIGN.md#6-事务与批量契约)。

## 1. 定位与边界

| 接口 | 职责 |
|------|------|
| `GET /batch` | **只读整合层**：一次请求内执行多条只读操作，共享同一 MVCC 快照 |
| `POST /batch` | **写事务整合层**：一次请求内执行多条读写操作，整批原子提交或回滚 |

批量层只负责「解析操作列表 → 复用路由器分发 → 汇总结果」，不重复实现对象/集合语义。每个子操作仍走与独立请求相同的处理器，因此参数校验、错误码与响应格式完全一致。

不承担的能力：

- 不做跨操作依赖分析（依赖只能通过 `vars` 显式声明）；
- 不支持部分提交（需要容错时请拆成多次 batch 调用）；
- 不提供嵌套 batch 的独立事务（子操作共享外层事务）。

## 2. 事务模型

| 维度 | `GET /batch` | `POST /batch` |
|------|--------------|---------------|
| LMJCore 事务 | `LMJCORE_TXN_READONLY` | 写事务 |
| 允许的方法 | 仅 `GET` | `GET` / `PUT` / `POST` / `DELETE` |
| 结束方式 | 直接结束只读事务 | 全部成功后提交，任一失败回滚 |
| 超时 | 受 `txn_timeout`（默认 5 秒）约束 | 同左 |

- 只读批次中出现 `PUT` / `POST` / `DELETE` 时，在开启事务前直接返回 400：`Readonly transaction cannot contain write operations`。
- 批次执行期间逐条检查事务超时；超时返回顶层 `408 Transaction timeout`，整批不提交。
- 子处理器统一设置 `auto_manage_txn = false`，不自行开启、提交或回滚事务。
- `POST /obj`、`POST /set` 只分配指针、不写入存储，因此不参与写事务；其返回的指针可在同批次后续操作中直接使用。

## 3. vars 变量替换

`vars` 让后续操作引用**本批次中已执行操作**的结果，避免「先分配指针、再按返回指针写入」的两次请求。

### 3.1 语法

```json
{"token": "{N:key}"}
```

| 部分 | 说明 |
|------|------|
| `token` | 用户自定义的替换令牌，不能与 path/body 中的其他文本冲突；不得为空 |
| `N` | 被引用操作的索引（从 0 开始），必须小于当前操作索引 |
| `key` | 该操作响应体（`body`）的顶层字段名 |

引用值必须来自已执行操作的响应 `body` 对象，且 `key` 对应字段的值只能是**字符串或数字**：字符串直接使用，数字转为文本；布尔、`null`、数组、对象会报错。

### 3.2 替换规则

- 替换范围为本操作的 `path` 与 `body` 中所有字符串值（递归包含嵌套对象/数组），**不替换 body 的键**；
- 纯文本单遍替换，非级联：替换值中即使包含其他 token 也不会再次展开；
- 每个位置按「最长匹配」选择 token；
- `path` 中的替换值原样注入（指针为十六进制字符，无需转义）。

### 3.3 失败条件

以下任一情况都会使该操作失败，返回 `failed_at` 并回滚整个事务：

- `vars` 不是 JSON 对象；
- 令牌为空，或引用表达式不是 `{N:key}` 形式；
- `N` 大于等于当前操作索引（引用了尚未执行的操作）；
- 被引用操作的响应没有对象形式的 `body`；
- `key` 在响应体中不存在，或长度超过 511 字节；
- 引用值为布尔、`null`、数组或对象。

## 4. 原子性与失败定位

batch 是**全有或全无**的：任一操作返回 `>= 400` 即终止后续操作、回滚整批事务，并返回：

```json
{
  "success": false,
  "failed_at": 1,
  "details": {"error": "Object not found"}
}
```

| 字段 | 说明 |
|------|------|
| `success` | 始终为 `false` |
| `failed_at` | 失败操作的索引（从 0 开始） |
| `details` | 失败操作的原始响应体，可能包含 `error`、`at`、`segment` 等定位字段 |

注意：

- 失败响应的 HTTP 状态固定为 **400**，具体失败原因在 `details` 中；
- 子处理器返回 `4xx/5xx` 即视为失败，不能依赖处理器的返回值判断（`RETURN_ERROR_*` 宏返回 0）；
- 事务超时是批次级错误，返回顶层 408，不带 `failed_at`。

成功时返回 `200` 与 `results` 数组，每个元素对应一个操作：

```json
{
  "success": true,
  "results": [
    {"status": 200, "body": {"success": true}},
    {"status": 200, "body": {"ptr": "01abc...", "type": "object"}}
  ]
}
```

- `status` 为该操作自身的 HTTP 状态码；
- `body` 为该操作的响应体；处理器无响应体时为 `null`。

## 5. 操作限制

| 限制 | 值 | 行为 |
|------|-----|------|
| 单批操作数上限 | 1000 | 超出返回 400 `Too many operations (max 1000)` |
| 空操作列表 | 不允许 | 返回 400 `Operations array is empty` |
| `operations` 字段 | 必须为数组 | 缺失或类型错误返回 400 |
| 事务超时 | `txn_timeout`，默认 5 秒 | 返回 408 `Transaction timeout` |

## 6. 与 init 接口的事务复用

`POST /obj/init` 与 `POST /set/init` 在独立请求中自行开启并提交事务；当它们作为 batch 子操作执行时，检测到共享事务（`hp->txn` 非空）便不再自行提交/回滚，改由批量层统一处理。因此：

- init 的指针分配不进入事务，返回的 `ptr` 在批次内立即可用；
- init 的成员/元素写入在批次提交后才真正可见（提交前表现为空态）；
- 批次中后续操作可以通过 `vars` 引用 init 返回的 `ptr`；
- init 失败时，其已写入的嵌套子对象/集合随整批一起回滚；已分配的指针回到空态，仍可继续使用。

## 7. 完整示例

在同一批次内分配对象指针、引用新指针写入成员并读回：

```json
{
  "operations": [
    {"method": "POST", "path": "/obj/init", "body": {"name": "Alice"}},
    {
      "method": "PUT",
      "path": "/obj/ptr/age",
      "body": {"value": "30", "type": "raw"},
      "vars": {"ptr": "{0:ptr}"}
    },
    {"method": "GET", "path": "/obj/ptr", "vars": {"ptr": "{0:ptr}"}}
  ]
}
```

```bash
curl -X POST http://localhost:8080/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"method": "POST", "path": "/obj/init", "body": {"name": "Alice"}},
      {"method": "PUT", "path": "/obj/ptr/age",
       "body": {"value": "30", "type": "raw"},
       "vars": {"ptr": "{0:ptr}"}},
      {"method": "GET", "path": "/obj/ptr", "vars": {"ptr": "{0:ptr}"}}
    ]
  }'
```

## 8. 实现模块

```
src/handlers/batch_handle.c   批量解析、事务管理、vars 替换、结果汇总
include/batch_handle.h        handle_batch_get / handle_batch_post 声明
src/handlers/query_handle.c   链式查询（作为 batch 子操作时复用共享事务）
```
