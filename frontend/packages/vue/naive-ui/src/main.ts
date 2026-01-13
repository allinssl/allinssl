import { createApp } from 'vue'
// 导入全局样式
import './styles/index.css'
// 导入根组件
import App from './App.vue'

// 创建 Vue 应用实例
const app = createApp(App)
// 挂载应用到 DOM
app.mount('#app')
