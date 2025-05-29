import { NCard, NButton, NGrid, NGridItem } from 'naive-ui'
import { $t } from '@locales/index'
import { useStore } from '../useStore'
import { useController, useGeneralSettingsController } from '../useController'

/**
 * 常用设置标签页组件
 */
export default defineComponent({
	name: 'GeneralSettings',
	setup() {
		const { generalSettings } = useStore()
		const { handleSaveGeneralSettings } = useController()
		const { GeneralForm } = useGeneralSettingsController()
		return () => (
			<div class="flex flex-col gap-[2rem]">
				<div class="mt-[2rem]">
					<NButton type="primary" onClick={() => handleSaveGeneralSettings(generalSettings.value)}>
						{$t('t_9_1745464078110')}
					</NButton>
				</div>

				<NCard title={$t('t_10_1745464073098')} class="mb-4">
					<NGrid cols="1 m:2" xGap={24} yGap={24}>
						<NGridItem>
							<GeneralForm labelPlacement="top" />
						</NGridItem>
					</NGrid>
				</NCard>
			</div>
		)
	},
})
