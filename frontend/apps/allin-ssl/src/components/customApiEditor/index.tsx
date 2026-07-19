import { defineComponent, ref, type PropType } from 'vue'
import {
	NFormItem,
	NInput,
	NInputNumber,
	NSelect,
	NButton,
	NGrid,
	NFormItemGi,
	NTabs,
	NTabPane,
	NTag,
	NSpace,
	NText,
	NDynamicInput,
	NRadioGroup,
	NRadioButton,
	NCollapse,
	NCollapseItem,
	NPopover,
	NCheckbox,
} from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import type { CustomApiStep, CustomApiVariable } from '@/types/setting'

/** 自定义API配置（可复用部分：变量 + 多步请求） */
export interface CustomApiEditorValue {
	variables: CustomApiVariable[]
	steps: CustomApiStep[]
}

/** 内置变量说明项 */
export interface CustomApiSystemVar {
	label: string
	value: string
}

const operatorOptions = [
	{ label: '相等', value: 'eq' },
	{ label: '不相等', value: 'ne' },
	{ label: '包含', value: 'contains' },
	{ label: '不包含', value: 'not_contains' },
	{ label: '大于', value: 'gt' },
	{ label: '小于', value: 'lt' },
]

const methodOptions = [
	{ label: 'GET', value: 'GET' },
	{ label: 'POST', value: 'POST' },
]

/** 公式函数说明项 */
interface FormulaFn {
	/** 函数名（列表展示用） */
	label: string
	/** 点击插入的写法示例 */
	value: string
	/** 一句话说明（签名、输出格式、注意事项） */
	desc: string
}

