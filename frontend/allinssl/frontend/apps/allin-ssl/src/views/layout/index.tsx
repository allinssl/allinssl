// 外部库依赖
import {
	Transition,
	type Component as ComponentType,
	h,
	defineComponent,
	ref,
	onMounted,
	computed,
	watch,
	onUnmounted,
} from 'vue' // 添加 watch, onUnmounted
import {
  NBadge,
  NDropdown,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NTooltip,
  type DropdownOption,
} from "naive-ui";
import { RouterView } from 'vue-router'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@vicons/antd'
import { ChevronDown, MoonOutline, SunnyOutline } from "@vicons/ionicons5";
import { useMediaQuery } from '@vueuse/core' // 引入 useMediaQuery

// 内部模块导入 - Hooks/Composables
import { useThemeCssVar, useTheme } from "@baota/naive-ui/theme";
import { useController } from "./useController";
// 内部模块导入 - 工具函数
import { $t } from '@locales/index'
// 内部模块导入 - 样式
import styles from './index.module.css'
// 内部模块导入 - API
import { getVersion } from '@api/setting'
// 内部模块导入 - 组件
import UpdateLogModal from '@/components/UpdateLogModal'
// 内部模块导入 - 类型
import type { VersionData } from '@/types/setting'

/**
 * @description 基础布局组件，包含侧边栏导航、头部信息和内容区域。
 * @component LayoutView
 */
