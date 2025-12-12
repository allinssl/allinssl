import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * AllinSSL 自定义暗色主题配置
 * 覆盖全局主题变量
 */
export const allinSslDarkThemeOverrides: GlobalThemeOverrides = {
  common: {
    bodyColor: "#000", // 页面主体背景色 (对应 --n-color)
    cardColor: "#1C1C1C", // 卡片背景色
    modalColor: "#1C1C1C", // 弹出框背景色 (--n-color-modal)
    hoverColor: "#1a1a1a", // 悬停背景色
    errorColor: "#db2828",
    successColor: "#F4D1B4",
    primaryColor: "#D6A487",
    primaryColorHover: "#F4D1B4",
    primaryColorPressed: "#F4D1B4",
  },
  Card: {
    color: "#1C1C1C",
    closeIconColor: "#fff",
  },
  Modal: {
    color: "#1C1C1C",
    closeIconColor: "#fff",
    borderColorHover: "#1C1C1C",
  },
  Layout: {
    color: "#0F0F0F",
    headerColor: "#000", // 头部背景色
    siderColor: "#1e1e1e", // 侧边栏背景色
    siderBorderColor: "transparent", // 侧边栏边框颜色
    headerBorderColor: "1px solid #363637", // 头部边框颜色
    textColor: "transparent", // 头部文字颜色
    footerColor: "#000", // 底部背景色
  },
  DataTable: {
    thColor: "#1a1a1a", // 普通表格表头背景色 (--n-th-color)
    tdColor: "#1c1c1c",
    tdColorHover: "#0f0f0f",
    thColorModal: "#202020", // 弹窗内表格表头背景色 (--n-th-color-modal)
	  borderColorModal: "#202020",
	  loadingColor: "transparent",
    borderColor: "transparent",
  },
  
  Tag: {
    color: "transparent",
    colorInfo: "transparent",
    border: "1px solid #fff",
    borderError: "1px solid #db2828",
    colorError: "#db2828",
    borderSuccess: "1px solid #F4D1B4",
    textColorSuccess: "#F4D1B4",
    borderWarning: "1px solid #f2711c",
    textColorWarning: "#f2711c",
    borderInfo: "1px solid #1EA6FF",
    textColorInfo: "#1EA6FF",
  },
  // 侧边栏菜单激活项样式
  Menu: {
    itemColorHover: "#2a2a2a",
    itemColorActive: "#0f0f0f",
    itemColorActiveHover: "#0f0f0f",
    itemTextColorActive: "#f4d1b4",
    itemTextColorActiveHover: "#f4d1b4",
    itemIconColorActive: "#f4d1b4",
    itemIconColorActiveHover: "#f4d1b4",
    arrowColorActive: "transparent",
    itemTextColorChildActive: "#f4d1b4",
    itemTextColorChildActiveHover: "#f4d1b4",
  },
  Pagination: {
    itemTextColorHover: "#F4D1B4",
    itemTextColorPressed: "#F4D1B4",
    itemTextColorActive: "#282523",
    itemColorActive: "#796051",
    itemColorActiveHover: "#796051",
    itemBorderActive: "1px solid transparent",
    itemBorder: "1px solid transparent",
    itemBorderRadius: "3px",
    itemColor: "#1c1c1c",
    itemColorHover: "#1c1c1c",
    buttonIconColorHover: "#F4D1B4",
    buttonIconColorPressed: "#F4D1B4",
    buttonBorder: "transparent",
    buttonBorderHover: "transparent",
    buttonColorPressed: "#1c1c1c",
    buttonBorderPressed: "transparent",
    buttonColorHover: "#1c1c1c",
    buttonColor: "#1c1c1c",
  },
  Tabs: {
    tabTextColorHover: "#fff",
    tabTextColorActive: "#fff",
    tabColorSegment: "#000",
  },
  InternalSelection: {
    border: "1px solid #4c4c4f",
    borderHover: "1px solid #6C6E72",
    borderActive: "1px solid #F4D1B4",
    borderFocus: "1px solid #6C6E72",
    colorActive: "#1C1C1C",
    boxShadowHover: "transparent",
    boxShadowActive: "transparent",
    boxShadowFocus: "transparent",
    caretColor: "#fff",
    logoColor: "#F4D1B4",
  },
  InternalSelectMenu: {
    color: "#1C1C1C",
    optionColorPending: "#0f0f0f",
    optionColorActivePending: "#0f0f0f",
    optionTextColorHover: "#fff",
    optionTextColorActive: "#F4D1B4",
    optionTextColorPressed: "#fff",
    optionCheckColor: "#fff",
  },
  Button: {
    textColorPrimary: "#1f1f1f",
    colorPrimary: "#F4D1B4",
    colorFocusPrimary: "#eac2a5",
    colorDisabledPrimary: "#7E6859",
    colorPressedPrimary: "#eac2a5",
    borderPrimary: "1px solid #F4D1B4",
    borderRadiusPrimary: "3px",
    colorHoverPrimary: "#eac2a5",
    borderHoverPrimary: "1px solid #F4D1B4",
    borderPressedPrimary: "1px solid #eac2a5",
    borderFocusPrimary: "1px solid #F4D1B4",
    borderDisabledPrimary: "1px solid #F4D1B4",
    
    colorDefault: "#e1e1e1",
    textColorDefault: "#e1e1e1",
    textColorHover: "#F4D1B4",
    borderHover: "1px solid #D6A487",
    borderFocus: "1px solid #F4D1B4",
    borderPressed: "1px solid #F4D1B4",
    colorFocus: "transparent", // 聚焦时背景色设为透明
    textColorFocus: "#F4D1B4", // 聚焦时文字颜色设为白色
    rippleColor: "#F4D1B4",
    rippleColorPrimary: "#7E6859",
    textColorPressed: "#F4D1B4",
    colorPressed: "transparent",
    borderRadius: "3px",
  },
  Input: {
    logoColor: "#F4D1B4",
    color: "#171717",
    colorHover: "transparent",
    border: "1px solid #4C4D4F",
    colorFocus: "#171717", // 聚焦时背景色设为透明
    borderFocus: "1px solid #F4D1B4", // 默认去掉边框
    borderHover: "1px solid #6C6E72",
    iconColor: "#F4D1B4",
	borderHoverError: "1px solid var(--n-error-primary-color)",
	borderFocusError: "1px solid var(--n-error-primary-color)",
    caretColor: "#fff",
    boxShadowFocus: "transparent",
  },
  Switch: {
    railColorActive: "#F4D1B4",
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
    color: "#1c1c1c",
  },
  Checkbox: {
    borderChecked: "1px solid #F4D1B4",
    colorChecked: "#F4D1B4",
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

