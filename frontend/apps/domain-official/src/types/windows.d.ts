/**
 * 窗口相关类型定义
 */

/**
 * 登录状态类型
 * @description 表示用户的登录状态
 */
export type LoginStatus = boolean;

/**
 * 简化的 layer 全局对象类型（仅声明 msg 方法，避免 TS 报错）
 */
export interface LayerGlobal {
	msg?: (message: string, options?: any) => void;
}

/**
 * 窗口全局类型扩展
 */
declare global {
  interface Window {
    /** 用户登录状态 */
    isLoggedIn?: LoginStatus;
    /** 可选的第三方弹层库 */
    layer?: LayerGlobal;
  }
}