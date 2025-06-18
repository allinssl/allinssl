import { Transition, type Component as ComponentType, h } from 'vue'
import { RouterView } from 'vue-router'
import CustomProvider from '@baota/naive-ui/components/customProvider'
 
export default defineComponent({
	name: 'App',
	setup() {
		return () => (
			<CustomProvider>
				<RouterView>
					{({ Component }: { Component: ComponentType }) => (
						<Transition name="route-slide" mode="out-in">
							{Component && h(Component)}
						</Transition>
					)}
				</RouterView>
			</CustomProvider>
		)
	},
})
