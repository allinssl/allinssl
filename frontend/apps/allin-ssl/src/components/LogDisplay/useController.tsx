// External Libraries
import { ref, watch, computed, onMounted, nextTick, type StyleValue } from 'vue';
import hljs from 'highlight.js/lib/core';
import { NLog } from 'naive-ui'; // 确保 NLog 可以作为类型导入，或者其类型定义可用

// Type Imports
import type { LogDisplayProps, LogLine, LogDisplayControllerExposes } from './types';

// Absolute Internal Imports
import { $t } from '@locales/index';
import { useThemeCssVar } from '@baota/naive-ui/theme'; // 假设路径正确

/**
 * @description LogDisplay 组件的控制器逻辑
 * @param props - 组件的 props
 * @returns {LogDisplayControllerExposes} 暴露给视图的响应式数据和方法
 */
export function useLogDisplayController(
	props: LogDisplayProps,
): LogDisplayControllerExposes {
	const logs = ref(props.content || '');
	const isLoading = ref(props.loading || false);
	const logRef = ref<InstanceType<typeof NLog> | null>(null);

	// 初始化 highlight.js 自定义语言 (仅执行一次)
	// 注意: 如果多个 LogDisplay 实例共享页面，此注册是全局的。
	// 如果需要隔离，可能需要更复杂的处理或在应用级别注册。
	if (!hljs.getLanguage('custom-logs')) {
		hljs.registerLanguage('custom-logs', () => ({
			contains: [
				{
					className: 'info-text',
					begin: /\[INFO\]/,
				},
				{
					className: 'error-text',
					begin: /\[ERROR\]/,
				},
				{
					className: 'warning-text',
					begin: /\[WARNING\]/,
				},
				{
					className: 'date-text',
					begin: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
				},
			],
		}));
	}

	const themeCssVars = useThemeCssVar(['successColor', 'errorColor', 'warningColor', 'successColorPressed']);
	const cssVarStyles = computed((): StyleValue => {
		// 根据 useThemeCssVar 的实际返回值和 NCard 的 style 需求来构造
		// 示例： return { '--success-color': themeCssVars.value.successColor, ... }
		// 为了简单起见，这里直接返回，实际项目中可能需要转换
		return themeCssVars.value as StyleValue;
	});
	
	// 监听外部 props.content 变化
	watch(
		() => props.content,
		(newValue) => {
			logs.value = newValue || '';
			scrollToBottom();
		},
	);

	// 监听外部 props.loading 变化
	watch(
		() => props.loading,
		(newValue) => {
			isLoading.value = !!newValue;
		},
	);

	/**
	 * @description 滚动到日志底部
	 */
	const scrollToBottom = () => {
		nextTick(() => {
			// NLog 的 scrollTo 方法可能需要特定参数或直接操作其内部的滚动元素
			// 此处假设 NLog 实例有 scrollTo 方法且接受 { top: number }
			logRef.value?.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: 'smooth' });
		});
	};

	/**
	 * @description 加载日志内容
	 */
	const loadLogs = async () => {
		if (!props.fetchLogs) return;
		isLoading.value = true;
		try {
			const result = await props.fetchLogs();
			logs.value = result;
			scrollToBottom();
		} catch (error) {
			logs.value = `${$t('t_1_1746776198156')}: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * @description 下载日志
	 */
	const downloadLogs = () => {
		if (!logs.value) return;
		const blob = new Blob([logs.value], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = props.downloadFileName || 'logs.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	/**
	 * @description 刷新日志
	 */
	const refreshLogs = () => {
		loadLogs();
	};

	/**
	 * @description 将日志内容字符串转换为 NLog 需要的格式
	 */
	const logContent = computed((): LogLine[] => {
		if (!logs.value) return [];
		return logs.value.split('\n').map(
			(line): LogLine => ({
				type: 'default', // NLog 可能不需要这个 type，或者可以根据行内容动态设置
				content: line,
			}),
		);
	});

	onMounted(() => {
		if (props.fetchLogs) {
			loadLogs();
		} else if (props.content) {
			scrollToBottom() // 如果初始就有 content prop，也尝试滚动到底部
		}
	});

	return {
		logs,
		isLoading,
		logRef,
		logContent,
		cssVarStyles,
		refreshLogs,
		downloadLogs,
	};
}