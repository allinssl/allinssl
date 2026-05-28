import type { ProductsType, FreeProductItem } from '@/types/cert'

export const mainTabOptionsData = [
	{ key: 'free', title: '免费证书', desc: '适用于个人博客、测试环境的免费SSL证书' },
	{ key: 'commercial', title: '商业证书', desc: '品牌SSL证书，安全保障，全球兼容' },
]

export const typeOptionsData = {
	dv: '域名型(DV)',
	ov: '企业型(OV)',
	ev: '增强型(EV)',
}

export const sslTypeListData = [
	{ type: 'dv', title: '个人(DV 证书)', explain: '个人博客、个人项目等<br>可选择DV SSL证书。' },
	{
		type: 'ov',
		title: '传统行业(OV 证书)',
		explain: '企业官网、电商、教育、医疗、公共<br>部门等,可选择OV SSL证书。',
	},
	{
		type: 'ev',
		title: '金融机构(EV 证书)',
		explain: '银行、金融、保险、电子商务、中大型企<br>业、政府机关等,可选择EV SSL证书。',
	},
]

export const sslTypeDescriptionsData = {
	dv: {
		title: '域名型SSL证书 (DV SSL)',
		features: [
			'适用场景: 个人网站、博客、论坛等',
			'验证方式: 仅验证域名所有权',
			'签发时间: 最快5分钟',
			'安全级别: 基础级',
		],
		advantages: '优势: 价格低廉，签发速度快，适合个人使用',
		disadvantages: '劣势: 仅显示锁形图标，不显示企业信息',
		recommendation: '推荐指数: ★★★☆☆',
	},
	ov: {
		title: '企业型SSL证书 (OV SSL)',
		features: [
			'适用场景: 企业官网、电商网站、教育医疗网站等',
			'验证方式: 验证域名所有权和企业真实性',
			'签发时间: 1-3个工作日',
			'安全级别: 中级',
		],
		advantages: '优势: 兼顾安全和价格，适合一般企业使用',
		disadvantages: '劣势: 签发时间较DV长',
		recommendation: '推荐指数: ★★★★☆',
	},
	ev: {
		title: '增强型SSL证书 (EV SSL)',
		features: [
			'适用场景: 银行、金融机构、政府网站、大型企业',
			'验证方式: 最严格的身份验证流程',
			'签发时间: 5-7个工作日',
			'安全级别: 最高级',
		],
		advantages: '优势: 提供最高级别安全认证，浏览器地址栏显示企业名称',
		disadvantages: '劣势: 价格较高，签发时间最长',
		recommendation: '推荐指数: ★★★★★',
	},
}

export const productsData: ProductsType = {
	dv: [
		{
			pid: 0,
			brand: '宝塔证书',
			type: '域名型(DV)',
			add_price: 0,
			other_price: 128.66,
			title: '宝塔证书 单域名SSL证书',
			code: 'comodo-positivessl',
			num: 1,
			price: 128.66,
			discount: 1,
			state: 1,
			install_price: 200,
			src_price: 128.66,
		},
		{
			pid: 0,
			brand: '宝塔证书',
			type: '域名型(DV)',
			add_price: 0,
			other_price: 1688,
			title: '宝塔证书 通配符SSL证书',
			code: 'comodo-positivessl-wildcard',
			num: 1,
			price: 1688,
			discount: 1,
			state: 1,
			install_price: 200,
			src_price: 1688,
		},
		{
			pid: 0,
			brand: '宝塔证书',
			type: '域名型(DV)',
			add_price: 98,
			other_price: 180,
			title: '宝塔证书 IP-SSL证书',
			code: 'comodo-positive-multi-domain',
			num: 1,
			price: 180,
			discount: 1,
			ipssl: 1,
			state: 1,
			install_price: 200,
			src_price: 180,
		},
	],
	ov: [
		{
			pid: 9018,
			brand: '宝塔证书',
			type: '企业型(OV)',
			add_price: 0,
			other_price: 4500,
			title: '宝塔企业型 SSL 证书(C5) (OV)',
			code: 'bt-ssl-ov-v2',
			num: 1,
			price: 1388,
			discount: 1,
			state: 1,
			install_price: 200,
			src_price: 1388,
		},
		{
			pid: 9020,
			brand: '宝塔证书',
			type: '企业型(OV)',
			add_price: 0,
			other_price: 13500,
			title: '宝塔企业型通配符 SSL 证书(C5) (OV)',
			code: 'bt-ssl-ov-wildcard-v2-wildcard',
			num: 1,
			price: 4088,
			discount: 1,
			state: 1,
			install_price: 200,
			src_price: 4088,
		},
	],
	ev: [
		{
			pid: 9021,
			brand: '宝塔证书',
			type: '企业增强型(EV)',
			add_price: 0,
			other_price: 9500,
			title: '宝塔增强型 SSL 证书(C5) (EV)',
			code: 'bt-ssl-ev-v2',
			num: 1,
			price: 2588,
			discount: 1,
			state: 1,
			install_price: 200,
			src_price: 2588,
		},
	],
}

export const freeProductsData: FreeProductItem[] = [
	{
		pid: 9002,
		brand: "LiteSSL",
		type: '域名型(DV)',
		title: "LiteSSL 单域名SSL证书",
		code: 'litessl-single',
		num: 1,
		valid_days: 90,
		desc: '是面向全球开发者提供免费、全生命周期自动化的 TLS / SSL 证书。',
		features: ['90 天证书', '自主可控', '快速验证', 'ACME 自动化集成'],
	},
	{
		pid: 9001,
		brand: "Let's Encrypt",
		type: '域名型(DV)',
		title: "Let's Encrypt 单域名SSL证书",
		code: 'letsencrypt-single',
		num: 1,
		valid_days: 90,
		desc: '是广泛使用的免费SSL证书提供商，适合个人网站和测试环境。',
		features: ['90天有效期', '自动续期', '单域名', '全球认可'],
	},
]
