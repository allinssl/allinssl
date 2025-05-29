// External Libraries
import { defineComponent, type PropType } from 'vue';
import { NCard, NSpin, NButton, NSpace, NIcon, NLog, NConfigProvider } from 'naive-ui';
import hljs from 'highlight.js/lib/core'; // hljs 仍需在此导入以传递给 NConfigProvider

// Type Imports
import type { LogDisplayProps } from './types';

// Absolute Internal Imports
import { $t } from '@locales/index';
import { DownloadOutline, RefreshOutline } from '@vicons/ionicons5';

// Relative Internal Imports
import { useLogDisplayController } from './useController';

/**
 * @description LogDisplay 组件 (LogViewer)
 * @description 用于显示日志内容，支持加载、刷新、下载和自定义高亮。
 */
export default defineComponent({
	name: 'LogViewer',
	props: {
		content: {
			type: String,
			default: '',
		},
		loading: {
			type: Boolean,
			default: false,
		},
		enableDownload: {
			type: Boolean,
			default: true,
		},
		downloadFileName: {
			type: String,
			default: 'logs.txt',
		},
		title: {
			type: String,
			default: () => $t('t_0_1746776194126'), // $t('t_0_1747754231151')
		},
		fetchLogs: {
			type: Function as PropType<() => Promise<string>>,
			default: undefined, // 显式设为 undefined，由 controller 判断
		},
	} as const, // 使用 as const 帮助类型推断

	setup(props: LogDisplayProps) {
		const {
			isLoading,
			logRef,
			logContent, // NLog 的 log prop 应该直接使用 controller.logs.value
			cssVarStyles,
			refreshLogs,
			downloadLogs,
		} = useLogDisplayController(props);

		return () => (
			<NCard
				title={props.title} // 使用 props.title
				bordered={false}
				class="w-full h-full flex flex-col" // 确保 NCard 充满高度
				contentClass="!p-3 flex-grow overflow-hidden" // 让内容区域可滚动
				style={cssVarStyles.value} // 应用主题样式
				headerClass="flex-shrink-0"
				footerClass="flex-shrink-0"
			>
				{{
					header: () => props.title,
					'header-extra': () => (
						<NSpace>
							<NButton onClick={refreshLogs} size="small" type="primary" disabled={isLoading.value}>
								{{
									icon: () => (
										<NIcon>
											<RefreshOutline />
										</NIcon>
									),
									default: () => $t('t_0_1746497662220'),
								}}
							</NButton>
							{props.enableDownload && (
								<NButton onClick={downloadLogs} size="small" disabled={isLoading.value || !logContent.value.length}>
									{{
										icon: () => (
											<NIcon>
												<DownloadOutline />
											</NIcon>
										),
										default: () => $t('t_2_1746776194263'),
									}}
								</NButton>
							)}
						</NSpace>
					),
					default: () => (
						<NSpin show={isLoading.value} class="h-full">
							<NConfigProvider hljs={hljs} class="h-full">
								<NLog
									ref={logRef}
									log={logContent.value.map((line) => line.content).join('\n')} // NLog 的 log prop 期望是 string
									language="custom-logs"
									trim={false}
									fontSize={14}
									lineHeight={1.5}
									class="h-full" // NLog 充满 NSpin
									style={{
										// height: '500px', // 改为 flex 布局后，由父容器控制高度
										border: '1px solid var(--n-border-color)',
										borderRadius: 'var(--n-border-radius)', // 使用 Naive UI 变量
										padding: '10px',
									}}
								/>
							</NConfigProvider>
						</NSpin>
					),
				}}
			</NCard>
		)
	},
});
