import { AxiosResponseData } from './public'

/** 证书列表请求参数 */
export interface CertListParams {
	p?: number
	limit?: number
	search?: string
}

/** 证书项 */
export interface CertItem {
	cert: string
	create_time: string
	domains: string
	end_day: string
	end_time: string
	history_id: string
	id: number
	issuer: string
	issuer_cert: string
	key: string
	sha256: string
	source: string
	start_time: string
	update_time: string
	workflow_id: string
}

/** 证书列表响应 */
export interface CertListResponse extends AxiosResponseData {
	data: CertItem[]
}

/** 申请证书请求参数 */
export interface ApplyCertParams {
	name: string
	domain: string
	access_id: string
}

/** 申请证书响应 */
export interface ApplyCertResponse extends AxiosResponseData {
	data: {
		id: string
	}
}

/** 上传证书请求参数 */
export interface UploadCertParams {
	cert_id: string
	cert: string
	key: string
}

/** 上传证书响应 */
export interface UploadCertResponse extends AxiosResponseData {
	data: string
}

/** 删除证书请求参数 */
export interface DeleteCertParams {
	id: string
}

/** 删除证书响应 */
export interface DeleteCertResponse extends AxiosResponseData {
	data: null
}

/** 下载证书请求参数 */
export interface DownloadCertParams {
	id: string
}

/** 下载证书响应 */
export interface DownloadCertResponse extends AxiosResponseData {
	data: string
}

/**
 * @description 商业证书产品条目类型
 */
export interface ProductItem {
	pid: number
	brand: string
	type: string
	add_price: number
	other_price: number
	title: string
	code: string
	num: number
	price: number
	discount: number
	ipssl?: number
	state: number
	install_price: number
	src_price: number
}

/**
 * @description 商业证书产品按类型分类的集合
 */
export interface ProductsType {
	dv: ProductItem[]
	ov: ProductItem[]
	ev: ProductItem[]
}

/**
 * @description 免费证书产品条目类型
 */
export interface FreeProductItem {
	pid: number
	brand: string
	type: string
	title: string
	code: string
	num: number
	valid_days: number
	features: string[]
}
