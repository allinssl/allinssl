import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * AllinSSL 自定义暗色主题配置
 * 覆盖全局主题变量
 */
export const allinSslDarkThemeOverrides: GlobalThemeOverrides = {
  common: {
    bodyColor: "#000", // 页面主体背景色 (对应 --n-color)
    cardColor: "#000", // 卡片背景色
    modalColor: "#000", // 弹出框背景色 (--n-color-modal)
    hoverColor: "#1a1a1a", // 悬停背景色
    errorColor: "#FF4314",
    successColor: "#16D13B",
  },
  Card: {
    color: "#000",
    closeIconColor: "#fff",
  },
  Modal: {
    color: "#000",
    closeIconColor: "#fff",
    borderColorHover: "#000",
  },
  Layout: {
    headerColor: "#000", // 头部背景色
    siderColor: "#000", // 侧边栏背景色
    footerColor: "#000", // 底部背景色
  },
  DataTable: {
    thColor: "#202020", // 普通表格表头背景色 (--n-th-color)
    thColorModal: "#202020", // 弹窗内表格表头背景色 (--n-th-color-modal)
	borderColorModal: "#202020",
	loadingColor: "transparent",
  },
  // 仅覆盖暗色主题下 NTag 的 error 语义色为 #FF4314
  Tag: {
    color: "transparent",
    colorInfo: "transparent",
    border: "1px solid #fff",
    borderError: "1px solid #FF4314",
    borderSuccess: "1px solid #16D13B",
    borderWarning: "1px solid #FF8E22",
    borderInfo: "1px solid #1EA6FF",
    textColorInfo: "#1EA6FF",
    textColorWarning: "#FF8E22",
  },
  // 侧边栏菜单激活项样式
  Menu: {
    itemColorActive: "#282218", // 激活项背景色
    itemTextColorActive: "transparent", // 文字颜色设为透明，通过 CSS 渐变实现
    itemIconColorActive: "transparent", // 图标颜色设为透明，通过 CSS 渐变实现
    arrowColorActive: "transparent", // 箭头颜色设为透明，通过 CSS 渐变实现
    itemTextColorChildActive: "transparent",
    itemTextColorChildActiveHover: "transparent",
  },
  Pagination: {
    itemTextColorHover: "#FFCF76",
    itemTextColorPressed: "#FFCF76",
    itemTextColorActive: "transparent",
    itemBorderActive: "1px solid transparent",
    itemBorder: "1px solid transparent",
  },
  Tabs: {
    tabTextColorHover: "#fff",
    tabTextColorActive: "#fff",
    tabColorSegment: "#000",
  },
  InternalSelection: {
    border: "1px solid #4e4e4e",
    borderHover: "1px solid #4e4e4e",
    borderActive: "1px solid #4e4e4e",
    borderFocus: "1px solid #4e4e4e",
    colorActive: "#171717",
    boxShadowHover: "0 0 8px 2px rgba(78, 78, 78, 0.3)",
    boxShadowActive: "0 0 8px 2px rgba(78, 78, 78, 0.3)",
    boxShadowFocus: "0 0 8px 2px rgba(78, 78, 78, 0.3)",
    caretColor: "#fff",
  },
  InternalSelectMenu: {
    optionTextColorHover: "#fff",
    optionTextColorActive: "#FFCF76",
    optionTextColorPressed: "#fff",
    optionCheckColor: "#fff",
  },
  Button: {
    colorDefault: "#2E2D2D",
    colorFocus: "#2E2D2D", // 聚焦时背景色设为透明
    colorHoverPrimary: "transparent",
    colorPressedPrimary: "transparent",
    textColorFocus: "#fff", // 聚焦时文字颜色设为白色
    rippleColor: "#fff",
    rippleColorPrimary: "#9C6240",
    textColorPressed: "#fff",
    colorPressed: "#202020",
  },
  Input: {
    color: "#171717",
    colorHover: "transparent",
    colorFocus: "#171717", // 聚焦时背景色设为透明
    border: "none", // 默认去掉边框
    borderColor: "transparent",
    borderHover: "none",
	borderHoverError: "1px solid var(--n-error-primary-color)",
	borderFocusError: "1px solid var(--n-error-primary-color)",
    borderFocus: "none",
    caretColor: "#fff",
    boxShadowFocus: "0 0 8px 2px rgba(0, 0, 0, 0.3)", // 聚焦时柔和的红色发光效果
  },
  Switch: {
    railColorActive: "transparent",
    boxShadowFocus: "0 0 8px 0 rgba(255, 255, 255, 0.3)",
  },
  Dialog: {
    color: "#000",
    titleTextColor: "#fff",
    closeIconColor: "#fff",
    textColor: "#979BA5",
    iconColor: "transparent",
  },
  Dropdown: {
    color: "#171717",
  },
  Checkbox: {
    borderChecked: "transparent",
    colorChecked: "transparent",
  },
  Popover: {
	color: "#000",
	textColor: "#fff",
	},
};

/**
 * AllinSSL 自定义亮色主题配置
 * 如果需要亮色主题也覆盖，可以在这里配置
 */
export const allinSslLightThemeOverrides: GlobalThemeOverrides = {
	// 亮色主题暂不需要覆盖
}

