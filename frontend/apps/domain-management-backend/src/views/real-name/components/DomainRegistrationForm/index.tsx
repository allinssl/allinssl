/**
 * 域名备案模板表单组件
 *
 * 功能特性：
 * - 完整的表单验证规则
 * - 动态字段显示（企业类型显示营业执照上传）
 * - 文件上传支持
 * - 级联选择器（省市区）
 * - 表单数据预览
 * - 响应式布局
 *
 * @author AI Assistant
 * @since 2024-01-01
 */

import { defineComponent, ref, computed, reactive, type PropType, watch } from 'vue'
import {
	NForm,
	NFormItem,
	NInput,
	NRadioGroup,
	NRadioButton,
	NSelect,
	NUpload,
	NUploadDragger,
	NButton,
	NDivider,
	NCheckbox,
	NText,
	NP,
	NIcon,
	NCascader,
	NSpin,
	useMessage,
	type FormInst,
	type FormRules,
	type SelectOption,
	type UploadCustomRequestOptions,
	type UploadFileInfo,
	NFlex,
} from 'naive-ui'
import { getChinaAreaData, getCityNamesByCityId } from '@/data/china-area-data'
import { DocumentTextOutline, RefreshOutline } from '@vicons/ionicons5'
import idCardHead from '@/icons/id-card-head.svg'
import idCardBack from '@/icons/id-card-back.svg'

import { uploadCardIdFront, uploadCardIdBack, uploadBusinessLicense } from '@/api/real-name'
import { useModalHooks } from '@baota/naive-ui/hooks'
import type { DomainRegistrationFormData } from '../../types'

import styles from './index.module.css'

import { useController } from './useController'
import { useApp } from '@/components/layout/useStore'

/**
 * 文件转换为 Base64 字符串
 * @param file 文件对象
 * @returns Promise<string> Base64 字符串
 */
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => {
			const result = reader.result as string
			resolve(result)
		}
		reader.onerror = (error) => reject(error)
	})
}

/**
 * 域名备案模板表单组件
 */
