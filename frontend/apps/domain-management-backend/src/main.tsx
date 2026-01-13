import { createApp } from 'vue'
import pinia from '@/stores'
import App from '@/App'
import router from '@/router'
import { i18n } from '@locales/index'
import { useModalUseDiscrete } from '@baota/naive-ui/hooks'
import 'virtual:svg-icons-register' // 引入 SVG 图标
import 'virtual:uno.css'
import '@styles/index.css' // 样式现在通过 UnoCSS 管理，无需单独导入
import '@styles/mobile.css' // 移动端相关调整

// 创建应用实例
const app = createApp(App)
app.use(router) // 路由
app.use(pinia) // 使用状态管理
app.use(i18n) // 国际化

// 开发环境按需启动 Mock
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  import('./mocks').then(({ startMock }) => startMock())
}

app.mount('#app')

// 设置资源
useModalUseDiscrete({ i18n, router, pinia })
