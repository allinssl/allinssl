import { pinia } from '@baota/pinia'
import { router } from '@router/index'
import { i18n } from '@locales/index'
import { useModalUseDiscrete } from '@baota/naive-ui/hooks'
import App from './App' // 根组件

import 'virtual:svg-icons-register'
import 'normalize.css' // 样式修复一致性
import '@styles/reset.css' // 重置样式
import '@styles/variable.css' // 全局变量
import '@styles/transition.css' // 过渡动画
import '@styles/icon.css' // css 图标
import '@styles/naive-override.css' // 覆盖 Naive UI 样式
import { directives, useDirectives } from '@lib/directive'

// 引入mock
// import '../mock/access'

const app = createApp(App)
app.use(router) // 路由
app.use(pinia) // 使用状态管理
app.use(i18n) // 国际化
app.mount('#app') // 挂载到DOM

// 注册自定义指令
useDirectives(app, directives)

// 设置资源
useModalUseDiscrete({ i18n, router, pinia })
