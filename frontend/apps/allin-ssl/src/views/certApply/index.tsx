import { useController } from './useController'
import { NTabs, NTabPane, NEmpty, NIcon } from 'naive-ui'
import ProductCard from './components/ProductCard'
import FreeProductCard from './components/FreeProductCard'
import { ShoppingCartOutlined, LockOutlined } from '@vicons/antd'

interface SSLTypeItem {
	type: 'dv' | 'ov' | 'ev'
	title: string
	explain: string
}

export default defineComponent({
	setup() {
		const {
			activeMainTab,
			activeTab,
			mainTabOptions,
			sslTypeList,
			freeProducts,
			filteredProducts,
			handleBuyProduct,
			formatPrice,
			handleOpenApplyModal,
		} = useController()

		return () => (
			<div class="w-full max-w-[160rem] mx-auto p-[2rem]">
				<div class="bg-white rounded-[0.6rem] p-[2.4rem] mb-[3rem]">
					{/* 主标签页：商业证书/免费证书 */}
					<NTabs
						class="rounded-[1.2rem] p-[0.6rem]"
						type="segment"
						v-model:value={activeMainTab.value}
						size="large"
						justifyContent="space-evenly"
					>
						{mainTabOptions.value.map((tab) => (
							<NTabPane key={tab.key} name={tab.key}>
								{{
									tab: () => (
										<div class="flex items-center my-[1rem] px-[0.8rem] py-[0.4rem] rounded-[0.8rem] transition-all duration-300 hover:bg-black/5 ">
											<NIcon size="20">{tab.key === 'commercial' ? <ShoppingCartOutlined /> : <LockOutlined />}</NIcon>
											<span class="ml-[0.8rem]">{tab.title}</span>
										</div>
									),
									default: () => (
										<div class="py-[0.4rem] rounded-[1.6rem]">
											{/* 商业证书内容 */}
											{activeMainTab.value === 'commercial' && (
												<NTabs
													class="w-full p-0 mt-[1.6rem] rounded-[0.8rem] overflow-hidden"
													type="line"
													v-model:value={activeTab.value}
													size="medium"
													justifyContent="space-evenly"
												>
													{(sslTypeList.value as SSLTypeItem[]).map((item: SSLTypeItem) => (
														<NTabPane key={item.type} name={item.type} tab={item.title}>
															<div class="flex flex-col gap-[2.4rem] mt-[1rem]">
																{/* 证书产品列表 */}
																{filteredProducts.value.length > 0 ? (
																	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
																		{filteredProducts.value.map((product) => (
																			<ProductCard
																				key={product.pid}
																				product={product}
																				formatPrice={formatPrice}
																				onBuy={handleBuyProduct}
																			/>
																		))}
																	</div>
																) : (
																	<NEmpty description="暂无产品" />
																)}
															</div>
														</NTabPane>
													))}
												</NTabs>
											)}
											{activeMainTab.value === 'free' && (
												<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
													{freeProducts.value.map((product) => (
														<FreeProductCard key={product.pid} product={product} onApply={handleOpenApplyModal} />
													))}
												</div>
											)}
										</div>
									),
								}}
							</NTabPane>
						))}
					</NTabs>
				</div>
			</div>
		)
	},
})
