import { StoreDefinition, storeToRefs } from 'pinia'

/**
 * 使用pinia store
 * @param store
 * @returns
 */
export function usePiniaStore<T extends StoreDefinition>(store: T) {
	const storeVal = store()
	const storeRef = storeToRefs(storeVal)
	return {
		...storeVal,
		...storeRef,
	}
}
