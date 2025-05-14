import { NEmpty, NButton } from 'naive-ui'
import { defineComponent } from 'vue'

/**
 * 空状态提示组件，带有添加按钮和社区链接
 * @param addButtonText 添加按钮文本
 * @param onAddClick 添加按钮点击事件
 */
interface EmptyActionPromptProps {
	addButtonText: string
	onAddClick: () => void
}

export default defineComponent({
	name: 'EmptyActionPrompt',
	props: {
		addButtonText: {
			type: String,
			required: true,
		},
		onAddClick: {
			type: Function,
			required: true,
		},
	},
	setup(props: EmptyActionPromptProps) {
		return () => (
			<div class="flex justify-center items-center h-full">
				<NEmpty class="px-[4rem]">
					请先
					<NButton text type="primary" size="small" onClick={props.onAddClick}>
						{props.addButtonText}
					</NButton>
					，有问题或建议可提
					<NButton text tag="a" target="_blank" type="primary" href="https://github.com/allinssl/allinssl/issues">
						Issues
					</NButton>
					，也可在Github给我们
					<NButton text tag="a" target="_blank" type="primary" href="https://github.com/allinssl/allinssl">
						Star
					</NButton>
					，您的参与对AllinSSL极其重要，感谢。
				</NEmpty>
			</div>
		)
	},
})
