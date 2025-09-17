/**
 * 隐私保护弹窗状态管理
 * 负责管理表单数据、步骤状态和API调用
 */

import { ref, reactive, computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useError } from '@baota/hooks/error'
import { privacyOrder, privacyPrice } from '@/api/domain'
import { queryPaymentStatus } from '@/api/order'
import type { PrivacyRequest, PrivacyPriceRequest } from '@/types/domain'
import type { ApiResponse } from '@/types/api'
import type { DomainInfo } from '@/types/domain'

const { handleError } = useError()

/** 轮询定时器 */
let paymentPollTimer: any = null

/**
 * 隐私保护表单数据接口
 */
interface PrivacyProtectionForm {
  /** 域名 */
  domain: string
  /** 保护时长（年） */
  protectionTime: number
  /** 联系邮箱 */
  contactEmail: string
  /** 保护价格 */
  price: number
}

/**
 * 隐私保护状态Store
 */
export const usePrivacyProtectionStore = defineStore('privacy-protection-store', () => {
  // -------------------- 状态定义 --------------------

  /** 表单数据 */
  const protectionForm = reactive<PrivacyProtectionForm>({
    domain: '',
    protectionTime: 1,
    contactEmail: '',
    price: 0,
  })
	/** 当前row */
	const currentProps = ref<DomainInfo | null>(null)
  /** 当前步骤 */
  const currentStep = ref<1 | 2>(1)

  /** 订单状态 */
  const orderLoading = ref(false)
  const orderInfo = ref<ApiResponse | null>(null)

  /** 价格查询状态 */
  const priceLoading = ref(false)
  const priceError = ref(false)

  /** 支付方式 */
  const paymentMethod = ref<'wechat' | 'alipay' | 'balance'>('wechat')


  /** 订单创建状态 */
  const orderCreating = ref(false)
  const orderCreated = ref(false)

  /** 轮询状态 */
  const isPolling = ref(false)

  /** 支付成功状态 */
  const paymentSuccess = ref(false)

  // -------------------- 计算属性 --------------------

  /** 获取二维码链接 */
  const qrCodeUrl = computed(() => {
    if (!orderInfo.value?.data) return ''
    return paymentMethod.value === 'wechat' 
      ? orderInfo.value.data.wx 
      : orderInfo.value.data.ali
  })

  // -------------------- 方法定义 --------------------

  /**
   * 查询隐私保护价格
   */
  const queryPrivacyPrice = async (type: number = 1, year: number = 1): Promise<void> => {
    try {
      priceLoading.value = true
      priceError.value = false
      
      const params: PrivacyPriceRequest = {
        type, // 1:新购 2:续费
        year,
      }
      
      const { fetch, data } = privacyPrice(params)
      await fetch()
      
      // 假设 API 返回的数据结构中包含价格信息
      const responseData = data.value?.data
      if (responseData && typeof responseData.price === 'number') {
        protectionForm.price = responseData.price
      } else {
        // 如果没有返回价格或格式不正确，设置错误状态
        priceError.value = true
        protectionForm.price = 0
      }
    } catch (error) {
      priceError.value = true
      protectionForm.price = 0
      handleError(error)
    } finally {
      priceLoading.value = false
    }
  }

  /**
   * 创建隐私保护订单
   */
  const createPrivacyOrder = async (): Promise<void> => {
    try {
			orderCreating.value = true
			orderCreated.value = false
			console.log(currentProps.value, '--')
			const params: PrivacyRequest = {
				type: currentProps.value?.privacy === 1? 2:1, // 1:新购 2:续费
				domain: protectionForm.domain,
				year: protectionForm.protectionTime,
				email: protectionForm.contactEmail || undefined,
			}

			const { fetch, data } = privacyOrder(params)
			await fetch()
			// 检查API返回状态
			if (data.value?.status === false) {
				// 如果状态为false，抛出包含具体错误信息的错误
				const errorMsg = data.value?.msg || '订单创建失败'
				throw new Error(errorMsg)
			}
			orderInfo.value = data.value
			orderCreated.value = true
		} catch (error) {
      handleError(error)
      throw error
    } finally {
      orderCreating.value = false
    }
  }

  /**
   * 切换支付方式
   */
  const switchPaymentMethod = (method: 'wechat' | 'alipay' | 'balance') => {
    paymentMethod.value = method
  }

  /**
   * 重置表单状态
   */
  const resetForm = () => {
    currentStep.value = 1
    orderInfo.value = null
    priceError.value = false
    priceLoading.value = false
    orderCreating.value = false
    orderCreated.value = false
    paymentMethod.value = 'wechat'
    paymentSuccess.value = false
    stopPaymentPolling()
    Object.assign(protectionForm, {
      domain: '',
      protectionTime: 1,
      contactEmail: '',
      price: 0,
    })
  }

  /**
   * 根据保护时长计算价格
   * @param years 保护年数
   */
  const calculatePrice = (years: number): number => {
    // 这里可以根据实际的定价策略来计算
    // 暂时使用固定价格 30元/年
    return years * 30
  }

  /**
   * 更新保护时长并重新计算价格
   * @param years 保护年数
   */
  const updateProtectionTime = (years: number) => {
    protectionForm.protectionTime = years
    protectionForm.price = calculatePrice(years)
  }

  /**
   * 查询隐私保护订单支付状态
   */
  const queryPrivacyPaymentStatus = async (orderNo: string): Promise<boolean> => {
    try {
      const { fetch, data } = queryPaymentStatus({ order_no: orderNo })
      await fetch()
      return Number(data.value?.data?.status ?? 0) === 1
    } catch (error) {
      console.error('查询支付状态失败:', error)
      return false
    }
  }

  /**
   * 启动支付轮询
   */
  const startPaymentPolling = (orderNo: string) => {
    if (!orderNo || isPolling.value) return
    
    stopPaymentPolling()
    isPolling.value = true
    
    let count = 0
    const maxCount = 60 // 最多轮询60次（3分钟）
    
    paymentPollTimer = setInterval(async () => {
      count++
      try {
        const isPaid = await queryPrivacyPaymentStatus(orderNo)
        if (isPaid) {
          paymentSuccess.value = true
          stopPaymentPolling()
          return
        }
        
        if (count >= maxCount) {
          stopPaymentPolling()
        }
      } catch (error) {
        if (count >= maxCount) {
          stopPaymentPolling()
        }
      }
    }, 3000) // 每3秒查询一次
  }

  /**
   * 停止支付轮询
   */
  const stopPaymentPolling = () => {
    if (paymentPollTimer) {
      clearInterval(paymentPollTimer)
      paymentPollTimer = null
    }
    isPolling.value = false
  }

  // 返回状态和方法
  return {
    // 状态
    protectionForm,
    currentStep,
    orderLoading,
    orderInfo,
    priceLoading,
    priceError,
    paymentMethod,
    orderCreating,
    orderCreated,
    isPolling,
		paymentSuccess,
		currentProps,

    // 计算属性
    qrCodeUrl,

    // 方法
    queryPrivacyPrice,
    createPrivacyOrder,
    switchPaymentMethod,
    resetForm,
    calculatePrice,
    updateProtectionTime,
    startPaymentPolling,
    stopPaymentPolling,
  }
})

/**
 * 导出Store实例
 */
export const usePrivacyProtectionState = () => {
  const store = usePrivacyProtectionStore()
  return {
    ...store,
    ...storeToRefs(store),
  }
} 