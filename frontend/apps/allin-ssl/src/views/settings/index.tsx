import { NTabs, NTabPane, NCard, NIcon } from 'naive-ui'
import { SettingOutlined, BellOutlined, InfoCircleOutlined } from '@vicons/antd'

import { useStore } from './useStore'
import { useController } from './useController'
import BaseComponent from '@components/BaseLayout'
import GeneralSettings from './components/GeneralSettings'
import NotificationSettings from './components/NotificationSettings'
import AboutSettings from './components/AboutSettings'

/**
 * 设置页面组件
 */
export default defineComponent({
	name: 'Settings',
	setup() {
		const { activeTab, tabOptions } = useStore()
		const { fetchAllSettings, isCutTab } = useController()

		// 渲染图标组件
		const renderIcon = (iconName: string) => {
			const icons: Record<string, any> = {
				SettingOutlined: <SettingOutlined />,
				BellOutlined: <BellOutlined />,
				InfoCircleOutlined: <InfoCircleOutlined />,
			}
			return <NIcon size="20">{icons[iconName]}</NIcon>
		}

		// 自定义Tab样式已移至全局reset.css

		onMounted(() => {
			isCutTab()
			fetchAllSettings()
		})

		return () => (
			<div class="h-full flex flex-col">
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							content: () => (
								<div class="w-full">
									<NCard>
										<NTabs
											class="rounded-2xl p-6"
											type="segment"
											v-model:value={activeTab.value}
											size="large"
											justifyContent="space-evenly"
										>
											{tabOptions.value.map((tab) => (
												<NTabPane key={tab.key} name={tab.key}>
													{{
														tab: () => (
															<div class="flex items-center my-[10px] px-2 py-1 rounded-lg transition-all duration-300 ease-in-out">
																{renderIcon(tab.icon)}
																<span class="ml-2">{tab.title}</span>
															</div>
														),
														default: () => (
															<div class="w-full">
																{/* 常用设置 */}
																{activeTab.value === 'general' && <GeneralSettings />}

																{/* 告警通知 */}
																{activeTab.value === 'notification' && <NotificationSettings />}

																{/* 关于我们 */}
																{activeTab.value === 'about' && <AboutSettings />}
															</div>
														),
													}}
												</NTabPane>
											))}
										</NTabs>
									</NCard>
								</div>
							),
						}}
					/>
				</div>
			</div>
		)
	},
})
