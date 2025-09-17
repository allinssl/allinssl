/**
 * 隐私保护弹窗控制器
 * 负责处理业务逻辑、事件响应和状态管理
 */

import { onMounted, onUnmounted, watch } from 'vue'
import { useMessage } from '@baota/naive-ui/hooks'
import { usePrivacyProtectionState } from './useStore'
import { buyByBalance } from '@/api/order'
import type { DomainInfo, PrivacyInfo } from '@/types/domain'
import { useRechargeController } from '@/views/recharge/useController'

interface PrivacyProtectionProps {
	domain: DomainInfo
	privacy: PrivacyInfo
	refresh: () => void
	onClose?: () => void
}

/**
 * 隐私保护弹窗控制器
 */
export function usePrivacyProtectionController(props: PrivacyProtectionProps) {
  const message = useMessage()
	const { loadAccountBalance } = useRechargeController()
  
  // 获取状态管理
	const {
		currentProps,
    protectionForm,
    currentStep,
    orderLoading,
    orderInfo,
    priceLoading,
    priceError,
    paymentMethod,
    orderCreating,
    orderCreated,
    qrCodeUrl,
    isPolling,
    paymentSuccess,
    queryPrivacyPrice,
    createPrivacyOrder,
    switchPaymentMethod,
    startPaymentPolling,
    stopPaymentPolling,
    resetForm,
	} = usePrivacyProtectionState()
	
	// 1: 新购 2: 续费
	const privacyQueryType = ref(1)

  // 初始化表单数据
  onMounted(async () => {
		protectionForm.value.domain = props.domain.full_domain
		protectionForm.value.contactEmail = props.privacy?.email || ''
		currentProps.value = props.domain
		privacyQueryType.value = props.privacy === null ? 1 : 2
    // 查询默认价格（1年，新购）
		await queryPrivacyPrice(privacyQueryType.value, 1)
  })

  // 组件卸载时重置表单和停止轮询
  onUnmounted(() => {
    stopPaymentPolling()
		resetForm()
  })

  // 监听保护时长变化，重新查询价格
  watch(() => protectionForm.value.protectionTime, async (newYear) => {
    if (newYear) {
      await queryPrivacyPrice(privacyQueryType.value, newYear) // 1表示新购
    }
  })

  // 监听步骤和支付方式变化，控制轮询
  watch([currentStep, paymentMethod, orderCreated], () => {
    const orderNo = orderInfo.value?.data?.order_no
    
    if (currentStep.value === 2 && orderCreated.value && orderNo) {
      if (paymentMethod.value !== 'balance') {
        // 扫码支付时启动轮询
        startPaymentPolling(orderNo)
      } else {
        // 余额支付时停止轮询
        stopPaymentPolling()
      }
    } else {
      // 不在支付步骤时停止轮询
      stopPaymentPolling()
    }
  })

  // 监听支付成功状态变化
  watch(paymentSuccess, (success) => {
    if (success && currentStep.value === 2) {
      message.success('支付成功！隐私保护已开启')
      props.refresh?.()  // 刷新域名信息
      props.onClose?.()  // 关闭弹窗
    }
  })

  /**
   * 下一步操作
   */
	const handleNext = async () => {
		// 邮箱不为空，检查是否符合邮箱格式
		if (protectionForm.value.contactEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(protectionForm.value.contactEmail)) {
				message.error('邮箱格式不正确')
				return
			}
		}

		// 获取账户余额
		await loadAccountBalance()
		
		// 创建隐私保护订单
		await createPrivacyOrder()
		
		// 订单创建成功后，切换到步骤二
		currentStep.value = 2
  }

  /**
   * 上一步操作
   */
  const handleBack = () => {
    currentStep.value = 1
  }

  /**
   * 取消操作
   */
  const handleCancel = () => {
    resetForm()
    // 触发关闭弹窗
    props.onClose?.()
  }

  /**
   * 切换支付方式并控制轮询
   */
  const handleSwitchPaymentMethod = (method: 'wechat' | 'alipay' | 'balance') => {
    switchPaymentMethod(method)
    
    const orderNo = orderInfo.value?.data?.order_no
    if (orderNo && currentStep.value === 2 && orderCreated.value) {
      if (method === 'balance') {
        stopPaymentPolling()
      } else if (!isPolling.value) {
        startPaymentPolling(orderNo)
      }
    }
  }

  /**
   * 余额支付处理
   */
  const handleBalancePayment = async () => {
    const orderNo = orderInfo.value?.data?.order_no
    if (!orderNo) {
      message.error('订单号不存在')
      return
    }

    try {
      // 这里调用余额支付API
      // 参考续费模块的 payRenewByBalance 实现
      const { fetch, data } = await buyByBalance({ order_no: orderNo })
      await fetch()
      const response = data.value
      // 检查支付结果
      if (response?.status) {
        paymentSuccess.value = true
      } else {
        message.error(response?.msg || '支付失败，请重试')
      }
      
    } catch (error) {
      message.error('支付失败，请重试')
    }
  }

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
    qrCodeUrl,
    isPolling,
    
    // 方法
    handleNext,
    handleBack,
    handleCancel,
    handleBalancePayment,
    switchPaymentMethod: handleSwitchPaymentMethod,
    resetForm,
  }
} 