import { createPinia, defineStore, storeToRefs } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 创建pinia实例
const pinia = createPinia()

// 全局持久化
pinia.use(piniaPluginPersistedstate)

export { pinia, defineStore, storeToRefs }
