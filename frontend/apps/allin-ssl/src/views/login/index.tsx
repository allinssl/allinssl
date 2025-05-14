import { NInput, NButton, NCheckbox, NForm, NFormItem, NIcon, NImage } from 'naive-ui'
import { UserOutlined, LockOutlined, CodeOutlined } from '@vicons/antd'
import { useTheme, useThemeCssVar } from '@baota/naive-ui/theme'
import { $t } from '@locales/index'
import { useController } from './useController'
import styles from './index.module.css'

import LocalesTips from '@baota/naive-ui/components/localesTips'
import ThemeTips from '@baota/naive-ui/components/themeTips'

export default defineComponent({
	setup() {
		// 获取登录控制器
		const { loading, error, rememberMe, handleSubmit, handleKeyup, loginData, handleGetCode, codeImg, mustCode } =
			useController()

		// 获取主题暗色模式
		const { isDark } = useTheme()

		// 获取主题变量
		const cssVar = useThemeCssVar(['textColor2', 'actionColor', 'errorColor', 'primaryColor', 'primaryColorSuppl'])

		return () => (
			<div style={cssVar.value}>
				<div
					class={styles.container}
					style={`background-image:${isDark.value ? 'url(/static/images/login-bg-dark.svg)' : 'url(/static/images/login-bg.svg)'};`}
				>
					<div class="absolute z-[99] top-0 right-0 p-[2rem] flex w-[120px] justify-between">
						<LocalesTips />
						<ThemeTips />
					</div>
					<div class={styles.loginBox}>
						<div class={styles.leftSection}>
							<h2 class={styles.leftTitle}>
								<img src="/static/images/logo.png" alt="logo" class={styles.logo} />
								<span>{$t('t_2_1747047214975')}</span>
							</h2>
							<div class={styles.leftImageWrapper}>
								<img src="/static/images/login-display.svg" alt={$t('t_1_1744164835667')} class={styles.leftImage} />
							</div>
						</div>
						<div class={styles.rightSection}>
							<div class={styles.formContainer}>
								<h1 class={styles.title}>{$t('t_2_1744164839713')}</h1>
								<NForm onSubmit={handleSubmit} class={styles.formWrapper}>
									<div class={styles.formContent}>
										<div class={styles.formInputs}>
											<NFormItem show-label={false}>
												<NInput
													v-model:value={loginData.value.username}
													onKeyup={handleKeyup}
													disabled={loading.value}
													placeholder={$t('t_3_1744164839524')}
													clearable
													size="large"
												>
													{{
														prefix: () => <NIcon component={UserOutlined} class={styles.icon} />,
													}}
												</NInput>
											</NFormItem>
											<NFormItem show-label={false}>
												<NInput
													onKeyup={handleKeyup}
													disabled={loading.value}
													v-model:value={loginData.value.password}
													type="password"
													placeholder={$t('t_4_1744164840458')}
													clearable
													size="large"
													showPasswordOn="click"
												>
													{{
														prefix: () => <NIcon component={LockOutlined} class={styles.icon} />,
													}}
												</NInput>
											</NFormItem>
											{mustCode.value ? (
												<NFormItem show-label={false}>
													<NInput
														onKeyup={handleKeyup}
														disabled={loading.value}
														v-model:value={loginData.value.code}
														type="text"
														placeholder={$t('t_25_1745289355721')}
														clearable
														size="large"
														showPasswordOn="click"
													>
														{{
															prefix: () => <NIcon component={CodeOutlined} class={styles.icon} />,
															suffix: () => (
																<span
																	onClick={handleGetCode}
																	title={$t('t_0_1745936396853')}
																	class="w-[10rem] h-[4rem] mr-[-1.5rem] relative z-[999] cursor-pointer bg-slate-400 rounded-r-[6px]"
																>
																	<NImage src={codeImg.value} preview-disabled />
																</span>
															),
														}}
													</NInput>
												</NFormItem>
											) : null}
										</div>

										<div class={styles.formActions}>
											<div class={styles.rememberSection}>
												<NCheckbox checked={rememberMe.value} onUpdateChecked={(v) => (rememberMe.value = v)}>
													{$t('t_5_1744164840468')}
												</NCheckbox>
												<a
													class={styles.forgotPassword}
													href="https://www.bt.cn/bbs/thread-144776-1-1.html"
													target="_blank"
												>
													{$t('t_6_1744164838900')}
												</a>
											</div>
											{error.value && <div class={styles.error}>{error.value}</div>}
											<NButton type="primary" size="large" block loading={loading.value} onClick={handleSubmit}>
												{loading.value ? $t('t_7_1744164838625') : $t('t_8_1744164839833')}
											</NButton>
										</div>
									</div>
								</NForm>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	},
})
