import { NButton, NSpace, NTag, type DataTableColumns } from 'naive-ui'
import {
	useModal,
	useTable,
	useTablePage,
	useDialog,
	useFormHooks,
	useModalHooks,
	useForm,
	useLoadingMask,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'

import { useStore } from './useStore'
import UploadCert from './components/uploadCertForm'

import type { CertItem, CertListParams } from '@/types/cert'

const { handleError } = useError()
const { useFormTextarea } = useFormHooks()
const { fetchCertList, downloadExistingCert, deleteExistingCert, uploadNewCert, uploadForm, resetUploadForm } =
	useStore()
const { confirm } = useModalHooks()
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
				const endDay = Number(row.end_day)
				const config = [
					[endDay <= 0, 'error', $t('t_0_1746001199409')],
					[endDay < 30, 'warning', $t('t_1_1745999036289', { days: row.end_day })],
					[endDay > 30, 'success', $t('t_0_1745999035681', { days: row.end_day })],
				] as [boolean, 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary', string][]
				const [_, type, text] = config.find((item) => item[0]) ?? ['default', 'error', '获取失败']
				console.log(config)
				return (
					<NTag type={type} size="small">
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
			width: 150,
			render: (row: CertItem) => (
				<NSpace justify="end">
					<NButton
						style={{ '--n-text-color': 'var(--text-color-3)' }}
						size="tiny"
						strong
						secondary
						onClick={() => downloadExistingCert(row.id)}
					>
						{$t('t_25_1745227838080')}
					</NButton>
					<NButton size="tiny" strong secondary type="error" onClick={() => handleDeleteCert(row)}>
						{$t('t_12_1745215914312')}
					</NButton>
				</NSpace>
			),
		},
	]

	// 表格实例
	const {
		component: CertTable,
		loading,
		param,
		data,
		total,
		fetch,
	} = useTable<CertItem, CertListParams>({
		config: createColumns(),
		request: fetchCertList,
		defaultValue: {
			p: 1,
			limit: 10,
			search: '',
		},
		watchValue: ['p', 'limit'],
	})

	// 分页实例
	const { component: CertTablePage } = useTablePage({
		param,
		total,
		alias: {
			page: 'p',
			pageSize: 'limit',
		},
	})

	/**
	 * @description 打开上传证书弹窗
	 */
	const openUploadModal = () => {
		useModal({
			title: $t('t_13_1745227838275'),
			area: 600,
			component: UploadCert,
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
					await deleteExistingCert(id)
					await fetch()
				} catch (error) {
					handleError(error)
				}
			},
		})
	}

	return {
		loading,
		fetch,
		CertTable,
		CertTablePage,
		param,
		data,
		openUploadModal,
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