export default defineComponent({
	name: 'LayoutView',
	setup() {
		const { menuItems, menuActive, isCollapsed, toggleCollapse, handleExpand, handleCollapse, updateMenuActive } =
			useController()
		const { themeActive } = useTheme();
		// 确保所有需要的颜色变量都已在 useThemeCssVar 中声明，或直接在 CSS Module 中使用 var(--n-...)
		const cssVars = useThemeCssVar([
			'bodyColor', // --n-color 通常是 bodyColor
			'headerColor',
			'borderColor',
			'textColorBase',
			'textColor1',
			'textColor2',
			'textColor3',
			'textColorSecondary',
			'actionColor',
			'layoutContentBackgroundColor',
			'siderLoginHeight', // 确保这个变量在 Naive UI 主题中存在或已自定义
			'contentPadding',
		])

		// 版本检查相关状态
		const hasUpdate = ref(false)
		const versionData = ref<VersionData | null>(null)
		const showUpdateModal = ref(false)
		const checkTimer = ref<number | null>(null)

		// 版本检查API
		const versionApi = getVersion()

		// 检查版本更新
		const checkVersion = async () => {
			try {
				await versionApi.fetch()
				if (versionApi.data.value && versionApi.data.value.data) {
					const data = versionApi.data.value.data
					versionData.value = data
					hasUpdate.value = data.update === '1'
				}
			} catch (error) {
				console.error('检查版本更新失败:', error)
			}
		}

		// 点击版本号
		const handleVersionClick = () => {
			if (hasUpdate.value && versionData.value) {
				showUpdateModal.value = true
			}
		}

		const siderWidth = ref(200)
		const siderCollapsedWidth = ref(60)

		// 将断点从 768px 调整为 1100px
		const isMobile = useMediaQuery('(max-width: 768px)')
		const isNarrowScreen = useMediaQuery('(max-width: 1100px)')

		onMounted(() => {
			// 初始化时根据屏幕宽度设置菜单状态
			if (isMobile.value || isNarrowScreen.value) {
				isCollapsed.value = true
			}

			// 初始检查版本
			checkVersion()

			// 设置定时检查版本更新（每30分钟检查一次）
			checkTimer.value = setInterval(checkVersion, 30 * 60 * 1000)
		})

		// 组件卸载时清理定时器
		onUnmounted(() => {
			if (checkTimer.value) {
				clearInterval(checkTimer.value)
			}
		})

		// 监听屏幕宽度变化，自动折叠/展开菜单
		watch(isNarrowScreen, (newValue) => {
			if (newValue && !isMobile.value) {
				// 仅在非移动设备且宽度小于1100px时处理
				isCollapsed.value = true
			} else if (!newValue && !isMobile.value) {
				// 宽度大于1100px且非移动设备时
				isCollapsed.value = false
			}
		})

		// 控制 NLayoutSider 组件的 'collapsed' prop
		// 在移动端，我们希望 NLayoutSider 始终保持其展开时的宽度，
		// 通过 CSS transform 控制其显示/隐藏，以避免 Naive UI 自身的宽度过渡动画。
		const nLayoutSiderCollapsedProp = computed(() => {
			if (isMobile.value) {
				return false // 在移动端，阻止 NLayoutSider 因 collapsed 变化而产生的宽度动画
			}
			return isCollapsed.value // 桌面端按正常逻辑处理
		})

		// 控制 NLayoutSider 内部 NMenu 组件的 'collapsed' prop
		// 这决定了菜单项是显示为图标还是图标加文字。
		// 在移动端，当侧边栏滑出隐藏时 (isCollapsed.value 为 true)，菜单也应处于折叠状态。
		// 当侧边栏滑入显示时 (!isCollapsed.value 为 true)，菜单应处于展开状态。
		// 桌面端则直接跟随 isCollapsed.value。
		// 因此，此计算属性直接返回 isCollapsed.value 即可。
		const nMenuCollapsedProp = computed(() => {
			return isCollapsed.value
		})

		// 动态计算 NLayoutSider 的 class，用于移动端的滑入滑出动画
		const siderDynamicClass = computed(() => {
			if (isMobile.value) {
				// 当 !isCollapsed.value (菜单逻辑上应为打开状态) 时，应用滑入样式
				// 当 isCollapsed.value (菜单逻辑上应为关闭状态) 时，应用滑出样式
				return !isCollapsed.value ? styles.siderMobileOpen : styles.siderMobileClosed
			}
			return '' // 桌面端不需要此动态 class
		})

		const showBackdrop = computed(() => isMobile.value && !isCollapsed.value)

		// NMenu 的折叠状态 (此处的 menuCollapsedState 变量名可以替换为 nMenuCollapsedProp)
		// const menuCollapsedState = computed(() => { ... }) // 旧的，将被 nMenuCollapsedProp 替代

		const themeLabelMap: Record<string, string> = {
      defaultLight: "Default",
      defaultDark: "Gold",
    };

    const themeDropdownOptions: DropdownOption[] = [
      {
        label: "Default",
        key: "defaultLight",
        icon: () => (
          <NIcon size={16}>
            <SunnyOutline />
          </NIcon>
        ),
      },
      {
        label: "Gold",
        key: "defaultDark",
        icon: () => (
          <NIcon size={16}>
            <MoonOutline />
          </NIcon>
        ),
      },
    ];

    const handleThemeSelect = (key: string | number) => {
      if (typeof key !== "string") return;
      if (themeActive.value === key) return;
      themeActive.value = key;
    };

    return () => {
      const isGoldTheme = themeActive.value === "defaultDark";
      const ThemeIcon = isGoldTheme ? MoonOutline : SunnyOutline;
      const currentLabel = themeLabelMap[themeActive.value] || "Default";

      return (
        <NLayout class={styles.layoutContainer} hasSider style={cssVars.value}>
          <svg width="0" height="0" style="position: absolute">
            <defs>
              <linearGradient
                id="menu-active-icon-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stop-color="#9C6240" />
                <stop offset="100%" stop-color="#FFCF76" />
              </linearGradient>
            </defs>
          </svg>
          <NLayoutSider
            width={siderWidth.value} // 在移动端，宽度始终是展开时的宽度
            collapsed={nLayoutSiderCollapsedProp.value} // 使用新的计算属性
            showTrigger={false}
            collapseMode="width"
            collapsedWidth={siderCollapsedWidth.value} // 桌面端折叠宽度及 NMenu 折叠宽度参考
            onCollapse={handleCollapse}
            onExpand={handleExpand}
            class={[styles.sider, siderDynamicClass.value].join(" ")}
            bordered
          >
            <div
              class={`${styles.logoContainer} ${
                // Logo 容器的 'active' 状态 (仅在桌面端且折叠时应用)
                // 在移动端，由于 NLayoutSider 自身宽度不变，不应用 active 样式来改变 Logo 区域布局
                (isMobile.value ? false : isCollapsed.value)
                  ? styles.logoContainerActive
                  : ""
              }`}
            >
              {/* Logo 显示逻辑 */}
              {(isMobile.value ? false : isCollapsed.value) ? (
                // 折叠时的 Logo (仅桌面端)
                <div class="flex items-center justify-center w-full h-full">
                  <img
                    src={`/static/images/logo${isGoldTheme ? '-dark' : ''}.png`}
                    alt="logo"
                    class="h-8 w-8"
                  />
                </div>
              ) : (
                // 展开时的 Logo (桌面端展开时，或移动端侧边栏可见时)
                <div class={styles.logoContainerText}>
                  <img
                    src={`/static/images/logo${isGoldTheme ? '-dark' : ''}.png`}
                    alt="logo"
                    class="h-8 w-8 mr-2 sm:mr-3"
                  />
                  <span class={`${styles.logoText} ml-0 font-bold`}>
                    {$t("t_1_1744164835667")}
                  </span>
                </div>
              )}
              {/* 桌面端展开状态下的内部折叠按钮 */}
              {!isCollapsed.value && !isMobile.value && (
                <NTooltip placement="right" trigger="hover">
                  {{
                    trigger: () => (
                      <div
                        class={styles.menuToggleButton}
                        onClick={() => toggleCollapse()}
                      >
                        <NIcon size={20}>
                          <MenuFoldOutlined />
                        </NIcon>{" "}
                        {/* 图标大小调整为 20 */}
                      </div>
                    ),
                    default: () => <span>{$t("t_4_1744098802046")}</span>,
                  }}
                </NTooltip>
              )}
            </div>
            <NMenu
              value={menuActive.value}
              onUpdateValue={(key: string, item: any) => {
                updateMenuActive(key as any); // 保留原有的菜单激活逻辑
                // 如果是移动端并且菜单当前是展开状态，则关闭菜单
                if (isMobile.value && !isCollapsed.value) {
                  isCollapsed.value = true; // 直接设置 isCollapsed 为 true 来关闭菜单
                }
              }}
              options={menuItems.value}
              class="border-none"
              collapsed={nMenuCollapsedProp.value} // NMenu 的折叠状态
              collapsedWidth={siderCollapsedWidth.value}
              collapsedIconSize={22}
            />
          </NLayoutSider>

          <NLayout>
            <NLayoutHeader class={styles.header}>
              {/* 移动端或桌面端侧边栏折叠时，在头部左侧显示展开/收起按钮 */}
              {(isMobile.value || (!isMobile.value && isCollapsed.value)) && (
                <div class="mr-auto">
                  <NTooltip placement="right" trigger="hover">
                    {{
                      trigger: () => (
                        <div
                          class={styles.headerMenuToggleButton}
                          onClick={() => toggleCollapse()}
                        >
                          <NIcon size={20}>
                            {isCollapsed.value ? (
                              <MenuUnfoldOutlined />
                            ) : (
                              <MenuFoldOutlined />
                            )}
                          </NIcon>
                        </div>
                      ),
                      default: () => <span>展开主菜单</span>,
                    }}
                  </NTooltip>
                </div>
              )}
              <div class={styles.systemInfo}>
                <div class={styles.themeSelector}>
                  <NDropdown
                    trigger="click"
                    options={themeDropdownOptions}
                    onSelect={handleThemeSelect}
                  >
                    <div class={styles.themeSelectorTrigger}>
                      <NIcon size={isGoldTheme ? 16 : 18}>
                        <ThemeIcon />
                      </NIcon>
                      <span class={styles.themeSelectorLabel}>
                        {currentLabel}
                      </span>
                      <NIcon size={18} class={styles.themeSelectorArrow}>
                        <ChevronDown />
                      </NIcon>
                    </div>
                  </NDropdown>
                </div>
                <NBadge value={1} show={hasUpdate.value} dot>
                  <span
                    class="px-[.8rem] sm:px-[.5rem] py-[.4rem] cursor-pointer hover:text-primary transition-colors text-[1.4rem] font-medium"
                    onClick={handleVersionClick}
                  >
                    {versionData.value && versionData.value.version}
                  </span>
                </NBadge>
              </div>
            </NLayoutHeader>
            <NLayoutContent class={styles.content}>
              <RouterView>
                {({ Component }: { Component: ComponentType }) => (
                  <Transition name="fade" mode="out-in">
                    {Component && h(Component)}
                  </Transition>
                )}
              </RouterView>
            </NLayoutContent>
          </NLayout>
          {/* 移动端菜单展开时的背景遮罩 */}
          {showBackdrop.value && (
            <div
              class={styles.mobileMenuBackdrop}
              onClick={() => toggleCollapse()}
            ></div>
          )}

          {/* 更新日志弹窗 */}
          <UpdateLogModal
            v-model:show={showUpdateModal.value}
            versionData={versionData.value}
          />
        </NLayout>
      );
    };
	},
})
