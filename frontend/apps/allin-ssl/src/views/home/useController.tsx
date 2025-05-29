import { useRouter } from 'vue-router';
import { onMounted } from 'vue'; // 新增：导入 onMounted
import { NTag } from 'naive-ui';

// Type Imports
import type { Ref } from 'vue'; // 新增：导入 Ref 类型
import type { DataTableColumns } from 'naive-ui';
import type { OverviewData, WorkflowHistoryItem } from '@/types/public'; // 新增：导入 OverviewData 类型

// Absolute Internal Imports - Utilities
import { $t } from '@locales/index';

// Relative Internal Imports
import { useStore } from './useStore';

// Side-effect Imports
import styles from './index.module.css';

/**
 * @interface HomeControllerExposes
 * @description 首页 Controller 暴露给视图的接口定义。
 * @property {Ref<OverviewData>} overviewData - 概览数据。
 * @property {(type?: string) => void} pushToWorkflow - 跳转到工作流页面。
 * @property {(type?: string) => void} pushToCert - 跳转到证书申请页面。
 * @property {(type?: string) => void} pushToMonitor - 跳转到监控页面。
 * @property {() => void} pushToCertManage - 跳转到证书管理页面。
 * @property {(state: number) => 'success' | 'error' | 'warning' | 'default'} getWorkflowStateType - 获取工作流状态对应的标签类型。
 * @property {(state: number) => string} getWorkflowStateText - 获取工作流状态对应的文本。
 * @property {(time: string) => string} formatExecTime - 格式化执行时间。
 * @property {() => DataTableColumns<WorkflowHistoryItem>} createColumns - 创建表格列配置。
 */
interface HomeControllerExposes {
	overviewData: Ref<OverviewData>;
	pushToWorkflow: (type?: string) => void;
	pushToCert: (type?: string) => void;
	pushToMonitor: (type?: string) => void;
	pushToCertManage: () => void;
	getWorkflowStateType: (state: number) => 'success' | 'error' | 'warning' | 'default';
	getWorkflowStateText: (state: number) => string;
	formatExecTime: (time: string) => string;
	createColumns: () => DataTableColumns<WorkflowHistoryItem>;
}

/**
 * 首页控制器 (Composable Function)
 *
 * @description 处理首页视图的业务逻辑，包括状态转换、数据格式化、页面导航等功能。
 * @returns {HomeControllerExposes} 返回首页视图所需的状态和方法。
 */
export function useController(): HomeControllerExposes {
	// 路由实例
	const router = useRouter();
	// 从 Store 中获取状态和方法
	const { overviewData, fetchOverviewData } = useStore();

	// -------------------- 业务逻辑处理 --------------------
	/**
	 * 获取工作流状态对应的标签类型。
	 * @function getWorkflowStateType
	 * @param {number} state - 工作流状态值。
	 * @returns {'success' | 'error' | 'warning' | 'default'} NTag 组件的 type 属性值。
	 */
	function getWorkflowStateType(state: number): 'success' | 'error' | 'warning' | 'default' {
		switch (state) {
			case 1:
				return 'success'; // 成功状态
			case 0:
				return 'warning'; // 正在运行状态 (根据原代码逻辑，0是warning，-1是error)
			case -1:
				return 'error'; // 失败状态
			default:
				return 'default'; // 未知状态
		}
	}

	/**
	 * 获取工作流状态对应的文本说明。
	 * @function getWorkflowStateText
	 * @param {number} state - 工作流状态值。
	 * @returns {string} 状态的中文描述。
	 */
	function getWorkflowStateText(state: number): string {
		switch (state) {
			case 1:
				return  $t('t_8_1745227838023');
			case 0:
				return $t('t_0_1747795605426');
			case -1:
				return $t('t_9_1745227838305');
			default:
				return $t('t_11_1745227838422');
		}
	}

	/**
	 * 格式化执行时间为本地化的日期时间字符串。
	 * @function formatExecTime
	 * @param {string} time - ISO 格式的时间字符串。
	 * @returns {string} 格式化后的本地时间字符串。
	 */
	function formatExecTime(time: string): string {
		return new Date(time).toLocaleString();
	}

	/**
	 * 创建工作流历史表格列配置。
	 * @function createColumns
	 * @returns {DataTableColumns<WorkflowHistoryItem>} 工作流历史表格列配置。
	 */
	function createColumns(): DataTableColumns<WorkflowHistoryItem> {
		return [
			{
				title: $t('t_2_1745289353944'), // 名称
				key: 'name',
			},
			{
				title: $t('t_0_1746590054456'), // 状态
				key: 'state',
				render: (row: WorkflowHistoryItem) => {
					const stateType = getWorkflowStateType(row.state);
					const stateText = getWorkflowStateText(row.state);
					return (
						<NTag type={stateType} size="small" class={`${styles.stateText} ${styles[stateType]}`}>
							{stateText}
						</NTag>
					);
				},
			},
			{
				title: $t('t_1_1746590060448'), // 模式
				key: 'mode',
				render: (row: WorkflowHistoryItem) => {
					return <span class={styles.tableText}>{row.mode || $t('t_11_1745227838422')}</span>;
				},
			},
			{
				title: $t('t_4_1745227838558'), // 执行时间
				key: 'exec_time',
				render: (row: WorkflowHistoryItem) => <span class={styles.tableText}>{formatExecTime(row.exec_time)}</span>,
			},
		];
	}

	/**
	 * 跳转至工作流构建页面。
	 * @function pushToWorkflow
	 * @param {string} [type=''] - 类型参数，可选。
	 */
	function pushToWorkflow(type: string = ''): void {
		router.push(`/auto-deploy${type ? `?type=${type}` : ''}`);
	}

	/**
	 * 跳转至申请证书页面。
	 * @function pushToCert
	 * @param {string} [type=''] - 类型参数，可选。
	 */
	function pushToCert(type: string = ''): void {
		router.push(`/cert-apply${type ? `?type=${type}` : ''}`);
	}

	/**
	 * 跳转至证书管理页面。
	 * @function pushToCertManage
	 */
	function pushToCertManage(): void {
		router.push(`/cert-manage`);
	}

	/**
	 * 跳转至添加监控页面。
	 * @function pushToMonitor
	 * @param {string} [type=''] - 类型参数，可选。
	 */
	function pushToMonitor(type: string = ''): void {
		router.push(`/monitor${type ? `?type=${type}` : ''}`);
	}

	onMounted(fetchOverviewData);

	// 暴露状态和方法给视图使用
	return {
		overviewData,
		pushToWorkflow,
		pushToCert,
		pushToMonitor,
		pushToCertManage,
		getWorkflowStateType,
		getWorkflowStateText,
		formatExecTime,
		createColumns,
	};
}
