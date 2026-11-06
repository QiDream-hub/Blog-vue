# LMJCore-Web API 参考文档

本文档只描述 HTTP API 契约：端点、参数、请求/响应与错误码。概念背景与设计说明通过以下文档提供：

| 文档 | 内容 |
|------|------|
| [CONCEPTS.md](./CONCEPTS.md) | 指针、空态与实化、对象与集合、类型系统、存储模型、init 值映射 |
| [QUERY_DESIGN.md](./QUERY_DESIGN.md) | 链式查询的路径语法、执行流程与错误模型 |
| [BATCH_DESIGN.md](./BATCH_DESIGN.md) | 批量操作的事务模型、`vars` 语义与原子性 |
| [lmjcore_web.md](./lmjcore_web.md) | 架构设计、配置管理、部署与构建 |

启动与配置见 [README](../../README.md) 和 [配置管理](./lmjcore_web.md#7-配置管理)。默认监听 `0.0.0.0:8080`。

---

## API 概览

| # | 类别 | 方法 | 端点 | 说明 |
|---|------|------|------|------|
| 1 | 对象 | `POST` | `/obj` | 分配对象指针（空态） |
| 2 | 对象 | `GET` | `/obj/{ptr}` | 获取完整对象 |
| 3 | 对象 | `GET` | `/obj/{ptr}/{member}` | 获取成员值 |
| 4 | 对象 | `PUT` | `/obj/{ptr}/{member}` | 设置成员值（首次写入即实化） |
| 5 | 对象 | `DELETE` | `/obj/{ptr}/{member}` | 删除成员 |
| 6 | 对象 | `POST` | `/obj/init` | 分配指针并填充成员（原子、支持嵌套） |
| 7 | 对象 | `DELETE` | `/obj/{ptr}` | 清空对象 |
| 8 | 对象 | `GET` | `/obj/query?path={path}` | 链式查询（深度访问） |
| 9 | 集合 | `POST` | `/set` | 分配集合指针（空态） |
| 10 | 集合 | `GET` | `/set/{ptr}` | 获取完整集合 |
| 11 | 集合 | `POST` | `/set/{ptr}/elements` | 添加元素（首次写入即实化） |
| 12 | 集合 | `DELETE` | `/set/{ptr}/elements` | 删除元素 |
| 13 | 集合 | `DELETE` | `/set/{ptr}` | 清空集合 |
| 14 | 集合 | `POST` | `/set/init` | 分配指针并填充元素（原子、支持嵌套） |
| 15 | 工具 | `GET` | `/ptr/{ptr}/exist` | 检查指针是否已实化 |
| 16 | 工具 | `GET` | `/health` | 健康检查 |
| 17 | 批量 | `GET` | `/batch` | 只读批量操作 |
| 18 | 批量 | `POST` | `/batch` | 写操作批量操作 |

---

## 通用约定

### 指针

- 34 位十六进制字符串，前两位为类型前缀：`01` = 对象，`02` = 集合。
- 示例：`01abc123def456789012345678901234`。
- 详见 [CONCEPTS.md - 指针](./CONCEPTS.md#1-指针pointer)。

### 值类型

| 方向 | `type` 取值 |
|------|-------------|
| 写（`PUT`、集合增删） | `raw`、`ref`、`null` |
| 读（成员读取、完整对象/集合、链式查询） | `raw`、`object`、`set`、`null` |

写接口不自动推断类型；读接口把 `ref` 按指针载荷细分为 `object` / `set`。映射关系见 [CONCEPTS.md - 读接口与写接口的类型词汇](./CONCEPTS.md#31-读接口与写接口的类型词汇)。

### 指针状态：空态与实化

指针的状态由 `set` 库定义：`set` 中存在以该指针为 Key 的条目即**已实化**，否则为**空态**（默认态）。分配指针不会写入存储；首次 `PUT` 成员或 `POST` 元素才完成实化。删除最后一个成员/元素（或清空全部内容）会回到空态，但**指针仍然有效**，可再次写入实化。详见 [CONCEPTS.md - 指针状态](./CONCEPTS.md#5-指针状态空态与实化)。

### 错误响应

单个请求失败时返回 JSON 对象，至少包含 `error` 字段；链式查询可能附带 `at`、`segment`、`found`、`limit` 定位字段。批量操作使用独立的 `failed_at` 信封，见 [批量响应](#批量响应)。

---

## 对象操作 API

### 1. 分配对象指针

**请求**
```http
POST /obj
```

**响应**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "ptr": "01abc123def456789012345678901234"
}
```

**说明**
- 分配一个对象指针（前缀 `01`），**不写入存储**，返回时处于空态。
- 空态指针在 `set` 库中没有条目，`GET /ptr/{ptr}/exist` 返回 `exist: false`。
- 后续 `PUT /obj/{ptr}/{member}` 首次写入即完成实化。

---

### 2. 获取完整对象

**请求**
```http
GET /obj/{ptr}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 对象指针（34 位十六进制） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ptr": "01abc123def456789012345678901234",
  "members": [
    {
      "name": "username",
      "value": "alice",
      "type": "raw"
    },
    {
      "name": "profile",
      "value": "01def456789012345678901234567890",
      "type": "object"
    },
    {
      "name": "email",
      "value": "null",
      "type": "null"
    }
  ],
  "count": 3
}
```

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Object not found"
}
```

---

### 3. 获取成员值

**请求**
```http
GET /obj/{ptr}/{member}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 对象指针 |
| `member` | string | 成员名 |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "member": "username",
  "value": "alice",
  "type": "raw"
}
```

**值类型说明**
| type | 说明 | value 格式 |
|------|------|-----------|
| `raw` | 原始数据 | 字符串 |
| `object` | 对象引用 | 以 `01` 开头的 34 位十六进制指针 |
| `set` | 集合引用 | 以 `02` 开头的 34 位十六进制指针 |
| `null` | 空值 | 字符串 `"null"` |

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Member not found"
}
```

---

### 4. 设置成员值

**请求**
```http
PUT /obj/{ptr}/{member}
Content-Type: application/json

{
  "value": "string value or 01abc123... pointer",
  "type": "raw"
}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 对象指针 |
| `member` | string | 成员名 |

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `value` | string | 是 | 要设置的值 |
| `type` | string | 是 | 值的类型：`raw`（原始数据）、`ref`（指针引用）、`null`（空值） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

**说明**
- `type` 为必填字段，不自动推断类型：
  - `raw` → 原样存储为原始数据（即使内容形似指针）；
  - `ref` → 存储为指针引用，`value` 必须是合法的 34 位十六进制指针串，否则返回 400；
  - `null` → 存储为空值；`value` 内容被忽略（字段仍须为字符串）。
- 缺失 `type` 或取值非法返回 400。
- 目标指针处于空态时写入成功，并完成首次实化；无需预先创建“实体”。

---

### 5. 删除成员

**请求**
```http
DELETE /obj/{ptr}/{member}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 对象指针 |
| `member` | string | 成员名 |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

> ⚠️ 删除**最后一个成员**后，指针回到空态（指针仍然有效），后续 `GET` 返回 404 表示没有可读内容。详见 [CONCEPTS.md - 删除最后一个成员/元素的后果](./CONCEPTS.md#51-删除最后一个成员元素的后果)。

---

### 6. 分配对象指针并填充成员（原子操作，支持嵌套）

分配对象指针后，在同一事务内完成全部成员值填充，避免先 `POST /obj` 再逐个 `PUT` 之间留下半成品对象。

**请求**
```http
POST /obj/init
Content-Type: application/json

{
  "username": "alice",
  "age": 30,
  "email": null,
  "note": "",
  "profile": {"city": "北京", "tags": ["a", "b"]},
  "ip": ["192.168.1.1", "192.168.1.2"]
}
```

**请求体**
- 请求体直接是**一个 JSON 对象**（键即成员名），无需 `members` 包装字段。
- 空对象 `{}` 允许，返回空态指针，`member_count` 为 `0`（等价于 `POST /obj`）。
- JSON 值到存储类型的映射见 [CONCEPTS.md - 初始化值映射](./CONCEPTS.md#7-初始化值映射init)：对象/数组自动递归分配指针，标量一律存为 `raw`，不做类型推断。
- 若需引用已有指针，先用 `PUT /obj/{ptr}/{member}`（`type: "ref"`）设置。
- 嵌套深度上限 64，超出返回 400。

**成功响应**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "ptr": "01abc123def456789012345678901234",
  "member_count": 8
}
```

**错误响应（自动回滚）**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "member name must not be empty (in member '') (in element [0]) (in member 'bad')"
}
```

**错误响应字段**
| 字段 | 类型 | 说明 |
|------|------|------|
| `error` | string | 失败原因（在前）与逐层失败位置（在后，如 `(in member 'x') (in element [0])`） |

**说明**
- **原子性**: 指针分配不进入事务；填充全部成员与分配所有嵌套子实体指针的写入在同一事务内完成，任一环节失败则整体回滚，不留下任何已写入的成员/集合。
- **返回指针**: `ptr` 为新对象指针（前缀 `01`），`member_count` 为根对象实际写入的成员数量。
- **事务复用**: 通过 `POST /batch` 调用时，本接口不自行提交/回滚，交由批量事务统一处理（见 [BATCH_DESIGN.md](./BATCH_DESIGN.md#6-与-init-接口的事务复用)）。
- **版本变更（1.3.0）**: 请求体由 `{"members":{...}}` 改为直接的对象映射；成员值由「仅字符串/null」扩展为任意 JSON。

---

### 7. 删除完整对象（清空内容）

**请求**
```http
DELETE /obj/{ptr}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 对象指针（34 位十六进制） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Object not found"
}
```

**说明**
- 清空对象：删除其所有成员，同时清理 `set` 库中的成员列表和 `main` 库中的成员值；指针回到空态，仍然有效，可再次写入实化。

---

### 8. 链式查询（深度访问）

沿对象图走一条确定路径并返回**单个**叶子值。多路径的组合查询由 `GET /batch` 负责（一次请求内共享同一只读事务快照）。

**请求**
```http
GET /obj/query?path={path}
```

**查询参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | string | 查询路径：`<34位指针>.<成员名>[.<成员名>...]` |

**路径语法**
- 根段必须是**对象**指针（`01` 前缀）；集合指针（`02`）返回 400。
- 成员名中的字面 `.` 写作 `%2E`，逐段 URL 解码（`file.txt`、`user.name` 可正常寻址）。
- 空段（`01ab..a`、`01ab.a.`）与缺少成员段（仅 `01ab`）都是语法错误。
- 成员段数上限由 `query_max_depth` 控制（默认 64）。

**示例**
```http
GET /obj/query?path=01abc123.user.profile.name
GET /obj/query?path=01abc123.a%2Eb        # 成员名为 "a.b"
```

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "path": "01abc123.user.profile.name",
  "value": "alice",
  "type": "raw"
}
```

