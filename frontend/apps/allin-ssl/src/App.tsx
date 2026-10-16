import { Transition, type Component as ComponentType, h } from 'vue'
import { ModuleRouterView as RouterView } from '@/modules'
import AllinSslThemeProvider from '@/components/AllinSslThemeProvider'
 

export default defineComponent({
	name: 'App',
	setup() {
		return () => (
			<AllinSslThemeProvider>
				<RouterView>
					{({ Component }: { Component: ComponentType }) => (
						<Transition name="route-slide" mode="out-in">
							{Component && h(Component)}
						</Transition>
					)}
				</RouterView>
			</AllinSslThemeProvider>
		)
	},
})
