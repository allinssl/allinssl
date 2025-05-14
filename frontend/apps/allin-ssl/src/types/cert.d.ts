import { AxiosResponseData } from './public'

/** 证书列表请求参数 */
export interface CertListParams {
	p?: number
	limit?: number
	search?: string
}

/** 证书项 */
export interface CertItem {
	id: string
	name: string
	domains: string
	issuer: string
	create_time: string
	expire_time: string
	sha256: string
	cert: string
	key: string
	status: number
	source: 'upload' | 'apply'
	end_day: string
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
