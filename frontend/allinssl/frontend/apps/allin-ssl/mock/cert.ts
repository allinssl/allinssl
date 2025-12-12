import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 证书列表
export const getCertList = Mock.mock(/\/cert\/get_list/, 'post', () => {
	const list = []
	for (let i = 0; i < 15; i++) {
		list.push({
			id: Mock.Random.id(),
			name: `${Mock.Random.domain()}证书`,
			domain: Mock.Random.domain(),
			expire_time: Mock.Random.datetime('yyyy-MM-dd'),
			status: Mock.Random.integer(0, 2),
			created_at: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
		})
	}
	return {
		code: 0,
		count: list.length,
		data: {
			list,
			total: 32,
		},
		message: '获取成功',
		status: true,
	}
})

// 申请证书
export const applyCert = Mock.mock(/\/cert\/apply_cert/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '申请成功',
	status: true,
}))

// 上传证书
export const uploadCert = Mock.mock(/\/cert\/upload_cert/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		id: Mock.Random.id(),
	},
	message: '上传成功',
	status: true,
}))

// 删除证书
export const deleteCert = Mock.mock(/\/cert\/del_cert/, 'post', () => ({
	code: 0,
	count: 0,
	data: null,
	message: '删除成功',
	status: true,
}))

// 下载证书
export const downloadCert = Mock.mock(/\/cert\/download_cert/, 'get', () => {
	// 二进制文件流模拟，实际上应该是从服务器获取的二进制数据
	return {
		code: 0,
		count: 0,
		data: 'certificate-file-content',
		message: '下载成功',
		status: true,
	}
})
