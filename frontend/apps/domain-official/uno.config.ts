import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

/**
 * UnoCSS配置文件
 * 基于项目CSS变量定义的设计系统配置
 */
export default defineConfig({
  // 配置UnoCSS扫描的文件内容
  content: {
    filesystem: [
      "**/*.{vue,js,ts,jsx,tsx,html,css}",
      "!node_modules/**/*",
      "!dist/**/*",
    ],
  },

  // 安全列表：确保动态生成的CSS类不会被清除
  safelist: [
    // 状态徽章类
    "status-badge",
    "status-badge-unavailable",
    "status-badge-available",
    "status-badge-premium",
    "status-badge-recommended",
    "status-badge-popular",
    "status-badge-discount",
    // 操作按钮类
    "action-button",
    "action-button-add-cart",
    "action-button-buy-now",
    // 价格提示相关类
    "price-tooltip",
    "price-tooltip-container",
    "price-trigger",
    // 其他动态类
    "domain-actions",
    "cart-item",
    "cart-count",
    "filter-btn",
    "transition-custom",
    "discount-badge",
    // 常用的原子类组合
    "hover:text-primary",
    "hover:text-primary-80",
    "hover:opacity-100",
    "text-secondary-60",
    "text-orange-500",
    // Modal相关类（从modal-notification.js提取）
    "modal-content",
    "modal-close",
    "notification-close",
    // Modal容器类
    "fixed",
    "inset-0",
    "bg-black-50",
    "hidden",
    "flex",
    "items-center",
    "justify-center",
    "px-5",
    "py-5",
    // Modal内容类
    "bg-white",
    "rounded-sm-xl",
    "max-w-sm",
    "max-w-md",
    "max-w-lg",
    "max-w-xl",
    "max-w-2xl",
    "max-w-4xl",
    "w-full",
    "transform",
    "transition-all",
    "scale-95",
    "scale-100",
    "opacity-0",
    "opacity-100",
    // Modal头部类
    "justify-between",
    "p-6",
    "border-b",
    "border-gray-100",
    "text-xl",
    "font-bold",
    "text-dark",
    "text-gray-400",
    "hover:text-gray-600",
    "transition-colors",
    // Modal按钮类
    "flex-1",
    "py-3",
    "rounded-sm",
    "bg-primary",
    "hover:bg-primary-90",
    "text-white",
    "font-medium",
    "border",
    "border-gray-200",
    "hover:bg-light",
    "text-secondary",
    "bg-red-500",
    "hover:bg-red-600",
    "gap-4",
    "border-t",
    // Notification容器类
    "top-20",
    "top-6",
    "bottom-6",
    "right-6",
    "left-6",
    "left-1/2",
    "-translate-x-1/2",
    "translate-x-full",
    "translate-x-0",
    "duration-300",
    // Notification内容类
    "bg-green-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-dark",
    "px-6",
    "py-4",
    "shadow-lg",
    "min-w-[300px]",
    "max-w-[400px]",
    "text-green-400",
    "mr-3",
    "ml-3",
    "mb-1",
    "text-sm",
    "flex-shrink-0",
    "hover:text-gray-200",
    // z-index动态类
    "z-10",
    "z-20",
    "z-30",
    "z-40",
    "z-50",
    "z-60",
    "z-70",
    "z-80",
    "z-90",
    "z-100",
    "z-9990",
  ],

  presets: [
    presetUno(), // 默认预设，包含Tailwind CSS兼容的工具类
    presetAttributify(), // 属性化模式预设
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  shortcuts: {
    // 基于设计系统的组件快捷方式
    btn: "px-4 py-2 rounded-lg inline-block bg-primary text-light cursor-pointer hover:bg-primary-90 transition-all duration-200 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50",
    "btn-primary": "btn bg-primary hover:bg-primary-90",
    "btn-secondary": "btn bg-secondary hover:bg-secondary-80 text-light",
    "btn-success": "btn bg-success hover:bg-success/90",
    "btn-danger": "btn bg-danger hover:bg-danger/90",
    card: "p-6 rounded-lg shadow-md bg-light hover:shadow-lg transition-shadow duration-200",
    "card-hover": "card hover-lift",
    container: "max-w-[1200px] mx-auto px-4",
    "container-1000": "max-w-[1000px] mx-auto px-4",
    "input-field":
      "w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200",
    "status-available":
      "px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success",
    "status-unavailable":
      "px-2 py-1 text-xs font-medium rounded-full bg-secondary/40 text-light",
    "status-premium":
      "px-2 py-1 text-xs font-medium rounded-full bg-yellow-400 text-light",
  },
  theme: {
    colors: {
      light: "#FFFFFF",
      dark: "#1A1A1A",
      discount: "#FF4D4F",
      orange: {
        DEFAULT: "#FF6600",
        400: "#fb923c",
        500: "#f97316",
      },
      // 主色调系统
      primary: {
        DEFAULT: "#20a53a",
        5: "rgba(32, 165, 58, 0.05)",
        10: "rgba(32, 165, 58, 0.1)",
        20: "rgba(32, 165, 58, 0.2)",
        30: "rgba(32, 165, 58, 0.3)",
        40: "rgba(32, 165, 58, 0.4)",
        50: "rgba(32, 165, 58, 0.5)",
        60: "rgba(32, 165, 58, 0.6)",
        70: "rgba(32, 165, 58, 0.7)",
        80: "rgba(32, 165, 58, 0.8)",
        90: "rgba(32, 165, 58, 0.9)",
      },
      secondary: {
        DEFAULT: "#363636",
        40: "rgba(54, 54, 54, 0.4)",
        50: "rgba(54, 54, 54, 0.5)",
        60: "rgba(54, 54, 54, 0.6)",
        70: "rgba(54, 54, 54, 0.7)",
        80: "rgba(54, 54, 54, 0.8)",
      },
      success: {
        DEFAULT: "#00B42A",
        10: "rgba(0, 180, 42, 0.1)",
      },
      danger: {
        DEFAULT: "#F53F3F",
        10: "rgba(245, 63, 63, 0.1)",
        80: "rgba(255, 77, 79, 0.8)",
      },
      // 白色透明度变体
      white: {
        DEFAULT: "#FFFFFF",
        10: "rgba(255, 255, 255, 0.1)",
        70: "rgba(255, 255, 255, 0.7)",
        80: "rgba(255, 255, 255, 0.8)",
      },
      // 黑色透明度变体
      black: {
        50: "rgba(0, 0, 0, 0.5)",
      },
    },
    borderRadius: {
      // 基于CSS变量的圆角系统
      sm: "0.125rem", // 2px
      DEFAULT: "0.25rem", // 4px
      md: "0.25rem", // 4px
      lg: "0.375rem", // 6px
      xl: "0.5rem", // 8px
      "2xl": "0.75rem", // 12px
      full: "9999px",
    },
    boxShadow: {
      // 基于CSS变量的阴影系统
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      DEFAULT:
        "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      md: "0 2px 4px -1px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      lg: "0 4px 6px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      xl: "0 8px 12px -4px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
      card: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
    },
    backgroundColor: {
      rating: "#F9F9F9",
    },
  },
  rules: [
    // 悬停提升效果
    [
      "hover-lift",
      {
        transition:
          "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    ],
    [
      "hover-lift:hover",
      {
        transform: "translateY(-0.125rem)",
      },
    ],
    // 自定义过渡效果
    [
      "transition-custom",
      {
        transition: "all 0.2s ease-in-out",
      },
    ],
    // 动画效果
    [
      "animate-fade-in",
      {
        animation: "fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    ],
    [
      "animate-smooth-fade-in",
      {
        animation: "smooth-fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    ],
  ],
  // 添加关键帧动画
  preflights: [
    {
      getCSS: () => `
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes smooth-fade-in {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `,
    },
  ],
});
