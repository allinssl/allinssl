import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { uploadCert } from '@api/cert'
import { $t } from '@locales/index'
import { noSideSpace } from '@lib/utils'

export default defineComponent({
	name: 'UploadNodeCertForm',
	props: {
		cert: { type: String, default: '' },
		privateKey: { type: String, default: '' },
		onUploaded: { type: Function as PropType<(certId: string) => Promise<void>>, required: true },
	},
	setup(props) {
		const { useFormTextarea } = useFormHooks()
		const { confirm } = useModalHooks()
		const { handleError } = useError()
		const { component: Form, data, example } = useForm({
			defaultValue: { cert: props.cert, key: props.privateKey },
			config: [
				useFormTextarea($t('t_34_1745735771147'), 'cert', {
					placeholder: $t('t_35_1745735781545'), allowInput: noSideSpace, rows: 6,
				}),
				useFormTextarea($t('t_36_1745735769443'), 'key', {
					placeholder: $t('t_37_1745735779980'), allowInput: noSideSpace, rows: 6,
				}),
			],
			rules: {
				cert: { required: true, message: '证书正文不能为空', trigger: ['input', 'blur'] },
				key: { required: true, message: '证书私钥不能为空', trigger: ['input', 'blur'] },
			},
		})
		confirm(async (close) => {
			try {
				await example.value?.validate()
				const result = await uploadCert({ cert: data.value.cert, key: data.value.key }).fetch()
				if (!result) return
				await props.onUploaded(result.data)
				close()
			} catch (error) {
				handleError(error)
			}
		})
		return () => <Form labelPlacement="top" />
	},
})