export default defineComponent({
	name: 'DomainRegistrationForm',
	props: {
		/** 是否显示表单 */
		visible: {
			type: Boolean,
			default: false,
		},
		/** 表单模式：add-新增, edit-编辑, view-查看 */
		mode: {
			type: String as PropType<'add' | 'edit' | 'view'>,
			default: 'add',
		},
		/** 初始表单数据 */
		initialData: {
			type: Object as () => Partial<DomainRegistrationFormData>,
			default: () => ({}),
		},
		/** 刷新数据函数 */
		refresh: {
			type: Function as PropType<() => Promise<void>>,
			default: () => Promise.resolve(),
		},
	},
	setup(props) {
		const { handleFormSubmit } = useController(props)
		const { isMobile } = useApp()
		const message = useMessage()
		const { close } = useModalHooks()
		const handleCloseModal = close() // 构建关闭方式

		// 表单引用和消息实例
		const formRef = ref<FormInst | null>(null)

		// 表单数据
		const formData = reactive<DomainRegistrationFormData>({
			// 基础信息
			template_name: '',
			type: 1,
			id_type: 1,
			id_number: '',
			id_image_front: [],
			id_image_back: [],
			business_license: [],
			is_default: false,
			// 中文模板信息
			owner_name: '',
			contact_person: '',
			phone: '',
			email: '',
			city: '', // 城市字段，字符串类型
			city_id: [], // 城市ID字段，默认为空字符串
			address: '',
			postal_code: '',
			// 英文模板信息
			owner_name_en: '',
			address_en: '',
			...props.initialData,
		})

		// 上传状态管理
		const uploadStates = reactive({
			frontImageBase64: '',
			backImageBase64: '',
			businessLicenseBase64: '',
			frontLoading: false,
			backLoading: false,
			businessLoading: false,
			licenseLoading: false, // 添加licenseLoading属性
			frontImagePath: '',
			backImagePath: '',
			businessLicensePath: '',
		})

		// 监听模板类型变化，自动切换证件类型和清空相关文件
		watch(
			() => formData.type,
			(newType, oldType) => {
				if (newType !== oldType) {
					// 个人：身份证，企业：营业执照
					formData.id_type = newType === 1 ? 1 : 2

					// 清空文件列表
					formData.id_image_front = []
					formData.id_image_back = []
					formData.business_license = []

					// 清空base64数据和文件路径
					uploadStates.frontImageBase64 = ''
					uploadStates.backImageBase64 = ''
					uploadStates.businessLicenseBase64 = ''
					uploadStates.frontImagePath = ''
					uploadStates.backImagePath = ''
					uploadStates.businessLicensePath = ''

					console.log(
						`模板类型切换为: ${newType === 1 ? '个人' : '企业'}，证件类型: ${newType === 1 ? '身份证' : '营业执照'}`,
					)
				}
			},
		)

		// 表单验证规则
		const rules: FormRules = {
			template_name: [
				{
					required: true,
					message: '请输入模板名称',
					trigger: ['input', 'blur'],
				},
				{
					min: 2,
					max: 50,
					message: '模板名称长度应在 2-50 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
			type: [
				{
					required: true,
					type: 'number',
					message: '请选择模板类型',
					trigger: ['change', 'blur'],
				},
			],
			id_type: [
				{
					required: true,
					type: 'number',
					message: '请选择证件类型',
					trigger: ['change', 'blur'],
				},
			],
			id_image_front: [
				{
					required: true,
					type: 'array',
					message: '请上传身份证人像照片',
					trigger: ['change'],
				},
			],
			id_image_back: [
				{
					required: true,
					type: 'array',
					message: '请上传身份证国徽面照片',
					trigger: ['change'],
				},
			],
			id_number: [
				{
					required: true,
					message: '请输入证件号码',
					trigger: ['input', 'blur'],
				},
				{
					validator(rule, value) {
						if (!value) return true // 已有必填验证，此处不重复提示
						if (formData.type === 1) {
							// 身份证号码验证
							const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
							if (!idCardReg.test(value)) {
								return new Error('请输入正确的身份证号码')
							}
						} else {
							// 营业执照号码验证（统一社会信用代码）
							const businessLicenseReg = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
							if (!businessLicenseReg.test(value)) {
								return new Error('请输入正确的营业执照号码')
							}
						}
						return true
					},
					trigger: ['input', 'blur'],
				},
			],
			owner_name: [
				{
					required: true,
					message: '请输入域名所有者名称',
					trigger: ['input', 'blur'],
				},
				{
					min: 2,
					max: 50,
					message: '名称长度应在 2-50 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
			contact_person: [
				{
					required: true,
					message: '请输入联系人姓名',
					trigger: ['input', 'blur'],
				},
				{
					min: 2,
					max: 20,
					message: '联系人姓名长度应在 2-20 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
			phone: [
				{
					required: true,
					message: '请输入联系电话',
					trigger: ['input', 'blur'],
				},
				{
					validator(rule, value) {
						if (!value) return true // 已有必填验证，此处不重复提示
						const mobileReg = /^1[3-9]\d{9}$/
						const phoneReg = /^0\d{2,3}-\d{7,8}$/
						if (!mobileReg.test(value) && !phoneReg.test(value)) {
							return new Error('请输入正确的手机号码或固定电话')
						}
						return true
					},
					trigger: ['input', 'blur'],
				},
			],
			email: [
				{
					required: true,
					message: '请输入电子邮箱',
					trigger: ['input', 'blur'],
				},
				{
					type: 'email',
					message: '请输入正确的邮箱地址',
					trigger: ['input', 'blur'],
				},
			],
			city_id: [
				{
					required: true,
					message: '请选择所在地区',
					trigger: ['change', 'blur'],
				},
			],
			address: [
				{
					required: true,
					message: '请输入详细地址',
					trigger: ['input', 'blur'],
				},
				{
					min: 1,
					max: 200,
					message: '地址长度应在 1-200 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
			postal_code: [
				{
					required: true,
					message: '请输入邮政编码',
					trigger: ['input', 'blur'],
				},
				{
					pattern: /^\d{6}$/,
					message: '请输入正确的6位邮政编码',
					trigger: ['input', 'blur'],
				},
			],
			owner_name_en: [
				{
					required: true,
					message: '请输入英文所有者名称',
					trigger: ['input', 'blur'],
				},
				{
					min: 2,
					max: 100,
					message: '英文名称长度应在 2-100 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
			address_en: [
				{
					required: true,
					message: '请输入英文地址',
					trigger: ['input', 'blur'],
				},
				{
					min: 1,
					max: 300,
					message: '英文地址长度应在 1-300 个字符之间',
					trigger: ['input', 'blur'],
				},
			],
		}

		// 证件类型选项 - 根据模板类型动态变化
		const idTypeOptions = computed<SelectOption[]>(() => {
			if (formData.type === 1) {
				// 个人：只显示身份证
				return [{ label: '身份证', value: 1 }]
			} else {
				// 企业：只显示营业执照
				return [{ label: '营业执照', value: 2 }]
			}
		})

		// 城市级联选项（从外部动态库获取全国省市区县数据）
		const cityOptions = getChinaAreaData()

		// 通用重置文件函数
		const resetFileData = (type: 'front' | 'back' | 'business', ev?: Event) => {
			const config = {
				front: {
					formField: 'id_image_front' as keyof typeof formData,
					base64Field: 'frontImageBase64' as keyof typeof uploadStates,
					pathField: 'frontImagePath' as keyof typeof uploadStates,
				},
				back: {
					formField: 'id_image_back' as keyof typeof formData,
					base64Field: 'backImageBase64' as keyof typeof uploadStates,
					pathField: 'backImagePath' as keyof typeof uploadStates,
				},
				business: {
					formField: 'business_license' as keyof typeof formData,
					base64Field: 'businessLicenseBase64' as keyof typeof uploadStates,
					pathField: 'businessLicensePath' as keyof typeof uploadStates,
				},
			}

			const { formField, base64Field, pathField } = config[type]

			;(formData as any)[formField] = []
			;(uploadStates as any)[base64Field] = ''
			;(uploadStates as any)[pathField] = ''
			ev?.stopPropagation()
		}

		/**
		 * 提交表单
		 */
		const handleSubmit = async () => {
			try {
				await formRef.value?.validate()
				const submitData = { ...formData }
				// 处理图片文件路径数据（使用 file_path 而非 base64）
				if (!uploadStates.frontImagePath) message.error('请上传身份证正面,路径获取失败' + uploadStates.frontImagePath)
				submitData.id_image_front = uploadStates.frontImagePath || ''
				submitData.id_image_back = uploadStates.backImagePath || ''
				submitData.business_license = uploadStates.businessLicensePath || ''
				// 将 city_id 的 ID 转换为城市地点名称
				submitData.city = getCityNamesByCityId(submitData.city_id as string, {
					separator: '-',
					fullAddress: true,
					removeDuplicates: true,
				})
				if (props.mode === 'add') {
					await handleFormSubmit(submitData as DomainRegistrationFormData)
					// handleCloseModal()
				}
			} catch (error) {
				console.error('表单验证失败:', error)
				message.error('请检查表单填写是否正确')
			}
		}

		/**
		 * 上传配置映射
		 */
		const uploadConfigMap = {
			front: {
				uploadFn: uploadCardIdFront,
				setBase64: (base64: string) => (uploadStates.frontImageBase64 = base64),
				setPath: (path: string) => (uploadStates.frontImagePath = path),
				onSuccess: (rdata: any) => {
					const { idnum } = rdata.data || {}
					formData.id_number = idnum || ''
					message.success('已自动填充身份证信息')
				},
			},
			back: {
				uploadFn: uploadCardIdBack,
				setBase64: (base64: string) => (uploadStates.backImageBase64 = base64),
				setPath: (path: string) => (uploadStates.backImagePath = path),
				onSuccess: () => {}, // 背面上传无特殊处理
			},
			business: {
				uploadFn: uploadBusinessLicense,
				setBase64: (base64: string) => (uploadStates.businessLicenseBase64 = base64),
				setPath: (path: string) => (uploadStates.businessLicensePath = path),
				onSuccess: () => {}, // 营业执照上传无特殊处理
			},
		}

		/**
		 * 通用上传处理函数
		 * @param uploadType 上传类型
		 * @param base64 文件base64
		 * @param onFinish 完成回调
		 */
		const handleUpload = async (uploadType: keyof typeof uploadConfigMap, base64: string, onFinish: () => void) => {
			const config = uploadConfigMap[uploadType]
			const { data, fetch, message: messageRef } = config.uploadFn({ file: base64 })
			messageRef.value = true
			await fetch()
			// 上传成功后，设置base64
			config.setBase64(base64)
			const { status, data: rdata, msg } = data.value
			if (!status || !rdata?.file_path) throw new Error(msg)
			// 上传成功后，设置路径
			config.setPath(rdata.file_path)
			config.onSuccess(rdata)
			// 上传成功后，调用完成回调
			onFinish()
		}

		/**
		 * 自定义上传请求 - 对接实际API
		 * @param options UploadCustomRequestOptions
		 */
		const customRequest = async (options: UploadCustomRequestOptions) => {
			const { file, onFinish, onError, onProgress } = options
			const fileObj = file.file as File
			const uploadType = getUploadType(options)
			try {
				// 转换为base64
				const base64 = await fileToBase64(fileObj)
				// 设置加载状态
				setUploadLoading(uploadType, true)
				// 调用通用上传处理函数
				await handleUpload(uploadType, base64, onFinish)
				// 设置100%进度
				onProgress({ percent: 100 })
			} catch (error) {
				// 上传失败，调用错误回调
				onError()
				// 重置图片状态
				resetFileData(uploadType)
			} finally {
				// 重置加载状态
				setUploadLoading(uploadType, false)
			}
		}

		/**
		 * 根据上传选项确定上传类型
		 */
		const getUploadType = (options: UploadCustomRequestOptions): 'front' | 'back' | 'business' => {
			// 通过文件名或其他方式判断上传类型
			// 这里需要根据实际的组件实现来判断
			const uploadId = (options as any).uploadId || 'front'
			return uploadId
		}

		/**
		 * 设置上传加载状态
		 */
		const setUploadLoading = (type: 'front' | 'back' | 'business', loading: boolean) => {
			switch (type) {
				case 'front':
					uploadStates.frontLoading = loading
					break
				case 'back':
					uploadStates.backLoading = loading
					break
				case 'business':
					uploadStates.businessLoading = loading
					uploadStates.licenseLoading = loading // 确保同时设置licenseLoading状态
					break
			}
		}

		/**
		 * 上传前校验：大小和类型
		 */
		const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
			const file = data.file.file as File
			// 只允许jpg格式
			const isAcceptType = /image\/(jpeg|jpg|png)/i.test(file.type)
			if (!isAcceptType) {
				message.error('仅支持JPG、JPEG、PNG格式图片')
				return false
			}
			// 限制文件大小为2MB
			const isLt5M = file.size / 1024 / 1024 <= 2
			if (!isLt5M) {
				message.error('图片大小不能超过2MB')
				return false
			}
			return true
		}

		/**
		 * 移除文件回调
		 */
		const onRemoveFile = (options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
			message.info(`已移除 ${options.file.name}`)
		}

		/**
		 * 身份证上传区域
		 * @returns
		 */
		const idCardRender = () => (
			<>
				<NFormItem label="身份证人像面" path="id_image_front" required>
					<div class={styles['id-upload-container']}>
						{/* 身份证正面 */}
						<div
							class={
								styles['upload-item'] + ' ' + uploadStates.frontLoading || !!uploadStates.frontImagePath
									? styles['is-upload']
									: ''
							}
						>
							<NUpload
								v-model:fileList={formData.id_image_front}
								max={1}
								showFileList={false}
								directoryDnd
								listType="image"
								accept="image/jpg,image/jpeg,image/png"
								customRequest={(options) =>
									customRequest({
										...options,
										uploadId: 'front',
									} as any)
								}
								onBeforeUpload={beforeUpload}
								onRemove={onRemoveFile}
								class={styles['enhanced-upload']}
								disabled={uploadStates.frontLoading || !!uploadStates.frontImagePath}
								showCancelButton={!uploadStates.frontLoading}
								showRemoveButton={!uploadStates.frontLoading}
								showRetryButton={!uploadStates.frontLoading}
							>
								{uploadStates.frontImageBase64 ? (
									<div class={styles['preview-container']}>
										<img src={uploadStates.frontImageBase64} class={styles['preview-image']} alt="身份证人像面" />
										{uploadStates.frontLoading && (
											<div class={styles['loading-overlay']}>
												<div
													style={{
														textAlign: 'center',
														color: '#fff',
													}}
												>
													<NSpin size="small" />
													<div
														style={{
															marginTop: '8px',
															fontSize: '12px',
														}}
													>
														上传中...
													</div>
												</div>
											</div>
										)}
										{!uploadStates.frontLoading && (
											<div class={styles['reset-button']} onClick={(ev) => resetFileData('front', ev)}>
												<NButton size="small" type="primary" ghost>
													<NIcon size={14} style={{ marginRight: '4px' }}>
														<RefreshOutline />
													</NIcon>
													重新上传
												</NButton>
											</div>
										)}
									</div>
								) : (
									<NUploadDragger class={styles['custom-dragger']}>
										<div class={styles['upload-content']}>
											<div
												class={styles['upload-background-image']}
												style={{ backgroundImage: `url(${idCardHead})` }}
											></div>
											<div class={styles['upload-text']}>
												<NText
													style={{
														fontSize: '14px',
														fontWeight: '500',
													}}
												>
													身份证人像面
												</NText>
												<NP
													depth={3}
													style={{
														margin: '4px 0 0 0',
														fontSize: '12px',
													}}
												>
													点击或拖拽上传
												</NP>
												<NText depth={3} style={{ fontSize: '11px' }}>
													支持JPG、JPEG、PNG格式 ≤ 2MB
												</NText>
											</div>
										</div>
										{uploadStates.frontLoading && (
											<div class={styles['upload-loading-overlay']}>
												<div
													style={{
														textAlign: 'center',
														color: '#fff',
													}}
												>
													<NSpin size="small" />
													<div
														style={{
															marginTop: '8px',
															fontSize: '12px',
														}}
													>
														上传中...
													</div>
												</div>
											</div>
										)}
									</NUploadDragger>
								)}
							</NUpload>
							<div class={styles['upload-tips-container']}>
								<NText type="warning" style={{ fontSize: '12px' }}>
									请上传清晰完整的身份证人像面照片，确保信息清晰可见，无反光、遮挡或裁剪
								</NText>
							</div>
						</div>
					</div>
				</NFormItem>
				<NFormItem label="身份证国徽面" path="id_image_back" required>
					<div class={styles['id-upload-container']}>
						{/* 身份证背面 */}
						<div
							class={
								styles['upload-item'] + ' ' + uploadStates.backLoading || !!uploadStates.backImagePath
									? styles['is-upload']
									: ''
							}
						>
							<NUpload
								v-model:fileList={formData.id_image_back}
								max={1}
								showFileList={false}
								directoryDnd
								listType="image"
								accept="image/jpg,image/jpeg,image/png"
								customRequest={(options) =>
									customRequest({
										...options,
										uploadId: 'back',
									} as any)
								}
								onBeforeUpload={beforeUpload}
								onRemove={onRemoveFile}
								class={styles['enhanced-upload']}
								disabled={uploadStates.backLoading || !!uploadStates.backImagePath}
								showCancelButton={!uploadStates.backLoading}
								showRemoveButton={!uploadStates.backLoading}
								showRetryButton={!uploadStates.backLoading}
							>
								{uploadStates.backImageBase64 ? (
									<div class={styles['preview-container']}>
										<img src={uploadStates.backImageBase64} class={styles['preview-image']} alt="身份证国徽面" />
										{uploadStates.backLoading && (
											<div class={styles['loading-overlay']}>
												<div
													style={{
														textAlign: 'center',
														color: '#fff',
													}}
												>
													<NSpin size="small" />
													<div
														style={{
															marginTop: '8px',
															fontSize: '12px',
														}}
													>
														上传中...
													</div>
												</div>
											</div>
										)}
										{!uploadStates.backLoading && (
											<div class={styles['reset-button']} onClick={(ev) => resetFileData('back', ev)}>
												<NButton size="small" type="primary" ghost>
													<NIcon size={14} style={{ marginRight: '4px' }}>
														<RefreshOutline />
													</NIcon>
													重新上传
												</NButton>
											</div>
										)}
									</div>
								) : (
									<NUploadDragger class={styles['custom-dragger']}>
										<div class={styles['upload-content']}>
											<div
												class={styles['upload-background-image']}
												style={{ backgroundImage: `url(${idCardBack})` }}
											></div>
											<div class={styles['upload-text']}>
												<NText
													style={{
														fontSize: '14px',
														fontWeight: '500',
													}}
												>
													身份证国徽面
												</NText>
												<NP
													depth={3}
													style={{
														margin: '4px 0 0 0',
														fontSize: '12px',
													}}
												>
													点击或拖拽上传
												</NP>
												<NText depth={3} style={{ fontSize: '11px' }}>
													支持JPG、JPEG、PNG格式 ≤ 2MB
												</NText>
											</div>
										</div>
										{uploadStates.backLoading && (
											<div class={styles['loading-overlay']}>
												<div style={{ textAlign: 'center', color: '#fff' }}>
													<NSpin size="small" />
													<div style={{ marginTop: '8px', fontSize: '12px' }}>上传中...</div>
												</div>
											</div>
										)}
									</NUploadDragger>
								)}
							</NUpload>
							<div class={styles['upload-tips-container']}>
								<NText type="warning" style={{ fontSize: '12px' }}>
									请上传清晰完整的身份证国徽面照片，确保信息清晰可见，无反光、遮挡或裁剪
								</NText>
							</div>
						</div>
					</div>
				</NFormItem>
			</>
		)

		return () => (
			<div class={styles['domain-registration-form']}>
				<NForm
					ref={formRef}
					model={formData}
					rules={rules}
					labelPlacement={isMobile.value ? 'top' : 'left'}
					labelWidth="120px"
					requireMarkPlacement="right-hanging"
					size="medium"
					disabled={props.mode === 'view'}
				>
					{/* 两列布局表单 */}
					<div class={styles['form-two-columns']}>
						{/* 左列 - 基础信息 */}
						<div class={styles['form-column']}>
							{/* 基础信息分组 */}
							<NDivider titlePlacement={isMobile.value ? 'center' : 'left'}>
								<NText type="primary" depth={1} style={{ fontWeight: 'bold' }}>
									基础信息
								</NText>
							</NDivider>

							<NFormItem label="模板名称" path="template_name">
								<NInput
									v-model:value={formData.template_name}
									placeholder="请输入模板名称，如：个人备案模板_2023"
									clearable
								/>
							</NFormItem>

							<NFormItem label="模板类型" path="type">
								<NRadioGroup v-model:value={formData.type} name="type">
									<NRadioButton value={1} label="个人" />
									<NRadioButton value={2} label="企业" />
								</NRadioGroup>
							</NFormItem>

							<NFormItem label="证件类型" path="id_type">
								<NSelect
									v-model:value={formData.id_type}
									options={idTypeOptions.value}
									placeholder="请选择证件类型"
									disabled={true} // 根据模板类型自动确定，不允许手动选择
								/>
							</NFormItem>

							{/* 证件上传区域 - 动态显示 */}
							{formData.type === 1 && idCardRender()}

							{formData.type === 2 && (
								<NFormItem label="营业执照" path="business_license" required>
									<div class={styles['id-upload-container']}>
										<div class={styles['upload-item']}>
											<NUpload
												v-model:fileList={formData.business_license}
												max={1}
												showFileList={false}
												directoryDnd
												listType="image"
												accept="image/jpg,image/jpeg,image/png"
												customRequest={(options) =>
													customRequest({
														...options,
														uploadId: 'business',
													} as any)
												}
												onBeforeUpload={beforeUpload}
												onRemove={onRemoveFile}
												class={styles['enhanced-upload']}
												disabled={uploadStates.licenseLoading || !!uploadStates.businessLicensePath}
												showCancelButton={!uploadStates.licenseLoading}
												showRemoveButton={!uploadStates.licenseLoading}
												showRetryButton={!uploadStates.licenseLoading}
											>
												{uploadStates.businessLicenseBase64 ? (
													<div class={styles['preview-container']}>
														<img
															src={uploadStates.businessLicenseBase64}
															class={styles['preview-image']}
															alt="营业执照"
														/>
														{uploadStates.licenseLoading && (
															<div class={styles['loading-overlay']}>
																<div style={{ textAlign: 'center', color: '#fff' }}>
																	<NSpin size="small" />
																	<div
																		style={{
																			marginTop: '8px',
																			fontSize: '12px',
																		}}
																	>
																		上传中...
																	</div>
																</div>
															</div>
														)}
														{!uploadStates.licenseLoading && (
															<div class={styles['reset-button']} onClick={(ev) => resetFileData('business', ev)}>
																<NButton size="small" type="primary" ghost>
																	<NIcon size={14} style={{ marginRight: '4px' }}>
																		<RefreshOutline />
																	</NIcon>
																	重新上传
																</NButton>
															</div>
														)}
													</div>
												) : (
													<NUploadDragger class={styles['custom-dragger']}>
														<div class={styles['upload-content']}>
															<div class={styles['upload-icon']}>
																<NIcon size={40} color="#18a058">
																	<DocumentTextOutline />
																</NIcon>
															</div>
															<div class={styles['upload-text']}>
																<NText
																	style={{
																		fontSize: '14px',
																		fontWeight: '500',
																	}}
																>
																	营业执照
																</NText>
																<NP
																	depth={3}
																	style={{
																		margin: '4px 0 0 0',
																		fontSize: '12px',
																	}}
																>
																	点击或拖拽上传
																</NP>
															</div>
														</div>
														<div class={styles['upload-tips']}>
															<NText depth={3} style={{ fontSize: '11px' }}>
																支持JPG、JPEG、PNG格式 ≤ 2MB
															</NText>
														</div>
													</NUploadDragger>
												)}
											</NUpload>
											<div class={styles['upload-tips-container']}>
												<NText type="warning" style={{ fontSize: '12px' }}>
													请上传清晰完整的营业执照照片，确保公司名称、统一社会信用代码等信息清晰可见，无反光、遮挡或裁剪
												</NText>
											</div>
										</div>
									</div>
								</NFormItem>
							)}

							<NFormItem label={formData.type === 1 ? '证件号码' : '统一社会信用代码'} path="id_number">
								<NInput
									v-model:value={formData.id_number}
									placeholder={formData.type === 1 ? '请输入身份证号码' : '请输入统一社会信用代码'}
									clearable
								/>
							</NFormItem>

							{formData.type === 2 && idCardRender()}

							{/* 设为默认模板 */}
							<NFormItem label="设为默认模板" path="is_default">
								<NCheckbox checked-value={1} unchecked-value={0}>
									如果有多个模板，设置后会覆盖之前的默认模板
								</NCheckbox>
							</NFormItem>
						</div>

						{/* 右列 - 中文模板信息和英文模板信息 */}
						<div class={styles['form-column']}>
							{/* 中文模板信息 */}
							<NDivider titlePlacement={isMobile.value ? 'center' : 'left'}>
								<NText type="primary" depth={1} style={{ fontWeight: 'bold' }}>
									中文模板信息
								</NText>
							</NDivider>

							<NFormItem label="域名所有者" path="owner_name">
								<NInput v-model:value={formData.owner_name} placeholder="请输入域名所有者名称" clearable />
							</NFormItem>

							<NFormItem label="联系人" path="contact_person">
								<NInput v-model:value={formData.contact_person} placeholder="请输入联系人姓名" clearable />
							</NFormItem>

							<NFormItem label="联系电话" path="phone">
								<NInput v-model:value={formData.phone} placeholder="请输入联系电话" clearable />
							</NFormItem>

							<NFormItem label="电子邮箱" path="email">
								<NInput v-model:value={formData.email} placeholder="请输入电子邮箱" clearable />
							</NFormItem>

							<NFormItem label="所在地区" path="city_id">
								<NCascader
									v-model:value={formData.city_id}
									options={cityOptions}
									placeholder="请选择所在地区"
									clearable
									checkStrategy="child"
									showPath
									expandTrigger="hover"
								/>
							</NFormItem>

							<NFormItem label="详细地址" path="address">
								<NInput
									v-model:value={formData.address}
									placeholder="请输入详细地址"
									clearable
									type="textarea"
									rows={2}
								/>
							</NFormItem>

							<NFormItem label="邮政编码" path="postal_code">
								<NInput v-model:value={formData.postal_code} placeholder="请输入邮政编码" clearable />
							</NFormItem>

							{/* 英文模板信息 */}
							<NDivider titlePlacement={isMobile.value ? 'center' : 'left'}>
								<NText type="primary" depth={1} style={{ fontWeight: 'bold' }}>
									英文模板信息
								</NText>
							</NDivider>

							<NFormItem label="英文名称" path="owner_name_en">
								<NInput v-model:value={formData.owner_name_en} placeholder="请输入域名所有者英文名称" clearable />
							</NFormItem>

							<NFormItem label="英文地址" path="address_en">
								<NInput
									v-model:value={formData.address_en}
									placeholder="请输入英文详细地址"
									clearable
									type="textarea"
									rows={2}
								/>
							</NFormItem>
						</div>
					</div>

					{/* 表单操作按钮 */}
					{props.mode !== 'view' && (
						<NFormItem show-label={false}>
							<NFlex class="w-full gap-12" justify={isMobile.value ? 'center' : 'end'}>
								<NButton size={isMobile.value ? 'large' : 'medium'} onClick={handleCloseModal}>
									取消
								</NButton>
								<NButton size={isMobile.value ? 'large' : 'medium'} type="primary" onClick={handleSubmit}>
									{props.mode === 'edit' ? '更新' : '提交表单'}
								</NButton>
							</NFlex>
						</NFormItem>
					)}

					{props.mode === 'view' && (
						<NFormItem show-label={false}>
							<NFlex>
								<NButton size="large" onClick={handleCloseModal}>
									关闭
								</NButton>
							</NFlex>
						</NFormItem>
					)}
				</NForm>
			</div>
		)
	},
})
