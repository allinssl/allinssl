/**
 * @fileoverview 域名安全管理相关 API 接口
 * @description 提供安全状态查询、密保问题管理、敏感操作限制、全局转移锁等安全功能
 */

import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'
import type {
	SecurityStatusData,
	SecurityQuestionsListData,
	SecurityQuestionItem,
	SetupSecurityQuestionsRequest,
	UpdateProtectionSettingsRequest,
	VerifySecurityQuestionsRequest,
	VerifySecurityQuestionsResponse,
	SendPhoneCodeRequest,
	VerifyPhoneRequest,
	VerifyPhoneResponse,
	PanelWhitelistFormData,
	PanelWhitelistListRequest,
	PanelWhitelistItem,
	PanelWhitelistToggleRequest,
	PanelWhitelistDeleteRequest,
} from '@/views/domain-security/types.d'

/**
 * @description 获取安全页面全局状态
 * @description 获取用户的安全设置状态，包括全局转移锁、密保问题、敏感操作限制等
 * @returns {useAxiosReturn<ApiResponse<SecurityStatusData>>} 返回安全状态数据
 */
export const getSecurityStatus = () =>
	useApi<ApiResponse<SecurityStatusData>>('/v1/user/security/get_security_status')

/**
 * @description 发送手机验证码
 * @description 向指定手机号发送验证码，用于手机号验证
 * @param {SendPhoneCodeRequest} params 发送验证码参数，包含手机号
 * @returns {useAxiosReturn<ApiResponse, SendPhoneCodeRequest>} 返回发送结果
 */
export const sendPhoneCode = (params: SendPhoneCodeRequest) =>
	useApi<ApiResponse, SendPhoneCodeRequest>('/v1/user/security/send_phone_code', params)

/**
 * @description 验证手机号
 * @description 验证手机号和验证码的正确性
 * @param {VerifyPhoneRequest} params 验证参数，包含手机号和验证码
 * @returns {useAxiosReturn<ApiResponse<VerifyPhoneResponse>, VerifyPhoneRequest>} 返回验证结果
 */
export const verifyPhone = (params: VerifyPhoneRequest) =>
	useApi<ApiResponse<VerifyPhoneResponse>, VerifyPhoneRequest>('/v1/user/security/verify_phone', params)

/**
 * @description 获取密保问题列表
 * @description 获取系统提供的所有密保问题选项
 * @returns {useAxiosReturn<ApiResponse<SecurityQuestionsListData>>} 返回密保问题列表
 */
export const getSecurityQuestionsList = () =>
	useApi<ApiResponse<SecurityQuestionsListData>>('/v1/user/security/get_security_questions_list')

/**
 * @description 设置密保问题
 * @description 设置或重置用户的密保问题和答案
 * @param {SetupSecurityQuestionsRequest} params 设置参数，包含问题ID和答案
 * @returns {useAxiosReturn<ApiResponse, SetupSecurityQuestionsRequest>} 返回设置结果
 */
export const setupSecurityQuestions = (params: SetupSecurityQuestionsRequest) =>
	useApi<ApiResponse, SetupSecurityQuestionsRequest>('/v1/user/security/setup_security_questions', params)

/**
 * @description 更新安全设置
 * @description 更新域名转移保护、DNS修改保护、敏感操作保护、全局转移锁等安全设置
 * @param {UpdateProtectionSettingsRequest} params 更新参数，包含各种保护开关
 * @returns {useAxiosReturn<ApiResponse, UpdateProtectionSettingsRequest>} 返回更新结果
 */
export const updateProtectionSettings = (params: UpdateProtectionSettingsRequest) =>
	useApi<ApiResponse, UpdateProtectionSettingsRequest>('/v1/user/security/update_protection_settings', params)

/**
 * @description 获取验证用的密保问题
 * @description 获取用户设置的密保问题，用于验证身份
 * @returns {useAxiosReturn<ApiResponse<{ questions: SecurityQuestionItem[] }>>} 返回验证用密保问题
 */
export const getSecurityQuestionsForVerification = () =>
	useApi<ApiResponse<{ questions: SecurityQuestionItem[] }>>('/v1/user/security/get_security_questions_for_verification')

/**
 * @description 验证密保问题答案
 * @description 验证用户提供的密保问题答案是否正确
 * @param {VerifySecurityQuestionsRequest} params 验证参数，包含操作类型和答案
 * @returns {useAxiosReturn<ApiResponse<VerifySecurityQuestionsResponse>, VerifySecurityQuestionsRequest>} 返回验证结果和安全令牌
 */
export const verifySecurityQuestions = (params: VerifySecurityQuestionsRequest) =>
	useApi<ApiResponse<VerifySecurityQuestionsResponse>, VerifySecurityQuestionsRequest>('/v1/user/security/verify_security_questions', params)

/**
 * @description 设置面板IP白名单
 * @description 创建或更新面板IP白名单设置
 * @param {PanelWhitelistFormData} params 白名单参数，包含IP列表、名称、状态和备注
 * @returns {useAxiosReturn<ApiResponse, PanelWhitelistFormData>} 返回设置结果
 */
export const setPanelWhitelist = (params: PanelWhitelistFormData) =>
	useApi<ApiResponse, PanelWhitelistFormData>('/v1/user/security/set_panel_whitelist', params)

/**
 * @description 获取面板IP白名单列表
 * @description 获取用户的面板IP白名单列表
 * @param {PanelWhitelistListRequest} params 查询参数，包含分页、搜索条件等
 * @returns {useAxiosReturn<ApiResponse<{ list: PanelWhitelistItem[], total: number, page: number, limit: number }>, PanelWhitelistListRequest>} 返回白名单列表
 */
export const getPanelWhitelist = (params?: PanelWhitelistListRequest) =>
	useApi<ApiResponse<{ list: PanelWhitelistItem[], total: number, page: number, limit: number }>, PanelWhitelistListRequest>('/v1/user/security/get_panel_whitelist', params)

/**
 * @description 切换面板IP白名单启用状态
 * @description 切换指定IP白名单的启用/禁用状态
 * @param {PanelWhitelistToggleRequest} params 切换参数，包含ID和启用状态
 * @returns {useAxiosReturn<ApiResponse, PanelWhitelistToggleRequest>} 返回切换结果
 */
export const togglePanelWhitelist = (params: PanelWhitelistToggleRequest) =>
	useApi<ApiResponse, PanelWhitelistToggleRequest>('/v1/user/security/toggle_panel_whitelist', params)

/**
 * @description 删除面板IP白名单
 * @description 删除指定的IP白名单记录
 * @param {PanelWhitelistDeleteRequest} params 删除参数，包含ID
 * @returns {useAxiosReturn<ApiResponse, PanelWhitelistDeleteRequest>} 返回删除结果
 */
export const deletePanelWhitelist = (params: PanelWhitelistDeleteRequest) =>
	useApi<ApiResponse, PanelWhitelistDeleteRequest>('/v1/user/security/delete_panel_whitelist', params)