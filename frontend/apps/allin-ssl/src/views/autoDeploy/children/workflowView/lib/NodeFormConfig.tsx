import { NFormItem, NSwitch, NText, SelectOption } from 'naive-ui'
import { $t } from '@locales/index'
import { Ref } from 'vue'
import { useFormHooks } from '@baota/naive-ui/hooks'
import { noSideSpace } from '@lib/utils'

export interface FormOption extends SelectOption {
	category?: string
	icon?: string
}

/**
 * 节点表单配置工厂
 * 用于生成各种节点类型的表单配置项
 */
export function createNodeFormConfig() {
	const { useFormInput, useFormTextarea, useFormSelect } = useFormHooks()

	return {
		/**
		 * 基础表单组件
		 */

		/**
		 * 创建文本输入框
		 * @param label 标签
		 * @param path 字段路径
		 * @param options 选项
		 * @param formItemProps 表单项属性
		 */
		input(label: string, path: string, options: Record<string, any> = {}, formItemProps: Record<string, any> = {}) {
			return useFormInput(
				label,
				path,
				{ placeholder: options.placeholder || $t('t_0_1747817614953') + label, allowInput: noSideSpace, ...options },
				formItemProps,
			)
		},

		/**
		 * 创建文本域
		 * @param label 标签
		 * @param path 字段路径
		 * @param options 选项
		 * @param formItemProps 表单项属性
		 */
		textarea(label: string, path: string, options: Record<string, any> = {}, formItemProps: Record<string, any> = {}) {
			return useFormTextarea(
				label,
				path,
				{ placeholder: options.placeholder || $t('t_0_1747817614953') + label, rows: options.rows || 3, ...options },
				{ showRequireMark: false, ...formItemProps },
			)
		},

		/**
		 * 创建下拉选择框
		 * @param label 标签
		 * @param path 字段路径
		 * @param options 选项数组
		 * @param selectProps 选择框属性
		 * @param formItemProps 表单项属性
		 */
		select(
			label: string,
			path: string,
			options: FormOption[],
			selectProps: Record<string, any> = {},
			formItemProps: Record<string, any> = {},
		) {
			return useFormSelect(label, path, options as SelectOption[], selectProps, formItemProps)
		},

		/**
		 * 创建开关组件
		 * @param label 标签
		 * @param path 字段路径
		 * @param valueRef 值引用
		 * @param options 选项
		 */
		switch(
			label: string,
			path: string,
			valueRef: Ref<any>,
			options: { checkedText?: string; uncheckedText?: string; description?: string } = {},
		) {
			const checkedText = options.checkedText || $t('t_1_1747817639034')
			const uncheckedText = options.uncheckedText || $t('t_2_1747817610671')
			const description = options.description || ''

			return {
				type: 'custom' as const,
				render: () => {
					return (
						<NFormItem label={label} path={path}>
							{description && <NText>{description}</NText>}
							<NSwitch
								v-model:value={valueRef.value[path]}
								checkedValue={1}
								uncheckedValue={0}
								class="mx-[.5rem]"
								v-slots={{ checked: () => checkedText, unchecked: () => uncheckedText }}
							/>
						</NFormItem>
					)
				},
			}
		},

		/**
		 * 创建自定义组件
		 * @param render 渲染函数
		 */
		custom(render: () => any) {
			return {
				type: 'custom' as const,
				render,
			}
		},

		/**
		 * 部署相关的表单配置
		 */

		/**
		 * 创建SSH部署相关字段
		 * @param valueRef 值引用
		 */
		sshDeploy() {
			return [
				this.input($t('t_1_1747280813656'), 'certPath', { placeholder: $t('t_30_1746667591892') }),
				this.input($t('t_2_1747280811593'), 'keyPath', { placeholder: $t('t_31_1746667593074') }),
				this.textarea($t('t_3_1747280812067'), 'beforeCmd', { placeholder: $t('t_21_1745735769154'), rows: 2 }),
				this.textarea($t('t_4_1747280811462'), 'afterCmd', { placeholder: $t('t_22_1745735767366'), rows: 2 }),
			]
		},

		/**
		 * 创建站点相关字段
		 * @param valueRef 值引用
		 */
		siteDeploy() {
			return [this.input($t('t_0_1747296173751'), 'siteName', { placeholder: $t('t_1_1747296175494') })]
		},

		/**
		 * 创建1Panel站点相关字段
		 * @param valueRef 值引用
		 */
		onePanelSiteDeploy() {
			return [this.input($t('t_6_1747280809615'), 'site_id', { placeholder: $t('t_24_1745735766826') })]
		},

		/**
		 * 创建CDN相关字段
		 * @param valueRef 值引用
		 */
		cdnDeploy() {
			return [this.input($t('t_17_1745227838561'), 'domain', { placeholder: $t('t_0_1744958839535') })]
		},

		/**
		 * 创建WAF相关字段
		 */
		wafDeploy() {
			const regionOptions = [
				{ label: 'cn-hangzhou', value: 'cn-hangzhou' },
				{ label: 'ap-southeast-1', value: 'ap-southeast-1' },
			]

			return [
				this.input($t('t_17_1745227838561'), 'domain', { placeholder: $t('t_0_1744958839535') }),
				this.select($t('t_7_1747280808936'), 'region', regionOptions, {
					placeholder: $t('t_25_1745735766651'),
					defaultValue: 'cn-hangzhou',
				}),
			]
		},

		/**
		 * 创建对象存储相关字段
		 * @param valueRef 值引用
		 */
		storageDeploy() {
			return [
				this.input($t('t_17_1745227838561'), 'domain', { placeholder: $t('t_0_1744958839535') }),
				this.input($t('t_7_1747280808936'), 'region', { placeholder: $t('t_25_1745735766651') }),
				this.input($t('t_8_1747280809382'), 'bucket', { placeholder: $t('t_26_1745735767144') }),
			]
		},

		/**
		 * 创建跳过选项字段
		 * @param valueRef 值引用
		 */
		skipOption(valueRef: Ref<any>) {
			return this.switch($t('t_9_1747280810169'), 'skip', valueRef, {
				checkedText: $t('t_11_1747280809178'),
				uncheckedText: $t('t_12_1747280809893'),
				description: $t('t_10_1747280816952'),
			})
		},
	}
}
