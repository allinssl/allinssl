import { NButton, NCard, NTag, NImage, NBadge, NList, NListItem, NTooltip } from 'naive-ui'

interface ProductCardProps {
	product: {
		pid: number
		brand: string
		type: string
		title: string
		add_price: number
		other_price: number
		num: number
		price: number
		discount: number
		ipssl?: number
		state: number
		install_price: number
		src_price: number
		code: string
	}
	formatPrice: (price: number) => string
	onBuy: (id: number) => void
}

/**
 * SSL证书产品卡片组件
 * @param product - 产品信息
 * @param formatPrice - 价格格式化函数
 * @param onBuy - 购买按钮点击处理函数
 */
export default defineComponent({
	name: 'ProductCard',
	props: {
		product: {
			type: Object as PropType<ProductCardProps['product']>,
			required: true,
		},
		formatPrice: {
			type: Function as PropType<ProductCardProps['formatPrice']>,
			required: true,
		},
		onBuy: {
			type: Function as PropType<ProductCardProps['onBuy']>,
			required: true,
		},
	},
	setup(props) {
		// 判断是否为通配符证书
		const isWildcard = computed(() => {
			return props.product.title.toLowerCase().includes('通配符')
		})

		// 判断是否为多域名证书
		const isMultiDomain = computed(() => {
			return props.product.title.toLowerCase().includes('多域名')
		})

		// 处理购买按钮点击
		const handleBuy = () => {
			props.onBuy(props.product.pid)
		}

		// 获取品牌图标
		const getBrandIcon = (brand: string) => {
			const brandLower = brand.toLowerCase()
			if (brandLower.includes('sectigo')) return '/static/icons/sectigo-ico.png'
			if (brandLower.includes('positive')) return '/static/icons/positive-ico.png'
			if (brandLower.includes('锐安信')) return '/static/icons/ssltrus-ico.png'
			if (brandLower.includes("let's encrypt")) return '/static/icons/letsencrypt-icon.svg'
			if (brandLower.includes('宝塔证书')) return '/static/icons/btssl.svg'
		}

		return () => (
			<div class="relative border border-gray-200 rounded-[0.8rem] p-[2rem] transition-all duration-300 h-full flex flex-col bg-white shadow-sm hover:shadow-md hover:border-blue-100 hover:-translate-y-[0.2rem]">
				{props.product.discount < 1 && (
					<div class="absolute top-[1.2rem] right-[1.2rem] z-10">
						<NBadge type="success" value="推荐" />
					</div>
				)}

				<div class="flex flex-col items-center text-center mb-[2rem] pb-[1.6rem] border-b border-gray-100">
					<div class="flex-none h-[6rem] w-2/5 mb-[1.2rem] flex items-center justify-center">
						<NImage
							width="100%"
							src={getBrandIcon(props.product.brand)}
							fallbackSrc="/static/icons/default.png"
							alt={props.product.brand}
						/>
					</div>
					<div class="flex-1 w-full">
						<h3 class="font-semibold mb-[0.8rem] text-gray-800 leading-tight">{props.product.title}</h3>
						<p class="text-[1.3rem] text-gray-500 m-0 leading-relaxed px-[0.8rem]">
							{props.product.brand === '宝塔证书'
								? '宝塔证书是新国产证书品牌，支持 ECC、RSA 及我国商用密码 SM2 等标准算法，兼容国密浏览器'
								: `${props.product.brand}是知名的证书颁发机构，提供高质量的SSL证书解决方案`}
							。
						</p>
					</div>
				</div>

				<div class="flex-1 flex flex-col mt-0">
					<div class="text-[1.3rem] mb-[2.4rem] flex-1 text-left">
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">支持域名数：</span>
							<span class="flex-1 text-gray-700">{props.product.num}个</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">支持通配符：</span>
							<span class="flex-1 text-gray-700">{isWildcard.value ? '支持' : '不支持'}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">绿色地址栏：</span>
							<span class="flex-1 text-gray-700">{props.product.type.includes('EV') ? '显示' : '不显示'}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">支持小程序：</span>
							<span class="flex-1 text-gray-700">支持</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis text-gray-500">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">适用网站：</span>
							<span class="flex-1 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
								{props.product?.ipssl
									? '支持IP SSL证书'
									: isWildcard.value
										? isMultiDomain.value
											? '*.bt.cn、*.btnode.cn'
											: '*.bt.cn'
										: isMultiDomain.value
											? 'bt.cn、btnode.cn'
											: 'www.bt.cn、bt.cn'}
							</span>
						</div>
					</div>

					<div class="flex justify-between items-center mt-[1.6rem] pt-[1.6rem] border-t border-gray-100">
						<div class="flex-1 flex flex-col">
							<div class="flex items-baseline justify-start">
								<span class="text-[2.2rem] font-bold text-red-500 leading-tight">
									{props.formatPrice(props.product.price)}
								</span>
								<span class="text-[1.3rem] text-gray-400 ml-[0.4rem]">元/年</span>
							</div>
							<div class="text-[1.3rem] text-gray-400 line-through mt-[0.4rem]">
								原价 {props.formatPrice(props.product.other_price)}元/年
							</div>
						</div>
						<NButton
							type="primary"
							class="flex-none transition-all duration-300 min-w-[9rem] hover:scale-105 hover:shadow-md"
							onClick={handleBuy}
							strong
							round
						>
							立即查看
						</NButton>
					</div>
				</div>
			</div>
		)
	},
})
