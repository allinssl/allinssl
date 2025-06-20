/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	APPLY,
	BRANCH,
	CONDITION,
	DEPLOY,
	END,
	EXECUTE_RESULT_BRANCH,
	EXECUTE_RESULT_CONDITION,
	NOTIFY,
	START,
	UPLOAD,
	DEFAULT,
} from './lib/alias'
import type { FormRules } from 'naive-ui'
import type { Component } from 'vue'

// 拖拽效果
export interface FlowNodeProps {
	isEdit: boolean
	type: 'quick' | 'advanced'
	node: FlowNode
	taskComponents?: Record<string, Component>
}

export interface FlowNode {
	id: string
	name: string
	childNode: BaseNodeData
}

// 添加节点选项
export interface NodeSelect {
	title: NodeTitle
	type: NodeNum
	icon: NodeIcon
	selected: boolean
}

// 节点标题配置
export interface NodeTitle {
	name: string
	color?: string
	bgColor?: string
}

// 节点图标配置
export interface NodeIcon {
	name: string
	color?: string
}

// 操作节点配置，用于渲染节点的操作功能
export interface operateNodeOptions {
	add?: boolean // 是否显示添加节点
	sort?: number // 节点排序，用于排序节点的显示优先级，主要用于配置节点的操作
	addBranch?: boolean // 是否显示添加分支节点，仅在节点类型为分支节点时有效
	addBranchTitle?: string // 添加分支节点标题，仅在节点类型为分支节点时有效
	edit?: boolean // 是否可编辑
	remove?: boolean // 是否可删除
	onSupportNode?: NodeNum[] // 不支持添加的节点类型
}

// 基础节点渲染配置，用于渲染节点
export interface BaseRenderNodeOptions<T extends BaseNodeData> {
	title: NodeTitle // 节点标题
	icon?: NodeIcon // 节点图标
	isAddNode?: boolean // 是否显示添加节点
	isHasDrawer?: boolean // 是否显示抽屉
	operateNode?: operateNodeOptions // 是否显示操作节点
	defaultNode?: T // 默认节点数据 -- 节点数据，用于组合相应结构
}

// 基础节点数据
export interface BaseNodeData<T = Record<string, unknown>> {
	type: NodeNum // 节点类型
	id?: string // 节点id，用于编辑
	name: string // 节点名称
	icon?: NodeIcon // 节点图标
	inputs?: Record<string, unknown>[] // 输入，用于连接其他节点的数据
	config?: T // 参数，用于配置当前的节点
	childNode?: BaseNodeData | BranchNodeData | null // 子节点
}

// 分支节点数据
export interface BranchNodeData<T extends Record<string, unknown> = Record<string, unknown>> extends BaseNodeData<T> {
	type: typeof BRANCH // 节点类型
	conditionNodes: ConditionNodeData[] // 子节点
}

// 执行条件分支节点数据
export interface ExecuteResultBranchNodeData extends BaseNodeData {
	type: typeof EXECUTE_RESULT_BRANCH // 节点类型
	conditionNodes: ExecuteResultConditionNodeData[] // 子节点
}

// 执行结果条件节点数据
interface ExecuteResultCondition {
	type: 'success' | 'fail'
	[key: string]: unknown
}

// 条件节点数据
export interface ExecuteResultConditionNodeData extends BaseNodeData<ExecuteResultCondition> {
	type: typeof EXECUTE_RESULT_CONDITION // 节点类型
	config: ExecuteResultCondition
}

// 节点类型
export type NodeNum =
	| typeof START // 开始节点
	| typeof DEFAULT // 默认节点
	| typeof END // 结束节点
	| typeof BRANCH // 分支节点
	| typeof CONDITION // 条件节点
	| typeof EXECUTE_RESULT_BRANCH // 执行结果分支节点（if）
	| typeof EXECUTE_RESULT_CONDITION // 执行结果条件节点
	| typeof UPLOAD // 上传节点（业务）
	| typeof NOTIFY // 通知节点（业务）
	| typeof APPLY // 申请节点（业务）
	| typeof DEPLOY // 部署节点（业务）

