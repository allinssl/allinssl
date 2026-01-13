/**
 * 私有CA项类型
 */
export interface PrivateCaItem {
	/** CA ID */
	id: string;
	/** CA名称 */
	name: string;
	/** 可分辨名称 */
	distinguishedName: string;
	/** CA类型：root-根CA，intermediate-中间CA */
	type: 'root' | 'intermediate';
	/** 加密算法 */
	algorithm: string;
	/** 密钥长度 */
	keySize: string;
	/** 有效期开始时间 */
	validFrom: string;
	/** 有效期结束时间 */
	validTo: string;
	/** 剩余天数 */
	remainingDays: number;
	/** 状态：normal-正常，expired-已过期，revoked-已吊销 */
	status: 'normal' | 'expired' | 'revoked';
	/** 创建时间 */
	createdAt: string;
	/** 父CA ID（中间CA才有） */
	parentId?: string;
}

/**
 * 表格查询参数类型
 */
export interface TableQueryParams {
	/** 页码 */
	page: number;
	/** 每页数量 */
	pageSize: number;
	/** 搜索关键词 */
	keyword?: string;
}

/**
 * 添加私有CA参数
 */
export interface AddPrivateCaParams {
	/** CA名称 */
	name: string;
	/** 通用名称 */
	cn: string;
	/** 组织 */
	o: string;
	/** 国家 */
	c: string;
	/** 组织单位 */
	ou: string;
	/** 省份 */
	province: string;
	/** 城市 */
	locality: string;
	/** 加密算法 */
	algorithm: 'rsa' | 'ecdsa' | 'sm2';
	/** 密钥长度 */
	key_length: string;
	/** 有效期（年） */
	valid_days: string;
}
/**
 * 表格行类名函数参数
 */
export interface RowClassNameParams {
	row: PrivateCaItem;
	rowIndex: number;
}

