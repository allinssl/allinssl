import { NButton, NFlex, NTag, type DataTableColumns } from 'naive-ui';
import {
	useTable,
	useSearch,
	useMessage,
	useDialog,
	useModal,
	useLoadingMask,
} from '@baota/naive-ui/hooks';
import { useError } from "@baota/hooks/error";
import { useStore } from './useStore';
import type { PrivateCaItem } from './types';
import { getCaList, deleteCa as deleteCaApi, createRootCa, createIntermediateCa } from '@/api/ca';
import type { GetCaListParams } from '@/types/ca';
import { onMounted } from 'vue';
import AddCaModal from './components/AddCaModal';

const { handleError } = useError();

/**
 * useController
 * @description 私有CA管理业务逻辑控制器
 * @returns {object} 返回controller对象
 */
export const useController = () => {
	const { 
		createType,
		rootCaList,
		addForm,
		resetAddForm
	} = useStore();
	
	const message = useMessage();

	// 获取状态标签类型和文本
	const getStatusInfo = (validTo: string) => {
		const calculateRemainingDays = (expiryDate: string): number => {
			const expiry = new Date(expiryDate);
			const now = new Date();
			const diffTime = expiry.getTime() - now.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			return diffDays;
		};

		const remainingDays = calculateRemainingDays(validTo);
		
		if (remainingDays > 30) {
			return { type: 'success' as const, text: '正常' };
		} else if (remainingDays > 0) {
			return { type: 'warning' as const, text: '即将过期' };
		} else if (remainingDays === 0) {
			return { type: 'warning' as const, text: '今天到期' };
		} else {
			return { type: 'error' as const, text: '已过期' };
		}
	};

	// 创建表格列
	const createColumns = (): DataTableColumns<PrivateCaItem> => [
		{
			title: "名称",
			key: "name",
			width: 250,
			render: (row: PrivateCaItem) => (
				<div class="flex flex-col">
					<div class="text-gray-900">{row.name}</div>
					<div class="text-xl text-gray-500">{row.distinguishedName}</div>
				</div>
			),
		},
		{
			title: "类型",
			key: "type",
			width: 100,
			render: (row: PrivateCaItem) => {
				const typeText = row.type === 'root' ? '根CA' : '中间CA';
				return <NTag size="small">{typeText}</NTag>;
			},
		},
		{
			title: "算法",
			key: "algorithm",
			width: 120,
			render: (row: PrivateCaItem) => (
				<div class="flex flex-col">
					<div class="text-gray-900">{row.algorithm.toUpperCase()}</div>
					<div class="text-xl text-gray-500">{row.keySize} bit</div>
				</div>
			),
		},
		{
			title: "有效期",
			key: "validTo",
			width: 200,
			render: (row: PrivateCaItem) => {
				const calculateRemainingDays = (expiryDate: string) => {
					const expiry = new Date(expiryDate);
					const now = new Date();
					const diffTime = expiry.getTime() - now.getTime();
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
					return diffDays;
				};

				const remainingDays = calculateRemainingDays(row.validTo);
				let remainingText = "";
				let textColor = "";

				if (remainingDays > 0) {
					if (remainingDays <= 30) {
						remainingText = `${remainingDays} 天后`;
						textColor = "text-orange-500";
					} else {
						remainingText = `${remainingDays} 天后`;
						textColor = "text-gray-500";
					}
				} else if (remainingDays === 0) {
					remainingText = "今天到期";
					textColor = "text-orange-500";
				} else {
					remainingText = `已过期 ${Math.abs(remainingDays)} 天`;
					textColor = "text-red-500";
				}

				return (
					<div class="flex flex-col">
						<div class="text-gray-900">{row.validTo}</div>
						<div class={`text-xl ${textColor}`}>{remainingText}</div>
					</div>
				);
			},
		},
		{
			title: "状态",
			key: "status",
			width: 100,
			render: (row: PrivateCaItem) => {
				const statusInfo = getStatusInfo(row.validTo);
				return (
					<NTag type={statusInfo.type} size="small">
						{statusInfo.text}
					</NTag>
				);
			},
		},
		{
			title: "创建时间",
			key: "createdAt",
			width: 150,
		},
		{
			title: "操作",
			key: "actions",
			fixed: "right" as const,
			align: "right",
			width: 200,
			render: (row: PrivateCaItem) => (
				<NFlex justify="end">
					<NButton
						size="tiny"
						strong
						secondary
						type="primary"
						onClick={() => handleDownload(row)}
					>
						下载
					</NButton>
					<NButton
						size="tiny"
						strong
						secondary
						type="error"
						onClick={() => handleDelete(row)}
					>
						删除
					</NButton>
				</NFlex>
			),
		},
	];

	// 表格实例
	const { TableComponent, PageComponent, loading, param, data, fetch } = useTable<PrivateCaItem, GetCaListParams>({
		config: createColumns(),
		request: async (params: GetCaListParams): Promise<any> => {
			const { fetch: getCaListFetch, data } = getCaList(params);
			await getCaListFetch();

			if (data.value && data.value.status === true && data.value.data) {
				const transformedData = data.value.data.map((item: any) => {
					const remainingDays = Math.ceil((new Date(item.not_after).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
					let status: 'normal' | 'expired' | 'revoked' = 'normal';
					
					if (remainingDays <= 0) {
						status = 'expired';
					}
					const dnParts = [];
					if (item.cn) dnParts.push(`CN=${item.cn}`);
					if (item.ou) dnParts.push(`OU=${item.ou}`);
					if (item.o) dnParts.push(`O=${item.o}`);
					if (item.locality) dnParts.push(`L=${item.locality}`);
					if (item.province) dnParts.push(`ST=${item.province}`);
					if (item.c) dnParts.push(`C=${item.c}`);
					const distinguishedName = dnParts.join(', ');
					
					return {
						id: item.id.toString(),
						name: item.name,
						distinguishedName: distinguishedName || item.cn,
						type: item.root_id ? 'intermediate' : 'root' as const,
						algorithm: item.algorithm,
						keySize: item.key_length.toString(),
						validFrom: item.not_before,
						validTo: item.not_after,
						remainingDays,
						status,
						createdAt: item.create_time,
						parentId: item.root_id?.toString(),
					};
				});
				
				return {
					list: transformedData,
					total: data.value.count || transformedData.length,
				};
			}
			return {
				list: [],
				total: 0,
			};
		},
		defaultValue: { p: '1', limit: '20', search: '' },
		alias: { page: 'p', pageSize: 'limit' },
		watchValue: ['p', 'limit', 'search'],
	});

	// 搜索组件
	const { SearchComponent } = useSearch({
		onSearch: async (keyword: string) => {
			param.value.search = keyword;
		},
	});

	/**
	 * @description 获取根证书列表
	 */
	const fetchRootCaList = async () => {
		try {
			const { fetch: getCaListFetch, data } = getCaList({ p: '-1', limit: '-1', level: 'root' });
			await getCaListFetch();
			
			if (data.value?.status === true) {
				rootCaList.value = data.value.data;
				if (createType.value === 'intermediate' && rootCaList.value.length > 0 && rootCaList.value[0]) {
					addForm.value.root_id = rootCaList.value[0].id.toString();
				}
			}
		} catch (error) {
			console.error('获取根证书列表失败:', error);
		}
	};

	/**
	 * 打开添加模态框
	 */
	const openAddModal = async () => {
		// 先获取根CA列表，确保数据加载完成
		await fetchRootCaList();
		useModal({
			title: createType.value === 'root' ? '创建根CA' : '创建中间CA',
			area: 600,
			component: () => (
				<AddCaModal
					onSuccess={() => {
						fetch();
						resetAddForm();
						return false;
					}}
				/>
			),
			footer: false,
			onUpdateShow: (show: boolean) => {
				if (!show) {
					fetch(); // 刷新列表
					resetAddForm();
				}
			},
		});
	};

	/**
	 * 下载CA证书
	 */
	const handleDownload = (row: PrivateCaItem) => {
		try {
      const link = document.createElement("a");
      link.href = `/v1/private_ca/download_cert?id=${row.id.toString()}&type=ca`;
      link.target = "_blank";
      link.click();
		} catch (error: any) {
			handleError(error);
		}
	};

	// 删除CA事件
	const handleDelete = async (row: PrivateCaItem) => {
		const { open: openLoad, close: close } = useLoadingMask({ text: '正在删除CA，请稍后...', zIndex: 3000 });
		useDialog({
			title: "删除CA",
			content: `确认要删除CA "${row.name}" 吗？此操作不可恢复。`,
			onPositiveClick: async () => {
				openLoad();
				try {
					const { fetch: deleteFetch, data } = deleteCaApi({ id: row.id });
					await deleteFetch();
					if (data.value && data.value.status === true) {
						message.success("删除成功");
						await fetch();
					}
				} catch (err) {
					console.error("删除CA失败:", err);
				} finally {
					close();
				}
			},
		});
	};

	// 获取表格行类名
	const getRowClassName = (row: PrivateCaItem): string => {
		const statusInfo = getStatusInfo(row.validTo);
		if (statusInfo.type === 'error') return 'bg-red-500/10';
		if (statusInfo.type === 'warning') return 'bg-orange-500/10';
		return '';
	};

	onMounted(() => fetch());

	return {
		// 表格组件
		TableComponent,
		PageComponent,
		SearchComponent,
		// 状态
		loading,
		data,
		param,
		// 方法
		openAddModal,
		getRowClassName,
		fetch,
	};
};

/**
 * @description 添加CA控制器
 */
export const useAddCaController = () => {
	const message = useMessage();
	const { open: openLoad, close: closeLoad } = useLoadingMask({ 
		text: '正在创建CA，请稍后...',
		zIndex: 3000,
	});

	const { 
		createType,
		resetAddForm
	} = useStore();

	// 算法选项
	const algorithmOptions = [
		{ label: "ECDSA", value: "ecdsa" },
		{ label: "RSA", value: "rsa" },
		{ label: "SM2", value: "sm2" },
	];

	const getKeyLengthOptions = (algorithm: string) => {
		switch (algorithm) {
			case 'ecdsa':
				return [
					{ label: "P-256 (256 bit)", value: "256" },
					{ label: "P-384 (384 bit)", value: "384" },
					{ label: "P-521 (521 bit)", value: "521" },
				];
			case 'rsa':
				return [
					{ label: "2048 bit", value: "2048" },
					{ label: "3072 bit", value: "3072" },
					{ label: "4096 bit", value: "4096" },
				];
			case 'sm2':
				return [
					{ label: "SM2 (256 bit)", value: "256" },
				];
			default:
				return [];
		}
	};

	// 有效期选项
	const getValidityOptions = (isRoot: boolean) => {
		if (isRoot) {
			return [
				{ label: "10年", value: "10" },
				{ label: "15年", value: "15" },
				{ label: "20年", value: "20" },
			];
		} else {
			return [
				{ label: "5天", value: "5" },
				{ label: "10天", value: "10" },
				{ label: "15天", value: "15" },
				{ label: "30天", value: "30" },
			];
		}
	};

	// 国家选项
	const countryOptions = [
		{ label: "中国", value: "CN" },
		{ label: "美国", value: "US" },
		{ label: "日本", value: "JP" },
		{ label: "德国", value: "DE" },
		{ label: "英国", value: "GB" },
	];

	// 表单验证规则
	const getValidationRules = () => {
		const baseRules: any = {
			name: [{ required: true, message: '请输入CA名称', trigger: 'blur' }],
			cn: [{ required: true, message: '请输入通用名称', trigger: 'blur' }],
			c: [{ required: true, message: '请选择国家', trigger: 'change' }],
			key_length: [{ required: true, message: '请选择密钥长度', trigger: 'change' }],
			valid_days: [{ required: true, message: '请选择有效期', trigger: 'change' }],
		};

		if (createType.value === 'root') {
			baseRules.algorithm = [{ required: true, message: '请选择加密算法', trigger: 'change' }];
		}

		if (createType.value === 'intermediate') {
			baseRules.root_id = [{ required: true, message: '请选择父级CA', trigger: 'change' }];
		}

		return baseRules;
	};

	// 创建请求函数
	const createRequest = async (formData: any) => {
		if (createType.value === 'root') {
			const { root_id, ...rootFormData } = formData;
			const { fetch: createFetch, data } = createRootCa(rootFormData);
			await createFetch();
			return data.value;
		} else {
			const { algorithm, ...intermediateFormData } = formData;
			const { fetch: createFetch, data } = createIntermediateCa(intermediateFormData);
			await createFetch();
			return data.value;
		}
	};

	// 表单提交处理函数
	const handleSubmit = async (formData: any) => {
		try {
			openLoad();
			// 验证必填字段
			let requiredFields: string[] = ['name', 'cn', 'c', 'key_length', 'valid_days'];
			if (createType.value === 'root') {
				requiredFields.push('algorithm');
			}
			if (createType.value === 'intermediate') {
				requiredFields.push('root_id');
			}
			
			const missingFields = requiredFields.filter(field => !formData[field]);
			if (missingFields.length > 0) {
				message.error(`请填写必填字段: ${missingFields.join(', ')}`);
				return false;
			}
			const response = await createRequest(formData);
			if (response.status) {
				message.success(response?.message);
				resetAddForm();
				return true;
			} else {
				message.error(response?.message);
				return false;
			}
		} catch (error: any) {
			message.error(error.message || '创建失败');
			return false;
		} finally {
			closeLoad();
		}
	};

	return {
		algorithmOptions,
		getKeyLengthOptions,
		getValidityOptions,
		countryOptions,
		getValidationRules,
		handleSubmit,
	};
};