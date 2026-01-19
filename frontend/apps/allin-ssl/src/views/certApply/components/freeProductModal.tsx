import { useCertificateFormController } from '@certApply/useController'

interface CertificateFormProps {
	product?: { brand: string }
}

/**
 * 证书申请表单组件
 */
export default defineComponent({
	name: 'CertificateForm',
	props: {
		product: {
			type: Object as PropType<CertificateFormProps['product']>,
			default: () => undefined,
		},
	},
	setup(props) {
		const { CertificateForm } = useCertificateFormController(props.product)
		return () => <CertificateForm labelPlacement="top" class="max-w-[50rem] mx-auto" />
	},
})
