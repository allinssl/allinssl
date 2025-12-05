/**
 * DNS服务器设置弹窗组件
 * 负责域名DNS服务器的配置和管理
 */

import { defineComponent, ref, type PropType } from 'vue'
import { NSpace, NForm, NFormItem, NInput, NButton, NButtonGroup, NFlex } from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import { updateDomainDnsServers } from '@/api/domain'
import { executeApiWithSecurityVerification } from '@/public/dialog'
import type { DomainInfo } from '@/types/domain'
import { useDomainDetailState } from '../useStore'

export default defineComponent({
	name: 'DnsSettingsDialog',
	props: {
		domainId: {
			type: Number,
			required: true,
		},
		domainInfo: {
			type: Object as PropType<DomainInfo | null>,
			default: null,
		},
		refresh: {
			type: Function as PropType<() => Promise<void>>,
			required: true,
		},
	},

	setup(props) {
		const { openDnsChangeDialog } = useDomainDetailState()
		const message = useMessage()

		// DNS服务器设置相关状态
		const dnsForm = ref({
			ns1: '',
			ns2: '',
			ns3: '',
			ns4: '',
			ns5: '',
			ns6: '',
			domain_id: 0,
		})
		const submitting = ref(false)
		const dnsMode = ref<'default' | 'custom'>('default') // DNS模式：默认/自定义
		const visibleDnsCount = ref(2) // 当前显示的DNS字段数量，默认2个

		// 初始化表单数据
		const initializeForm = () => {
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

				// 如果ns数量大于2，则默认打开自定义模式
				if (props.domainInfo?.ns3) {
					dnsMode.value = 'custom'
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
				} else {
					dnsMode.value = 'default'
					visibleDnsCount.value = 2
				}
			} else {
				// 如果没有域名信息，设置默认值
				dnsForm.value = {
					ns1: '',
					ns2: '',
					ns3: '',
					ns4: '',
					ns5: '',
					ns6: '',
					domain_id: 0,
				}
				dnsMode.value = 'default'
				visibleDnsCount.value = 2
			}
		}

		// 组件初始化时调用
		initializeForm()

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
					value: 'ns1.baotadns.com',
				},
				{
					label: 'NS服务器2:',
					value: 'ns2.baotadns.com',
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
				<NFlex size="small" class="mt-2">
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
				</NFlex>
			</div>
		)

		// 模式切换处理
		const switchToDefaultMode = () => {
			dnsMode.value = 'default'
			// 重置表单为默认值
			dnsForm.value = {
				ns1: '',
				ns2: '',
				ns3: '',
				ns4: '',
				ns5: '',
				ns6: '',
				domain_id: props.domainInfo?.id || 0,
			}
			visibleDnsCount.value = 2
		}

		const switchToCustomMode = () => {
			dnsMode.value = 'custom'
			// 初始化表单数据，但保持自定义模式
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
				// 计算当前需要显示的字段数量，至少显示3个
				const filledCount =
					[
						dnsForm.value.ns1,
						dnsForm.value.ns2,
						dnsForm.value.ns3,
						dnsForm.value.ns4,
						dnsForm.value.ns5,
						dnsForm.value.ns6,
					].findLastIndex((v) => v && v.trim()) + 1
				visibleDnsCount.value = Math.max(filledCount, 3) // 自定义模式至少显示3个字段
			} else {
				// 没有域名信息时，设置默认值
				dnsForm.value = {
					ns1: '',
					ns2: '',
					ns3: '',
					ns4: '',
					ns5: '',
					ns6: '',
					domain_id: 0,
				}
				visibleDnsCount.value = 3 // 自定义模式至少显示3个字段
			}
		}
		// 取消操作
		const handleCancel = () => {
			openDnsChangeDialog.value?.close()
		}

		// 提交DNS服务器设置
		const handleSubmit = async () => {
			// 如果是默认模式，设置默认DNS服务器
			if (dnsMode.value === 'default') {
				dnsForm.value.ns1 = 'ns1.baotadns.com'
				dnsForm.value.ns2 = 'ns2.baotadns.com'
				// 清空其他DNS字段
				dnsForm.value.ns3 = ''
				dnsForm.value.ns4 = ''
				dnsForm.value.ns5 = ''
				dnsForm.value.ns6 = ''
				dnsForm.value.domain_id = (props.domainInfo && props.domainInfo.id) || 0
			}

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

			try {
				submitting.value = true
				const info = await executeApiWithSecurityVerification(
					updateDomainDnsServers as any,
					{
						domain_id: dnsForm.value.domain_id,
						dns1: dnsForm.value.ns1,
						dns2: dnsForm.value.ns2,
						dns3: dnsForm.value.ns3,
						dns4: dnsForm.value.ns4,
						dns5: dnsForm.value.ns5,
						dns6: dnsForm.value.ns6,
					},
					{
						showMessage: true,
						setLoading: (load: boolean) => {
							submitting.value = load
						},
					},
				)
				if (info?.status) {
					await props.refresh()
					// 提交成功后关闭弹窗
					openDnsChangeDialog.value?.close()
				}
			} catch (error) {
				// 错误已在 executeApiWithSecurityVerification 中处理
			} finally {
				submitting.value = false
			}
		}

		return () => (
			<>
				<NSpace class="flex items-center mb-4">
					<span class="mr-[46px]">类型：</span>
					<NButtonGroup>
						<NButton type={dnsMode.value === 'default' ? 'primary' : 'default'} onClick={switchToDefaultMode}>
							默认
						</NButton>
						<NButton type={dnsMode.value === 'custom' ? 'primary' : 'default'} onClick={switchToCustomMode}>
							自定义
						</NButton>
					</NButtonGroup>
				</NSpace>

				{/* DNS服务器配置表单 */}
				<NForm class="mt-4" label-placement="left" label-width="100" label-align="left">
					{dnsMode.value === 'default' ? renderDefaultDnsMode() : renderCustomDnsMode()}
				</NForm>

				{/* 操作按钮 */}
				<NFlex justify="end" class="mt-6">
					<NButton onClick={handleCancel}>取消</NButton>
					<NButton type="primary" loading={submitting.value} onClick={handleSubmit}>
						确认
					</NButton>
				</NFlex>
			</>
		)
	},
})
