/**
 * 主布局组件
 * 提供应用的整体布局结构，包括顶部导航、侧边菜单和主内容区域
 */

import { defineComponent } from 'vue'
import {
	NLayout,
	NLayoutHeader,
	NLayoutSider,
	NLayoutContent,
	NLayoutFooter,
	NMenu,
	NButton,
	NIcon,
	NDrawer,
	NDrawerContent,
	NDropdown,
	NBackTop,
} from 'naive-ui'
import { RouterView } from 'vue-router'
import { useMainLayoutController } from './useController'
import { MenuOutlined, MoreVertOutlined } from '@vicons/material'
import { onMounted, onUnmounted } from 'vue'
/**
 * 主布局组件
 */
export default defineComponent({
	name: 'MainLayout',
	setup() {
		// 使用主布局控制器
		const {
			state,
			menuOptions,
			handleMenuSelect,
			handleBackToOfficial,
			handleLogoClick,
			handleMobileMenuToggle,
			handleMobileBottomMenuToggle,
			initMobile,
			cleanupMobile,
		} = useMainLayoutController()

		// 解构state中的响应式变量
		const { sidebarCollapsed, activeMenuKey, isMobile, mobileMenuVisible, mobileBottomMenuVisible } = state

		const scrollbarContentRef = ref<HTMLDivElement>()

		setTimeout(() => {
			// 初始化移动端检测
			console.log(scrollbarContentRef.value)
		}, 5000)

		// 移动端底部菜单选项
		const mobileBottomMenuOptions = [
			{
				label: '返回堡塔后台',
				key: 'admin',
				props: {
					onClick: () => handleBackToOfficial(true),
				},
			},
			{
				label: '返回官网',
				key: 'official',
				props: {
					onClick: () => handleBackToOfficial(),
				},
			},
		]

		// 组件挂载时初始化移动端检测
		onMounted(() => {
			initMobile()
		})

		// 组件卸载时清理
		onUnmounted(() => {
			cleanupMobile()
		})

		return () => (
			<NLayout class="min-h-screen">
				{/* 顶部状态栏 */}
				<NLayoutHeader
					class={`h-16 flex items-center px-6 border-b border-gray-200 bg-white shadow-sm ${
						isMobile.value ? 'justify-between' : 'justify-between'
					}`}
				>
					{/* 移动端布局 */}
					{isMobile.value ? (
						<>
							{/* 左侧：菜单按钮 */}
							<div class="flex items-center">
								<NButton quaternary circle size="large" onClick={handleMobileMenuToggle}>
									<NIcon size="20">
										<MenuOutlined />
									</NIcon>
								</NButton>
							</div>

							{/* 中间：Logo */}
							<div
								class="flex items-center cursor-pointer mobile-logo absolute left-1/2 transform -translate-x-1/2"
								onClick={handleLogoClick}
							>
								<div class="w-28 flex items-center justify-center">
									<img src="/static/new/images/logo_03.svg" alt="Logo" class="w-[60px] h-full object-contain" />
								</div>
							</div>

							{/* 右侧：更多功能按钮 */}
							<div class="flex items-center">
								<NDropdown
									trigger="click"
									options={mobileBottomMenuOptions}
									placement="bottom-end"
									show={mobileBottomMenuVisible.value}
									onUpdateShow={(show: boolean) => {
										if (!show) {
											handleMobileBottomMenuToggle()
										}
									}}
								>
									<NButton quaternary circle size="large" onClick={handleMobileBottomMenuToggle}>
										<NIcon size="20">
											<MoreVertOutlined />
										</NIcon>
									</NButton>
								</NDropdown>
							</div>
						</>
					) : (
						<>
							{/* 桌面端左侧：Logo */}
							<div class="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
								<div class="w-36 flex items-center justify-center">
									<img src="/static/new/images/logo_03.svg" alt="Logo" class="w-[75px] h-full object-contain" />
								</div>
							</div>

							{/* 桌面端右侧：功能按钮 */}
							<div class="flex items-center gap-4">
								<a
									class="text-[#20a53a] hover:text-[#20a53a]-800 text-sm no-underline cursor-pointer"
									href="https://qm.qq.com/q/fxbto4wZkk"
									target="_blank"
									rel="noopener noreferrer"
								>
									加入QQ群
								</a>
								<NButton ghost onClick={() => handleBackToOfficial(true)}>
									返回堡塔后台
								</NButton>
								<NButton ghost onClick={() => handleBackToOfficial()}>
									返回官网
								</NButton>
							</div>
						</>
					)}
				</NLayoutHeader>

				{/* 主内容区域 */}
				<NLayout hasSider={!isMobile.value} class="flex-1 overflow-hidden h-[calc(100vh-64px)] relative">
					{/* 桌面端左侧菜单 */}
					{!isMobile.value && (
						<NLayoutSider
							collapsed={sidebarCollapsed.value}
							collapsedWidth={64}
							width={200}
							showTrigger
							collapseMode="width"
							class="border-r border-gray-200 shadow-sm bg-white"
							nativeScrollbar={false}
							onCollapse={() => (sidebarCollapsed.value = true)}
							onExpand={() => (sidebarCollapsed.value = false)}
						>
							<NMenu
								collapsed={sidebarCollapsed.value}
								collapsedWidth={64}
								options={menuOptions}
								value={activeMenuKey.value}
								indent={16}
								accordion={true}
								rootIndent={20}
								collapsedIconSize={20}
								default-expanded-keys={['domain']}
								dropdownProps={{
									placement: 'right-start',
									trigger: 'hover',
									showArrow: true,
								}}
								onUpdateValue={handleMenuSelect}
							/>
						</NLayoutSider>
					)}

					{/* 移动端侧边菜单抽屉 */}
					{isMobile.value && (
						<NDrawer
							show={mobileMenuVisible.value}
							width={230}
							placement="left"
							onUpdateShow={(show: boolean) => {
								if (!show) {
									handleMobileMenuToggle()
								}
							}}
							class="mobile-menu-drawer"
							style={{
								'--n-body-padding': '0px',
								'--n-title-font-size': '16px',
								'min-width': '230px',
							}}
						>
							<NDrawerContent title="菜单" closable class="p-0">
								<div class="h-full bg-white">
									<NMenu
										options={menuOptions}
										value={activeMenuKey.value}
										indent={16}
										accordion={true}
										rootIndent={20}
										default-expanded-keys={['domain']}
										onUpdateValue={(key: string) => {
											handleMenuSelect(key)
											// 选择菜单后关闭抽屉
											handleMobileMenuToggle()
										}}
										class="border-none"
									/>
								</div>
							</NDrawerContent>
						</NDrawer>
					)}

					<NLayout class="flex flex-col relative">
						{/* 右侧主要内容区域 */}
						<NLayoutContent class="flex-1 overflow-auto">
							<div class="p-4 bg-gray-50 min-h-[calc(100vh-120px)] box-border">
								<RouterView />{' '}
							</div>
						</NLayoutContent>

						{/* 底部版权声明 */}
						<NLayoutFooter
							class={`${isMobile.value ? 'h-12' : 'h-14'} flex items-center justify-center bg-white border-t border-gray-200 shadow-sm flex-shrink-0`}
						>
							<p class={`${isMobile.value ? 'text-xs' : 'text-sm'} text-gray-500 text-center px-4`}>
								<a
									class="text-[#20a53a] hover:text-[#20a53a]-800 text-sm underline cursor-pointer"
									href="https://docs.bt.cn/domain/"
									target="_blank"
									rel="noopener noreferrer"
								>
									使用帮助
								</a>{' '}
								| 堡塔，让你轻松管理域名 Copyright © 2014-2025
							</p>
						</NLayoutFooter>
					</NLayout>
				</NLayout>
			</NLayout>
		)
	},
})
