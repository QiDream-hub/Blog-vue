// 主题配置数据源
// 所有主题的完整定义，使用 CSS 变量名作为 key

export const themes = {
  sakura: {
    name: '樱花粉',
    icon: '🌸',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff7aae',
      '--secondary-color': '#5d8aa8',
      '--bg-color': '#ffffff',
      '--bg-secondary-color': '#fafafa',
      '--text-color': '#333333',
      '--text-secondary-color': '#555555',

      // --- 状态色 ---
      '--selected-color': '#ff5c9d',
      '--selected-bg-color': 'rgba(255, 158, 181, 0.1)',
      '--hover-bg-color': 'rgba(255, 158, 181, 0.08)',

      // --- 功能色 ---
      '--meta-color': '#999999',
      '--description-color': '#6a8ba8',
      '--border-color': 'rgba(93, 138, 168, 0.15)',
      '--border-light-color': 'rgba(93, 138, 168, 0.1)',
      '--tag-bg-color': 'rgba(255, 158, 181, 0.15)',
      '--tag-text-color': '#ff7aae',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(93, 138, 168, 0.08)',
      '--shadow-md': '0 4px 12px rgba(93, 138, 168, 0.12)',
      '--shadow-lg': '0 6px 20px rgba(93, 138, 168, 0.18)',
      '--shadow-primary': '0 4px 16px rgba(255, 122, 174, 0.3)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  },

  midnight: {
    name: '午夜蓝',
    icon: '🌙',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff8fb8',
      '--secondary-color': '#7ab8e8',
      '--bg-color': '#1a1a2e',
      '--bg-secondary-color': '#16213e',
      '--text-color': '#e8e8e8',
      '--text-secondary-color': '#c0c0c0',

      // --- 状态色 ---
      '--selected-color': '#ff6b9d',
      '--selected-bg-color': 'rgba(255, 143, 184, 0.15)',
      '--hover-bg-color': 'rgba(255, 143, 184, 0.1)',

      // --- 功能色 ---
      '--meta-color': '#888888',
      '--description-color': '#7ab8e8',
      '--border-color': 'rgba(122, 184, 232, 0.2)',
      '--border-light-color': 'rgba(122, 184, 232, 0.1)',
      '--tag-bg-color': 'rgba(255, 143, 184, 0.2)',
      '--tag-text-color': '#ff8fb8',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.2)',
      '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 6px 20px rgba(0, 0, 0, 0.4)',
      '--shadow-primary': '0 4px 16px rgba(255, 143, 184, 0.25)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  },

  forest: {
    name: '森林绿',
    icon: '🌲',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#5cb87a',
      '--secondary-color': '#8fb85d',
      '--bg-color': '#f5f7f3',
      '--bg-secondary-color': '#ffffff',
      '--text-color': '#2d3a2f',
      '--text-secondary-color': '#4a5a4d',

      // --- 状态色 ---
      '--selected-color': '#4a9d6a',
      '--selected-bg-color': 'rgba(92, 184, 122, 0.12)',
      '--hover-bg-color': 'rgba(92, 184, 122, 0.08)',

      // --- 功能色 ---
      '--meta-color': '#889988',
      '--description-color': '#6a8b5d',
      '--border-color': 'rgba(143, 184, 93, 0.2)',
      '--border-light-color': 'rgba(143, 184, 93, 0.1)',
      '--tag-bg-color': 'rgba(92, 184, 122, 0.15)',
      '--tag-text-color': '#5cb87a',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(143, 184, 93, 0.08)',
      '--shadow-md': '0 4px 12px rgba(143, 184, 93, 0.12)',
      '--shadow-lg': '0 6px 20px rgba(143, 184, 93, 0.18)',
      '--shadow-primary': '0 4px 16px rgba(92, 184, 122, 0.25)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  },

  sunset: {
    name: '落日橙',
    icon: '🌅',
    variables: {
      // --- 核心配色 ---
      '--primary-color': '#ff8a5c',
      '--secondary-color': '#e8b87a',
      '--bg-color': '#fffbf7',
      '--bg-secondary-color': '#fff9f2',
      '--text-color': '#3d2a1f',
      '--text-secondary-color': '#5a4a3f',

      // --- 状态色 ---
      '--selected-color': '#ff6b3d',
      '--selected-bg-color': 'rgba(255, 138, 92, 0.12)',
      '--hover-bg-color': 'rgba(255, 138, 92, 0.08)',

      // --- 功能色 ---
      '--meta-color': '#998877',
      '--description-color': '#c9985a',
      '--border-color': 'rgba(232, 184, 122, 0.2)',
      '--border-light-color': 'rgba(232, 184, 122, 0.1)',
      '--tag-bg-color': 'rgba(255, 138, 92, 0.15)',
      '--tag-text-color': '#ff8a5c',

      // --- 阴影 ---
      '--shadow-sm': '0 1px 3px rgba(232, 184, 122, 0.08)',
      '--shadow-md': '0 4px 12px rgba(232, 184, 122, 0.12)',
      '--shadow-lg': '0 6px 20px rgba(232, 184, 122, 0.18)',
      '--shadow-primary': '0 4px 16px rgba(255, 138, 92, 0.25)',

      // --- 动画变量 ---
      '--anim-duration': '0.3s',
      '--anim-easing': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      '--anim-translate-y': '20px',
      '--transition-bg-color': 'background-color 0.3s ease',
      '--transition-base': 'all 0.3s ease',
      '--transition-shadow': 'box-shadow 0.3s ease',
      '--transition-transform': 'transform 0.3s ease'
    }
  }
}

// 默认主题
export const defaultThemeKey = 'sakura'

// 获取主题元信息（不包含变量）
export function getThemeMeta(themeKey) {
  const theme = themes[themeKey]
  if (!theme) {
    console.warn(`Theme "${themeKey}" not found, falling back to default`)
    return { name: '樱花粉', icon: '🌸' }
  }
  return { name: theme.name, icon: theme.icon }
}

// 获取所有主题的元信息
export function getAllThemeMetas() {
  return Object.fromEntries(
    Object.entries(themes).map(([key, theme]) => [key, { name: theme.name, icon: theme.icon }])
  )
}
