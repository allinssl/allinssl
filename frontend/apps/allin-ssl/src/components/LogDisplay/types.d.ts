import type { PropType, Ref, ComputedRef, StyleValue } from 'vue';
import type { NLog } from 'naive-ui'; // 假设 NLog 类型可以这样导入，如果不行，需要找到正确的导入方式或使用更通用的类型

/**
 * @description 日志行项目结构
 */
export interface LogLine {
	type: string; // 例如: 'default', 'info', 'error', 'warning'
	content: string;
}

/**
 * @description LogDisplay 组件的 Props 定义
 */
export interface LogDisplayProps {
	/**
	 * 日志内容
	 */
	content?: string;
	/**
	 * 是否加载中
	 */
	loading?: boolean;
	/**
	 * 是否允许下载
	 */
	enableDownload?: boolean;
	/**
	 * 下载文件名
	 */
	downloadFileName?: string;
	/**
	 * 标题
	 */
	title?: string;
	/**
	 * 获取日志方法
	 */
	fetchLogs?: () => Promise<string>;
}

/**
 * @description useLogDisplayController 组合式函数暴露的接口
 */
export interface LogDisplayControllerExposes {
	/**
	 * 内部日志内容引用
	 */
	logs: Ref<string>;
	/**
	 * 内部加载状态引用
	 */
	isLoading: Ref<boolean>;
	/**
	 * NLog 组件实例引用
	 */
	logRef: Ref<InstanceType<typeof NLog> | null>;
	/**
	 * 格式化后的日志内容，供 NLog 组件使用
	 */
	logContent: ComputedRef<LogLine[]>;
	/**
	 * 主题相关的 CSS 变量
	 */
	cssVarStyles: ComputedRef<StyleValue>;
	/**
	 * 刷新日志的方法
	 */
	refreshLogs: () => void;
	/**
	 * 下载日志的方法
	 */
	downloadLogs: () => void;
}