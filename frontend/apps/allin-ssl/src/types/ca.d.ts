/**
 * CA管理相关类型定义
 */

/**
 * 创建根证书请求参数
 */
export interface CreateRootCaParams {
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
 * 创建根证书响应
 */
export interface CreateRootCaResponse {
	/** 响应状态码 */
	code: number;
	/** 响应消息 */
	message: string;
	/** 响应数据 */
	data: {
		/** CA ID */
		id: string;
		/** CA名称 */
		name: string;
		/** 可分辨名称 */
		distinguished_name: string;
		/** 创建时间 */
		created_at: string;
	};
	status: boolean;
}

/**
 * 创建中间证书请求参数
 */
export interface CreateIntermediateCaParams {
	/** 根CA ID */
	root_id: string;
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
	/** 密钥长度 */
	key_length: string;
	/** 有效期（天） */
	valid_days: string;
}

/**
 * 创建中间证书响应
 */
export interface CreateIntermediateCaResponse {
	/** 响应状态码 */
	code: number;
	/** 响应消息 */
	message: string;
	/** 响应数据 */
	data: {
		/** CA ID */
		id: string;
		/** CA名称 */
		name: string;
		/** 可分辨名称 */
		distinguished_name: string;
		/** 创建时间 */
		created_at: string;
	};
	status: boolean;
}

/**
 * 获取CA列表请求参数
 */
export interface GetCaListParams {
	p: string;
	limit: string;
	level?: 'root' | 'intermediate';
	search?: string;
}

/**
 * 获取CA列表响应数据
 */
export interface GetCaListResponse {
	code: number;
	count: number;
	data: Array<{
		id: number;
		name: string;
		cn: string;
		o: string;
		c: string;
		ou?: string;
		province?: string;
		locality?: string;
		algorithm: 'rsa' | 'ecdsa' | 'sm2';
		key_length: number;
		not_before: string;
		not_after: string;
		create_time: string;
		root_id: number | null;
		cert: string;
		key: string;
		en_cert: string | null;
		en_key: string | null;
	}>;
	message: string;
	status: boolean;
}

/**
 * 删除CA请求参数
 */
export interface DeleteCaParams {
	/** CA ID */
	id: string;
}

/**
 * 删除CA响应数据
 */
export interface DeleteCaResponse {
	code: number;
	message: string;
	status: boolean;
}

/**
 * 创建叶子证书请求参数
 */
export interface CreateLeafCertParams {
	/** 中间证书ID */
	ca_id: string;
	/** 用途：1服务器2客户端4邮件 */
	usage: string;
	/** 密钥长度 */
	key_length: string;
	/** 有效期（天） */
	valid_days: string;
	/** 通用名称 */
	cn: string;
	/** 主题备用名称 (SAN) */
	san: string;
}

/**
 * 创建叶子证书响应
 */
export interface CreateLeafCertResponse {
	code: number;
	message: string;
	status: boolean;
	data: {
		/** 叶子证书ID */
		id: string;
		/** 证书名称 */
		name: string;
		/** 创建时间 */
		created_at: string;
	};
}

/**
 * 获取叶子证书列表请求参数
 */
export interface GetLeafCertListParams {
	/** 页码 */
	p: string;
	/** 每页数量 */
	limit: string;
	/** 中间证书ID */
	ca_id: string;
	/** 搜索关键词 */
	search: string;
}

/**
 * 获取叶子证书列表响应
 */
export interface GetLeafCertListResponse {
	code: number;
	message: string;
	status: boolean;
	count: number;
	data: Array<{
		/** 叶子证书ID */
		id: string;
		/** 证书名称 */
		name: string;
		/** 通用名称 */
		cn: string;
		/** 用途 */
		usage: string;
		/** 中间证书ID */
		ca_id: string;
		/** 创建时间 */
		created_at: string;
		/** 到期时间 */
		expires_at: string;
		/** 状态 */
		status: string;
	}>;
}

/**
 * 删除叶子证书请求参数
 */
export interface DeleteLeafCertParams {
	/** 叶子证书ID */
	id: string;
}

/**
 * 删除叶子证书响应
 */
export interface DeleteLeafCertResponse {
	code: number;
	message: string;
	status: boolean;
}
