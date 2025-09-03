import { defineStore, storeToRefs } from 'pinia';
import type { AddPrivateCaParams } from './types';

// 根证书类型
export interface RootCaItem {
	id: number;
	name: string;
	cn: string;
	o: string;
	c: string;
	algorithm: 'rsa' | 'ecdsa' | 'sm2';
	key_length: number;
	not_before: string;
	not_after: string;
	create_time: string;
	root_id: number | null;
}

export const usePrivateCaStore = defineStore('private-ca-store', () => {
	const createType = ref<'root' | 'intermediate'>('root');

	const rootCaList = ref<RootCaItem[]>([]);

	const addForm = ref<AddPrivateCaParams & { root_id?: string }>({
		name: '',
		cn: '',
		o: '',
		c: 'CN',
		ou: '',
		province: '',
		locality: '',
		algorithm: 'ecdsa',
		key_length: '256',
		valid_days: '10',
		root_id: '',
	});

	/**
	 * @description 重置添加CA表单
	 */
	const resetAddForm = () => {
		addForm.value = {
			name: '',
			cn: '',
			o: '',
			c: 'CN',
			ou: '',
			province: '',
			locality: '',
			algorithm: 'ecdsa',
			key_length: '256',
			valid_days: '10',
			root_id: '',
		};
	};

	/**
	 * @description 设置创建类型
	 */
	const setCreateType = (type: 'root' | 'intermediate') => {
		createType.value = type;
		resetAddForm();
	};

	return {
		createType,
		rootCaList,
		addForm,
		resetAddForm,
		setCreateType,
	};
});

export const useStore = () => {
	const store = usePrivateCaStore();
	return { ...store, ...storeToRefs(store) };
};
