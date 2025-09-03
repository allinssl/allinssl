/**
 * @fileoverview DNS分析模块 - 控制器层
 * @description 连接视图层和模型层，处理业务逻辑和UI状态
 */

import { ref, reactive, computed, watch, onMounted } from "vue";
import { useDnsAnalysisStore } from "./useStore";
import type { DnsRecordItem } from "@/types/domain";
import type {
  // GetDnsRecordListRequest,
  UpdateDnsRecordRequest,
  DeleteDnsRecordRequest,
  CreateDnsRecordRequest,
  ToggleDnsRecordRequest,
} from "@/types/dns";
// import type { SelectOption } from "naive-ui";
import { DnsRecordForm } from "../../types";
import { useModal, useMessage, useForm, useFormHooks } from '@baota/naive-ui/hooks'
import DnsAnalysisForm from './form'
import { NButton, NSpace } from 'naive-ui'
import { useApp } from '@/components/layout/useStore'

/**
 * DNS分析控制器参数接口
 */
interface DnsAnalysisControllerProps {
  /** 域名ID */
  domainId: number;
}
// 获取移动端状态
const { isMobile } = useApp()

/**
 * DNS分析控制器
 * @param props 控制器参数
 * @returns 暴露的状态和方法
 */
export function useDnsAnalysisController(props: DnsAnalysisControllerProps) {
  // 获取Store
  const {
    isLoading,
    dnsRecords,
    hasRecords,
    pagination,
    recordCount,
    viewsOptions,
    recordListParams,
    searchKeyOptions,
    recordTypesOptions,
    fetchRecords,
    fetchViews,
    fetchRecordTypes,
    createRecord,
    updateRecord,
    deleteRecord,
    pauseRecord,
    startRecord,
    setCurrentDomainId,
  } = useDnsAnalysisStore();

  // 本地UI状态
  const editingRecord = ref<DnsRecordItem | null>();
  const isEditing = ref<string>("");
	const isAdding = ref<boolean>(false);
	
	// dns解析弹窗
	const dnsAnalysisDialog = ref<boolean>(false);

  // 新记录表单
  const newRecord = reactive<DnsRecordForm>({
    record_id: "",
    record: "",
    type: "A",
    value: "",
    mx: 1,
    ttl: 600,
    remark: "",
    viewId: 0,
  });

  /**
   * 取消添加
   */
  const cancelAdding = (): void => {
    isAdding.value = false;
  };

  /**
   * 创建DNS记录
   */
  const handleCreateRecord = async (): Promise<boolean> => {
    const params: CreateDnsRecordRequest = {
      domain_id: props.domainId,
      record: newRecord.record,
      type: newRecord.type,
      value: newRecord.value,
      ttl: newRecord.ttl,
      mx: newRecord.mx,
      remark: newRecord.remark,
      viewId: newRecord.viewId,
    };
    try {
      await createRecord(params);
      isAdding.value = false;
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * 更新DNS记录
   */
  const handleUpdateRecord = async (): Promise<boolean> => {
    const params: UpdateDnsRecordRequest = {
      domain_id: props.domainId,
      record_id: newRecord.record_id || 0,
      record: newRecord.record,
      type: newRecord.type,
      value: newRecord.value,
      ttl: newRecord.ttl,
      mx: newRecord.mx,
      remark: newRecord.remark,
      viewId: newRecord.viewId,
    };
    try {
      await updateRecord(params);
      isEditing.value = "";
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * 删除DNS记录
   * @param recordId 记录ID
   */
  const handlDeleteRecord = async (recordId: number | string) => {
    const params: DeleteDnsRecordRequest = {
      record_id: recordId,
      domain_id: props.domainId,
    };
    await deleteRecord(params);
  };

  /**
   * 暂停DNS解析记录
   * @param recordId 记录ID
   */
  const handlPauseRecord = async (recordId: number | string) => {
    const params: ToggleDnsRecordRequest = {
      record_id: recordId,
      domain_id: props.domainId,
    };
    await pauseRecord(params);
  };

  /**
   * 启用DNS解析记录
   * @param recordId 记录ID
   */
  const handlStartRecord = async (recordId: number | string) => {
    const params: ToggleDnsRecordRequest = {
      record_id: recordId,
      domain_id: props.domainId,
    };
    await startRecord(params);
  };

  /**
   * 切换记录状态（启用/暂停）
   * @param record 记录对象
   */
  const toggleRecordStatus = async (record: DnsRecordItem) => {
    // 根据当前状态决定是启用还是暂停
    // state: 0-启用, 1-暂停
    if (record.state === 0) {
      await handlPauseRecord(record.record_id);
    } else {
      await handlStartRecord(record.record_id);
    }
	};

	
  /**
   * 打开dns解析弹窗（移动端），支持添加/编辑
   */
  function openDnsAnalysisDialog(mode: 'add' | 'edit' = 'add', record?: DnsRecordItem) {
    if (!isMobile.value) return
    // 组装初始数据
    const initialData: Partial<DnsRecordForm & { domain_id: number }> = mode === 'edit' && record
      ? {
          record_id: String(record.record_id || 0),
          record: record.record,
          type: record.type as any,
          value: record.value,
          ttl: Number((record as any).TTL ?? 600),
          mx: Number((record as any).MX ?? 0),
          remark: record.remark,
          viewId: Number((record as any).viewID ?? 0),
        }
      : {
          record_id: '',
          record: '',
          type: 'A',
          value: '',
          ttl: 600,
          mx: 1,
          remark: '',
          viewId: 0,
        }
		initialData['domain_id'] = props.domainId
    useModal({
			title: mode === 'add' ? '新增DNS记录' : '编辑DNS记录',
			area: ['100%','100%'],
			component: DnsAnalysisForm,
			componentProps: {
				mode,
				initialData,
				recordTypesOptions: recordTypesOptions.value,
				viewsOptions: viewsOptions.value,
				refresh: fetchRecords,
      },
      footer: false,
    })
  };
	
	// -------------------- 搜索表单（useForm） --------------------
	const { useFormInput, useFormSelect } = useFormHooks()
	const formConfig = () => [
		useFormSelect(
			'',
			'searchKey',
			searchKeyOptions.value,
			{
				placeholder: '请选择查询字段',
				class: 'w-30',
				disabled: isAdding.value || isEditing.value !== '',
			},
			{ showLabel: false, showFeedback: false },
		),
		useFormInput(
			'',
			'searchValue',
			{
				placeholder: '请输入查询的字段内容',
				clearable: true,
				disabled: isAdding.value || isEditing.value !== '',
			},
			{ showLabel: false, showFeedback: false },
		),
		{
			type: 'custom' as const,
			render: () => (
				<NSpace>
					<NButton type="primary" onClick={() => formFetchSearch()}>
						查询
					</NButton>
				</NSpace>
			),
		},
	]

	async function handleFormSearch(values: { searchKey?: string | number; searchValue?: string }) {
		recordListParams.value.searchKey = values?.searchKey as any
		recordListParams.value.searchValue = values?.searchValue || ''
		recordListParams.value.p = 1
		await fetchRecords()
	}

	const { component: FilterForm, fetch: formFetchSearch } = useForm({
		config: formConfig(),
		defaultValue: {
			searchKey: recordListParams.value.searchKey,
			searchValue: recordListParams.value.searchValue,
		},
		request: handleFormSearch,
	})


  // 组件挂载时获取记录
  onMounted(async () => {
    if (props.domainId) {
      setCurrentDomainId(props.domainId);
      await fetchRecords(); // 先获取记录
      await fetchRecordTypes(); // 再获取记录类型
      await fetchViews(); // 最后获取线路
    }
  });

  // 返回暴露的状态和方法
  return {
		// 从Store获取的状态
		isLoading,
		dnsRecords,
		hasRecords,
		pagination,
		recordListParams,
		searchKeyOptions,
		recordCount,
		viewsOptions,
		recordTypesOptions,
		isMobile,

		// 本地UI状态
		newRecord,
		editingRecord,
		isEditing,
		isAdding,

		// 方法
		fetchRecords,
		fetchViews,
		fetchRecordTypes,
		handleCreateRecord,
		handleUpdateRecord,
		handlDeleteRecord,
		handlPauseRecord,
		handlStartRecord,
		toggleRecordStatus,
		// startAdding,
		cancelAdding,

		openDnsAnalysisDialog,

		// 表单
		FilterForm,
		formFetchSearch,
	}
}
