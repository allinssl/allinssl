import { defineComponent } from 'vue'; // 修改：移除 computed
import { NCard, NSpin, NIcon, NEmpty, NDataTable, NButton } from 'naive-ui';
import { CloudMonitoring, Flow, ArrowRight } from '@vicons/carbon';
import { Certificate20Regular } from '@vicons/fluent';
import { useThemeCssVar } from '@baota/naive-ui/theme';

// Absolute Internal Imports - Utilities
import { $t } from '@locales/index';

// Relative Internal Imports
import { useController } from './useController';
import { useStore } from './useStore';

// Side-effect Imports
import styles from './index.module.css';

/**
 * @component HomeView
 * @description 首页视图组件。
 * 负责展示应用概览信息、工作流历史以及快捷入口。
 */
export default defineComponent({
	name: 'HomeView',
	setup() {
		const { loading } = useStore()
		const { overviewData, pushToWorkflow, pushToCert, pushToMonitor, pushToCertManage, createColumns } = useController()
		const columns = createColumns()

		// 参考 layout/index.tsx 的用法，直接获取需要的 Naive UI 主题变量
		// useThemeCssVar 会将这些 camelCase 变量名转换为 kebab-case CSS 变量 (e.g., successColor -> --n-success-color)
		// 并将它们应用到绑定 style 的元素上。
		const cssVars = useThemeCssVar(['successColor', 'errorColor', 'warningColor', 'primaryColor']);

		return () => (
			<div class="mx-auto max-w-[1600px] w-full p-6" style={cssVars.value}>
				<NSpin show={loading.value}>
					<div class="flex flex-col h-full gap-8">
						{/* 概览模块 */}
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* 自动化工作流概览卡片 */}
							<div onClick={() => pushToWorkflow()} class="cursor-pointer relative">
								<div
									class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
								></div>
								<NCard class="transition-all duration-300 rounded-[0.6rem]" hoverable={true} bordered={false}>
									<div class="flex items-center justify-center">
										<div class="flex-1">
											<div class={styles.tableText}>{$t('t_2_1746773350970')}</div>
											<div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
												<div>
													<span class="xl:text-[2.4rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold">
														{overviewData.value.workflow.count}
													</span>
													<p class={styles.tableText}>{$t('t_3_1746773348798')}</p>
												</div>
												<div class="border-l-2 xl:pl-[2rem] xl:ml-[3rem] lg:pl-[1.5rem] lg:ml-[2.5rem] md:pl-[1.5rem] md:ml-[2rem] pl-[1rem] ml-[1.5rem] min-h-[5rem] flex flex-col justify-center">
													<div class="flex items-center space-x-1">
														<span class={`w-4 h-4 rounded-full mr-[.6rem] ${styles.bgUtilSuccess}`}></span>
														<span class={styles.tableText}>
															{$t('t_0_1746782379424')}: {overviewData.value.workflow.active}
														</span>
													</div>
													<div class="flex items-center space-x-1 mt-3">
														<span class={`w-4 h-4 rounded-full mr-[.6rem] ${styles.bgUtilError}`}></span>
														<span class={styles.tableText}>
															{$t('t_4_1746773348957')}: {overviewData.value.workflow.failure}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div class={styles.workflowIcon}>
											<NIcon size="28">
												<Flow />
											</NIcon>
										</div>
									</div>
								</NCard>
							</div>

							{/* 证书管理概览卡片 */}
							<div onClick={() => pushToCertManage()} class="cursor-pointer relative">
								<div
									class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
								></div>
								<NCard class="transition-all duration-300 rounded-[0.6rem]" hoverable={true} bordered={false}>
									<div class="flex items-center justify-center">
										<div class="flex-1">
											<div class={styles.tableText}>{$t('t_2_1744258111238')}</div>
											<div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
												<div>
													<span class="xl:text-[2.4rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold">
														{overviewData.value.cert.count}
													</span>
													<p class={styles.tableText}>{$t('t_3_1746773348798')}</p>
												</div>
												<div class="border-l-2 xl:pl-[2rem] xl:ml-[3rem] lg:pl-[1.5rem] lg:ml-[2.5rem] md:pl-[1.5rem] md:ml-[2rem] pl-[1rem] ml-[1.5rem] min-h-[5rem] flex flex-col justify-center">
													<div class="flex items-center space-x-1">
														<span class={`w-4 h-4 rounded-full mr-[.6rem] ${styles.bgUtilWarning}`}></span>
														<span class={styles.tableText}>
															{$t('t_5_1746773349141')}: {overviewData.value.cert.will}
														</span>
													</div>
													<div class="flex items-center space-x-1 mt-3">
														<span class={`w-4 h-4 rounded-full mr-[.6rem] ${styles.bgUtilError}`}></span>
														<span class={styles.tableText}>
															{$t('t_0_1746001199409')}: {overviewData.value.cert.end}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div class={styles.certIcon}>
											<NIcon size="28">
												<Certificate20Regular />
											</NIcon>
										</div>
									</div>
								</NCard>
							</div>

							{/* 实时监控概览卡片 */}
							<div onClick={() => pushToMonitor()} class="cursor-pointer relative">
								<div
									class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
								></div>
								<NCard class="transition-all duration-300 rounded-[0.6rem]" hoverable={true} bordered={false}>
									<div class="flex items-center justify-center">
										<div class="flex-1">
											<div class={styles.tableText}>{$t('t_6_1746773349980')}</div>
											<div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
												<div>
													<span class="xl:text-[2.4rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold">
														{overviewData.value.site_monitor.count}
													</span>
													<p class={styles.tableText}>{$t('t_3_1746773348798')}</p>
												</div>
												<div class="border-l-2 xl:pl-[2rem] xl:ml-[3rem] lg:pl-[1.5rem] lg:ml-[2.5rem] md:pl-[1.5rem] md:ml-[2rem] pl-[1rem] ml-[1.5rem] min-h-[5rem] flex flex-col justify-center">
													<div class="flex items-center space-x-1">
														<span class={`w-4 h-4 rounded-full mr-[.6rem] ${styles.bgUtilError}`}></span>
														<span class={styles.tableText}>
															{$t('t_7_1746773349302')}: {overviewData.value.site_monitor.exception}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div class={styles.monitorIcon}>
											<NIcon size="28">
												<CloudMonitoring />
											</NIcon>
										</div>
									</div>
								</NCard>
							</div>
						</div>

						{/* 工作流执行列表 */}
						<NCard class="rounded-[0.6rem] transition-all duration-300" hoverable={true} bordered={false}>
							<div class="flex justify-between items-center mb-4">
								<div class={styles.tableText}>{$t('t_8_1746773351524')}</div>
								<NButton text type="primary" onClick={() => pushToWorkflow()} class={styles.viewAllButton}>
									{$t('t_9_1746773348221')}
									<NIcon class="ml-1">
										<ArrowRight />
									</NIcon>
								</NButton>
							</div>
							{overviewData.value.workflow_history.length > 0 ? (
								<NDataTable
									columns={columns}
									data={overviewData.value.workflow_history}
									bordered={false}
									size="small"
									singleLine={false}
									rowClassName={() => 'border-none'}
									class="border-none"
									style={{
										'--n-border-color': 'transparent',
										'--n-border-radius': '0',
									}}
								/>
							) : (
								<NEmpty description={$t('t_10_1746773351576')} />
							)}
						</NCard>

						{/* 快捷入口区域 */}
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* 工作流构建入口 */}
							<div onClick={() => pushToWorkflow('create')} class="cursor-pointer">
								<NCard
									class={`${styles.quickEntryCard} ${styles.workflow} transition-all duration-300`}
									hoverable={true}
									bordered={false}
								>
									<div class="flex items-center p-6">
										<div class={`${styles.iconWrapper} mr-6`}>
											<NIcon size="32">
												<Flow />
											</NIcon>
										</div>
										<div class="flex-1">
											<div class={`${styles.title} text-[1.8rem] font-medium mb-3`}>{$t('t_11_1746773349054')}</div>
											<div class={styles.tableText}>{$t('t_12_1746773355641')}</div>
										</div>
									</div>
								</NCard>
							</div>

							{/* 申请证书入口 */}
							<div onClick={() => pushToCert()} class="cursor-pointer">
								<NCard
									class={`${styles.quickEntryCard} ${styles.cert} transition-all duration-300 rounded-[0.6rem]`}
									hoverable={true}
									bordered={false}
								>
									<div class="flex items-center p-6">
										<div class={`${styles.iconWrapper} mr-6`}>
											<NIcon size="32">
												<Certificate20Regular />
											</NIcon>
										</div>
										<div class="flex-1">
											<div class={`${styles.title} text-[1.8rem] font-medium mb-3`}>{$t('t_13_1746773349526')}</div>
											<div class={styles.tableText}>{$t('t_14_1746773355081')}</div>
										</div>
									</div>
								</NCard>
							</div>

							{/* 添加监控入口 */}
							<div onClick={() => pushToMonitor('create')} class="cursor-pointer">
								<NCard
									class={`${styles.quickEntryCard} ${styles.monitor} transition-all duration-300 rounded-[0.6rem]`}
									hoverable={true}
									bordered={false}
								>
									<div class="flex items-center p-6">
										<div class={`${styles.iconWrapper} mr-6`}>
											<NIcon size="32">
												<CloudMonitoring />
											</NIcon>
										</div>
										<div class="flex-1">
											<div class={`${styles.title} text-[1.8rem] font-medium mb-3`}>{$t('t_11_1745289354516')}</div>
											<div class={styles.tableText}>{$t('t_1_1747019624067')}</div>
										</div>
									</div>
								</NCard>
							</div>
						</div>
					</div>
				</NSpin>
			</div>
		)
	}
})
