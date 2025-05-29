export default defineComponent({
	name: 'EndNode',
	setup() {
		return () => (
			<div class="flex flex-col items-center justify-center">
				<div class="w-[1.5rem] h-[1.5rem] rounded-[1rem] bg-[#cacaca]"></div>
				<div class="text-[#5a5e66] mb-[10rem]">流程结束</div>
			</div>
		)
	},
})
