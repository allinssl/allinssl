/**
 * 域名价格数据结构
 */
export type DomainPrice = {
  suffix: string
  originalPrice: number
  firstYearPrice: number
  renewPrice: number
	transferPrice: number
	isWan?: boolean
}
