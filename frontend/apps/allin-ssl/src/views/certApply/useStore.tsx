import { defineStore, storeToRefs } from 'pinia'
import type { ProductsType, FreeProductItem } from '@/types/cert'
import {
	mainTabOptionsData,
	typeOptionsData,
	sslTypeListData,
	sslTypeDescriptionsData,
	productsData,
	freeProductsData,
} from './certApply.data'

export const useCertApplyStore = defineStore('cert-apply-store', () => {
	// -------------------- 状态定义 --------------------
	const test = ref('证书申请')

	// 当前激活的主标签
	const activeMainTab = ref<'commercial' | 'free'>('commercial')

	// 当前激活的子标签
	const activeTab = ref<'dv' | 'ov' | 'ev'>('dv')

	// 主标签选项
	const mainTabOptions = ref(mainTabOptionsData)

	// 证书类型选项
	const typeOptions = ref(typeOptionsData)

	// SSL证书类型列表
	const sslTypeList = ref(sslTypeListData)

	// SSL证书类型详细说明
	const sslTypeDescriptions = ref(sslTypeDescriptionsData)

	// 产品数据类型定义
	// type ProductItem = {
	// 	pid: number
	// 	brand: string
	// 	type: string
	// 	add_price: number
	// 	other_price: number
	// 	title: string
	// 	code: string
	// 	num: number
	// 	price: number
	// 	discount: number
	// 	ipssl?: number
	// 	state: number
	// 	install_price: number
	// 	src_price: number
	// }

	// type ProductsType = {
	// 	dv: ProductItem[]
	// 	ov: ProductItem[]
	// 	ev: ProductItem[]
	// }

	// 商业证书产品数据
	const products = ref<ProductsType>(productsData)

	// 免费证书数据
	// type FreeProductItem = {
	// 	pid: number
	// 	brand: string
	// 	type: string
	// 	title: string
	// 	code: string
	// 	num: number
	// 	valid_days: number
	// 	features: string[]
	// }

	const freeProducts = ref<FreeProductItem[]>(freeProductsData)

	// -------------------- 派生状态 --------------------
	// 根据当前活动标签筛选产品
	const filteredProducts = computed(() => {
		if (activeMainTab.value === 'commercial') {
			return products.value[activeTab.value] || []
		} else {
			return [] // 免费证书不通过这个计算属性获取
		}
	})

	// -------------------- 工具方法 --------------------
	const handleTest = () => {
		test.value = '点击了证书申请'
	}

	return {
		test,
		handleTest,
		activeMainTab,
		activeTab,
		mainTabOptions,
		typeOptions,
		sslTypeList,
		sslTypeDescriptions,
		products,
		freeProducts,
		filteredProducts,
	}
})

/**
 * useStore
 * @description 组合式API使用store
 * @returns {object} store - 返回store对象
 */
export const useStore = () => {
	const store = useCertApplyStore()
	return { ...store, ...storeToRefs(store) }
}
