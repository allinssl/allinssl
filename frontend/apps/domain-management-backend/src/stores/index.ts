/**
 * Pinia Store 主入口文件
 * 配置和导出所有 store
 */

import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 创建 Pinia 实例
const pinia = createPinia()

// 配置持久化插件
pinia.use(
  createPersistedState({
    // 默认使用 localStorage
    storage: localStorage,
    // 序列化配置
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
    // 默认不持久化，需要在各个 store 中单独配置
    auto: false,
  })
)

export default pinia
