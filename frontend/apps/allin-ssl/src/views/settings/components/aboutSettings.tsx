import { NCard, NSpace, NDescriptions, NDescriptionsItem, NIcon, NButton } from 'naive-ui'
import { $t } from '@locales/index'
import { LogoGithub } from '@vicons/ionicons5'
/**
 * 关于我们标签页组件
 */
export default defineComponent({
	name: 'AboutSettings',
	setup() {
		return () => (
			<div class="about-settings">
				<NCard title={$t('t_4_1745833932780')} class="mb-4">
					<NSpace vertical size={24}>
						<NDescriptions bordered>
							<NDescriptionsItem label={$t('t_5_1745833933241')}>
								<div class="flex items-center">
									<span class="text-[2rem] font-medium">v1.0.1</span>
								</div>
							</NDescriptionsItem>
							<NDescriptionsItem label={$t('t_29_1746667589773')}>
								<div class="flex items-center space-x-2 h-[3.2rem]">
									<NIcon size="20" class="text-gray-600">
										<LogoGithub />
									</NIcon>
									<NButton text tag="a" href="https://github.com/allinssl/allinssl" target="_blank" type="primary">
										https://github.com/allinssl/allinssl
									</NButton>
								</div>
							</NDescriptionsItem>
						</NDescriptions>
					</NSpace>
				</NCard>

				<NCard title={$t('t_13_1745833933630')} class="mb-4">
					<div class="about-content">
						<p class="text-gray-700 leading-relaxed">
							<p class="text-[3rem] font-medium">AllinSSL</p>
							<br />
							<p class="text-[1.6rem] text-primary mb-[2rem]">{$t('t_35_1746773362992')}</p>
							<span class="text-[1.4rem] mb-[1rem] text-gray-500">
								{$t(
									'本工具可帮助用户轻松管理多个网站的SSL证书，提供自动化的证书申请、更新和部署流程，并实时监控证书状态，确保网站安全持续运行。',
								)}
								<ul class="list-disc pl-[2rem] mt-[2rem]">
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_36_1746773348989')}</span>
										{$t('t_1_1746773763643')}
									</li>
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_38_1746773349796')}</span>
										{$t('t_39_1746773358932')}
									</li>
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_40_1746773352188')}</span>
										{$t('t_41_1746773364475')}
									</li>
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_42_1746773348768')}</span>
										{$t('t_43_1746773359511')}
									</li>
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_44_1746773352805')}</span>
										{$t('t_45_1746773355717')}
									</li>
									<li class="mb-[1rem]">
										<span class="text-[1.4rem]">{$t('t_46_1746773350579')}</span>
										{$t('t_47_1746773360760')}
									</li>
								</ul>
							</span>
						</p>
					</div>
				</NCard>
			</div>
		)
	},
})
