import 'fake-indexeddb/auto'
import { vi } from 'vitest'
import { indexedDB, IDBKeyRange } from 'fake-indexeddb'
// 设置全局变量
globalThis.indexedDB = indexedDB
globalThis.IDBKeyRange = IDBKeyRange
// 清理 IndexedDB 数据库的辅助函数
async function clearIndexedDB() {
	const databases = indexedDB._databases
	if (databases && databases instanceof Map) {
		const databaseNames = Array.from(databases.keys())
		await Promise.all(
			databaseNames.map(
				(name) =>
					new Promise((resolve, reject) => {
						const request = indexedDB.deleteDatabase(name)
						request.onerror = () => reject(request.error)
						request.onsuccess = () => resolve()
					}),
			),
		)
	}
}
// 清理函数
beforeEach(async () => {
	// 重置所有模拟
	vi.resetModules()
	// 清理 indexedDB
	await clearIndexedDB()
})
// 测试完成后清理
afterEach(async () => {
	// 清理 indexedDB
	await clearIndexedDB()
})
//# sourceMappingURL=setup.js.map
