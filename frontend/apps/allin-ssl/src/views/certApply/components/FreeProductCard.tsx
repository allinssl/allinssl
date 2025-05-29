import { NButton, NImage, NBadge } from 'naive-ui'
import { $t } from '@locales/index'
interface FreeProductCardProps {
	product: {
		pid: number
		brand: string
		type: string
		title: string
		code: string
		num: number
		valid_days: number
		features: string[]
	}
	onApply: (id: number) => void
}

/**
 * 免费SSL证书产品卡片组件
 * @param product - 产品信息
 * @param onApply - 申请按钮点击处理函数
 */
export default defineComponent({
	name: 'FreeProductCard',
	props: {
		product: {
			type: Object as PropType<FreeProductCardProps['product']>,
			required: true,
		},
		onApply: {
			type: Function as PropType<FreeProductCardProps['onApply']>,
			required: true,
		},
	},
	setup(props) {
		// 判断是否为通配符证书
		const isWildcard = computed(() => {
			return props.product.title.toLowerCase().includes($t('t_10_1746667589575'))
		})

		// 判断是否为多域名证书
		const isMultiDomain = computed(() => {
			return props.product.title.toLowerCase().includes($t('t_11_1746667589598'))
		})

		// 处理申请按钮点击
		const handleApply = () => {
			props.onApply(props.product.pid)
		}

		// 获取品牌图标
		const getBrandIcon = (brand: string) => {
			const brandLower = brand.toLowerCase()
			const brandIconMap: Record<string, string> = {
				sectigo: '/static/icons/sectigo-ico.png',
				positive: '/static/icons/positive-ico.png',
				ssltrus: '/static/icons/ssltrus-ico.png',
				"let's encrypt": '/static/icons/letsencrypt-icon.svg',
			}
			return Object.keys(brandIconMap).find((key) => brandLower.includes(key))
				? brandIconMap[Object.keys(brandIconMap).find((key) => brandLower.includes(key)) as string]
				: undefined
		}

		return () => (
			<div class="relative border border-gray-200 rounded-[0.8rem] p-[2rem] transition-all duration-300 h-full flex flex-col bg-white shadow-sm hover:shadow-md hover:border-blue-100 hover:-translate-y-[0.2rem]">
				{props.product.brand === "Let's Encrypt" && (
					<div class="absolute top-[1.2rem] right-[1.2rem] z-10">
						<NBadge type="info" value={$t('t_12_1746667589733')} />
					</div>
				)}

				<div class="flex flex-col items-center text-center mb-[2rem] pb-[1.6rem] border-b border-gray-100">
					<div class="flex-none h-[6rem] w-2/5 mb-[1.2rem] flex items-center justify-center">
						<NImage
							src={getBrandIcon(props.product.brand)}
							fallbackSrc="/static/icons/default.png"
							alt={props.product.brand}
						/>
					</div>
					<div class="flex-1 w-full">
						<h3 class="font-semibold mb-[0.8rem] text-gray-800 leading-tight">{props.product.title}</h3>
						<p class="text-[1.3rem] text-gray-500 m-0 leading-relaxed px-[0.8rem]">
							{props.product.brand + $t('t_13_1746667599218')}
						</p>
					</div>
				</div>

				<div class="flex-1 flex flex-col mt-0">
					<div class="text-[1.3rem] mb-[2.4rem] flex-1 text-left">
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">{$t('t_14_1746667590827')}</span>
							<span class="flex-1 text-gray-700">{props.product.num + $t('t_15_1746667588493')}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">{$t('t_16_1746667591069')}</span>
							<span class="flex-1 text-gray-700">{$t('t_17_1746667588785')}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">{$t('t_19_1746667589295')}</span>
							<span class="flex-1 text-gray-700">{props.product.valid_days + $t('t_20_1746667588453')}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">{$t('t_21_1746667590834')}</span>
							<span class="flex-1 text-gray-700">{$t('t_17_1746667588785')}</span>
						</div>
						<div class="flex mb-[1rem] leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis text-gray-500">
							<span class="font-medium text-gray-500 flex-none w-[9rem]">{$t('t_22_1746667591024')}</span>
							<span class="flex-1 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
								{isWildcard.value
									? isMultiDomain.value
										? $t('t_23_1746667591989')
										: $t('t_24_1746667583520')
									: isMultiDomain.value
										? $t('t_25_1746667590147')
										: $t('t_26_1746667594662')}
							</span>
						</div>
					</div>

					<div class="flex justify-between items-center mt-[1.6rem] pt-[1.6rem] border-t border-gray-100">
						<div class="flex-1 flex flex-col">
							<div class="flex items-baseline justify-start">
								<span class="text-[2.2rem] font-bold text-green-500 leading-tight">{$t('t_27_1746667589350')}</span>
							</div>
						</div>
						<NButton
							type="primary"
							class="flex-none transition-all duration-300 min-w-[9rem] hover:scale-105 hover:shadow-md"
							onClick={handleApply}
							strong
							round
						>
							{$t('t_28_1746667590336')}
						</NButton>
					</div>
				</div>
			</div>
		)
	},
})
