import { NButton, NSpace, NTag, type DataTableColumns } from 'naive-ui'
import {
	useModal,
	useTable,
	useDialog,
	useFormHooks,
	useModalHooks,
	useForm,
	useLoadingMask,
	useMessage,
	useSearch,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { getDaysDiff } from '@baota/utils/date'

import { useStore } from './useStore'

import type { CertItem, CertListParams } from '@/types/cert'

const { handleError } = useError()
const { useFormTextarea } = useFormHooks()
const { fetchCertList, downloadExistingCert, deleteExistingCert, uploadNewCert, uploadForm, resetUploadForm } =
	useStore()
const { confirm } = useModalHooks()
/**
 * 计算证书剩余天数
 * @param cert 证书项
 * @returns 剩余天数，如果无法计算则返回 null
 */
const calculateRemainingDays = (cert: CertItem): number | null => {
	// 首先尝试使用后端提供的 end_day 字段
	const endDay = Number(cert.end_day)
	if (!isNaN(endDay) && endDay !== 0) {
		return endDay
	}

	// 如果 end_day 无效，则根据 end_time 计算
	if (cert.end_time) {
		try {
			const endTime = new Date(cert.end_time)
			const currentTime = new Date()

			// 检查日期是否有效
			if (isNaN(endTime.getTime())) {
				return null
			}

			// 计算剩余天数
			const endDay = getDaysDiff(currentTime, endTime)
			return endDay
		} catch (error) {
			console.warn('计算证书剩余天数失败:', error)
			return null
		}
	}

	return null
}

/**
 * useController
 * @description 证书管理业务逻辑控制器
 * @returns {object} 返回controller对象
 */
export const useController = () => {
	/**
	 * @description 创建表格列配置
	 * @returns {DataTableColumns<CertItem>} 返回表格列配置数组
	 */
	const createColumns = (): DataTableColumns<CertItem> => [
		{
			title: $t('t_17_1745227838561'),
			key: 'domains',
			width: 200,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: $t('t_18_1745227838154'),
			key: 'issuer',
			width: 200,
			ellipsis: {
				tooltip: true,
			},
		},
		{
			title: $t('t_21_1745227837972'),
			key: 'source',
			width: 100,
			render: (row: CertItem) => (row.source !== 'upload' ? $t('t_22_1745227838154') : $t('t_23_1745227838699')),
		},
		{
			title: $t('t_19_1745227839107'),
			key: 'end_day',
			width: 100,
			render: (row: CertItem) => {
				const endDay = calculateRemainingDays(row)

				// 如果无法计算剩余天数，显示获取失败
				if (endDay === null) {
					return (
						<NTag round type="error" size="small">
						获取失败
						</NTag>
					);
				}

				// 根据剩余天数确定显示样式和文本
				const config = [
					[endDay <= 0, 'error', $t('t_0_1746001199409')],
					[endDay < 30, 'warning', $t('t_1_1745999036289', { days: endDay })],
					[endDay >= 30, 'success', $t('t_0_1745999035681', { days: endDay })],
				] as [boolean, 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary', string][]

				const matchedConfig = config.find((item) => item[0])
				const [, type, text] = matchedConfig ?? ['default', 'error', '获取失败']

				return (
					<NTag round type={type} size="small">
						{text}
					</NTag>
				)
			},
		},
		{
			title: $t('t_20_1745227838813'),
			key: 'end_time',
			width: 150,
		},

		{
			title: $t('t_24_1745227839508'),
			key: 'create_time',
			width: 150,
		},
		{
			title: $t('t_8_1745215914610'),
			key: 'actions',
			fixed: 'right' as const,
			align: 'right',
			width: 200,
			render: (row: CertItem) => (
				<NSpace justify="end">
					<NButton size="tiny" strong secondary type="primary" class="table-action-btn" onClick={() => openViewModal(row)}>
						查看
					</NButton>
					<NButton size="tiny" strong secondary type="primary" class="table-action-btn" onClick={() => downloadExistingCert(row.id.toString())}>
						{$t('t_25_1745227838080')}
					</NButton>
					<NButton size="tiny" strong secondary type="error" class="table-action-btn-danger" onClick={() => handleDeleteCert(row)}>
						{$t('t_12_1745215914312')}
					</NButton>
				</NSpace>
			),
		},
	]

	/**
	 * 根据证书的到期天数确定行的 CSS 类名。
	 * @param row 当前行的数据对象，类型为 CertItem。
	 * @returns 返回一个字符串，表示行的 CSS 类名。
	 *          - 'bg-red-500/10'：如果证书已过期 (endDay <= 0)。
	 *          - 'bg-orange-500/10'：如果证书将在30天内过期 (0 < endDay < 30)。
	 *          - 空字符串：其他情况。
	 */
	const getRowClassName = (row: CertItem): string => {
		const endDay = calculateRemainingDays(row)

		// 如果无法计算剩余天数，不应用特殊样式
		if (endDay === null) {
			return ''
		}

		if (endDay <= 0) {
			return 'bg-red-500/10' // Tailwind class for light red background
		}
		if (endDay < 30) {
			return 'bg-orange-500/10' // Tailwind class for light orange background
		}
		return '' // 默认情况下没有额外的类
	}

	// 表格实例
	const { TableComponent, PageComponent, loading, param, data, fetch } = useTable<CertItem, CertListParams>({
		config: createColumns(),
		request: fetchCertList,
		defaultValue: { p: 1, limit: 10, search: '' },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit'],
		storage: 'certManagePageSize',
	})

	// 搜索实例
	const { SearchComponent } = useSearch({
		onSearch: (value) => {
			param.value.search = value
			fetch()
		},
	})

	/**
	 * @description 打开上传证书弹窗
	 */
	const openUploadModal = () => {
		useModal({
			title: $t('t_13_1745227838275'),
			area: 600,
			component: () => {
				const { UploadCertForm } = useUploadCertController()
				return <UploadCertForm labelPlacement="top" />
			},
			footer: true,
			onUpdateShow: (show) => {
				if (!show) fetch()
				resetUploadForm()
			},
		})
	}

	/**
	 * @description 删除证书
	 * @param {CertItem} cert - 证书对象
	 */
	const handleDeleteCert = async ({ id }: CertItem) => {
		useDialog({
			title: $t('t_29_1745227838410'),
			content: $t('t_30_1745227841739'),
			onPositiveClick: async () => {
				try {
					await deleteExistingCert(id.toString())
					await fetch()
				} catch (error) {
					handleError(error)
				}
			},
		})
	}

	/**
	 * @description 打开查看证书弹窗
	 * @param {CertItem} cert - 证书对象
	 */
	const openViewModal = (cert: CertItem) => {
		useModal({
			title: '查看证书信息',
			area: 600,
			component: () => {
				const { ViewCertForm } = useViewCertController(cert)
				return <ViewCertForm labelPlacement="top" />
			},
			footer: false,
		})
	}

	onMounted(() => fetch())

	return {
		loading,
		TableComponent,
		PageComponent,
		SearchComponent,
		getRowClassName,
		openUploadModal,
		openViewModal,
	}
}

/**
 * @description 上传证书控制器
 */
export const useUploadCertController = () => {
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: $t('t_0_1746667592819') })
	// 表单实例
	const { example, component, loading, fetch } = useForm({
		config: [
			useFormTextarea($t('t_34_1745227839375'), 'cert', { placeholder: $t('t_35_1745227839208'), rows: 6 }),
			useFormTextarea($t('t_36_1745227838958'), 'key', { placeholder: $t('t_37_1745227839669'), rows: 6 }),
		],
		request: uploadNewCert,
		defaultValue: uploadForm,
		rules: {
			cert: [{ required: true, message: $t('t_35_1745227839208'), trigger: 'input' }],
			key: [{ required: true, message: $t('t_37_1745227839669'), trigger: 'input' }],
		},
	})

	// 关联确认按钮
	confirm(async (close) => {
		try {
			openLoad()
			await fetch()
			close()
		} catch (error) {
			handleError(error)
		} finally {
			closeLoad()
		}
	})

	return {
		UploadCertForm: component,
		example,
		loading,
		fetch,
	}
}

