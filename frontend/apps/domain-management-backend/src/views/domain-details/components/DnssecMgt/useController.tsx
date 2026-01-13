/**
 * DNSSEC管理控制器
 * 职责：处理业务逻辑、事件响应和生命周期管理
 */

import { ref, computed, watch, defineComponent } from 'vue'
import { NButton, NIcon, NForm, NFormItem, NInput, NSelect, NGrid, NGridItem } from 'naive-ui'
import { AddOutline, SyncOutline, TrashOutline } from '@vicons/ionicons5'
import { useDnssecManagementState } from './useStore'
import { useModal, useModalHooks, useMessage, useForm, useFormHooks, useTable, useLoadingMask } from '@baota/naive-ui/hooks'
import { useDialog } from 'naive-ui'
import { useError } from '@baota/hooks/error'
import type { DnssecRecord, DnssecManagementProps, DnssecTableColumn } from './types.d'

/**
 * 添加DS记录模态框组件
 */
const createAddDnssecRecordModal = (store: any, domainId: number, onRefresh: () => Promise<void>) => defineComponent({
  name: 'AddDnssecRecordModal',
  setup() {
    const { close } = useModalHooks()
    const closeModal = close()
    const message = useMessage()
    const { handleError } = useError()
    const { useFormInput, useFormSelect } = useFormHooks()
    
    const algorithmOptions = [
      { label: 'RSA/MD5', value: 1 },
      { label: 'Diffie-Hellman', value: 2 },
      { label: 'DSA/SHA-1', value: 3 },
      { label: 'RSA/SHA-1', value: 5 },
      { label: 'DSA-NSEC3-SHA1', value: 6 },
      { label: 'RSASHA1-NSEC3-SHA1', value: 7 },
      { label: 'RSA/SHA-256', value: 8 },
      { label: 'RSA/SHA-512', value: 10 },
      { label: 'GOST R 34.10-2001', value: 12 },
      { label: 'ECDSA Curve P-256 with SHA-256', value: 13 },
      { label: 'ECDSA Curve P-384 with SHA-384', value: 14 },
      { label: 'Ed25519', value: 15 },
      { label: 'Ed448', value: 16 },
      { label: 'Reserved for Indirect Keys', value: 252 },
      { label: 'private algorithm', value: 253 },
      { label: 'private algorithm OID', value: 254 },
    ]

    const digestTypeOptions = [
      { label: 'SHA-1', value: 1 },
      { label: 'SHA-256', value: 2 },
      { label: 'GOST R 34.11-94', value: 3 },
      { label: 'SHA-384', value: 4 },
    ]

    // 表单配置
    const formConfig = [
      useFormInput(
        '密钥标签',
        'keyTag',
        {
          placeholder: '请输入密钥标签 (0-65535)',
          clearable: true,
        },
        {
          required: true,
          showFeedback: true,
          labelWidth: '80px',
          rule: {
            required: true,
            trigger: ['input', 'blur'],
            validator: (rule: any, value: any) => {
              if (!value || value === '') {
                return new Error('请输入密钥标签')
              }
              if (!/^\d+$/.test(value)) {
                return new Error('密钥标签格式错误')
              }
              const num = Number(value)
              if (isNaN(num) || !Number.isInteger(num)) {
                return new Error('密钥标签必须是整数')
              }
              if (num < 0 || num > 65535) {
                return new Error('密钥标签必须是0-65535之间的整数')
              }
              return true
            },
          },
        },
      ),
      useFormSelect(
        '加密算法',
        'algorithm',
        algorithmOptions,
        {
          placeholder: '请选择加密算法',
        },
        {
          required: true,
          showFeedback: true,
          labelWidth: '80px',
        },
      ),
      useFormSelect(
        '摘要类型',
        'digestType',
        digestTypeOptions,
        {
          placeholder: '请选择摘要类型',
        },
        {
          required: true,
          showFeedback: true,
          labelWidth: '80px',
        },
      ),
      useFormInput(
        '摘要',
        'digest',
        {
          placeholder: '请输入摘要内容 (十六进制字符串)',
          type: 'textarea',
          autosize: { minRows: 3, maxRows: 6 },
        },
        {
          required: true,
          showFeedback: true,
          labelWidth: '80px',
          rule: {
            required: true,
            message: '请填写摘要内容',
            trigger: ['blur'],
          },
        },
      ),
      {
        type: 'custom' as const,
        render: () => (
          <div class="flex justify-end gap-2 mt-6">
            <NButton onClick={closeModal}>取消</NButton>
            <NButton
              type="primary"
              disabled={formLoading.value}
              onClick={async () => {
                try {
                  await submitForm()
                } catch (error) {
                  console.error('表单提交失败:', error)
                }
              }}
            >
              确认添加
            </NButton>
          </div>
        ),
      },
    ]

    // 表单实例
    const { component: FormComponent, fetch: submitForm, loading: formLoading } = useForm({
      config: formConfig,
      defaultValue: {
        keyTag: '',
        algorithm: 8, // RSA/SHA-256
        digestType: 2, // SHA-256
        digest: '',
      },
      request: async (formData: any) => {
        try {
          const submitData = {
            ...formData,
            keyTag: Number(formData.keyTag),
            domainId: domainId
          }
					const result = await store.addDnssecRecord(submitData)
          if (result.success) {
            await onRefresh()
            closeModal()
          }
        } catch (error) {
          handleError(error)
        }
      },
    })

    return () => (
      <div class="max-w-2xl">
        <FormComponent />
      </div>
    )
  },
})

