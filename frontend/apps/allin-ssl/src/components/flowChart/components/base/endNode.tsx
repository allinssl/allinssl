import styles from './baseNode/index.module.css'

export default defineComponent({
	name: 'EndNode',
	setup() {
		return () => (
			<div class="flex flex-col items-center justify-center">
				<div class={styles.endNode}></div>
				<div class={styles.endNodeTxt}>流程结束</div>
			</div>
		)
	},
})
