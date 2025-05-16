import { defineStore, storeToRefs } from 'pinia'
import { getCertList, uploadCert, deleteCert } from '@/api/cert'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import type { CertItem, UploadCertParams, CertListParams } from '@/types/cert'
import type { TableResponse } from '@baota/naive-ui/types/table'

// 导入错误处理钩子
const { handleError } = useError()

/**
 * 证书管理状态 Store
 * @description 用于管理证书相关的状态和操作，包括证书列表、上传、下载等
 */
export const useCertManageStore = defineStore('cert-manage-store', () => {
	// -------------------- 状态定义 --------------------
	// 上传证书表单
	const uploadForm = ref<UploadCertParams>({
		cert_id: '',
		cert: '',
		key: '',
	})

	// -------------------- 工具方法 --------------------
	/**
	 * 获取证书列表
	 * @description 根据分页参数获取证书列表数据
	 * @param {CertListParams} params - 查询参数
	 * @returns {Promise<TableResponse<T>>} 返回列表数据和总数
	 */
	const fetchCertList = async <T = CertItem,>(params: CertListParams): Promise<TableResponse<T>> => {
		try {
			const { data, count } = await getCertList(params).fetch()
			return {
				list: (data || []) as T[],
				total: count,
			}
		} catch (error) {
			handleError(error)
			return { list: [] as T[], total: 0 }
		}
	}

	/**
	 * 下载证书
	 * @description 下载指定ID的证书文件
	 * @param {number} id - 证书ID
	 * @returns {Promise<boolean>} 是否下载成功
	 */
	const downloadExistingCert = (id: string) => {
		try {
			const link = document.createElement('a')
			link.href = '/v1/cert/download?id=' + id
			link.target = '_blank'
			link.click()
		} catch (error) {
			handleError(error).default($t('t_38_1745227838813'))
		}
	}

	/**
	 * 上传证书
	 * @description 上传新证书
	 * @param {UploadCertParams} params - 上传证书参数
	 * @returns {Promise<boolean>} 是否上传成功
	 */
	const uploadNewCert = async (params: UploadCertParams) => {
		try {
			const { message, fetch } = uploadCert(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 删除证书
	 * @description 删除指定ID的证书
	 * @param {number} id - 证书ID
	 * @returns {Promise<boolean>} 是否删除成功
	 */
	const deleteExistingCert = async (id: string) => {
		try {
			const { message, fetch } = deleteCert({ id })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * @description 重置上传证书表单
	 */
	const resetUploadForm = () => {
		uploadForm.value = {
			cert: '',
			key: '',
		}
	}

	return {
		// 状态
		uploadForm,
		// 方法
		fetchCertList,
		downloadExistingCert,
		uploadNewCert,
		deleteExistingCert,
		resetUploadForm,
	}
})

/**
 * 组合式 API 使用 Store
 * @description 提供对证书管理 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useStore = () => {
	const store = useCertManageStore()
	return { ...store, ...storeToRefs(store) }
}