/**
 * DNSSEC管理控制器
 */
export function useController(props: DnssecManagementProps) {
  const store = useDnssecManagementState()
  const { handleError } = useError()
  
  const dialog = useDialog()

  /**
   * 表格列配置
   */
  const createColumns = [
    {
      title: '密钥标签',
      key: 'keyTag',
      width: 100,
      align: 'center',
      render: (row: DnssecRecord) => row.keyTag.toString(),
    },
    {
      title: '加密算法',
      key: 'algorithm',
      width: 150,
      align: 'center',
      render: (row: DnssecRecord) => {
        const algorithmMap: Record<number, string> = {
          1: 'RSA/MD5',
          2: 'Diffie-Hellman',
          3: 'DSA/SHA-1',
          5: 'RSA/SHA-1',
          6: 'DSA-NSEC3-SHA1',
          7: 'RSASHA1-NSEC3-SHA1',
          8: 'RSA/SHA-256',
          10: 'RSA/SHA-512',
          12: 'GOST R 34.10-2001',
          13: 'ECDSA Curve P-256 with SHA-256',
          14: 'ECDSA Curve P-384 with SHA-384',
          15: 'Ed25519',
          16: 'Ed448',
          252: 'Reserved for Indirect Keys',
          253: 'private algorithm',
          254: 'private algorithm OID',
        }
        return algorithmMap[row.algorithm] || `算法 ${row.algorithm}`
      },
    },
    {
      title: '摘要类型',
      key: 'digestType',
      width: 120,
      align: 'center',
      render: (row: DnssecRecord) => {
        const digestTypeMap: Record<number, string> = {
          1: 'SHA-1',
          2: 'SHA-256',
          3: 'GOST R 34.11-94',
          4: 'SHA-384',
        }
        return digestTypeMap[row.digestType] || `类型 ${row.digestType}`
      },
    },
    {
      title: '摘要',
      key: 'digest',
      width: 300,
      ellipsis: { tooltip: true },
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (row: DnssecRecord) => (
        <NButton
          size="small"
          type="error"
          ghost
          class="!px-2"
          onClick={() => handleDeleteRecord(row.id)}
        >
          删除
        </NButton>
      ),
    },
  ]

  // 表格实例
  const {
    TableComponent: DnssecTable,
    loading,
    fetch: fetchDnssecRecords,
    data: tableData,
  } = useTable({
    config: createColumns as any,
    request: async (params: any) => {
      const result = await store.fetchDnssecRecords({ domainId: params.domainId || props.domainId })
      return result as any
    },
    defaultValue: { domainId: props.domainId },
  })

  // 计算属性
  const hasRecords = computed(() => {
    const data = tableData.value as any
    return data?.list?.length > 0 || data?.length > 0
  })
  const isMaxRecords = computed(() => {
    const data = tableData.value as any
    const length = data?.list?.length || data?.length || 0
    return length >= 8
  })
  const recordsCount = computed(() => {
    const data = tableData.value as any
    return data?.list?.length || data?.length || 0
  })

  // 事件处理
  const handleAddRecord = () => {
    const AddDnssecRecordModalComponent = createAddDnssecRecordModal(store, props.domainId, fetchDnssecRecords)
    useModal({
      title: '添加DS记录',
      area: '600px',
      component: AddDnssecRecordModalComponent,
      footer: false,
    })
  }

  const handleDeleteRecord = async (recordId: number) => {
    dialog.warning({
      title: '确认删除',
      content: '确定要删除这条DS记录吗？删除后无法恢复。',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        await store.deleteDnssecRecord(recordId)
        await fetchDnssecRecords()
      },
    })
  }

	const handleSyncRecords = async () => {
    try {
      await store.syncDnssecRecords({ domainId: props.domainId })
      await fetchDnssecRecords()
		} catch (error) {
			handleError(error)
    }
  }

  // 监听模态框显示状态
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        fetchDnssecRecords()
      }
    },
    { immediate: true }
  )

  return {
    // 状态
    loading,
    records: tableData,
    recordsCount,
    canAddMore: computed(() => !isMaxRecords.value),
    hasRecords,
    isMaxRecords,
    
    // 表格组件
    DnssecTable,
    
    // 事件处理
    handleAddRecord,
    handleDeleteRecord,
    handleSyncRecords,
  }
}