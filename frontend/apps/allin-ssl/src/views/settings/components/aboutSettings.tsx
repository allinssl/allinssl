import { NCard, NSpace, NDescriptions, NDescriptionsItem, NIcon, NButton, NBadge, NAlert } from 'naive-ui'
import { $t } from '@locales/index'
import { LogoGithub } from '@vicons/ionicons5'
import { getVersion } from '@api/setting'
import type { VersionData } from '@/types/setting'
import styles from './index.module.css'
/**
 * 关于我们标签页组件
 */
export default defineComponent({
	name: 'AboutSettings',
	setup() {
		// 版本检查相关状态
		const versionData = ref<VersionData | null>(null)
		const hasUpdate = ref(false)

		// 版本检查API
		const versionApi = getVersion()

		// 检查版本更新
		const checkVersion = async () => {
			try {
				await versionApi.fetch()
				if (versionApi.data.value && versionApi.data.value.data) {
					const data = versionApi.data.value.data
					versionData.value = data
					hasUpdate.value = data.update === '1'
				}
			} catch (error) {
				console.error('检查版本更新失败:', error)
			}
		}

		// 跳转到GitHub
		const goToGitHub = () => {
			window.open('https://github.com/allinssl/allinssl', '_blank')
		}

		// 组件挂载时检查版本
		onMounted(() => {
			checkVersion()
		})

		return () => (
			<div class="about-settings">
				<div class="mb-4">
					<div class="flex items-center mb-6 mt-2">
						<h2 class={`${styles.sectionTitle} ml-2 text-[1.8rem] font-semibold`}>版本信息</h2>
					</div>
					<NSpace vertical size={24}>
						<NDescriptions bordered>
							<NDescriptionsItem label={$t('t_5_1745833933241')}>
								<div class="flex items-center space-x-[1.2rem]">
									<span class="text-[2.0rem] font-medium">{versionData.value && versionData.value.version}</span>
									{hasUpdate.value && versionData.value && (
										<div class="relative">
											<NBadge value="NEW" type="success" offset={[4, -3]}>
												<span
													class="text-[1.4rem] text-primary cursor-pointer font-medium inline-block px-[.8rem] py-[.4rem]"
													onClick={goToGitHub}
												>
													{versionData.value.new_version} 可用
												</span>
											</NBadge>
										</div>
									)}
								</div>
							</NDescriptionsItem>
							<NDescriptionsItem label={$t('t_29_1746667589773')}>
								<div class="flex items-center space-x-2 h-[3.2rem]">
									<NIcon size="20" class="text-gray-600">
										<LogoGithub />
									</NIcon>
									<NButton text onClick={goToGitHub} type="primary">
										https://github.com/allinssl/allinssl
									</NButton>
								</div>
							</NDescriptionsItem>
						</NDescriptions>
					</NSpace>
				</div>

				{/* 新版本信息卡片 */}
				{hasUpdate.value && versionData.value && (
					<div class="mb-4">
						<div class="flex items-center mb-6 mt-2">
							<h2 class={`${styles.sectionTitle} ml-2 text-[1.8rem] font-semibold`}>发现新版本</h2>
						</div>
						<NAlert type="info" title={`新版本 ${versionData.value.new_version} 已发布`} class="mb-[1.6rem]">
							<div class="text-[1.4rem]">
								<div class="mb-[1.2rem] text-[1.4rem]">发布日期: {versionData.value.date}</div>
								<div class="mb-[1.2rem] text-[1.4rem]">
									<strong>更新内容:</strong>
								</div>
								<div class="whitespace-pre-line text-color5 text-[1.3rem] leading-relaxed">
									{versionData.value.log.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}
								</div>
								<div class="mt-4">
									<NButton class="gradient-primary-btn" size="medium" type="primary" onClick={goToGitHub}>
										<div class="flex items-center">
											<NIcon size="18" class="mr-2">
												<LogoGithub />
											</NIcon>
											前往GitHub下载
										</div>
									</NButton>
								</div>
							</div>
						</NAlert>
					</div>
				)}

				<div class="mb-4">
					<div class="flex items-center mb-6 mt-2">
						<h2 class={`${styles.sectionTitle} ml-2 text-[1.8rem] font-semibold`}>关于产品</h2>
					</div>
					<div class="about-content bg-[var(--setting-input-bg)] px-[2rem] py-[2.4rem] rounded-[6px]">
						<p class="leading-relaxed">
							<p class="text-[2rem] font-semibold">AllinSSL</p>
							<br />
							<p class="text-[1.6rem] font-semibold text-primary mb-[2rem]">{$t('t_35_1746773362992')}</p>
							<span class="text-[1.4rem] mb-[1rem] text-color5">
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
				</div>
			</div>
		)
	},
})
