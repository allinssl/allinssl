import { defineComponent, ref } from 'vue'
import { NCard } from 'naive-ui'
import useForm from '@hooks/useForm'
import type { FormConfig, CheckboxOptionItem, RadioOptionItem, UseFormOptions } from '../../types/form'

const mockFormRequest = async (data: any) => {
	await new Promise((resolve) => setTimeout(resolve, 1000))
	console.log('Form submitted:', data)
	return { success: true }
}

export default defineComponent({
	name: 'FormDemo',
	setup() {
		const dynamFormSelectList = ref([
			{ label: '男', value: 'male' },
			{ label: '女', value: 'female' },
			{ label: '其他', value: 'other' },
		])

		const educationOptions = ref<RadioOptionItem[]>([
			{ label: '高中', value: 'highschool' },
			{ label: '大专', value: 'college' },
			{ label: '本科', value: 'bachelor' },
			{ label: '硕士', value: 'master' },
			{ label: '博士', value: 'phd' },
		])

		const hobbyOptions = ref<CheckboxOptionItem[]>([
			{ label: '阅读', value: 'reading' },
			{ label: '运动', value: 'sports' },
			{ label: '音乐', value: 'music' },
			{ label: '旅行', value: 'travel' },
			{ label: '摄影', value: 'photography' },
		])

		const departmentOptions = ref([
			{ label: '技术部', value: 'tech' },
			{ label: '产品部', value: 'product' },
			{ label: '设计部', value: 'design' },
			{ label: '运营部', value: 'operation' },
			{ label: '市场部', value: 'marketing' },
		])

		const formConfig: FormConfig = [
			{
				type: 'grid',
				cols: 24,
				xGap: 24,
				children: [
					{
						type: 'formItemGi',
						label: '姓名',
						span: 12,
						required: true,
						children: [
							{
								type: 'input',
								field: 'name',
								placeholder: '请输入姓名',
							},
						],
					},
					{
						type: 'formItemGi',
						label: '性别',
						span: 12,
						required: true,
						children: [
							{
								type: 'select',
								field: 'gender',
								placeholder: '请选择性别',
								options: dynamFormSelectList.value,
							},
						],
					},
				],
			},
			{
				type: 'grid',
				cols: 24,
				xGap: 24,
				children: [
					{
						type: 'formItemGi',
						label: '出生日期',
						span: 12,
						required: true,
						children: [
							{
								type: 'datepicker',
								field: 'birthDate',
								placeholder: '请选择出生日期',
							},
						],
					},
					{
						type: 'formItemGi',
						label: '部门',
						span: 12,
						required: true,
						children: [
							{
								type: 'select',
								field: 'department',
								placeholder: '请选择部门',
								options: departmentOptions.value,
							},
						],
					},
				],
			},
			{
				type: 'grid',
				cols: 24,
				xGap: 24,
				children: [
					{
						type: 'formItemGi',
						label: '手机号码',
						span: 12,
						required: true,
						children: [
							{
								type: 'input',
								field: 'phone',
								placeholder: '请输入手机号码',
							},
						],
					},
					{
						type: 'formItemGi',
						label: '邮箱',
						span: 12,
						required: true,
						children: [
							{
								type: 'input',
								field: 'email',
								placeholder: '请输入邮箱地址',
							},
						],
					},
				],
			},
			{
				type: 'formItem',
				label: '教育程度',
				required: true,
				children: [
					{
						type: 'radio',
						field: 'education',
						options: educationOptions.value,
					},
				],
			},
			{
				type: 'formItem',
				label: '兴趣爱好',
				children: [
					{
						type: 'checkbox',
						field: 'hobbies',
						options: hobbyOptions.value,
					},
				],
			},
			{
				type: 'formItem',
				label: '个人简介',
				children: [
					{
						type: 'input',
						field: 'introduction',
						placeholder: '请输入个人简介',
						inputProps: { type: 'textarea' },
						rows: 3,
					},
				],
			},
			{
				type: 'grid',
				cols: 24,
				xGap: 24,
				children: [
					{
						type: 'formItemGi',
						label: '薪资期望',
						span: 12,
						children: [
							{
								type: 'inputNumber',
								field: 'expectedSalary',
								placeholder: '请输入期望薪资',
							},
						],
					},
					{
						type: 'formItemGi',
						label: '工作年限',
						span: 12,
						children: [
							{
								type: 'inputNumber',
								field: 'workYears',
								placeholder: '请输入工作年限',
							},
						],
					},
				],
			},
		]

		const { FormComponent, config, formData } = useForm<{ name: number }>({
			config: formConfig,
			requestFn: mockFormRequest,
			defaultValues: {
				name: 1,
			},
		})

		return () => (
			<NCard title="复杂表单示例" class="mt-[16px]">
				<div class="p-[16px]">
					<FormComponent />
				</div>
			</NCard>
		)
	},
})
