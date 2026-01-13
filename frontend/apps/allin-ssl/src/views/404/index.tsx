import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { $t } from '@locales/index'

// 错误图标
const errorIcon = (size: number = 16, color: string) => {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill={color}>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6zM7.9 7.5L10.3 5l.7.7-2.4 2.5 2.4 2.5-.7.7-2.4-2.5-2.4 2.5-.7-.7 2.4-2.5-2.4-2.5.7-.7 2.4 2.5z"
			/>
		</svg>
	)
}

export default defineComponent({
	setup() {
		const router = useRouter()
		const cssVar = useThemeCssVar(['baseColor', 'textColorBase', 'textColorSecondary', 'textColorDisabled'])

		return () => (
			<div class="flex flex-col items-center justify-center min-h-screen p-4" style={cssVar.value}>
				<div class="text-center px-4 sm:px-8 max-w-[60rem] mx-auto">
					<div
						class="text-[4.5rem] sm:text-[6rem] md:text-[8rem] font-bold leading-none mb-2 sm:mb-4"
						style={{
							color: 'var(--n-text-color-base)',
							textShadow: '2px 2px 8px rgba(0,0,0,0.25)',
						}}
					>
						404
					</div>
					<div class="flex items-center justify-center mb-4 sm:mb-8">{errorIcon(60, 'var(--n-text-color-base)')}</div>
					<div
						class="text-[1.2rem] sm:text-[1.5rem] md:text-[1.8rem] mb-4 sm:mb-8"
						style={{ color: 'var(--n-text-color-secondary)' }}
					>
						{$t('t_0_1744098811152')}
					</div>
					<NButton
						style={{
							backgroundColor: 'var(--n-text-color-base)',
							color: 'var(--n-base-color)',
							border: 'none',
						}}
						onClick={() => router.push('/')}
					>
						{$t('t_1_1744098801860')}
					</NButton>
					<div
						class="mt-4 sm:mt-8 text-[1rem] sm:text-[1.1rem] md:text-[1.3rem]"
						style={{ color: 'var(--n-text-color-disabled)' }}
					>
						{$t('t_2_1744098804908')}
					</div>
				</div>
			</div>
		)
	},
})