| type | value 形态 | 说明 |
|------|-----------|------|
| `raw` | 原始文本 | 叶子为原始数据 |
| `object` | 34 位指针（`01…`） | 叶子是对象引用（不自动解引用） |
| `set` | 34 位指针（`02…`） | 叶子是集合引用 |
| `null` | `"null"` | 空值 |

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Member not found",
  "at": "01abc123/user/profile",
  "segment": 2
}
```

| 场景 | 状态码 | error |
|------|--------|-------|
| 路径语法错误（空段 / 缺成员段） | 400 | `Invalid query path` |
| 根段不是合法指针 | 400 | `Invalid pointer format` |
| 根段或中间目标是集合 | 400 | `Set does not support member access` |
| 中间值不是引用 | 400 | `Intermediate value is not a reference` |
| 超过深度上限 | 400 | `Query path too deep` |
| 中间对象处于空态（无内容） | 404 | `Object not found` |
| 成员不存在（或已注册但无值） | 404 | `Member not found` |
| 叶子值超过 `max_value_bytes` | 413 | `Value too large` |
| 事务超时 | 408 | `Transaction timeout` |

**错误定位字段**
| 字段 | 说明 |
|------|------|
| `at` | 失败位置，形如 `<指针>/<段>/<段>`（仅在有明确位置时出现） |
| `segment` | 失败段索引（`0` = 根指针段，`1` = 第一个成员段） |
| `found` | 中间值不是引用时实际观测到的存储类型（`raw` / `null` / `set`） |
| `limit` | 413 时生效的上限值 |

**说明**
- 只读、单值访问，每段一次精确读取，代价 O(深度)；不枚举成员。
- 在 `GET /batch` 中复用共享事务，多条路径共享同一 MVCC 快照。
- 叶子值按需增长至 `max_value_bytes`（默认 8192，超限 413）。
- 路径语法、执行流程与错误模型的完整说明见 [QUERY_DESIGN.md](./QUERY_DESIGN.md)。

---

## 集合操作 API

### 9. 分配集合指针

**请求**
```http
POST /set
```

**响应**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "ptr": "02def456789012345678901234567890"
}
```

