export const useCertApplyStore = defineStore('cert-apply-store', () => {
	// -------------------- 状态定义 --------------------
	const test = ref('证书申请')

	// 当前激活的主标签
	const activeMainTab = ref<'commercial' | 'free'>('commercial')

	// 当前激活的子标签
	const activeTab = ref<'dv' | 'ov' | 'ev'>('dv')

	// 主标签选项
	const mainTabOptions = ref([
		{ key: 'commercial', title: '商业证书', desc: '品牌SSL证书，安全保障，全球兼容' },
		{ key: 'free', title: '免费证书', desc: '适用于个人博客、测试环境的免费SSL证书' },
	])

	// 证书类型选项
	const typeOptions = ref({
		dv: '域名型(DV)',
		ov: '企业型(OV)',
		ev: '增强型(EV)',
	})

	// SSL证书类型列表
	const sslTypeList = ref([
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
	])

	// SSL证书类型详细说明
	const sslTypeDescriptions = ref({
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
	})

	// 产品数据类型定义
	type ProductItem = {
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

	type ProductsType = {
		dv: ProductItem[]
		ov: ProductItem[]
		ev: ProductItem[]
	}

	// 商业证书产品数据
	const products = ref<ProductsType>({
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
				pid: 8303,
				brand: 'Sectigo',
				type: '企业型(OV)',
				add_price: 0,
				other_price: 1880,
				title: 'Sectigo OV SSL证书',
				code: 'sectigo-ov',
				num: 1,
				price: 1388,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 1388,
			},
			{
				pid: 8304,
				brand: 'Sectigo',
				type: '企业型(OV)',
				add_price: 880,
				other_price: 5640,
				title: 'Sectigo OV多域名SSL证书',
				code: 'sectigo-ov-multi-san',
				num: 3,
				price: 3888,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 3888,
			},
			{
				pid: 8305,
				brand: 'Sectigo',
				type: '企业型(OV)',
				add_price: 0,
				other_price: 6980,
				title: 'Sectigo OV通配符SSL证书',
				code: 'sectigo-ov-wildcard',
				num: 1,
				price: 4888,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 4888,
			},
			{
				pid: 8307,
				brand: 'Sectigo',
				type: '企业型(OV)',
				add_price: 3680,
				other_price: 2094,
				title: 'Sectigo OV多域名通配符SSL证书',
				code: 'comodo-multi-domain-wildcard-certificate',
				num: 3,
				price: 15888,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 15888,
			},
		],
		ev: [
			{
				pid: 8300,
				brand: 'Sectigo',
				type: '企业增强型(EV)',
				add_price: 0,
				other_price: 3400,
				title: 'Sectigo EV SSL证书',
				code: 'comodo-ev-ssl-certificate',
				num: 1,
				price: 2788,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 2788,
			},
			{
				pid: 8302,
				brand: 'Sectigo',
				type: '企业增强型(EV)',
				add_price: 1488,
				other_price: 10200,
				title: 'Sectigo EV多域名SSL证书',
				code: 'comodo-ev-multi-domin-ssl',
				num: 3,
				price: 8388,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 8388,
			},
			{
				pid: 8520,
				brand: '锐安信',
				type: '企业增强型(EV)',
				add_price: 0,
				other_price: 3480,
				title: '锐安信EV SSL证书',
				code: 'ssltrus-ev-ssl',
				num: 1,
				price: 2688,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 2688,
			},
			{
				pid: 8521,
				brand: '锐安信',
				type: '企业增强型(EV)',
				add_price: 2380,
				other_price: 10440,
				title: '锐安信EV多域名SSL证书',
				code: 'ssltrus-ev-multi',
				num: 3,
				price: 9096,
				discount: 1,
				state: 1,
				install_price: 500,
				src_price: 9096,
			},
		],
	})

	// 免费证书数据
	type FreeProductItem = {
		pid: number
		brand: string
		type: string
		title: string
		code: string
		num: number
		valid_days: number
		features: string[]
	}

	const freeProducts = ref<FreeProductItem[]>([
		{
			pid: 9001,
			brand: "Let's Encrypt",
			type: '域名型(DV)',
			title: "Let's Encrypt 单域名SSL证书",
			code: 'letsencrypt-single',
			num: 1,
			valid_days: 90,
			features: ['90天有效期', '自动续期', '单域名', '全球认可'],
		},
	])

	// -------------------- 派生状态 --------------------
	// 根据当前活动标签筛选产品
	const filteredProducts = computed(() => {
		if (activeMainTab.value === 'commercial') {
			return products.value[activeTab.value] || []
		} else {
			return [] // 免费证书不通过这个计算属性获取
		}
	})

	// -------------------- 工具方法 --------------------
	const handleTest = () => {
		test.value = '点击了证书申请'
	}

	return {
		test,
		handleTest,
		activeMainTab,
		activeTab,
		mainTabOptions,
		typeOptions,
		sslTypeList,
		sslTypeDescriptions,
		products,
		freeProducts,
		filteredProducts,
	}
})

/**
 * useStore
 * @description 组合式API使用store
 * @returns {object} store - 返回store对象
 */
export const useStore = () => {
	const store = useCertApplyStore()
	return { ...store, ...storeToRefs(store) }
}