/** 公式分组（「全部公式」选择器用） */
const formulaGroups: Array<{ name: string; fns: FormulaFn[] }> = [
	{
		name: '摘要',
		fns: [
			{ label: 'MD5', value: 'md5("文本")', desc: 'md5(文本) → hex 摘要' },
			{ label: 'SHA1', value: 'sha1("文本")', desc: 'sha1(文本) → hex 摘要' },
			{ label: 'SHA256', value: 'sha256("文本")', desc: 'sha256(文本) → hex 摘要' },
			{ label: 'SHA512', value: 'sha512("文本")', desc: 'sha512(文本) → hex 摘要' },
		],
	},
	{
		name: '签名',
		fns: [
			{ label: 'HMAC-MD5', value: 'hmac_md5("密钥", "文本")', desc: 'hmac_md5(密钥, 文本) → hex 签名' },
			{ label: 'HMAC-SHA1', value: 'hmac_sha1("密钥", "文本")', desc: 'hmac_sha1(密钥, 文本) → hex 签名' },
			{ label: 'HMAC-SHA256', value: 'hmac_sha256("密钥", "文本")', desc: 'hmac_sha256(密钥, 文本) → hex 签名' },
			{ label: 'HMAC-SHA512', value: 'hmac_sha512("密钥", "文本")', desc: 'hmac_sha512(密钥, 文本) → hex 签名' },
			{ label: 'HMAC-SHA256(Base64)', value: 'base64(hmac_sha256_raw("密钥", "文本"))', desc: 'HMAC-SHA256 签名 → base64 输出（钉钉/阿里云风格）' },
			{ label: 'RSA-SHA256签名', value: 'rsa_sha256("私钥PEM", "文本")', desc: 'rsa_sha256(私钥, 文本) → base64 签名（支付宝 RSA2）' },
			{ label: 'RSA-SHA1签名', value: 'rsa_sha1("私钥PEM", "文本")', desc: 'rsa_sha1(私钥, 文本) → base64 签名' },
			{ label: 'RSA签名(通用)', value: 'rsa_sign("私钥PEM", "sha256", "文本")', desc: 'rsa_sign(私钥, 算法, 文本)，算法：md5/sha1/sha256/sha512；hex 输出用 hex(rsa_sign_raw(...))' },
		],
	},
	{
		name: '加解密',
		fns: [
			{ label: 'AES-CBC加密', value: 'aes_cbc_enc("16/24/32字节密钥", "16字节IV", "明文")', desc: 'aes_cbc_enc(密钥, IV, 明文) → base64' },
			{ label: 'AES-CBC解密', value: 'aes_cbc_dec("密钥", "IV", "密文base64")', desc: 'aes_cbc_dec(密钥, IV, 密文base64) → 明文' },
			{ label: 'AES-ECB加密', value: 'aes_ecb_enc("密钥", "明文")', desc: 'aes_ecb_enc(密钥, 明文) → base64' },
			{ label: 'AES-ECB解密', value: 'aes_ecb_dec("密钥", "密文base64")', desc: 'aes_ecb_dec(密钥, 密文base64) → 明文' },
			{ label: 'RSA加密', value: 'rsa_enc("公钥PEM", "明文")', desc: 'rsa_enc(公钥, 明文) → base64（公钥也可以是证书）' },
			{ label: 'RSA解密', value: 'rsa_dec("私钥PEM", "密文base64")', desc: 'rsa_dec(私钥, 密文base64) → 明文' },
		],
	},
	{
		name: '国密',
		fns: [
			{ label: 'SM3摘要', value: 'sm3("文本")', desc: 'sm3(文本) → hex 摘要（国密）' },
			{ label: 'HMAC-SM3', value: 'hmac_sm3("密钥", "文本")', desc: 'hmac_sm3(密钥, 文本) → hex 签名（国密）' },
			{ label: 'SM2签名', value: 'sm2_sign("私钥PEM", "文本")', desc: 'sm2_sign(私钥, 文本) → base64 签名（国密）' },
			{ label: 'SM2加密', value: 'sm2_enc("公钥PEM", "明文")', desc: 'sm2_enc(公钥, 明文) → base64（国密）' },
			{ label: 'SM2解密', value: 'sm2_dec("私钥PEM", "密文base64")', desc: 'sm2_dec(私钥, 密文base64) → 明文（国密）' },
			{ label: 'SM4-CBC加密', value: 'sm4_cbc_enc("16字节密钥", "16字节IV", "明文")', desc: 'sm4_cbc_enc(密钥, IV, 明文) → base64（国密）' },
			{ label: 'SM4-CBC解密', value: 'sm4_cbc_dec("密钥", "IV", "密文base64")', desc: 'sm4_cbc_dec(密钥, IV, 密文base64) → 明文（国密）' },
			{ label: 'SM4-ECB加密', value: 'sm4_ecb_enc("密钥", "明文")', desc: 'sm4_ecb_enc(密钥, 明文) → base64（国密）' },
			{ label: 'SM4-ECB解密', value: 'sm4_ecb_dec("密钥", "密文base64")', desc: 'sm4_ecb_dec(密钥, 密文base64) → 明文（国密）' },
		],
	},
	{
		name: '编码',
		fns: [
			{ label: 'Base64', value: 'base64("文本")', desc: 'base64(文本) → base64 编码' },
			{ label: 'Base64解码', value: 'base64_decode("文本")', desc: 'base64_decode(密文) → 原文' },
			{ label: 'Hex', value: 'hex("文本")', desc: 'hex(文本) → hex 编码' },
			{ label: 'Hex解码', value: 'hex_decode("文本")', desc: 'hex_decode(hex) → 原文' },
			{ label: 'URL编码', value: 'urlencode("文本")', desc: 'urlencode(文本) → URL 编码（参数拼接用）' },
			{ label: 'URL解码', value: 'urldecode("文本")', desc: 'urldecode(文本) → 原文' },
			{ label: 'JSON转义', value: 'json_escape("文本")', desc: 'json_escape(文本) → 转义后可嵌入 JSON 字符串（PEM 入 JSON body 用）' },
		],
	},
	{
		name: '字符串',
		fns: [
			{ label: '拼接', value: 'concat("a", "b")', desc: 'concat(任意多个参数) → 顺序拼接' },
			{ label: '大写', value: 'upper("文本")', desc: 'upper(文本) → 全大写' },
			{ label: '小写', value: 'lower("文本")', desc: 'lower(文本) → 全小写' },
			{ label: '替换', value: 'replace("文本", "旧", "新")', desc: 'replace(文本, 旧串, 新串) → 全部替换' },
			{ label: '去空白', value: 'trim("文本")', desc: 'trim(文本) → 去除首尾空白' },
			{ label: '截取', value: 'substr("文本", "0", "10")', desc: 'substr(文本, 起始, 长度)，长度 -1 表示到结尾' },
			{ label: '长度', value: 'len("文本")', desc: 'len(文本) → 字符数' },
			{ label: '分割取值', value: 'split("a,b,c", ",", "1")', desc: 'split(文本, 分隔符, 下标) → 第 N 段' },
			{ label: '正则提取', value: 'regex("文本", "token=(\\w+)")', desc: 'regex(文本, 正则) → 首个捕获组或整体匹配' },
		],
	},
	{
		name: '逻辑',
		fns: [
			{ label: '包含', value: 'contains("文本", "子串")', desc: 'contains(文本, 子串) → true/false' },
			{ label: '相等', value: 'eq("a", "b")', desc: 'eq(a, b) → true/false' },
			{ label: '条件', value: 'if(eq("a", "b"), "是", "否")', desc: 'if(条件, 真值, 假值)，条件可嵌 eq/contains 等' },
		],
	},
	{
		name: '时间 / 随机 / 运算',
		fns: [
			{ label: '时间戳', value: 'timestamp()', desc: 'timestamp() → 秒级时间戳' },
			{ label: '毫秒时间戳', value: 'timestamp_ms()', desc: 'timestamp_ms() → 毫秒级时间戳' },
			{ label: '日期', value: 'date("yyyy-MM-dd HH:mm:ss")', desc: 'date(格式) → 当前时间，支持 yyyy/MM/dd/HH/mm/ss' },
			{ label: 'UUID', value: 'uuid()', desc: 'uuid() → 随机 UUID' },
			{ label: '随机字符串', value: 'rand_string("16")', desc: 'rand_string(长度) → 字母数字随机串' },
			{ label: '加法', value: 'add("1", "2")', desc: 'add/sub/mul/div/mod(a, b) → 整数运算' },
		],
	},
]