/**
 * @description 查看证书控制器
 * @param {CertItem} cert - 证书对象
 */
export const useViewCertController = (cert: CertItem) => {
	/**
	 * @description 复制文本到剪贴板
	 * @param {string} text - 要复制的文本
	 */
	const copyToClipboard = async (text: string) => {
		const message = useMessage()
		try {
			await navigator.clipboard.writeText(text)
			message.success('复制成功')
		} catch (error) {
			// 降级方案：使用传统的复制方法
			try {
				const textArea = document.createElement('textarea')
				textArea.value = text
				document.body.appendChild(textArea)
				textArea.select()
				document.execCommand('copy')
				document.body.removeChild(textArea)
				message.success('复制成功')
			} catch (error) {
				message.error('复制失败')
			}
		}
	}

	// 合并证书内容（cert + issuer_cert）
	// const combinedCert = cert.cert + (cert.issuer_cert ? '\n' + cert.issuer_cert : '')
	const combinedCert = cert.cert

	// 表单实例
	const { component } = useForm({
		config: [
			useFormTextarea(
				$t('t_34_1745227839375'),
				'cert',
				{ placeholder: '', rows: 8, readonly: true },
				{},
				{
					suffix: [
						() => (
							<NButton size="tiny" type="primary" ghost onClick={() => copyToClipboard(combinedCert)}>
								{$t('t_4_1747984130327')}
							</NButton>
						),
					],
				},
			),
			useFormTextarea(
				$t('t_36_1745227838958'),
				'key',
				{ placeholder: '', rows: 8, readonly: true },
				{},
				{
					suffix: [
						() => (
							<NButton size="tiny" type="primary" ghost onClick={() => copyToClipboard(cert.key)}>
								{$t('t_4_1747984130327')}
							</NButton>
						),
					],
				},
			),
		],
		defaultValue: {
			cert: combinedCert,
			key: cert.key,
		},
	})

	return {
		ViewCertForm: component,
	}
}