**说明**
- 分配一个集合指针（前缀 `02`），**不写入存储**，返回时处于空态。
- 空态指针在 `set` 库中没有条目，`GET /ptr/{ptr}/exist` 返回 `exist: false`。
- 后续 `POST /set/{ptr}/elements` 首次写入即完成实化。

---

### 10. 获取完整集合

**请求**
```http
GET /set/{ptr}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 集合指针 |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ptr": "02def456789012345678901234567890",
  "elements": [
    {
      "value": "apple",
      "type": "raw"
    },
    {
      "value": "01abc123def456789012345678901234",
      "type": "object"
    },
    {
      "value": "null",
      "type": "null"
    }
  ],
  "count": 3
}
```

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Set not found"
}
```

**说明**
- 集合无序，不保证插入顺序，并按字典序返回（见 [CONCEPTS.md - 集合的无序性](./CONCEPTS.md#6-集合的无序性)）。
- 元素可以是原始数据、`null` 或对象/集合指针。

---

### 11. 添加元素

**请求**
```http
POST /set/{ptr}/elements
Content-Type: application/json

{
  "value": "element value",
  "type": "raw"
}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 集合指针 |

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `value` | string | 是 | 要添加的元素值 |
| `type` | string | 是 | 元素类型：`raw` / `ref` / `null`（不自动推断，缺失或非法返回 400） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