// 节点配置映射
export type NodeOptions = {
	[START]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof START }>
	[END]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof END }>
	[DEFAULT]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof DEFAULT }>
	[BRANCH]: () => BaseRenderNodeOptions<BranchNodeData>
	[CONDITION]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof CONDITION }>
	[EXECUTE_RESULT_BRANCH]: () => BaseRenderNodeOptions<ExecuteResultBranchNodeData>
	[EXECUTE_RESULT_CONDITION]: () => BaseRenderNodeOptions<ExecuteResultConditionNodeData>
	[UPLOAD]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof UPLOAD }>
	[NOTIFY]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof NOTIFY }>
	[APPLY]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof APPLY }>
	[DEPLOY]: () => BaseRenderNodeOptions<BaseNodeData & { type: typeof DEPLOY }>
}

// 基础节点配置
interface BaseNodeProps {
	node: BaseNodeData<Record<string, unknown>>
}

// 定义组件包装器接受的props
export interface NodeWrapProps {
	node?: BaseNodeData | BranchNodeData | ExecuteResultBranchNodeData
	depth?: number
}

/**
 * 验证结果接口
 * @property valid - 验证是否通过
 * @property message - 验证失败时的提示信息
 */
export interface ValidatorResult {
	valid: boolean
	message: string
}

/**
 * 验证函数类型定义
 * @returns ValidatorResult - 返回验证结果对象
 */
export type ValidatorFunction = () => ValidatorResult

/**
 * 兼容async-validator的类型定义
 */
export interface RuleItem {
	type?: string
	required?: boolean
	pattern?: RegExp
	min?: number
	max?: number
	len?: number
	enum?: Array<any>
	whitespace?: boolean
	message?: string
	validator?: (
		rule: RuleItem,
		value: any,
		callback?: (error?: Error) => void,
	) => boolean | Error | Error[] | Promise<void>
	asyncValidator?: (rule: RuleItem, value: any, callback?: (error?: Error) => void) => Promise<void>
	transform?: (value: any) => any
	[key: string]: any
}

/**
 * 兼容async-validator的描述符类型
 */
export type ValidatorDescriptor = FormRules

// 定义组件接收的参数类型(开始节点)
export interface StartNodeConfig {
	// 执行模式：auto-自动，manual-手动
	exec_type: 'auto' | 'manual'
	// 执行周期类型
	type?: 'month' | 'day' | 'week'
	month?: number
	week?: number
	hour?: number
	minute?: number
}

// 定义组件接收的参数类型(申请节点)
export interface ApplyNodeConfig {
	// 基本选项
	domains: string // 域名
	email: string // 邮箱
	eabId: string // CA授权ID（EAB ID）
	ca: string // CA类型
	proxy: string // 代理地址
	provider_id: string // DNS提供商授权ID
	provider: string // DNS提供商
	end_day: number // 续签间隔
	// 高级功能
	name_server: string // DNS递归服务器
	skip_check: number // 跳过检查
	algorithm: string // 数字证书算法
	close_cname: number // 禁用CNAME支持，0关闭1开启，默认0
	max_wait?: number // 预检查超时时间，单位秒（可选）
	ignore_check: number // 忽略预检查结果，1继续，0停止，默认0
	// 高级功能
	// algorithm: 'RSA2048' | 'RSA3072' | 'RSA4096' | 'RSA8192' | 'EC256' | 'EC384' // 数字证书算法
	// dnsServer?: string // 指定DNS解析服务器
	// dnsTimeout?: number // DNS超时时间
	// dnsTtl?: number // DNS解析TTL时间
	// disableCnameFollow: boolean // 关闭CNAME跟随
	// disableAutoRenew: boolean // 关闭ARI续期
	// renewInterval?: number // 续签间隔
}

// 部署节点配置
export interface DeployConfig<
	Z extends Record<string, unknown>,
	T extends
		| 'ssh'
		| 'btpanel'
		| '1panel'
		| 'btpanel-site'
		| '1panel-site'
		| 'tencentcloud-cdn'
		| 'tencentcloud-cos'
		| 'tencentcloud-waf'
		| 'tencentcloud-teo'
		| 'aliyun-cdn'
		| 'aliyun-oss'
		| 'aliyun-waf'
		| 'aliyun-esa'
		| 'doge-cdn'
		| 'baidu-cdn'
		| 'qiniu-cdn'
		| 'qiniu-oss'
		| 'safeline-site'
		| 'safeline-panel'
		| 'btpanel-dockersite'
		| 'plugin', // 新增插件类型