/** 高频公式（直接平铺的快捷标签） */
const quickFormulas: FormulaFn[] = [
	formulaGroups[0]!.fns[0]!, // MD5
	formulaGroups[0]!.fns[2]!, // SHA256
	formulaGroups[1]!.fns[2]!, // HMAC-SHA256
	formulaGroups[4]!.fns[0]!, // Base64
	formulaGroups[5]!.fns[0]!, // 拼接
	formulaGroups[7]!.fns[0]!, // 时间戳
]

export const createCustomApiStep = (name: string): CustomApiStep => ({
	name,
	method: 'GET',
	url: '',
	timeout: 15,
	headers: [],
	params: [],
	cookies: [],
	body: '',
	variables: [],
	response: {
		format: 'json',
		success_code: 200,
		condition: { field: '', operator: 'eq', value: '' },
		extracts: [],
	},
})

/** 按用途筛选自定义HTTP(S)提供方（config 中无 usage 的旧数据任意用途都可见） */
export const matchCustomApiUsage = (configStr: string, usage: 'cert' | 'host' | 'notify'): boolean => {
	try {
		const u = JSON.parse(configStr || '{}').usage
		return !u || u === usage
	} catch {
		return true
	}
}

/**
 * 自定义API配置编辑器（公共组件）
 * @description 多步HTTP请求 + 变量公式的通用编辑器，供通知渠道、部署等多个使用方复用。
 * 直接就地修改 value（父组件持有同一对象引用），表单校验路径为 steps[i].xxx / variables[i].xxx，
 * 需要校验时由父组件在外层包裹 NForm。
 */
