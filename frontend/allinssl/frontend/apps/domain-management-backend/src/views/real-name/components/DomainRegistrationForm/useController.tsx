import { createContact } from '@/api/real-name'
import type { CreateContactRequest } from '@/types/real-name.d'
import type { DomainRegistrationFormData } from '@/views/real-name/types.d'
import { useRealNameState } from '../../useStore'

/**
 * 实名模板管理页面控制器
 */
export function useController(props: { refresh: () => Promise<void> }) {
	const message = useMessage()
	// 获取状态管理
	const {
		// 状态
		openRealNameDialog,
	} = useRealNameState()
	/**
	 * 处理表单提交成功后的操作
	 * @description 将表单数据映射到 CreateContactRequest 并调用创建接口
	 * @param formData 表单数据
	 */
	async function handleFormSubmit(formData: DomainRegistrationFormData) {
		try {
			// 创建请求数据
			const requestData: CreateContactRequest = {
				template_name: formData.template_name,
				type: formData.type,
				id_type: formData.id_type,
				id_number: formData.id_number,
				business_concat_id_number: formData.business_concat_id_number,
				is_default: formData.is_default ? 1 : 0,
				owner_name: formData.owner_name,
				contact_person: formData.contact_person,
				phone: formData.phone,
				email: formData.email,
				city: formData.city,
				city_id: formData.city_id as string,
				address: formData.address,
				postal_code: formData.postal_code || '',
				// 英文信息
				owner_name_en: formData.owner_name_en || '',
				address_en: formData.address_en || '',
				// 图片信息 - 使用 file_path
				id_image_front: formData.id_image_front as string,
				id_image_back: formData.id_image_back as string,
				business_license: formData.business_license as string,
			}

			// 调用创建API
			const { message: apiMessage, fetch: fetchForm, data } = createContact(requestData)
			apiMessage.value = true
			await fetchForm()
			props.refresh()
			if (data.value?.status) openRealNameDialog.value?.close()
		} catch (error) {
			message.error('表单提交失败，请重试')
			throw error
		}
	}
	return { handleFormSubmit }
}
