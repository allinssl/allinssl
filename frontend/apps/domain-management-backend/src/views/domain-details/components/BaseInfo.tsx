/**
 * 域名详情 - 基本信息组件
 * 职责：展示域名的基本信息，包括域名信息、注册信息、DNS信息和安全设置
 */

import { defineComponent, PropType, ref } from 'vue'
import {
	NCard,
	NGrid,
	NGridItem,
	NTag,
	NSkeleton,
	NButton,
	NModal,
	NForm,
	NFormItem,
	NInput,
	NSwitch,
	NDivider,
	NSpace,
	NIcon,
	NButtonGroup,
} from 'naive-ui'
import { formatDate } from '@baota/utils/date'
import { useMessage, useModal } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { updateDomainDnsServers, setDomainSecurity,fetchDomainAutoRenew,downloadDomainCertificate } from '@/api/domain'
import { domainUtils } from '../config'

import type { DomainInfo,PrivacyInfo } from '@/types/domain'
import { useApp } from '@/components/layout/useStore'
import { useDomainDetailState } from '../useStore'

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
	},
	setup(props) {
		const message = useMessage()
		const { handleError } = useError()
		const { isMobile } = useApp()

		const { openPrivacyDialog } = useDomainDetailState()

		// DNS服务器设置相关状态
		const showDnsModal = ref(false)
		const dnsForm = ref({
			ns1: '',
			ns2: '',
			ns3: '',
			ns4: '',
			ns5: '',
			ns6: '',
			domain_id: 0,
		})
		const dnsSubmitting = ref(false)
		const dnsMode = ref<'default' | 'custom'>('default') // DNS模式：默认/自定义
		const visibleDnsCount = ref(2) // 当前显示的DNS字段数量，默认2个

		// 安全设置相关状态
		const dnsLockLoading = ref(false)
		const transferLockLoading = ref(false)
		const updateLockLoading = ref(false)

		// 添加DNS字段
		const addDnsField = () => {
			if (visibleDnsCount.value < 6) {
				visibleDnsCount.value++
			}
		}

		// 删除DNS字段
		const removeDnsField = () => {
			if (visibleDnsCount.value > 2) {
				// 清空最后一个字段
				const lastKey = `ns${visibleDnsCount.value}` as keyof typeof dnsForm.value
				;(dnsForm.value as any)[lastKey] = ''
				visibleDnsCount.value--
			}
		}

		// 获取当前显示的DNS字段
		const getDnsFields = () => {
			const fields = []
			for (let i = 1; i <= visibleDnsCount.value; i++) {
				const key = `ns${i}` as keyof typeof dnsForm.value
				fields.push({
					key,
					label: `NS服务器${i}`,
					value: String(dnsForm.value[key] || ''),
					required: i <= 2, // 前两个必填
				})
			}
			return fields
		}

		// 获取默认模式的DNS字段
		const getDefaultDnsFields = () => {
			return [
				{
					label: 'NS服务器1:',
					value: props.domainInfo?.ns1 || '',
				},
				{
					label: 'NS服务器2:',
					value: props.domainInfo?.ns2 || '',
				},
			]
		}

		// 渲染默认模式
		const renderDefaultDnsMode = () => (
			<div>
				{getDefaultDnsFields().map((field, index) => (
					<NFormItem key={index} label={field.label}>
						<NInput value={field.value} readonly placeholder={field.value || '暂无'} />
					</NFormItem>
				))}
			</div>
		)

		// 渲染自定义模式
		const renderCustomDnsMode = () => (
			<div>
				{getDnsFields().map((field) => (
					<NFormItem key={field.key} label={field.label} required={field.required}>
						<NInput
							value={field.value}
							onUpdateValue={(val) => {
								;(dnsForm.value as any)[field.key] = val
							}}
							placeholder={`请输入${field.label}地址`}
						/>
					</NFormItem>
				))}

				{/* 添加/删除按钮 */}
				<div class="flex gap-2">
					{visibleDnsCount.value < 6 && (
						<NButton size="small" quaternary type="success" onClick={addDnsField}>
							添加DNS
						</NButton>
					)}
					{visibleDnsCount.value > 2 && (
						<NButton size="small" quaternary type="error" onClick={removeDnsField}>
							删除最后一个
						</NButton>
					)}
				</div>
			</div>
		)
		// 模式切换处理
		const switchToCustomMode = () => {
			dnsMode.value = 'custom'
			// 初始化自定义表单数据
			if (props.domainInfo) {
				dnsForm.value = {
					ns1: props.domainInfo.ns1 || '',
					ns2: props.domainInfo.ns2 || '',
					ns3: props.domainInfo.ns3 || '',
					ns4: props.domainInfo.ns4 || '',
					ns5: props.domainInfo.ns5 || '',
					ns6: props.domainInfo.ns6 || '',
					domain_id: props.domainInfo.id,
				}

				// 计算当前需要显示的字段数量
				const filledCount =
					[
						dnsForm.value.ns1,
						dnsForm.value.ns2,
						dnsForm.value.ns3,
						dnsForm.value.ns4,
						dnsForm.value.ns5,
						dnsForm.value.ns6,
					].findLastIndex((v) => v && v.trim()) + 1
				visibleDnsCount.value = Math.max(filledCount, 2)
			}
		}

		// 打开DNS设置弹窗
		const openDnsModal = () => {
			if (props.domainInfo) {
				//如果ns数量大于2，则默认打开自定义模式
				if (props.domainInfo?.ns3) {
					switchToCustomMode()
				} else {
					dnsMode.value = 'default' // 默认打开默认模式
				}
				showDnsModal.value = true
			}
		}

		// 提交DNS服务器设置
		const submitDnsSettings = async () => {
			// 基础校验：ns1、ns2必填
			if (!dnsForm.value.ns1 || !dnsForm.value.ns2) {
				message.error('NS服务器1和NS服务器2为必填项')
				return
			}

			// 顺序校验：不能跳跃填写
			const dnsValues = [
				dnsForm.value.ns1,
				dnsForm.value.ns2,
				dnsForm.value.ns3,
				dnsForm.value.ns4,
				dnsForm.value.ns5,
				dnsForm.value.ns6,
			]

			for (let i = 0; i < dnsValues.length - 1; i++) {
				if (!dnsValues[i] && dnsValues[i + 1]) {
					message.error(`请按顺序填写DNS服务器，NS服务器${i + 1}为空但NS服务器${i + 2}有值`)
					return
				}
			}

			// DNS格式校验
			const dnsRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
			for (let i = 0; i < dnsValues.length; i++) {
				const dns = dnsValues[i]
				if (dns && dns.trim() && !dnsRegex.test(dns.trim())) {
					message.error(`NS服务器${i + 1}地址格式不正确`)
					return
				}
			}
			const {
				loading,
				data,
				fetch,
				message: messageRef,
			} = updateDomainDnsServers({
				domain_id: dnsForm.value.domain_id,
				dns1: dnsForm.value.ns1,
				dns2: dnsForm.value.ns2,
				dns3: dnsForm.value.ns3,
				dns4: dnsForm.value.ns4,
				dns5: dnsForm.value.ns5,
				dns6: dnsForm.value.ns6,
			})
			try {
				loading.value = true
				messageRef.value = true
				dnsSubmitting.value = true
				await fetch()
				if (data.value.status) {
					showDnsModal.value = false
					props.onRefresh()
				}
			} catch (error) {
				handleError(error)
			} finally {
				dnsSubmitting.value = false
				loading.value = false
			}
		}
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
				throw new Error(`Unsupported lock type: ${type}`)
			}

			const newStatus = currentStatus === 1 ? 0 : 1
			const { fetch, message, data } = setDomainSecurity({
				domain_id: props.domainInfo!.id,
				type: requestType,
				status: newStatus,
			})
			try {
				message.value = true
				await fetch()
				if (data.value.status) {
					props.onRefresh?.()
				}
			} catch (error) {
				handleError(error)
			} finally {
				const loadingMap = {
					dns_lock: dnsLockLoading,
					transfer_lock: transferLockLoading,
					update_lock: updateLockLoading,
				} as const
				loadingMap[type].value = false
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
							class={`${isMobile.value ? '' : 'h-[410px]'}`}
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
							class={`${isMobile.value ? '' : 'h-[410px]'}`}
						>
							{renderInfoItem('注册商', props.domainInfo?.registrar)}
							{renderInfoItem('注册时间', formatDate(props.domainInfo?.register_time))}
							{renderInfoItem('到期时间', formatDate(props.domainInfo?.expire_time))}
							{renderInfoItem('创建时间', formatDate(props.domainInfo?.created_at || 0))}
							{renderInfoItem('更新时间', formatDate(props.domainInfo?.updated_at || 0))}
							{(props.domainInfo?.suffix === 'cn' || props.domainInfo?.suffix === '中国') && (
								<div class="mb-2 flex items-center h-10 hover:bg-gray-100">
									<div class="text-gray-500 font-bold w-25 mr-5 ml-1">隐私保护</div>
									<div>
										<NTag type={isPrivacy.value ? 'success' : 'warning'} bordered={false}>
											{isPrivacy.value
												? `已开启(到期:${formatDate(props.privacyInfo?.end_time, 'yyyy-MM-dd')})`
												: '未开启'}
										</NTag>
										<NButton
											type="primary"
											size="small"
											class="ml-2"
											onClick={() => props.domainInfo && openCnDomainPrivacyModal(props.domainInfo)}
										>
											{isPrivacy.value ? '延续隐私保护' : '.CN/.中国专属域名隐私保护'}
										</NButton>
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
							<NButton size="small" ghost class="mt-4" onClick={openDnsModal} disabled={props.loading}>
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
				<NModal
					show={showDnsModal.value}
					title="修改DNS服务器"
					preset="dialog"
					positiveText={dnsMode.value === 'custom' ? '确认' : undefined}
					negativeText="取消"
					onPositiveClick={dnsMode.value === 'custom' ? submitDnsSettings : undefined}
					onNegativeClick={() => {
						showDnsModal.value = false
					}}
					onClose={() => {
						showDnsModal.value = false
					}}
					loading={dnsSubmitting.value}
					style="width: 36rem;"
				>
					<div class="p-4">
						{/* 模式选择器 */}
						<NSpace class="flex items-center mb-4">
							<span class="mr-[46px]">类型：</span>
							<NButtonGroup>
								<NButton
									type={dnsMode.value === 'default' ? 'primary' : 'default'}
									onClick={() => (dnsMode.value = 'default')}
								>
									默认
								</NButton>
								<NButton type={dnsMode.value === 'custom' ? 'primary' : 'default'} onClick={switchToCustomMode}>
									自定义
								</NButton>
							</NButtonGroup>
						</NSpace>

						<NForm class="mt-4" label-placement="left" label-width="100" label-align="left">
							{/* 根据模式渲染不同内容 */}
							{dnsMode.value === 'default' ? renderDefaultDnsMode() : renderCustomDnsMode()}
						</NForm>
					</div>
				</NModal>
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
}