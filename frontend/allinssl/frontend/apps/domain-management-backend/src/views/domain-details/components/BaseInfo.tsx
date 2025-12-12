/**
 * 域名详情 - 基本信息组件
 * 职责：展示域名的基本信息，包括域名信息、注册信息、DNS信息和安全设置
 */

import { defineComponent, PropType, ref, computed } from 'vue'
import {
	NCard,
	NGrid,
	NGridItem,
	NTag,
	NSkeleton,
	NButton,
	NSwitch,
	NDivider,
	NSpace,
	NIcon,
	NInput,
	NForm,
	NFormItem,
	NCheckbox,
} from 'naive-ui'
import { formatDate } from '@baota/utils/date'
import { useMessage, useModal, useDialog } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import {
	setDomainSecurity,
	fetchDomainAutoRenew,
	downloadDomainCertificate,
	updatePrivacyInfo,
	deletePrivacyInfo,
} from '@/api/domain'
import { domainUtils } from '../config'

import type { DomainInfo, PrivacyInfo } from '@/types/domain'
import { useApp } from '@/components/layout/useStore'
import { useDomainDetailState } from '../useStore'
import { executeApiWithSecurityVerification } from '@/public/dialog'

/**
 * 域名基本信息组件
 */
export default defineComponent({
	name: 'DomainBaseInfo',
	props: {
		domainInfo: {
			type: Object as PropType<DomainInfo | null>,
			default: null,
		},
		privacyInfo: {
			type: Object as PropType<PrivacyInfo | null>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		onRefresh: {
			type: Function as PropType<() => void>,
			default: () => {},
		},
		openDnsSettingsModal: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	setup(props) {
		const message = useMessage()
		const { handleError } = useError()
		const { isMobile } = useApp()

		const { openPrivacyDialog } = useDomainDetailState()

		// 安全设置相关状态
		const dnsLockLoading = ref(false)
		const transferLockLoading = ref(false)
		const updateLockLoading = ref(false)

		const downloadCert = ref(false)
		const handleDownloadCert = async () => {
			downloadCert.value = true
			const { fetch, data, message } = downloadDomainCertificate({
				domain_id: Number(props.domainInfo?.id),
			})
			message.value = true
			await fetch()
			downloadCert.value = false
			// 情况1：返回下载直链
			const url = data.value?.data?.cert
			downloadBase64File(url, `${props.domainInfo?.full_domain || 'certificate'}.jpg`, 'image/jpeg')
		}
		// 自动续费
		const toggleAutoRenew = async () => {
			const { fetch, message, data } = fetchDomainAutoRenew({
				domain_id: props.domainInfo!.id,
				status: props.domainInfo?.auto_renew === 1 ? 0 : 1,
			})
			message.value = true
			await fetch()

			if (data.value.status) {
				props.onRefresh?.()
			}
		}
		// 刷新数据
		function refreshFetch() {
			props.onRefresh?.()
		}
		/**
		 * 打开域名隐私保护弹窗
		 * @param row 域名数据
		 */
		function openCnDomainPrivacyModal(row: DomainInfo | null) {
			openPrivacyDialog.value = useModal({
				title: '.CN/.中国专属域名隐私保护',
				area: '520px',
				component: () => import('./PrivacyProtection'),
				componentProps: {
					domain: row,
					privacy: props.privacyInfo,
					refresh: refreshFetch, // 传递列表刷新函数
					onClose: () => {
						openPrivacyDialog.value?.close()
					},
				},
				footer: false,
			})
		}

		/**
		 * 打开修改邮箱对话框
		 */
		function openModifyEmailDialog() {
			const emailRef = ref(props.privacyInfo?.email || '')
			const emailFormRef = ref()
			const loading = ref(false)

			// 邮箱验证规则
			const emailRules = {
				required: true,
				pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				message: '请输入有效的邮箱地址',
				trigger: ['input', 'blur'],
			}

			const handleConfirm = async () => {
				try {
					await emailFormRef.value?.validate()
					loading.value = true

					const { fetch, data } = updatePrivacyInfo({
						domain_id: String(props.domainInfo?.id),
						email: emailRef.value,
					})

					await fetch()

					if (data.value?.status) {
						message.success('邮箱修改成功')
						props.onRefresh?.()
						return true
					} else {
						message.error(data.value?.msg || '修改失败')
						return false
					}
				} catch (error) {
					message.error('邮箱格式不正确')
					return false
				} finally {
					loading.value = false
				}
			}

			useDialog({
				type: undefined,
				title: '修改隐私保护邮箱',
				area: '400px',
				content: () => (
					<NForm
						ref={emailFormRef}
						model={{ email: emailRef.value }}
						rules={{ email: emailRules }}
						label-placement="left"
					>
						<NFormItem label="邮箱地址" path="email">
							<NInput v-model:value={emailRef.value} placeholder="请输入邮箱地址" clearable />
						</NFormItem>
					</NForm>
				),
				positiveText: '确认',
				negativeText: '取消',
				loading: loading.value,
				onPositiveClick: handleConfirm,
			})
		}

		/**
		 * 关闭隐私保护
		 */
		function closePrivacyProtection() {
			const confirmChecked = ref(false)
			const loading = ref(false)

			const handleConfirm = async () => {
				if (!confirmChecked.value) {
					message.warning('请先阅读并确认风险提示')
					return false
				}

				loading.value = true
				try {
					const { fetch, data } = deletePrivacyInfo({
						domain_id: String(props.domainInfo?.id),
					})

					await fetch()

					if (data.value?.status) {
						message.success('隐私保护已关闭')
						props.onRefresh?.()
						return true
					} else {
						message.error(data.value?.msg || '关闭失败')
						return false
					}
				} finally {
					loading.value = false
				}
			}

			useDialog({
				type: 'warning',
				title: '确认关闭隐私保护',
				area: '36rem',
				class: 'hide-dialog-icon',
				content: () => (
					<div>
						<div class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
							<div class="flex items-start">
								<div class="flex-1">
									<div class="text-yellow-800 font-semibold mb-2 text-sm">重要提示</div>
									<div class="text-sm text-yellow-700 leading-relaxed">
										<ul>
											<li>用户主动删除域名或主动提前取消CNNIC域名隐私保护服务的，已缴纳服务费用不予退费；</li>
											<li>用户主动提前取消隐私保护服务后，若需重新开启隐私保护服务，则需要重新购买。</li>
										</ul>
									</div>
								</div>
							</div>
						</div>

						{/* 风险确认勾选框 */}
						<div class="flex items-start space-x-2 p-3 rounded-md">
							<NCheckbox
								checked={confirmChecked.value}
								onUpdateChecked={(checked: boolean) => {
									confirmChecked.value = checked
								}}
							>
								我已阅读并理解上述风险提示
							</NCheckbox>
						</div>
					</div>
				),
				positiveText: '确认关闭',
				negativeText: '取消',
				loading: loading.value,
				onPositiveClick: handleConfirm,
			})
		}

		// 切换安全设置
		const toggleSecurity = async (type: 'dns_lock' | 'transfer_lock' | 'update_lock', currentStatus: number) => {
			// 设置对应 loading
			const loadingMap = {
				dns_lock: dnsLockLoading,
				transfer_lock: transferLockLoading,
				update_lock: updateLockLoading,
			} as const
			loadingMap[type].value = true

			// Handle dns_lock by mapping it to the appropriate type
			let requestType: 'update' | 'transfer'
			if (type === 'dns_lock') {
				// Map dns_lock to a valid API type (assuming it should be update)
				requestType = 'update'
			} else if (type === 'transfer_lock') {
				requestType = 'transfer'
			} else if (type === 'update_lock') {
				requestType = 'update'
			} else {
				requestType = 'update' // fallback
			}

			const newStatus = currentStatus === 1 ? 0 : 1
			const info = await executeApiWithSecurityVerification(
				setDomainSecurity as any,
				{
					domain_id: props.domainInfo!.id,
					type: requestType,
					status: newStatus,
				},
				{
					showMessage: true,
					setLoading: (load: boolean) => {
						const loadingMap = {
							dns_lock: dnsLockLoading,
							transfer_lock: transferLockLoading,
							update_lock: updateLockLoading,
						} as const
						loadingMap[type].value = load
					},
				},
			)
			if (info?.status) {
				props.onRefresh?.()
			}
		}

		// 渲染信息项
		const renderInfoItem = (label: string, value: any, valueType: 'text' | 'tag' = 'text', config?: any) => {
			if (props.loading) {
				return (
					<div class="mb-2 flex items-center h-10">
						<div class="text-gray-500  font-bold w-25 mr-5 ml-1">{label}</div>
						<NSkeleton text width="60%" />
					</div>
				)
			}

			if (valueType === 'tag' && config) {
				const { type, text } = config
				return (
					<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
						<div class="text-gray-500 font-bold w-25 mr-5 ml-1">{label}</div>
						<NTag type={type} bordered={false}>
							{text}
						</NTag>
					</div>
				)
			}

			return (
				<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
					<div class="text-gray-500 font-bold w-25 mr-5 ml-1">{label}</div>
					<div>{value || '-'}</div>
				</div>
			)
		}
		const isPrivacy = computed(() => {
			return !!props.domainInfo?.privacy
		})
		return () => (
			<div class="py-2">
				<NGrid cols="1 m:2" xGap="16" yGap="16" responsive="screen">
					{/* 域名信息 */}
					<NGridItem>
						<NCard
							title="域名信息"
							header-style="font-size:16px;font-weight:500"
							class={`${isMobile.value ? '' : 'h-[460px]'}`}
						>
							<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
								<div class="text-gray-500 font-bold w-25 mr-5 ml-1">域名</div>
								<div>
									<span>{props.domainInfo?.full_domain}</span>
									<NDivider vertical />
									<NButton size="tiny" ghost loading={downloadCert.value} onClick={() => handleDownloadCert()}>
										下载证书
									</NButton>
								</div>
							</div>
							{renderInfoItem('域名状态', null, 'tag', {
								type: domainUtils.status.getType(props.domainInfo?.status || 0),
								text: domainUtils.status.getText(props.domainInfo?.status || 0),
							})}
							{renderInfoItem('所有者', props.domainInfo?.owner_name)}
							{renderInfoItem('所有者(英文)', props.domainInfo?.owner_name_en)}
							{renderInfoItem('实名状态', null, 'tag', {
								type: domainUtils.realName.getType(props.domainInfo?.real_name_status || 0),
								text: domainUtils.realName.getText(props.domainInfo?.real_name_status || 0),
							})}
							{renderInfoItem('备注', props.domainInfo?.remark)}

							<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
								<div class="text-gray-500 font-bold w-25 mr-5 ml-1">自动续费</div>
								<div>
									<NSwitch value={props.domainInfo?.auto_renew === 1} onUpdateValue={() => toggleAutoRenew()} />
								</div>
							</div>
						</NCard>
					</NGridItem>

					{/* 注册信息 */}
					<NGridItem>
						<NCard
							title="注册信息"
							header-style="font-size:16px;font-weight:500"
							class={`${isMobile.value ? '' : 'h-[460px]'}`}
						>
							{renderInfoItem('注册商', props.domainInfo?.registrar)}
							{renderInfoItem('注册时间', formatDate(props.domainInfo?.register_time))}
							{renderInfoItem('到期时间', formatDate(props.domainInfo?.expire_time))}
							{renderInfoItem('创建时间', formatDate(props.domainInfo?.created_at || 0))}
							{renderInfoItem('更新时间', formatDate(props.domainInfo?.updated_at || 0))}
							{(props.domainInfo?.suffix === 'cn' || props.domainInfo?.suffix === '中国') && (
								<div class="mb-2 hover:bg-gray-100">
									<div class="flex items-start">
										<div class="text-gray-500 font-bold w-25 mr-5 ml-1 pt-1">隐私保护</div>
										<div class="flex-1">
											{/* 第一行：标签信息 */}
											<div class="mb-5">
												<NTag type={isPrivacy.value ? 'success' : 'warning'} bordered={false}>
													{isPrivacy.value
														? `已开启(到期:${formatDate(props.privacyInfo?.end_time, 'yyyy-MM-dd')})`
														: '未开启'}
												</NTag>
											</div>
											{/* 第二行：邮箱信息 */}
											<div class="mb-5 text-sm text-gray-600">邮箱：{props.privacyInfo?.email || ''}</div>

											{/* 第三行：操作按钮 */}
											<div>
												<NSpace>
													<NButton
														type="primary"
														size="small"
														onClick={() => props.domainInfo && openCnDomainPrivacyModal(props.domainInfo)}
													>
														{isPrivacy.value ? '续费隐私保护' : '.CN/.中国专属域名隐私保护'}
													</NButton>
													{isPrivacy.value && (
														<>
															<NButton size="small" onClick={openModifyEmailDialog}>
																修改邮箱
															</NButton>
															<NButton type="error" size="small" onClick={closePrivacyProtection}>
																关闭隐私保护
															</NButton>
														</>
													)}
												</NSpace>
											</div>
										</div>
									</div>
								</div>
							)}
						</NCard>
					</NGridItem>

					{/* DNS信息 */}
					<NGridItem>
						<NCard title="DNS信息" header-style="font-size:16px;font-weight:500" class="h-[280px]">
							{renderInfoItem('NS服务器1', props.domainInfo?.ns1)}
							{renderInfoItem('NS服务器2', props.domainInfo?.ns2)}
							{/* {renderInfoItem('DNS状态', null, 'tag', {
								type: props.domainInfo?.ns_status === 1 ? 'success' : 'warning',
								text: props.domainInfo?.ns_status === 1 ? '正常' : '未生效',
							})} */}
							<NButton size="small" ghost class="mt-4" onClick={props.openDnsSettingsModal} disabled={props.loading}>
								修改DNS服务器
							</NButton>
						</NCard>
					</NGridItem>

					{/* 安全设置 */}
					<NGridItem>
						<NCard title="安全设置" header-style="font-size:16px;font-weight:500" class="h-[280px]">
							<div class="flex items-center mb-2 h-10 hover:bg-gray-100">
								<div class="text-gray-500 font-bold w-25 mr-5 ml-1">禁止转移锁</div>
								<NSwitch
									value={props.domainInfo?.transfer_lock === 1}
									loading={transferLockLoading.value}
									disabled={props.loading}
									onUpdateValue={() => toggleSecurity('transfer_lock', props.domainInfo?.transfer_lock || 0)}
								/>
							</div>
							<div class="pl-2 mb-4">开启后，将禁止域名转出到其他注册商。</div>

							<div class="flex items-center mb-2 h-10 hover:bg-gray-100">
								<div class="text-gray-500 font-bold w-25 mr-5 ml-1">禁止更新锁</div>
								<NSwitch
									value={props.domainInfo?.update_lock === 1}
									loading={updateLockLoading.value}
									disabled={props.loading}
									onUpdateValue={() => toggleSecurity('update_lock', props.domainInfo?.update_lock || 0)}
								/>
							</div>
							<div class="pl-2">开启后，将禁止更新域名信息，保护您的注册信息及DNS不被恶意修改。</div>
						</NCard>
					</NGridItem>
				</NGrid>

				{/* DNS服务器设置弹窗 */}
				{/* 已移除，使用独立的DnsSettingsDialog组件 */}
			</div>
		)
	},
})
/**
 * Base64 数据直接下载为文件
 * @param {string} base64Str - 后端返回的完整 Base64 字符串（含头部如 data:xxx;base64,）
 * @param {string} fileName - 下载后的文件名（需带后缀，如 "报表.xlsx"）
 * @param {string} mimeType - 文件的 MIME 类型（如 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet）
 */
function downloadBase64File(base64Str: any, fileName: any, mimeType: any) {
	// 1. 移除 Base64 头部，提取纯编码内容（若后端返回的 Base64 已不含头部，可跳过此步）
	const base64Content = base64Str.replace(/^data:.+;base64,/, '')

	// 2. 将 Base64 解码为二进制数组（处理中文等特殊字符兼容）
	const decodeStr = atob(base64Content) // atob 解码 Base64
	const length = decodeStr.length
	const uint8Array = new Uint8Array(length) // 创建 8 位无符号整数数组（二进制容器）
	for (let i = 0; i < length; i++) {
		uint8Array[i] = decodeStr.charCodeAt(i) // 将每个字符转为 ASCII 码，存入二进制数组
	}

	// 3. 构建 Blob 对象（指定文件类型，确保浏览器正确识别）
	const blob = new Blob([uint8Array], { type: mimeType })

	// 4. 创建下载链接并触发下载
	const url = URL.createObjectURL(blob) // 生成 Blob 的临时 URL
	const a = document.createElement('a') // 创建隐藏的 <a> 标签
	a.href = url
	a.download = fileName // 关键：设置下载文件名（浏览器会忽略 URL 中的文件名）
	a.style.display = 'none' // 隐藏标签，避免影响页面

	// 5. 模拟点击触发下载，之后释放资源
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

// CSS 样式：隐藏弹窗图标
const style = document.createElement('style')
style.textContent = `
.hide-dialog-icon .n-dialog__icon {
	display: none !important;
}
`
document.head.appendChild(style)