> {
	provider: T
	provider_id: string
	skip: 1 | 0
	type?: string // 插件类型名称，用于插件部署
	provider_data?: any // 提供商数据，用于存储选择时的额外信息
	[key: string]: Z
}

// export interface DeployPanelConfig {}

// 部署节点配置（ssh）
export interface DeploySSHConfig {
	certPath: string // 证书文件路径
	keyPath: string // 私钥文件路径
	beforeCmd: string // 前置命令
	afterCmd?: string // 后置命令
}

// 部署本地节点配置
export interface DeployLocalConfig extends DeploySSHConfig {
	[key: string]: unknown
}

// 部署节点配置（宝塔面板）
export interface DeployBTPanelSiteConfig {
	siteName: string
}

// 部署节点配置（1Panel）
export interface Deploy1PanelConfig {
	site_id: string
}
// 部署节点配置（1Panel站点）
export interface Deploy1PanelSiteConfig extends Deploy1PanelConfig {
	[key: string]: unknown
}

// 部署腾讯云CDN/阿里云CDN
export interface DeployCDNConfig {
	domain: string
}

// 部署阿里云WAF
export interface DeployWAFConfig {
	domain: string
	region: string
}

// 部署腾讯云COS/阿里云OSS
export interface DeployStorageConfig {
	domain: string
	region: string
	bucket: string
}

// 部署阿里云ESA
export interface DeployAliyunESAConfig {
	site_id: string
}

// 部署节点配置（雷池WAF）
export interface DeploySafelineConfig {
	[key: string]: unknown
}

// 部署节点配置（雷池WAF站点）
export interface DeploySafelineSiteConfig extends DeployBTPanelSiteConfig {
	[key: string]: unknown
}

// 部署宝塔docker站点
export interface DeployBTPanelDockerSiteConfig extends DeployBTPanelSiteConfig {
	[key: string]: unknown
}

// 部署插件配置
export interface DeployPluginConfig {
	action: string // 插件方法名称
	params: string // 用户自定义参数（JSON字符串）
}

// 部署节点配置
export type DeployNodeConfig = DeployConfig<
	| DeploySSHConfig // 部署节点配置（ssh）
	| DeployLocalConfig // 部署节点配置（本地）
	| DeployBTPanelConfig // 部署节点配置（宝塔面板）
	| DeployBTPanelSiteConfig // 部署节点配置（宝塔面板站点）
	| Deploy1PanelConfig // 部署节点配置（1Panel）
	| Deploy1PanelSiteConfig // 部署节点配置（1Panel站点）
	| DeployCDNConfig // 部署节点配置（腾讯云CDN/阿里云CDN）
	| DeployWAFConfig // 部署节点配置（阿里云WAF）
	| DeployStorageConfig // 部署节点配置（腾讯云COS/阿里云OSS）
	| DeployAliyunESAConfig // 部署节点配置（阿里云ESA）
	| DeploySafelineConfig // 部署节点配置（雷池WAF）
	| DeploySafelineSiteConfig // 部署节点配置（雷池WAF站点）
	| DeployBTPanelDockerSiteConfig // 部署节点配置（宝塔docker站点）
	| DeployPluginConfig // 部署节点配置（插件）
>

// 部署节点输入配置
export interface DeployNodeInputsConfig {
	name: string
	fromNodeId: string
}

// 定义通知节点配置类型
interface NotifyNodeConfig {
	provider: string
	provider_id: string
	subject: string
	body: string
	skip: boolean // 当结果来源为跳过状态时，跳过/继续发送通知，true:跳过，false:继续
}

// 定义上传节点配置类型
interface UploadNodeConfig {
	cert_id: string
	cert: string
	key: string
}

// 部署节点配置（ssh）
// export type DeployNodeConfigSSH = DeployNodeConfig<'ssh', DeploySSHConfig>

// 部署节点配置（宝塔面板）
// export type DeployNodeConfigBTPanel = DeployNodeConfig<'btpanel', DeployBTPanelConfig>
