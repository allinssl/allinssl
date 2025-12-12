/**
 * DNSSEC管理状态管理
 * 职责：管理DNSSEC记录的状态、数据获取和操作
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { useMessage, useLoadingMask } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { addDnssecDsRecord, getDnssecDsList, deleteDnssecDsRecord, syncDnssecDsRecord } from '@/api/domain'
import type { DnssecRecord, AddDnssecRecordForm, SyncDnssecRecordsRequest, DeleteDnssecRecordRequest } from './types.d'

/**
 * DNSSEC管理Store
 */
export const useDnssecManagementStore = defineStore('dnssecManagement', () => {
  const { handleError } = useError()

  // 状态
  const loading = ref(false)
  const syncLoading = ref(false)
  const records = ref<DnssecRecord[]>([])
  const currentDomainId = ref<number | null>(null)

  // 计算属性
  const recordsCount = computed(() => records.value.length)
  const canAddMore = computed(() => recordsCount.value < 8) // 最多8条记录

  /**
   * 设置当前域名ID
   */
  const setCurrentDomainId = (domainId: number) => {
    currentDomainId.value = domainId
  }

  /**
   * 获取DNSSEC记录列表数据（供useTable使用）
   */
  const fetchDnssecRecords = async (params: { domainId: number } = { domainId: 0 }) => {
    try {
      loading.value = true
      setCurrentDomainId(params.domainId)
      const { fetch, data } = getDnssecDsList({ domain_id: params.domainId.toString() })
      await fetch()
      if (data.value?.status) {
        const apiData = data.value.data || []
        const mappedData = apiData.map((item: any) => ({
          id: item.id,
          keyTag: item.key_tag,
          algorithm: item.alg,
          digestType: item.digest_type,
          digest: item.digest,
        }))
        records.value = mappedData
        return {
          list: mappedData,
          total: mappedData.length,
        }
      }
    } catch (error) {
      handleError(error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加DS记录
   */
  const addDnssecRecord = async (formData: AddDnssecRecordForm): Promise<{ success: boolean }> => {
    try {
      loading.value = true
      const { fetch, data, message } = addDnssecDsRecord({
        domain_id: formData.domainId.toString(),
        key_tag: formData.keyTag!,
        alg: formData.algorithm,
        digest_type: formData.digestType,
        digest: formData.digest
      })
      message.value = true
      await fetch()
      if (data.value?.status) {
        return { success: true }
      } else {
        throw new Error(data.value?.msg || '添加DS记录失败')
      }
    } catch (error) {
      handleError(error)
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除DS记录
   */
	const deleteDnssecRecord = async (recordId: number): Promise<void> => {
		const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在删除DS记录，请稍后...', zIndex: 9999 })
		openLoad()
    try {
      const { fetch, data, message } = deleteDnssecDsRecord({ ds_id: recordId })
      message.value = true
      await fetch()
    } catch (error) {
      handleError(error)
    } finally {
      closeLoad()
    }
  }

  /**
   * 同步DS记录
   */
  const syncDnssecRecords = async (params: SyncDnssecRecordsRequest): Promise<void> => {
    try {
      syncLoading.value = true
      const { fetch, data, message } = syncDnssecDsRecord({ domain_id: params.domainId.toString() })
      message.value = true
      await fetch()
    } catch (error) {
      handleError(error)
    } finally {
      syncLoading.value = false
    }
  }

  /**
   * 清空记录
   */
  const clearRecords = () => {
    records.value = []
    currentDomainId.value = null
  }

  return {
    // 状态
    loading,
    syncLoading,
    records,
    currentDomainId,
    
    // 计算属性
    recordsCount,
    canAddMore,
    
    // 方法
    setCurrentDomainId,
    fetchDnssecRecords,
    addDnssecRecord,
    deleteDnssecRecord,
    syncDnssecRecords,
    clearRecords,
  }
})

/**
 * 导出Store实例
 */
export const useDnssecManagementState = () => {
  const store = useDnssecManagementStore()
  const { loading, syncLoading, records, currentDomainId, recordsCount, canAddMore } = storeToRefs(store)
  
  return {
    // 状态
    loading,
    syncLoading,
    records,
    currentDomainId,
    
    // 计算属性
    recordsCount,
    canAddMore,
    
    // 方法
    setCurrentDomainId: store.setCurrentDomainId,
    fetchDnssecRecords: store.fetchDnssecRecords,
    addDnssecRecord: store.addDnssecRecord,
    deleteDnssecRecord: store.deleteDnssecRecord,
    syncDnssecRecords: store.syncDnssecRecords,
    clearRecords: store.clearRecords,
  }
}