export default defineComponent({
	name: 'CustomApiEditor',
	props: {
		value: {
			type: Object as PropType<CustomApiEditorValue>,
			required: true,
		},
		/** 各使用方自己的系统内置变量（点击复制） */
		systemVars: {
			type: Array as PropType<CustomApiSystemVar[]>,
			default: () => [],
		},
		/** 响应参数「本地变量名」的建议项（如证书场景的 cert/key/issuer_cert），为空则纯文本输入 */
		extractSuggestions: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
	},
	setup(props) {
		const activeStep = ref(0)
		const message = useMessage()
		// 当前聚焦的公式输入位置（步骤变量行/预处理变量行），含记录的光标位置
		const activeVarFocus = ref<{
			kind: 'step' | 'pre'
			step: number
			row: number
			el: HTMLInputElement | null
			start: number
			end: number
		} | null>(null)

		// 「全部公式」选择器的搜索过滤
		const formulaSearch = ref('')
		const filteredFormulaGroups = computed(() => {
			const kw = formulaSearch.value.trim().toLowerCase()
			if (!kw) {
				return formulaGroups
			}
			return formulaGroups
				.map((g) => ({
					name: g.name,
					fns: g.fns.filter((fn) => `${fn.label} ${fn.value} ${fn.desc}`.toLowerCase().includes(kw)),
				}))
				.filter((g) => g.fns.length > 0)
		})

		// 复制文本（兼容非 HTTPS 环境下 clipboard API 不可用的情况）并给出反馈
		const copyText = async (text: string) => {
			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text)
				} else {
					const ta = document.createElement('textarea')
					ta.value = text
					ta.style.position = 'fixed'
					ta.style.opacity = '0'
					document.body.appendChild(ta)
					ta.select()
					document.execCommand('copy')
					document.body.removeChild(ta)
				}
				message.success(`已复制：${text}`)
			} catch {
				message.warning(`复制失败，请手动复制：${text}`)
			}
		}

		// 在光标/选区处插入文本（可嵌套组合），无输入框时追加到末尾
		const insertAtCursor = (
			text: string,
			get: () => string,
			set: (v: string) => void,
			focus: { el: HTMLInputElement | null; start: number; end: number } | null,
		) => {
			const cur = get() || ''
			if (focus?.el) {
				const start = Math.min(focus.start, cur.length)
				const end = Math.min(focus.end, cur.length)
				set(cur.slice(0, start) + text + cur.slice(end))
				nextTick(() => {
					focus.el!.focus()
					const pos = start + text.length
					focus.el!.setSelectionRange(pos, pos)
				})
			} else {
				set(cur + text)
			}
		}

		// 记录公式输入框的聚焦位置与光标（focus/click/keyup 时更新，插入时按此位置）
		const trackFocus = (kind: 'step' | 'pre', step: number, row: number, e: Event) => {
			const el = e.target as HTMLInputElement
			activeVarFocus.value = {
				kind,
				step,
				row,
				el,
				start: el.selectionStart ?? 0,
				end: el.selectionEnd ?? 0,
			}
		}

		// 在指定步骤的变量列表中插入公式；没有变量行时自动新增一行
		const insertFormula = (formula: string, vars: CustomApiVariable[], stepIndex: number, kind: 'step' | 'pre') => {
			if (vars.length === 0) {
				vars.push({ name: '', formula, process: kind === 'pre' })
				return
			}
			const focus = activeVarFocus.value
			const idx =
				focus && focus.kind === kind && focus.step === stepIndex && focus.row < vars.length
					? focus.row
					: vars.length - 1
			const row = vars[idx]
			if (!row) {
				return
			}
			const el = focus && focus.kind === kind && focus.step === stepIndex && focus.row === idx ? focus : null
			insertAtCursor(formula, () => row.formula || '', (v) => (row.formula = v), el)
		}

		const addStep = () => {
			// 生成不重复的步骤名（步骤名会用于 {{步骤名.变量}} 引用）
			let n = props.value.steps.length + 1
			while (props.value.steps.some((s) => s.name === `step${n}`)) {
				n++
			}
			props.value.steps.push(createCustomApiStep(`step${n}`))
			activeStep.value = props.value.steps.length - 1
		}

		const removeStep = (index: number) => {
			props.value.steps.splice(index, 1)
			if (activeStep.value >= props.value.steps.length) {
				activeStep.value = Math.max(0, props.value.steps.length - 1)
			}
		}

		const renderKeyValue = (step: CustomApiStep, field: 'headers' | 'params' | 'cookies', title: string) => {
			return (
				<div class="mb-4">
					<div class="text-gray-700 font-medium mb-2">{title}</div>
					<NDynamicInput
						v-model:value={step[field]}
						preset="pair"
						key-placeholder="字段(Key)"
						value-placeholder="值(Value)"
						min={0}
					/>
				</div>
			)
		}

		// 常用公式助手（快捷标签 + 「全部公式」选择器），onInsert 为点击插入回调
		const renderFormulaHelpers = (onInsert: (value: string) => void) => {
			return (
				<div class="flex items-center gap-2 flex-wrap mt-2 mb-1">
					<span class="text-gray-500 text-sm">常用公式：</span>
					{quickFormulas.map((h) => (
						<span
							key={h.value}
							title={h.desc}
							class="cursor-pointer inline-block"
							onClick={() => onInsert(h.value)}
						>
							<NTag>{h.label}</NTag>
						</span>
					))}
					<NPopover trigger="click" placement="bottom-start" style={{ maxHeight: '24rem', overflowY: 'auto' }}>
						{{
							trigger: () => <NButton text type="primary">全部公式 ▾</NButton>,
							default: () => (
								<div style={{ width: '28rem' }}>
									<NInput
										v-model:value={formulaSearch.value}
										placeholder="搜索公式名 / 写法 / 说明"
										class="mb-2"
									/>
									{filteredFormulaGroups.value.length === 0 ? (
										<NText depth={3}>没有匹配的公式</NText>
									) : (
										filteredFormulaGroups.value.map((g) => (
											<div key={g.name} class="mb-3">
												<div class="text-gray-400 text-[1.3rem] mb-1">{g.name}</div>
												{g.fns.map((fn) => (
													<div
														key={fn.value}
														class="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
														onClick={() => onInsert(fn.value)}
													>
														<div class="flex items-baseline gap-2">
															<span class="font-medium text-[1.4rem]">{fn.label}</span>
															<code class="text-gray-400 text-[1.3rem]">{fn.value}</code>
														</div>
														<div class="text-gray-500 text-[1.3rem]">{fn.desc}</div>
													</div>
												))}
											</div>
										))
									)}
								</div>
							),
						}}
					</NPopover>
				</div>
			)
		}

		const renderStep = (step: CustomApiStep, index: number) => {
			// 兼容旧配置：补默认解析格式与成功条件对象、预处理变量数组、步骤级变量数组
			const response = step.response
			response.format = response.format || 'json'
			const condition = (response.condition = response.condition || { field: '', operator: 'eq', value: '' })
			const preVars = (response.variables = response.variables || [])
			if (!step.variables) {
				step.variables = []
			}
			return (
				<div class="space-y-4">
					<NCollapse defaultExpandedNames={step.variables.length > 0 ? ['vars'] : []} class="mb-4">
						<NCollapseItem title="步骤变量（可选，在该步骤请求前计算；「输出」可用于请求及后续步骤，「过程」仅参与公式计算）" name="vars">
							<NDynamicInput
								v-model:value={step.variables}
								min={0}
								on-create={() => ({ name: '', formula: '', process: false })}
							>
								{{
									default: ({ value, index: rowIndex }: { value: any; index: number }) => (
										<div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'flex-start' }}>
											<NInput v-model:value={value.name} placeholder="变量名" style={{ width: '10rem', flexShrink: 0 }} />
											<NInput
												v-model:value={value.formula}
												placeholder="公式，如 hmac_sha256({{var.secret}}, {{step1.token}})"
												style={{ flex: 1, minWidth: 0 }}
												onFocus={(e: Event) => trackFocus('step', index, rowIndex, e)}
												onClick={(e: Event) => trackFocus('step', index, rowIndex, e)}
												onKeyup={(e: Event) => trackFocus('step', index, rowIndex, e)}
											/>
											<NCheckbox v-model:checked={value.process} style={{ flexShrink: 0 }}>
												过程
											</NCheckbox>
										</div>
									),
								}}
							</NDynamicInput>
							{renderFormulaHelpers((v) => insertFormula(v, step.variables!, index, 'step'))}
						</NCollapseItem>
					</NCollapse>
					<NGrid cols={24} xGap={16}>
						<NFormItemGi span={6} label="请求方法" path={`steps[${index}].method`}>
							<NSelect v-model:value={step.method} options={methodOptions} />
						</NFormItemGi>
						<NFormItemGi span={18} label="请求地址" path={`steps[${index}].url`}>
							<NInput v-model:value={step.url} placeholder="支持 {{变量}}" />
						</NFormItemGi>
					</NGrid>
					<NFormItem label="请求超时(秒)" path={`steps[${index}].timeout`}>
						<div class="flex items-center gap-4">
							<NInputNumber v-model:value={step.timeout} min={1} max={60} class="w-32" />
							<NCheckbox v-model:checked={step.insecure}>忽略SSL校验</NCheckbox>
						</div>
					</NFormItem>
					{renderKeyValue(step, 'headers', '请求头部')}
					{renderKeyValue(step, 'params', '请求URL参数')}
					{renderKeyValue(step, 'cookies', '请求Cookie')}
					{step.method === 'POST' && (
						<NFormItem label="请求Body" path={`steps[${index}].body`}>
							<NInput v-model:value={step.body} type="textarea" rows={4} placeholder="支持 {{变量}}，原样发送；Content-Type 请在请求头部中配置" />
						</NFormItem>
					)}
					<div class="border rounded p-4 bg-gray-50">
						<div class="font-medium mb-3">响应配置</div>
						<NFormItem label="解析格式">
							<NRadioGroup v-model:value={response.format}>
								<NRadioButton value="json">JSON</NRadioButton>
								<NRadioButton value="xml">XML</NRadioButton>
							</NRadioGroup>
						</NFormItem>
						<NCollapse defaultExpandedNames={preVars.length > 0 ? ['pp'] : []} class="mb-3">
							<NCollapseItem
								title="数据预处理（可选，按顺序求值；写回 raw 即把处理结果作为新响应体再解析）"
								name="pp"
							>
								<div class="mb-1">
									<div class="text-gray-700 font-medium mb-2">预处理变量（可用 {'{{raw}}'} 整体响应体、{'{{headers.X-Auth[0]}}'} 路径直取与上方变量；「过程」仅计算可见、不进请求）</div>
									<NDynamicInput
										v-model:value={response.variables}
										min={0}
										on-create={() => ({ name: '', formula: '', process: true })}
									>
										{{
											default: ({ value, index: rowIndex }: { value: any; index: number }) => (
												<div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'flex-start' }}>
													<NInput v-model:value={value.name} placeholder="变量名" style={{ width: '10rem', flexShrink: 0 }} />
													<NInput
														v-model:value={value.formula}
														placeholder="公式，如 aes_ecb_dec({{var.key}}, {{raw}})"
														style={{ flex: 1, minWidth: 0 }}
														onFocus={(e: Event) => trackFocus('pre', index, rowIndex, e)}
														onClick={(e: Event) => trackFocus('pre', index, rowIndex, e)}
														onKeyup={(e: Event) => trackFocus('pre', index, rowIndex, e)}
													/>
													<NCheckbox v-model:checked={value.process} style={{ flexShrink: 0 }}>
														过程
													</NCheckbox>
												</div>
											),
										}}
									</NDynamicInput>
								</div>
								{renderFormulaHelpers((v) => insertFormula(v, response.variables!, index, 'pre'))}
							</NCollapseItem>
						</NCollapse>
						<div class="text-gray-700 font-medium mb-2">响应参数</div>
						<NDynamicInput
							v-model:value={response.extracts}
							min={0}
							on-create={() => ({ name: '', path: '' })}
						>
							{{
								default: ({ value }: { value: any }) => (
									<div class="flex gap-2 w-full items-center">
										<NInput v-model:value={value.path} placeholder="解析字段，如 data.token" class="flex-1" />
										<span class="text-gray-400 flex-shrink-0">»</span>
										{props.extractSuggestions.length > 0 ? (
											<NSelect
												v-model:value={value.name}
												options={props.extractSuggestions.map((s) => ({ label: s, value: s }))}
												filterable
												tag
												placeholder="本地变量名"
												class="flex-1"
											/>
										) : (
											<NInput v-model:value={value.name} placeholder="本地变量名" class="flex-1" />
										)}
									</div>
								),
							}}
						</NDynamicInput>
						<NFormItem label="成功条件" class="mt-3">
							<div class="flex gap-2 items-center flex-wrap">
								<span class="text-gray-600 flex-shrink-0">HTTP状态码</span>
								<NInputNumber v-model:value={response.success_code} min={100} max={599} showButton={false} class="w-28" />
								<span class="text-gray-600 flex-shrink-0">且字段</span>
								<NInput v-model:value={condition.field} placeholder="如 code（可留空）" class="w-40" />
								<NSelect v-model:value={condition.operator} options={operatorOptions} class="w-28" />
								<NInput v-model:value={condition.value} placeholder="期望值" class="w-40" />
							</div>
						</NFormItem>
						<div class="text-gray-500 text-sm mt-2">
							提取路径支持响应体路径（按解析格式）或预处理变量名（含 raw）；提取的变量在后续步骤可用 {'{{变量名}}'}、
							{'{{' + (step.name || `step${index + 1}`) + '.变量名}}'} 或 {'{{step.变量名}}'} 引用；字段条件留空则只校验状态码
						</div>
					</div>
				</div>
			)
		}

		return () => (
			<div class="custom-api-editor">
				<NCollapse class="mb-4">
					<NCollapseItem title="变量使用说明" name="help">
						<div class="text-[1.3rem] text-gray-600 space-y-3">
							<div>
								<div class="font-medium text-gray-700 mb-1">请求中（每个步骤）</div>
								<div>· 可用位置：请求地址、请求头部、URL参数、Cookie、请求Body（仅 POST），写法 {'{{变量名}}'}</div>
								<div>· 系统内置变量：随用途注入（见下方列表，点击复制）</div>
								<div>
									· 步骤变量：在该步骤请求前计算，可用 {'{{var.变量名}}'} 或 {'{{变量名}}'} 引用；勾选「过程」后仅公式可见、不进请求
								</div>
								<div>
									· 上游提取：{'{{变量名}}'}（同名后者覆盖）、{'{{步骤名.变量名}}'}（指定步骤）、{'{{step.变量名}}'}（最近提取）
								</div>
							</div>
							<div>
								<div class="font-medium text-gray-700 mb-1">响应中（每个步骤）</div>
								<div>
									· 预处理变量：用 {'{{raw}}'}（整体响应体）或 {'{{headers.X-Auth[0]}}'}（按解析格式路径直取）与上游提取按顺序计算、链式引用；与请求变量分离，不可使用请求侧变量
								</div>
								<div>· 处理结果就是响应结果：把变量写回 {'raw'} 或 {'__raw__'}，即以其值作为新的响应体再进入解析</div>
								<div>· 成功条件：先校验 HTTP 状态码，字段条件留空则不再校验内容</div>
								<div>· 响应参数：按解析格式（JSON/XML）把「解析字段」映射为「本地变量」，提取后供后续步骤使用</div>
								<div>· 「过程」变量：只参与公式计算，不进请求、不进最终输出，执行完成即丢弃</div>
							</div>
						</div>
					</NCollapseItem>
				</NCollapse>
				{props.systemVars.length > 0 && (
					<div class="mb-4">
						<div class="text-gray-700 font-medium mb-2">系统内置变量（点击复制）</div>
						<div class="space-y-1">
							{props.systemVars.map((v) => (
								<div key={v.value} class="flex items-center gap-2">
									<span
										title="点击复制"
										class="cursor-pointer inline-block flex-shrink-0"
										onClick={() => copyText(v.value)}
									>
										<NTag>{v.value}</NTag>
									</span>
									<span class="text-gray-500 text-sm">{v.label}</span>
								</div>
							))}
						</div>
					</div>
				)}
				<div class="mb-3">
					<NButton type="primary" dashed onClick={addStep}>
						+ 添加请求步骤
					</NButton>
				</div>
				{props.value.steps.length === 0 ? (
					<NText depth={3}>还没有请求步骤，点击上方按钮添加</NText>
				) : (
					<NTabs type="card" closable v-model:value={activeStep.value} onClose={removeStep}>
						{props.value.steps.map((step, index) => (
							<NTabPane key={index} name={index} tab={step.name || `步骤${index + 1}`}>
								{renderStep(step, index)}
							</NTabPane>
						))}
					</NTabs>
				)}
				<div class="text-gray-500 text-sm mt-4">
					公式支持
					md5/sha1/sha256/sha512/hmac_*/rsa_*/aes_cbc/aes_ecb/sm2_*/sm3/hmac_sm3/sm4_*/base64/hex/urlencode/json_escape/concat/replace/trim/substr/len/split/regex/contains/eq/if/date/timestamp/uuid/rand_string/add
					等；公式参数可直接写 {'{{变量}}'}（系统变量或上方已声明的变量均可），点击「常用公式」标签插入到当前公式输入框的光标处
				</div>
			</div>
		)
	},
})