**错误响应**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Element already exists"
}
```

---

### 12. 删除元素

**请求**
```http
DELETE /set/{ptr}/elements
Content-Type: application/json

{
  "value": "element value",
  "type": "raw"
}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 集合指针 |

**请求体**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `value` | string | 是 | 要删除的元素值 |
| `type` | string | 是 | 元素类型：`raw` / `ref` / `null`（不自动推断，缺失或非法返回 400） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

> ⚠️ 删除**最后一个元素**后，指针回到空态（指针仍然有效），后续 `GET` 返回 404 表示没有可读内容。与对象规则相同，详见 [CONCEPTS.md - 删除最后一个成员/元素的后果](./CONCEPTS.md#51-删除最后一个成员元素的后果)。

---

### 13. 删除完整集合（清空内容）

**请求**
```http
DELETE /set/{ptr}
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 集合指针（34 位十六进制） |

**成功响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

**错误响应**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Set not found"
}
```

**说明**
- 清空集合：删除其所有元素；指针回到空态，仍然有效，可再次写入实化。

---

### 14. 分配集合指针并填充元素（原子操作，支持嵌套）

分配集合指针后，在同一事务内完成全部元素填充，避免先 `POST /set` 再逐个 `POST /set/{ptr}/elements` 之间留下半成品集合。

**请求**
```http
POST /set/init
Content-Type: application/json

["apple", 21, "192.168.1.1", {"name": "小李"}, ["x", "y"], null, ""]
```

**请求体**
- 请求体直接是**一个 JSON 数组**（元素列表），无需 `elements` 包装字段。
- 空数组 `[]` 允许，返回空态指针，`element_count` 为 `0`（等价于 `POST /set`）。
- JSON 值到存储类型的映射见 [CONCEPTS.md - 初始化值映射](./CONCEPTS.md#7-初始化值映射init)：对象/数组自动递归分配指针，标量一律存为 `raw`，不做类型推断。
- 若需引用已有指针，用 `POST /set/{ptr}/elements`（`type: "ref"`）添加。
- 嵌套深度上限 64，超出返回 400。
- 集合自动去重：请求中重复的元素（包括重复的 `null`）不报错。

**成功响应**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "ptr": "02def456789012345678901234567890",
  "element_count": 6
}
```

**错误响应（自动回滚）**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "nesting depth exceeds max 64 (in element [0]) (in element [0])"
}
```

**错误响应字段**
| 字段 | 类型 | 说明 |
|------|------|------|
| `error` | string | 失败原因（在前）与逐层失败位置（在后） |

**说明**
- **原子性**: 指针分配不进入事务；添加全部元素与分配所有嵌套子实体指针的写入在同一事务内完成，任一环节失败则整体回滚，不留下任何已写入的元素/对象。
- **返回指针**: `ptr` 为新集合指针（前缀 `02`），`element_count` 为去重后的元素数量。
- **事务复用**: 通过 `POST /batch` 调用时，本接口不自行提交/回滚，交由批量事务统一处理（见 [BATCH_DESIGN.md](./BATCH_DESIGN.md#6-与-init-接口的事务复用)）。
- **版本变更（1.3.0）**: 请求体由 `{"elements":[...]}` 改为直接的 JSON 数组；元素值由「仅字符串/null」扩展为任意 JSON。

---

## 工具接口 API

### 15. 检查指针是否已实化

**请求**
```http
GET /ptr/{ptr}/exist
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| `ptr` | string | 要检查的指针 |

**存在响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "exist": true,
  "type": "object"
}
```

**空态响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "exist": false
}
```

**类型说明**
| type | 说明 |
|------|------|
| `object` | 对象类型（指针前缀 `01`） |
| `set` | 集合类型（指针前缀 `02`） |

**说明**
- `exist` 表示指针是否**已实化**：只有当 `set` 中存在以其指针为 Key 且至少有一个 value 的条目时才为 `true`。
- 已分配但从未写入（或已被清空/删光成员元素）的指针返回 `exist: false`，但这并不表示指针无效。
- `type` 字段按指针前缀给出对象/集合类型，与实际是否实化无关。

---

### 16. 健康检查

**请求**
```http
GET /health
```

**响应**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "uptime": 12345
}
```

**字段说明**
| 字段 | 说明 |
|------|------|
| `status` | 服务状态（`ok` 表示正常） |
| `uptime` | 运行时间（秒） |

---

## 批量操作 API

批量操作通过 HTTP 方法区分事务类型：

| 方法 | 端点 | 事务类型 | 允许的操作 |
|------|------|----------|------------|
| `GET` | `/batch` | 只读事务 | 仅 `GET` |
| `POST` | `/batch` | 写事务 | `GET`/`PUT`/`POST`/`DELETE` |

事务模型、`vars` 替换算法与原子性细节见 [BATCH_DESIGN.md](./BATCH_DESIGN.md)。

### 17. GET /batch：只读批量操作

**请求**
```http
GET /batch
Content-Type: application/json

{
  "operations": [
    {
      "method": "GET",
      "path": "/obj/01abc123..."
    },
    {
      "method": "GET",
      "path": "/obj/01abc123.../name"
    },
    {
      "method": "GET",
      "path": "/set/02def456..."
    }
  ]
}
```

**请求体字段**
| 字段 | 类型 | 说明 |
|------|------|------|
| `operations` | array | 操作列表，最大 1000 个操作，仅允许 `GET` 操作 |

**说明**
- 使用只读事务（`LMJCORE_TXN_READONLY`），保证读取一致性；`GET` 请求同样携带 JSON 请求体。
- 如操作中包含 `PUT`/`POST`/`DELETE`，返回 400 `Readonly transaction cannot contain write operations`。

---

### 18. POST /batch：写操作批量操作

**请求**
```http
POST /batch
Content-Type: application/json

{
  "operations": [
    {
      "method": "PUT",
      "path": "/obj/01abc123.../name",
      "body": {"value": "Alice", "type": "raw"}
    },
    {
      "method": "GET",
      "path": "/obj/01abc123..."
    },
    {
      "method": "DELETE",
      "path": "/obj/01abc123.../temp"
    }
  ]
}
```

**请求体字段**
| 字段 | 类型 | 说明 |
|------|------|------|
| `operations` | array | 操作列表，最大 1000 个操作 |

**操作结构**
| 字段 | 类型 | 说明 |
|------|------|------|
| `method` | string | HTTP 方法：`GET`、`PUT`、`POST`、`DELETE` |
| `path` | string | 完整路径，如 `/obj/{ptr}`、`/obj/{ptr}/{member}`、`/set/{ptr}` |
| `body` | object/array | 可选，原样透传给目标端点。写值的操作（`PUT /obj/{ptr}/{member}`、`POST`/`DELETE /set/{ptr}/elements`）需为 `{"value": "...", "type": "raw"\|"ref"\|"null"}`；`POST /obj/init`、`POST /set/init` 可传任意 JSON；`POST /obj`、`POST /set`、`DELETE /obj/{ptr}`、`DELETE /set/{ptr}` 无需 body |
| `vars` | object | 可选，本次操作的字符串替换表：`{"token": "{N:key}"}`，仅作用于声明它的操作 |

**说明**
- 所有操作在同一事务内执行，任一操作失败则全部回滚。
- `POST /obj`、`POST /set` 只分配指针、不写入存储，因此不参与写事务；其返回的指针在批次内可直接用于后续操作。
- 支持所有操作类型，限制总时长（默认 5 秒超时）。
- 最多支持 1000 个操作；空 `operations` 数组返回 400。

### 批量响应

**成功响应（GET /batch 和 POST /batch 相同）**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "results": [
    {
      "status": 200,
      "body": {"success": true}
    },
    {
      "status": 200,
      "body": {
        "ptr": "01abc123def456789012345678901234",
        "type": "object"
      }
    },
    {
      "status": 200,
      "body": {"success": true}
    }
  ]
}
```

- `results` 中每个元素对应一个操作：`status` 为该操作的 HTTP 状态码，`body` 为该操作的响应体（无响应体时为 `null`）。

**失败响应**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "failed_at": 1,
  "details": {
    "error": "Object not found"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 始终为 `false` |
| `failed_at` | number | 失败操作的索引（从 0 开始） |
| `details` | object | 失败操作的原始响应体，可能附带 `at`、`segment` 等定位字段 |

**错误处理**
- 失败响应的 HTTP 状态固定为 400，具体原因看 `details`。
- 事务超时返回顶层 408 `Transaction timeout`，不带 `failed_at`。
- 请求本身非法（缺少 `operations`、JSON 解析失败等）返回 400 `{"error":"..."}`。

### 变量替换（vars）

`vars` 用于引用本批次中**已执行**操作的结果，格式为 `{"token": "{N:key}"}`：`N` 为被引用操作的索引（必须小于当前操作索引），`key` 为该操作响应 `body` 的顶层字段。

- 替换范围为本操作的 `path` 与 `body` 中所有字符串值（递归包含嵌套对象/数组），不替换 body 的键。
- 单遍替换，非级联；引用值只能是字符串或数字（数字转为文本）。
- 任一环节失败（格式非法、引用未执行的操作、字段缺失、值类型不支持）都会使该操作失败并回滚整批。

完整规则与失败条件见 [BATCH_DESIGN.md - vars 变量替换](./BATCH_DESIGN.md#3-vars-变量替换)。

**示例：分配指针并在同一批次中设置属性**
```json
{
  "operations": [
    {
      "method": "POST",
      "path": "/obj/init",
      "body": {"name": "Alice"}
    },
    {
      "method": "PUT",
      "path": "/obj/ptr/age",
      "body": {"value": "30", "type": "raw"},
      "vars": {"ptr": "{0:ptr}"}
    },
    {
      "method": "GET",
      "path": "/obj/ptr",
      "vars": {"ptr": "{0:ptr}"}
    }
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

**示例：只读批量查询**
```bash
curl -X GET http://localhost:8080/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"method": "GET", "path": "/obj/01abc123..."},
      {"method": "GET", "path": "/obj/01abc123.../name"},
      {"method": "GET", "path": "/set/02def456..."}
    ]
  }'
```

---

## 错误码参考

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数错误 / 批量操作失败 |
| 404 | 空态/无内容或成员不存在 |
| 405 | 方法不允许（只读事务中执行写操作） |
| 408 | 事务超时 |
| 409 | 元素已存在 |
| 413 | 值或响应超过大小上限 |
| 500 | 服务器错误 |

### LMJCore 错误码

| 错误码 | 值 | HTTP 映射 | 说明 |
|--------|-----|----------|------|
| `LMJCORE_SUCCESS` | 0 | 200 | 成功 |
| `LMJCORE_ERROR_INVALID_PARAM` | -32000 | 400 | 参数无效 |
| `LMJCORE_ERROR_MEMBER_TOO_LONG` | -32002 | 400 | 成员名长度超限 |
| `LMJCORE_ERROR_READONLY_TXN` | -32020 | 405 | 只读事务中执行写操作 |
| `LMJCORE_ERROR_ENTITY_NOT_FOUND` | -32040 | 404 | 指针处于空态（无内容） |
| `LMJCORE_ERROR_ENTITY_TYPE_MISMATCH` | -32042 | 400 | 实体类型不匹配 |
| `LMJCORE_ERROR_MEMBER_NOT_FOUND` | -32060 | 404 | 成员不存在 |
| `LMJCORE_ERROR_MEMBER_MISSING` | -32062 | 404 | 成员缺少值 |
| `LMJCORE_ERROR_MEMORY_ALLOCATION_FAILED` | -32080 | 500 | 内存分配失败 |
| `LMJCORE_ERROR_TXN_TIMEOUT` | -32101 | 408 | 事务超时 |
| `LMJCORE_ERROR_PATH_PARSE` | -32121 | 400 | 路径解析错误 |
| `LMJCORE_ERROR_PATH_TOO_DEEP` | -32122 | 400 | 路径深度超限 |
| `LMJCORE_ERROR_PATH_INVALID_PTR` | -32123 | 400 | 无效的起始指针 |
| `LMJCORE_ERROR_PATH_URL_DECODE` | -32124 | 400 | 路径 URL 解码失败 |
| `LMJCORE_ERROR_VALUE_TOO_LARGE` | -32125 | 413 | 值或响应超出大小上限 |
| `LMJCORE_ERROR_SET_NOT_SUPPORTED` | -32141 | 400 | 集合不支持成员访问 |
| `LMJCORE_ERROR_INVALID_TYPE` | -32142 | 400 | 无效的值类型标记 |
| `LMJCORE_ERROR_TYPE_MISMATCH` | -32143 | 400 | 类型不匹配 |

---

## 参考文档

- [概念与存储模型](./CONCEPTS.md)
- [链式查询设计](./QUERY_DESIGN.md)
- [批量操作设计](./BATCH_DESIGN.md)
- [架构与详细设计](./lmjcore_web.md)
- [LMJCore 概念指南](../../thirdparty/LMJCore/doc/core/LMJCore 概念指南.md)
- [LMJCore 核心存储模型](../../thirdparty/LMJCore/doc/core/LMJCore 核心存储模型.md)
- [LMJCore 核心设计定义](../../thirdparty/LMJCore/doc/core/LMJCore 核心设计定义.md)
- [LMJCore 事务模型](../../thirdparty/LMJCore/doc/core/LMJCore 事务模型.md)
