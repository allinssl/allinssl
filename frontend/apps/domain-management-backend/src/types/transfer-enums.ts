/**
 * 域名转出状态枚举
 */
export enum DomainTransferOutStatus {
	/** 申请已提交 */
	Submitted = 0,
	/** 申请失败 */
	Failed = 1,
	/** 取消转出 */
	Cancelled = 2,
	/** 转出失败 */
	TransferFailed = 3,
}

/**
 * 域名转出状态配置接口
 */
export interface DomainTransferOutStatusConfig {
	/** 状态文本 */
	text: string
	/** 状态类型 */
	type: 'default' | 'success' | 'warning' | 'error' | 'info'
}

/**
 * 域名转出状态映射
 */
export const DOMAIN_TRANSFER_OUT_STATUS_MAP: Record<DomainTransferOutStatus, DomainTransferOutStatusConfig> = {
	[DomainTransferOutStatus.Submitted]: { text: '申请已提交', type: 'info' },
	[DomainTransferOutStatus.Failed]: { text: '申请失败', type: 'error' },
	[DomainTransferOutStatus.Cancelled]: { text: '取消转出', type: 'warning' },
	[DomainTransferOutStatus.TransferFailed]: { text: '转出失败', type: 'error' },
}

/**
 * BT账号转入状态枚举
 */
export enum BtAccountTransferStatus {
	/** 申请已提交 */
	Submitted = 0,
	/** 申请失败 */
	Failed = 1,
	/** 取消转入 */
	Cancelled = 2,
	/** 转入失败 */
	TransferFailed = 3,
	/** 转入成功 */
	TransferSuccess = 4,
}

/**
 * BT账号转入状态配置接口
 */
export interface BtAccountTransferStatusConfig {
	/** 状态文本 */
	text: string
	/** 状态类型 */
	type: 'default' | 'success' | 'warning' | 'error' | 'info'
}

/**
 * BT账号转入状态映射
 */
export const BT_ACCOUNT_TRANSFER_STATUS_MAP: Record<BtAccountTransferStatus, BtAccountTransferStatusConfig> = {
	[BtAccountTransferStatus.Submitted]: { text: '申请已提交', type: 'info' },
	[BtAccountTransferStatus.Failed]: { text: '申请失败', type: 'error' },
	[BtAccountTransferStatus.Cancelled]: { text: '取消转入', type: 'warning' },
	[BtAccountTransferStatus.TransferFailed]: { text: '转入失败', type: 'error' },
	[BtAccountTransferStatus.TransferSuccess]: { text: '转入成功', type: 'success' },
}