/**
 * @fileoverview DNS记录分析组件 - 视图层
 * @description 提供DNS记录的查询、展示和管理功能
 */

import { defineComponent, ref, nextTick } from 'vue'
import {
	NInput,
	NInputNumber,
	NSelect,
	NButton,
	NSpace,
	NText,
	NDataTable,
	NTag,
	NEllipsis,
	NSwitch,
	type SelectOption,
	type DataTableColumns,
	type DataTableRowKey,
	NFlex,
	NCascader,
	CascaderOption,
	NCard,
	NPagination,
	NIcon,
	NDivider,
} from 'naive-ui'
import { useMessage, useDialog } from '@baota/naive-ui/hooks'
import { useDnsAnalysisController } from './useController'
import { useApp } from '@/components/layout/useStore'

import type { DnsRecordItem } from '@/types/domain'
import type { DnsRecordForm } from '../../types'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'

// 顶层导出：字段帮助信息（供组件内与表单弹窗复用）
export const getFieldHelpInfo = (field: string, type: string = 'A') => {
	const helpInfo: Record<string, any> = {
		record: {
			title: '主机记录说明',
			description: '指定DNS解析的子域名前缀，温馨提示，如果要解析www.bt.com，主机记录填写www即可',
			examples: [
				{ value: '@', desc: '直接解析主域名' },
				{ value: 'www', desc: '万维网服务' },
				{ value: 'mail', desc: '邮件服务' },
				{ value: '*', desc: '泛解析，匹配所有子域名' },
			],
			tips: '主机记录不能包含协议(http://)，只需填写子域名部分',
		},
		type: {
			title: '记录类型说明',
			description: 'DNS记录的类型决定了如何解析域名',
			examples: [
				{
					value: 'A',
					desc: 'IPv4地址记录',
					icon: '🔵',
					detail: '将域名指向IPv4地址，如 192.168.1.1',
				},
				{
					value: 'AAAA',
					desc: 'IPv6地址记录',
					icon: '🔷',
					detail: '将域名指向IPv6地址',
				},
				{
					value: 'CNAME',
					desc: '别名记录',
					icon: '🔗',
					detail: '将域名指向另一个域名',
				},
				{
					value: 'MX',
					desc: '邮件交换记录',
					icon: '📮',
					detail: '指定邮件服务器，需设置优先级',
				},
				{
					value: 'TXT',
					desc: '文本记录',
					icon: '📄',
					detail: '存储文本信息，常用于验证',
				},
				{
					value: 'NS',
					desc: '域名服务器记录',
					icon: '🗄️',
					detail: '指定域名的权威DNS服务器',
				},
				{
					value: 'SRV',
					desc: '服务记录',
					icon: '⚙️',
					detail: '指定特定服务的位置信息',
				},
			],
			tips:
				type === 'MX'
					? 'MX记录必须设置优先级，数值越小优先级越高'
					: type === 'CNAME'
						? 'CNAME记录不能与其他记录类型共存于同一主机记录'
						: type === 'TXT'
							? 'TXT记录常用于域名验证、SPF、DKIM等配置'
							: '选择正确的记录类型对DNS解析至关重要',
		},
		viewId: {
			title: '线路类型说明',
			description: '智能DNS解析，根据访问者地理位置返回最优IP',
			examples: [
				{ value: '默认', desc: '全球通用解析', icon: '🌍' },
				{ value: '境内', desc: '中国大陆地区', icon: '🇨🇳' },
				{ value: '境外', desc: '海外地区', icon: '🌏' },
				{ value: '电信', desc: '电信网络优化', icon: '📶' },
				{ value: '联通', desc: '联通网络优化', icon: '📡' },
				{ value: '移动', desc: '移动网络优化', icon: '📱' },
			],
			tips: '智能DNS可以根据用户网络环境返回最适合的IP地址，提升访问速度',
		},
		value: {
			title: '记录值说明',
			description: `${type}记录的目标值`,
			examples:
				type === 'A'
					? [
							{ value: '192.168.1.1', desc: '私有网络地址', icon: '🏠' },
							{ value: '8.8.8.8', desc: '公网IPv4地址', icon: '🌐' },
						]
					: type === 'CNAME'
						? [
								{ value: 'example.com', desc: '目标域名', icon: '🔗' },
								{ value: 'www.example.com', desc: '完整域名', icon: '🌐' },
							]
						: type === 'MX'
							? [
									{
										value: 'mail.example.com',
										desc: '邮件服务器',
										icon: '📧',
									},
									{
										value: 'mx.example.com',
										desc: '邮件交换服务器',
										icon: '📮',
									},
								]
							: type === 'CAA'
								? [
										{
											value:
												'格式为：flag tag value。 其中flag目前取值为0-128；tag取值为issue、issuewild、iodef；value为不包含|、""、\、<>、中文字符的字符串。',
											desc: '例如：0 issue www.51dns.com',
											icon: '📝',
										},
									]
								: [
										{
											value: '对应的值',
											desc: '根据记录类型填写',
											icon: '📝',
										},
									],
			tips:
				type === 'A'
					? 'IPv4地址格式：xxx.xxx.xxx.xxx，每段数字范围0-255'
					: type === 'AAAA'
						? 'IPv6地址格式：如 2001:db8::1'
						: type === 'CNAME'
							? '目标域名，不能是IP地址'
							: type === 'MX'
								? '邮件服务器域名，需要配合优先级使用'
								: type === 'TXT'
									? '文本内容，支持多种验证格式'
									: '请根据记录类型填写对应格式的值',
		},
		ttl: {
			title: 'TTL说明',
			description: '生存时间（秒），表示DNS记录在缓存中的保留时长',
			examples: [
				{ value: '600', desc: '推荐默认值' },
				{ value: '3600', desc: '更新较少变动记录' },
				{ value: '60', desc: '记录值频繁变动' },
			],
			tips: '数值越小，变更生效越快，但解析压力更大；建议 600',
		},
		mx: {
			title: 'MX优先级说明',
			description: '数值越小优先级越高；相同优先级将进行负载均衡',
			examples: [
				{ value: '5', desc: '高优先级' },
				{ value: '10', desc: '次高优先级' },
				{ value: '20', desc: '备份节点' },
			],
			tips: '仅 MX 记录需要设置优先级',
		},
	}

	return (
		helpInfo[field] || {
			title: '字段说明',
			description: '暂无说明',
			examples: [],
			tips: '',
		}
	)
}

