/**
 * 返回数据
 */
export interface AxiosResponseData<T = null> {
	code: number
	count: number
	data: T
	message: string
	status: boolean
}

/** 登录参数 */
export interface loginParams {
	/** 用户名 */
	username: string
	/** 密码 */
	password: string
	/** 验证码 */
	code?: string
}

/** 登录响应 */
export interface loginResponse extends AxiosResponseData {
	data: null
}

/** 首页概览请求参数 */
export interface GetOverviewsParams {
	// 没有参数
}

/** 工作流概览数据 */
export interface WorkflowOverview {
	count: number
	active: number
	failure: number
}

/** 证书概览数据 */
export interface CertOverview {
	count: number
	will: number
	end: number
}

/** 站点监控概览数据 */
export interface SiteMonitorOverview {
	count: number
	exception: number
}

/** 工作流历史记录项 */
export interface WorkflowHistoryItem {
	name: string
	state: number
	mode: string
	exec_time: string
}

/** 首页概览响应数据 */
export interface OverviewData {
	workflow: WorkflowOverview
	cert: CertOverview
	monitor: SiteMonitorOverview
	workflow_history: WorkflowHistoryItem[]
}

/** 首页概览响应 */
export interface GetOverviewsResponse extends AxiosResponseData {
	data: OverviewData
}

/** 登录验证码响应 */
export interface loginCodeResponse {
	data: string
}
