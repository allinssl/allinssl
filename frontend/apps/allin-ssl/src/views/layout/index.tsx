import { Transition, type Component as ComponentType, h } from 'vue'
import { NBadge, NIcon, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NMenu, NTooltip } from 'naive-ui'
import { RouterView } from 'vue-router'

import { $t } from '@locales/index'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@vicons/antd'
import { useController } from './useController'

import styles from './index.module.css'

export default defineComponent({
	setup() {
		// 获取控制器中的状态和方法
		const { menuItems, menuActive, isCollapsed, toggleCollapse, handleExpand, handleCollapse, updateMenuActive } =
			useController()

		// 获取主题变量
		const cssVars = useThemeCssVar(['cardColor', 'headerColor', 'contentColor'])

		return () => (
			<NLayout class={styles.layoutContainer} hasSider style={cssVars.value}>
				<NLayoutSider
					width={200}
					collapsed={isCollapsed.value}
					collapse-mode="width"
					collapsed-width={60}
					onCollapse={handleCollapse}
					onExpand={handleExpand}
					class={styles.sider}
					bordered
				>
					<div class={styles.logoContainer + ' ' + (isCollapsed.value ? styles.logoContainerActive : '')}>
						{!isCollapsed.value ? (
							<div class={styles.logoContainerText}>
								<img src="/static/images/logo.png" alt="logo" class="h-8 w-8" />
								<span class="ml-4 text-[1.6rem] font-bold">{$t('t_1_1744164835667')}</span>
							</div>
						) : null}
						<NTooltip placement="right" trigger="hover">
							{{
								trigger: () => (
									<div
										class={styles.collapsedIcon + ' ' + (isCollapsed.value ? styles.collapsedIconActive : '')}
										onClick={() => toggleCollapse()}
									>
										<NIcon size={18}>{isCollapsed.value ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</NIcon>
									</div>
								),
								default: () => <span>{isCollapsed.value ? $t('t_3_1744098802647') : $t('t_4_1744098802046')}</span>,
							}}
						</NTooltip>
					</div>
					<NMenu
						value={menuActive.value}
						onUpdateValue={updateMenuActive}
						options={menuItems.value}
						class="border-none"
						collapsed={isCollapsed.value}
						collapsed-width={60}
						collapsed-icon-size={20}
					/>
				</NLayoutSider>

				<NLayout>
					<NLayoutHeader class={styles.header}>
						<div class={styles.systemInfo}>
							<NBadge value={1} show={false} dot>
								<span class="px-[.5rem] cursor-pointer">v1.0.1</span>
							</NBadge>
						</div>
					</NLayoutHeader>
					<NLayoutContent class={styles.content}>
						<RouterView>
							{({ Component }: { Component: ComponentType }) => (
								<Transition name="route-slide" mode="out-in">
									{Component && h(Component)}
								</Transition>
							)}
						</RouterView>
					</NLayoutContent>
				</NLayout>
			</NLayout>
		)
	},
})