interface DnsAnalysisProps {
	/** 域名ID */
	domainId: number
	/** 域名类型：1=宝塔内部域名，2=外部域名 */
	domainType?: number
}

export default defineComponent({
	props: {
		domainId: {
			type: Number,
			default: 0,
		},
		domainType: {
			type: Number,
			default: 1, // 默认为宝塔内部域名
		},
	},
	setup(props: DnsAnalysisProps) {
		const { isMobile } = useApp()
		// 使用控制器
		const {
			toggleRecordStatus,
			fetchRecords,
			pagination,
			recordListParams,
			isEditing,
			isAdding,
			isLoading,
			newRecord,
			dnsRecords,
			viewsOptions,
			recordTypesOptions,
			handleCreateRecord,
			handleUpdateRecord,
			handlDeleteRecord,
			openDnsAnalysisDialog,
			recordCount,
			FilterForm,
		} = useDnsAnalysisController(props.domainId, props.domainType)

		// UI工具
		const message = useMessage()
		const expandedRowKeys = ref<DataTableRowKey[]>([])

		// 表格选择状态
		const checkedRowKeys = ref<DataTableRowKey[]>([]) // 获取移动端状态

		// 顶部操作栏（移动端）搜索表单开关
		const showSearchForm = ref<boolean>(false)
		const toggleSearchForm = () => {
			showSearchForm.value = !showSearchForm.value
		}

		/**
		 * 渲染状态切换开关
		 * @param row 行数据
		 * @returns JSX 元素
		 */
		const renderStatusSwitch = (row: DnsRecordItem) => {
			return (
				<NSwitch
					value={row.state === 0}
					onUpdate:value={() => handleToggleStatus(row)}
					railStyle={({ checked }) => {
						const style = {}
						if (!checked) {
							return {
								background: '#d03050',
							}
						}
						return style
					}}
				/>
			)
		}

		/**
		 * 处理记录状态切换
		 * @param record 记录对象
		 */
		const handleToggleStatus = async (record: DnsRecordItem) => {
			useDialog({
				type: 'warning',
				title: record.state === 0 ? '暂停解析' : '启用解析',
				area: '40',
				content: `${record.state === 0 ? '暂停' : '启用'}该DNS记录,是否继续?`,
				positiveText: '确定',
				negativeText: '取消',
				onPositiveClick: async () => {
					await toggleRecordStatus(record)
					await fetchRecords()
				},
			})
		}

		/**
		 * 处理删除记录
		 * @param recordId 记录ID
		 */
		const eventDeleteRecord = (recordId: number | string) => {
			if (isEditing.value != '' || isAdding.value) {
				message.warning('请先完成当前的编辑操作')
				return
			}
			useDialog({
				type: 'warning',
				title: '删除解析记录',
				area: '40',
				content: '删除DNS记录后将无法恢复，是否继续？',
				positiveText: '确定',
				negativeText: '取消',
				onPositiveClick: async () => {
					await handlDeleteRecord(recordId)
					await fetchRecords()
				},
			})
		}

		/**
		 * 验证所有表单字段
		 * @returns {boolean} 验证结果
		 */
		const validateAllFields = () => {
			const recordType = newRecord.type || 'A'
			// 使用小写的属性名，与 newRecord 定义保持一致
			const fieldsToValidate = ['record', 'value', 'ttl']

			// 如果是MX记录，还需要验证mx优先级（使用小写）
			if (recordType === 'MX') {
				fieldsToValidate.push('mx')
			}

			let isValid = true
			let firstErrorField = ''

			// 验证所有必填字段
			for (const field of fieldsToValidate) {
				// 将字段名转换为验证函数期望的格式（TTL和MX是大写）
				const validationField = field === 'ttl' ? 'TTL' : field === 'mx' ? 'MX' : field
				const validation = validateField(validationField, (newRecord as any)[field], recordType)
				if (!validation.valid) {
					isValid = false
					if (!firstErrorField) {
						firstErrorField = field
					}
					// 显示第一个错误信息
					if (firstErrorField === field) {
						message.error(validation.message)
					}
				}
			}

			// 标记所有字段为已触碰，以便显示验证错误
			fieldsToValidate.forEach((field) => {
				// 模拟字段的blur事件，触发验证状态显示
				const fieldElement = document.querySelector(`[data-field="${field}"] input, [data-field="${field}"] select`)
				if (fieldElement) {
					const event = new Event('blur', { bubbles: true })
					fieldElement.dispatchEvent(event)
				}
			})

			return isValid
		}

		/**
		 * 处理保存记录
		 * @param record 记录对象
		 */
		const eventCreateRecord = async () => {
			// 验证所有字段
			if (!validateAllFields()) {
				return
			}

			await handleCreateRecord()
			await fetchRecords()
			cancelEdit()
		}

		/**
		 * 处理更新记录
		 * @param record 记录对象
		 */
		const eventUpdateRecord = async () => {
			// 验证所有字段
			if (!validateAllFields()) return
			await handleUpdateRecord()
			await fetchRecords()
			cancelEdit()
		}

		/**
		 * 开始添加新记录
		 */
		const handleAdd = () => {
			// 简化域名状态检查，domain-resolve 模块不需要复杂的状态检查
			if (isMobile.value) return openDnsAnalysisDialog()
			// PC端：行内模式（恢复原有逻辑）
			if (isEditing.value != '' || isAdding.value) {
				message.warning('请先完成当前的编辑操作')
				return
			}
			isAdding.value = true
			isEditing.value = ''
			// 重置新增记录表单
			Object.assign(newRecord, {
				record_id: '_adding_',
				record: '',
				type: 'A',
				value: '',
				ttl: 600, // 使用小写的ttl，与newRecord定义保持一致
				mx: 1, // 使用小写的mx，与newRecord定义保持一致
				remark: '',
				viewId: 0,
			})
			dnsRecords.value.unshift({
				record_id: '_adding_',
				recordID: 0,
				record: '',
				type: 'A',
				value: '',
				TTL: 600,
				MX: 1,
				state: 0,
				remark: '',
				viewID: 0,
				domain_id: props.domainId,
				domainID: props.domainId,
				created_at: Math.floor(Date.now() / 1000),
				uid: 0,
			} as any)
			expandedRowKeys.value = ['_adding_']

			// 自动设置悬浮到主机记录字段
			setDefaultHover('_adding_')
		}

		/**
		 * 编辑记录
		 */
		const handleEdit = (row: DnsRecordItem) => {
			// 简化域名状态检查，domain-resolve 模块不需要复杂的状态检查
			if (isMobile.value) return openDnsAnalysisDialog('edit', row)
			if (isEditing.value != '' || isAdding.value) {
				message.warning('请先完成当前的编辑操作')
				return
			}
			isAdding.value = false
			isEditing.value = row.record_id as string
			Object.assign(newRecord, {
				record_id: row.record_id,
				record: row.record,
				type: row.type,
				value: row.value,
				ttl: row.TTL, // 使用小写的ttl，与newRecord定义保持一致
				mx: row.MX, // 使用小写的mx，与newRecord定义保持一致
				remark: row.remark,
				viewId: row.viewID,
			})
			expandedRowKeys.value = [row.record_id]

			// 自动设置悬浮到主机记录字段
			setDefaultHover(row.record_id)
		}

		/**
		 * 取消编辑
		 */
		const cancelEdit = () => {
			if (isAdding.value) dnsRecords.value.splice(0, 1)
			isAdding.value = false
			isEditing.value = ''
			Object.assign(newRecord, {
				record_id: '',
				record: '',
				type: 'A',
				value: '',
				ttl: 600, // 使用小写的ttl，与newRecord定义保持一致
				mx: 0, // 使用小写的mx，与newRecord定义保持一致
				remark: '',
				viewId: 0,
			})
			expandedRowKeys.value = []

			// 清除悬浮状态
			hoveredField.value = null
			hoveredRowId.value = null
		}

		// 新增：悬浮字段状态管理
		const hoveredField = ref<string | null>(null)
		const hoveredRowId = ref<string | null>(null)
		// 延迟清除定时器
		let hoverClearTimer: number | null = null

		/**
		 * 设置默认悬浮到主机记录字段并激活输入框
		 * @param rowId 行ID
		 */
		const setDefaultHover = (rowId: string | number) => {
			nextTick(() => {
				setTimeout(() => {
					hoveredField.value = 'record'
					hoveredRowId.value = String(rowId)

					// 自动激活主机记录输入框
					const recordInput = document.querySelector('[data-field="record"] input') as HTMLInputElement
					if (recordInput) {
						recordInput.focus()
					}
				}, 50)
			})
		}

		/**
		 * 进入编辑字段时，立即显示帮助信息
		 * @param field 字段名
		 * @param rid 行ID
		 */
		const handleFieldEnter = (field: string, rid: string | number) => {
			// 只在编辑模式下触发悬浮提示
			if (isEditing.value === rid || rid === '_adding_') {
				if (hoverClearTimer) {
					clearTimeout(hoverClearTimer)
					hoverClearTimer = null
				}
				hoveredField.value = field
				hoveredRowId.value = String(rid)
			}
		}

		/**
		 * 离开编辑字段时，在编辑模式下不清除悬浮内容
		 * @param rid 行ID
		 */
		const handleFieldLeave = (rid: string | number) => {
			// 在编辑模式下，离开字段时不清除悬浮内容
			if (isEditing.value === rid || rid === '_adding_') {
				return // 保持悬浮内容显示
			}

			// 非编辑模式下正常清除
			if (hoverClearTimer) clearTimeout(hoverClearTimer)
			hoverClearTimer = setTimeout(() => {
				// 检查鼠标是否在帮助面板区域内
				const helpPanel = document.querySelector('.help-panel')
				if (helpPanel && helpPanel.matches(':hover')) {
					// 如果鼠标在帮助面板内，不清除悬浮内容
					return
				}
				if (hoveredRowId.value === rid) {
					hoveredField.value = null
				}
				hoverClearTimer = null
			}, 250)
		}

		/**
		 * 右侧帮助面板鼠标进入事件
		 */
		const handleHelpEnter = () => {
			if (hoverClearTimer) {
				clearTimeout(hoverClearTimer)
				hoverClearTimer = null
			}
		}

		/**
		 * 右侧帮助面板鼠标离开事件
		 */
		const handleHelpLeave = () => {
			// 在编辑模式下，不因为离开帮助面板而清除悬浮内容
			if ((isEditing.value && hoveredRowId.value === isEditing.value) || hoveredRowId.value === '_adding_') {
				return
			}

			// 检查鼠标是否移动到了其他字段
			const activeElement = document.activeElement
			const isInEditableField = activeElement && activeElement.closest('.editable-cell')

			if (isInEditableField) {
				// 如果鼠标移动到了其他可编辑字段，不清除悬浮内容
				return
			}

			if (hoverClearTimer) clearTimeout(hoverClearTimer)
			hoverClearTimer = setTimeout(() => {
				hoveredField.value = null
				hoverClearTimer = null
			}, 150)
		}

		/**
		 * 处理点击帮助示例选项，自动填充到对应输入框
		 * @param field 字段名
		 * @param value 要填充的值
		 */
		const handleExampleClick = (field: string, value: string) => {
			// 只在编辑模式下允许填充
			if (!isEditing.value && !isAdding.value) {
				return
			}

			// 填充到对应字段
			if (field === 'record') {
				;(newRecord as any)[field] = value

				// 自动聚焦到输入框
				nextTick(() => {
					const recordInput = document.querySelector('[data-field="record"] input') as HTMLInputElement
					if (recordInput) {
						recordInput.focus()
						// 将光标移到末尾
						recordInput.setSelectionRange(value.length, value.length)
					}
				})
			}
		}

		/**
		 * 验证表单字段
		 * @param field 字段名
		 * @param value 字段值
		 * @param type 记录类型
		 * @returns 验证结果 {valid: boolean, message: string}
		 */
		const validateField = (field: string, value: any, type: string = 'A') => {
			// 默认验证通过
			const result = { valid: true, message: '' }

			if (field === 'record') {
				// 主机记录验证
				if (!value && value !== '@' && value !== '*') {
					result.valid = false
					result.message = '主机记录不能为空'
				} else if (/^https?:\/\//.test(value)) {
					result.valid = false
					result.message = '主机记录不能包含协议前缀(http://)'
				}
			} else if (field === 'value') {
				// 记录值验证，根据不同类型有不同规则
				if (!value) {
					result.valid = false
					result.message = '记录值不能为空'
				} else if (type === 'A') {
					// IPv4地址验证
					const ipv4Regex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
					if (!ipv4Regex.test(value)) {
						result.valid = false
						result.message = '请输入有效的IPv4地址'
					}
				} else if (type === 'AAAA') {
					// IPv6地址验证 (简化版)
					const ipv6Regex =
						/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$|^:([0-9a-fA-F]{1,4}:){1,6}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/
					if (!ipv6Regex.test(value)) {
						result.valid = false
						result.message = '请输入有效的IPv6地址'
					}
				} else if (type === 'CNAME' || type === 'MX' || type === 'NS') {
					// 域名验证
					const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
					if (!domainRegex.test(value) && value !== '@') {
						result.valid = false
						result.message = '请输入有效的域名格式'
					}
				}
			} else if (field === 'ttl') {
				// TTL验证
				if (!value || value < 1) {
					result.valid = false
					result.message = 'TTL必须大于0'
				}
			} else if (field === 'mx' && type === 'MX') {
				// MX优先级验证
				if (value === null || value === undefined || value < 0 || value > 100) {
					result.valid = false
					result.message = 'MX优先级必须在0-100之间'
				}
			}

			return result
		}

		/**
		 * 渲染可编辑单元格 - TSX 版本
		 * @param value 值
		 * @param row 行数据
		 * @param field 字段名
		 * @param type 组件类型
		 * @param options 选项（用于select）
		 * @returns JSX 元素
		 */
		const renderEditableCell = (
			value: any,
			row: DnsRecordItem,
			field: keyof DnsRecordForm,
			type: 'input' | 'select' | 'number' | 'cascader' = 'input',
			options?: SelectOption[] | CascaderOption[],
		) => {
			if (row.record_id === '_adding_' || isEditing.value === row.record_id) {
				// 获取当前记录类型，用于验证
				const currentRecordType = (newRecord as any)['type'] || 'A'

				// 字段验证状态 - 默认不验证，只在触发后验证
				const fieldValidationState = ref({
					valid: true,
					message: '',
					touched: false,
				})

				// 验证字段函数 - 仅在触发后验证
				const validateCurrentField = () => {
					console.log(newRecord)
					fieldValidationState.value.touched = true
					// 将字段名转换为验证函数期望的格式（TTL和MX是大写）
					const validationField = field === 'ttl' ? 'TTL' : field === 'mx' ? 'MX' : (field as string)
					const validation = validateField(validationField, (newRecord as any)[field], currentRecordType)
					fieldValidationState.value.valid = validation.valid
					fieldValidationState.value.message = validation.message
					return validation
				}

				// 新增行
				if (type === 'select') {
					return (
						<div
							class="editable-cell"
							data-field={field}
							onMouseenter={() => handleFieldEnter(field as string, row.record_id)}
							onMouseleave={() => handleFieldLeave(row.record_id)}
						>
							<NSelect
								value={(newRecord as any)[field]}
								options={(options as SelectOption[]) || []}
								status={fieldValidationState.value.touched && !fieldValidationState.value.valid ? 'error' : undefined}
								onUpdateValue={(val: any) => {
									;(newRecord as any)[field] = val
									// 如果是记录类型字段变更，需要重新验证记录值
									if (field === 'type' && (newRecord as any)['value']) {
										// 清空验证错误状态，让用户重新输入符合新类型的值
										const valueValidation = validateField('value', (newRecord as any)['value'], val)
										if (!valueValidation.valid) {
											message.warning(`记录类型已更改为${val}，请确保记录值符合${val}类型的格式要求`)
										}
									}
									// 选择后立即验证
									validateCurrentField()
								}}
								onBlur={validateCurrentField}
							/>
							{fieldValidationState.value.touched && !fieldValidationState.value.valid && (
								<div class="text-red-500 text-xs mt-1">{fieldValidationState.value.message}</div>
							)}
						</div>
					)
				} else if (type === 'cascader') {
					return (
						<div
							class="editable-cell"
							data-field={field}
							onMouseenter={() => handleFieldEnter(field as string, row.record_id)}
							onMouseleave={() => handleFieldLeave(row.record_id)}
						>
							<NCascader
								value={(newRecord as any)[field]}
								expandTrigger="hover"
								options={(options as CascaderOption[]) || []}
								status={fieldValidationState.value.touched && !fieldValidationState.value.valid ? 'error' : undefined}
								onUpdateValue={(val: any) => {
									;(newRecord as any)[field] = val
									// 选择后立即验证
									validateCurrentField()
								}}
								onBlur={validateCurrentField}
							/>
							{fieldValidationState.value.touched && !fieldValidationState.value.valid && (
								<div class="text-red-500 text-xs mt-1">{fieldValidationState.value.message}</div>
							)}
						</div>
					)
				} else if (type === 'number') {
					return (
						<div
							class="editable-cell"
							data-field={field}
							onMouseenter={() => handleFieldEnter(field as string, row.record_id)}
							onMouseleave={() => handleFieldLeave(row.record_id)}
						>
							<NInputNumber
								value={(newRecord as any)[field]}
								min={field === 'ttl' ? 1 : 0}
								max={field === 'ttl' ? undefined : 100}
								showButton={false}
								style="width: 100%"
								status={fieldValidationState.value.touched && !fieldValidationState.value.valid ? 'error' : undefined}
								onUpdateValue={(val: any) => {
									;(newRecord as any)[field] = val
								}}
								onBlur={validateCurrentField}
							/>
							{fieldValidationState.value.touched && !fieldValidationState.value.valid && (
								<div class="text-red-500 text-xs mt-1">{fieldValidationState.value.message}</div>
							)}
						</div>
					)
				} else {
					return (
						<div
							class="editable-cell"
							data-field={field}
							onMouseenter={() => handleFieldEnter(field as string, row.record_id)}
							onMouseleave={() => handleFieldLeave(row.record_id)}
						>
							<NInput
								value={(newRecord as any)[field] || ''}
								placeholder={field === 'record' ? '@ / www / mail / *' : '请输入'}
								status={fieldValidationState.value.touched && !fieldValidationState.value.valid ? 'error' : undefined}
								onUpdateValue={(val: string) => {
									;(newRecord as any)[field] = val
								}}
								onBlur={validateCurrentField}
							/>
							{fieldValidationState.value.touched && !fieldValidationState.value.valid && (
								<div class="text-red-500 text-xs mt-1">{fieldValidationState.value.message}</div>
							)}
						</div>
					)
				}
			} else {
				// 普通显示
				if (field === 'record') {
					return <NText code>{value}</NText>
				} else if (field === 'type') {
					return (
						<NTag type="info" size="small" bordered={false}>
							{value}
						</NTag>
					)
				} else if (field === 'value') {
					return <NEllipsis style="max-width: 200px">{value}</NEllipsis>
				} else if (field === 'mx') {
					return value ?? '-'
				} else if (field === 'viewId') {
					return viewsOptions.value.find((item: any) => item.value === row.viewID)?.label ?? '-'
				} else {
					return value
				}
			}
		}

		/**
		 * @description 处理分析搜索
		 * @param field 字段
		 * @param recordId 记录ID
		 * @returns
		 */
		const handleAnalysisSearch = () => {
			if (isAdding.value || isEditing.value !== '') {
				message.warning('正在编辑/添加记录，请先保存后搜索')
				return
			}
			fetchRecords()
		}

		/**
		 * 渲染展开行 - TSX 版本
		 * @param rowData 行数据
		 * @returns JSX 元素
		 */
		const renderExpand = (rowData: DnsRecordItem) => {
			if (!(isEditing.value !== rowData.record_id || rowData.record_id !== '_adding_')) {
				return null
			}

			// 获取当前悬浮字段的帮助信息
			const hoveredHelpInfo = hoveredField.value ? getFieldHelpInfo(hoveredField.value, newRecord.type) : null

			return (
				<div class="rounded-lg my-2">
					{/* 编辑预览区域 */}
					<div class="flex flex-col gap-4">
						{/* 帮助信息：在有内容时占据100%宽度 */}
						{hoveredHelpInfo ? (
							<div class="w-full help-panel" onMouseenter={handleHelpEnter} onMouseleave={handleHelpLeave}>
								<div class="ml-4 mb-2 text-sm font-semibold text-slate-800 flex items-center gap-2">
									{/* 移除图标，仅显示标题 */}
									<span>{hoveredHelpInfo.title}</span>
								</div>
								<div class="bg-white p-4 rounded-md border border-gray-200 w-full box-border">
									{/* 描述 */}
									<p class="m-0 mb-3 text-[13px] text-gray-700 leading-relaxed">{hoveredHelpInfo.description}</p>

									{/* 示例 */}
									{hoveredHelpInfo.examples.length > 0 && (
										<div class="mb-3">
											{hoveredHelpInfo.examples.map((example: any, index: number) => (
												<div
													key={index}
													class="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded mb-1 text-[11px] overflow-x-auto cursor-pointer hover:bg-blue-50 transition-colors duration-200"
													onClick={() => handleExampleClick(hoveredField.value!, example.value)}
												>
													{/* 移除每行示例图标 */}
													<code class="bg-gray-200 px-1 py-0.5 rounded font-mono text-slate-800 whitespace-pre-wrap break-all">
														{example.value}
													</code>
													<span class="text-gray-500">- {example.desc}</span>
													{example.detail && <span class="text-gray-400 text-[10px]">({example.detail})</span>}
												</div>
											))}
										</div>
									)}

									{/* 提示 */}
									{hoveredHelpInfo.tips && (
										<div class="px-3 py-2 bg-red-50 border-l-4 border-red-500 rounded text-[11px] text-slate-800 leading-tight">
											<span class="font-medium">提示：</span>
											<span>{hoveredHelpInfo.tips}</span>
										</div>
									)}
								</div>
							</div>
						) : (
							''
						)}
					</div>
				</div>
			)
		}

		/**
		 * 创建操作按钮 - TSX 版本
		 * @param row 行数据
		 * @returns JSX 元素
		 */
		const createActions = (row: DnsRecordItem) => {
			if (row.record_id === '_adding_') {
				return (
					<NSpace size="small" class="flex !justify-end">
						<NButton size="small" type="primary" ghost onClick={eventCreateRecord}>
							保存
						</NButton>
						<NButton size="small" ghost onClick={cancelEdit}>
							取消
						</NButton>
					</NSpace>
				)
			}

			if (isEditing.value === row.record_id) {
				return (
					<NSpace size="small" class="flex !justify-end">
						<NButton size="small" type="primary" ghost onClick={eventUpdateRecord}>
							保存
						</NButton>
						<NButton size="small" ghost onClick={cancelEdit}>
							取消
						</NButton>
					</NSpace>
				)
			}

			return (
				<NSpace size="small" class="flex !justify-end">
					<NButton size="small" ghost onClick={() => handleEdit(row)}>
						编辑
					</NButton>
					<NButton size="small" type="error" ghost onClick={() => eventDeleteRecord(row.record_id)}>
						删除
					</NButton>
				</NSpace>
			)
		}

		/** 定义列配置 */
		const columns: DataTableColumns<DnsRecordItem> = [
			{
				type: 'expand',
				expandable: (row: DnsRecordItem) => {
					return isEditing.value === row.record_id || row.record_id === '_adding_'
				},
				renderExpand,
			},
			{
				title: '主机记录',
				key: 'record',
				minWidth: 162,
				render: (row: DnsRecordItem) => renderEditableCell(row.record, row, 'record'),
			},
			{
				title: '记录类型',
				key: 'type',
				width: 120,
				render: (row: DnsRecordItem) => renderEditableCell(row.type, row, 'type', 'select', recordTypesOptions.value),
			},
			{
				title: '线路类型',
				key: 'viewId',
				width: 108,
				render: (row: DnsRecordItem) => renderEditableCell(row.viewID, row, 'viewId', 'cascader', viewsOptions.value),
			},
			{
				title: '记录值',
				key: 'value',
				minWidth: 216,
				ellipsis: {
					tooltip: true,
				},
				render: (row: DnsRecordItem) => renderEditableCell(row.value, row, 'value'),
			},
			{
				title: 'MX/权重',
				key: 'mx',
				width: 108,
				render: (row: DnsRecordItem) => renderEditableCell(row.MX, row, 'mx', 'number'),
			},
			{
				title: 'TTL',
				key: 'ttl',
				width: 108,
				render: (row: DnsRecordItem) => renderEditableCell(row.TTL, row, 'ttl', 'number'),
			},
			{
				title: '状态',
				key: 'state',
				width: 80,
				render: (row: DnsRecordItem) =>
					row.record_id === '_adding_' || isEditing.value === row.record_id ? '-' : renderStatusSwitch(row),
			},
			{
				title: '备注',
				key: 'remark',
				minWidth: 108,
				ellipsis: { tooltip: true },
				render: (row: DnsRecordItem) => renderEditableCell(row.remark ?? '', row, 'remark'),
			},
			{
				title: '操作',
				key: 'actions',
				width: 130,
				fixed: 'right',
				align: 'right',
				render: createActions,
			},
		]

		/**
		 * 移动端卡片列表
		 */
		const DnsRecordCardList = defineComponent({
			name: 'DnsRecordCardList',
			props: {
				data: { type: Array as () => DnsRecordItem[], default: () => [] },
				loading: { type: Boolean, default: false },
			},
			setup(cardProps) {
				const getViewLabel = (viewID?: number) =>
					viewsOptions.value.find((item: any) => item.value === (viewID as any))?.label ?? '-'
				return () => (
					<div class="gap-[16px] flex flex-col">
						{(cardProps.data || []).map((row: DnsRecordItem) => (
							<NCard key={row.record_id as any} bordered={true}>
								<NFlex vertical size="small">
									<NFlex align="center" justify="space-between">
										<NFlex align="center" size="small">
											<NTag type="info" bordered={false} size="small">
												{row.type}
											</NTag>
											<NText code>{row.record}</NText>
										</NFlex>
										<NTag size="small" type={row.state === 0 ? 'success' : 'warning'} bordered={false}>
											{row.state === 0 ? '启用' : '暂停'}
										</NTag>
									</NFlex>
									<NFlex class="text-sm text-gray-700" vertical>
										<div class="flex">
											<span class="text-gray-500">记录值：</span>
											<NEllipsis class="flex-1">{row.value}</NEllipsis>
										</div>
										<NFlex justify="space-between">
											<div class="flex">
												<span class="text-gray-500">TTL：</span>
												{String((row as any).TTL ?? '-')}
											</div>
											<div class="flex">
												<span class="text-gray-500">线路：</span>
												{getViewLabel((row as any).viewID)}
											</div>
										</NFlex>
										{row.remark && <div class="text-xs text-gray-500">备注：{row.remark}</div>}
									</NFlex>
									<NFlex justify="end" size="small">
										<NButton size="small" ghost onClick={() => handleEdit(row)}>
											编辑
										</NButton>
										<NButton size="small" type="error" ghost onClick={() => eventDeleteRecord(row.record_id)}>
											删除
										</NButton>
										<NButton
											size="small"
											type={row.state === 0 ? 'warning' : 'success'}
											ghost
											onClick={() => handleToggleStatus(row)}
										>
											{row.state === 0 ? '暂停' : '启用'}
										</NButton>
									</NFlex>
								</NFlex>
							</NCard>
						))}
					</div>
				)
			},
		})

		// 返回渲染函数
		return () => (
			<div class="dns-analysis-container">
				{/* 操作栏 */}
				<div class="flex items-center mt-2 mb-4">
					{isMobile.value ? (
						<NFlex vertical class="w-full" size="medium">
							<NFlex justify="space-between" align="center">
								<NButton type="primary" onClick={handleAdd}>
									添加记录
								</NButton>
								<NButton onClick={toggleSearchForm} class="search-toggle-btn">
									{showSearchForm.value ? (
										<>
											<NIcon size="18">
												<CloseOutline />
											</NIcon>
											<span>关闭</span>
										</>
									) : (
										<>
											<NIcon size="18">
												<SearchOutline />
											</NIcon>
											<span>搜索</span>
										</>
									)}
								</NButton>
							</NFlex>
							{showSearchForm.value && (
								<>
									<NDivider class="!my-2" dashed />
									<div class="mobile-search-form">
										<FilterForm inline={false} />
									</div>
								</>
							)}
						</NFlex>
					) : (
						<NFlex justify="space-between" class="w-full">
							<NSpace>
								<NButton type="primary" onClick={handleAdd}>
									添加记录
								</NButton>
							</NSpace>
							<NSpace class="flex-1 justify-end">
								<FilterForm inline={true} />
							</NSpace>
						</NFlex>
					)}
				</div>

				{/* 内容：移动端卡片 / 桌面端表格 */}
				{isMobile.value ? (
					<>
						<DnsRecordCardList data={dnsRecords.value as any} loading={isLoading.value} />
						<NFlex justify="center" class="mt-4">
							<NPagination
								page={recordListParams.value.p}
								page-size={recordListParams.value.row}
								item-count={(pagination.value as any)?.itemCount || 0}
								show-size-picker
								page-sizes={[10, 20, 50, 100]}
								show-quick-jumper
								prefix={() => `共 ${(pagination.value as any)?.itemCount || 0} 条`}
								onUpdate:page={(page: number) => {
									recordListParams.value.p = page
									fetchRecords()
								}}
								onUpdate:pageSize={(size: number) => {
									recordListParams.value.row = size
									recordListParams.value.p = 1 // 重置到第一页
									fetchRecords()
								}}
							/>
						</NFlex>
					</>
				) : (
					<>
						<NDataTable
							loading={isLoading.value}
							columns={columns}
							expandedRowKeys={expandedRowKeys.value}
							data={dnsRecords.value}
							rowKey={(row) => row.record_id}
						/>
						<NFlex justify="end" class="mt-4">
							<NPagination
								page={recordListParams.value.p}
								page-size={recordListParams.value.row}
								item-count={(pagination.value as any)?.itemCount || 0}
								show-size-picker
								page-sizes={[10, 20, 50, 100]}
								prefix={() => `共 ${(pagination.value as any)?.itemCount || 0} 条`}
								onUpdate:page={(page: number) => {
									recordListParams.value.p = page
									fetchRecords()
								}}
								onUpdate:pageSize={(size: number) => {
									recordListParams.value.row = size
									recordListParams.value.p = 1 // 重置到第一页
									fetchRecords()
								}}
							/>
						</NFlex>
					</>
				)}
			</div>
		)
	},
})
