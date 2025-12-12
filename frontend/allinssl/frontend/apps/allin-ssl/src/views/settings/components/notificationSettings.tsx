import { NCard, NButton, NList, NListItem, NTag, NSpace, NGrid, NGridItem, NSwitch, NIcon } from 'naive-ui'
import { WarningFilled, BellFilled } from "@vicons/antd";
import { useController } from '@settings/useController'
import { useStore } from '@settings/useStore'
import SvgIcon from '@components/SvgIcon'
import { $t } from '@locales/index'
import styles from './index.module.css'

/**
 * 告警通知标签页组件
 */
export default defineComponent({
	name: 'NotificationSettings',
	props: {
		title: {
			type: String,
			default: '告警通知',
		},
	},
	setup(props) {
		const { notifyChannels, channelTypes } = useStore()
		const {
			openAddEmailChannelModal,
			openAddFeishuChannelModal,
			openAddWebhookChannelModal,
			openAddDingtalkChannelModal,
			openAddWecomChannelModal,
			editChannelConfig,
			testChannelConfig,
			confirmDeleteChannel,
			handleEnableChange,
		} = useController()

		// 获取已配置的渠道数量
		const getConfiguredCount = (type: string) => {
			return notifyChannels.value.filter((item) => item.type === type).length
		}

		// 检查渠道是否已配置
		const isChannelConfigured = (type: string) => {
			return getConfiguredCount(type) > 0
		}

		// 根据渠道类型和配置状态获取操作按钮
		const getChannelActionButton = (type: string) => {
			// 根据类型返回对应的按钮
			if (type === 'mail') {
				return (
					<NButton strong secondary type="primary" class="gradient-primary-btn" onClick={() => openAddEmailChannelModal(getConfiguredCount(type))}>
						{$t('t_1_1746676859550')}
					</NButton>
				)
			} else if (type === 'feishu') {
				return (
					<NButton strong secondary type="primary" class="gradient-primary-btn" onClick={() => openAddFeishuChannelModal(getConfiguredCount(type))}>
						{$t('t_1_1746676859550')}
					</NButton>
				)
			} else if (type === 'webhook') {
				return (
					<NButton strong secondary type="primary" class="gradient-primary-btn" onClick={() => openAddWebhookChannelModal(getConfiguredCount(type))}>
						{$t('t_1_1746676859550')}
					</NButton>
				)
			} else if (type === 'dingtalk') {
				return (
					<NButton
						strong
						secondary
						type="primary"
						class="gradient-primary-btn"
						onClick={() => openAddDingtalkChannelModal(getConfiguredCount(type))}
					>
						{$t('t_1_1746676859550')}
					</NButton>
				)
			} else if (type === 'workwx') {
				return (
					<NButton strong secondary type="primary" class="gradient-primary-btn" onClick={() => openAddWecomChannelModal(getConfiguredCount(type))}>
						{$t('t_1_1746676859550')}
					</NButton>
				)
			}
			// 其他渠道暂未支持
			return (
				<NButton strong secondary disabled class="gradient-default-btn">
					{$t('t_2_1746676856700')}
				</NButton>
			)
		}

		// 渠道配置项数据
		const channelConfigs = [
			{
				type: 'mail',
				name: $t('t_3_1746676857930'),
				description: $t('t_4_1746676861473'),
				color: '#2080f0',
			},
			{
				type: 'feishu',
				name: $t('t_9_1746676857164'),
				description: $t('t_10_1746676862329'),
				color: '#3370ff',
			},
			{
				type: 'webhook',
				name: $t('t_11_1746676859158'),
				description: $t('t_12_1746676860503'),
				color: '#531dab',
			},
			{
				type: 'dingtalk',
				name: $t('t_5_1746676856974'),
				description: $t('t_6_1746676860886'),
				color: '#1677ff',
			},
			{
				type: 'workwx',
				name: $t('t_7_1746676857191'),
				description: $t('t_8_1746676860457'),
				color: '#07c160',
			},
		]
		return () => (
			<div class="notification-settings">
				<div class="mb-4 px-[2rem] py-[2.4rem] bg-[var(--content-bg-base)] rounded-[6px]">
					<div class="flex items-center mb-6">
						<NIcon size="24">
							<WarningFilled />
						</NIcon>
						<h2 class="ml-2 text-[1.8rem] font-semibold">{props.title}</h2>
					</div>
					<NGrid cols="2 s:1 m:2" xGap={16} yGap={16}>
						{channelConfigs.map((item) => (
							<NGridItem key={item.type}>
								<div class="flex justify-between items-center p-8 bg-[var(--setting-input-bg)] rounded-md hover:shadow-sm transition-shadow">
									<div class="flex items-center">
										<SvgIcon icon={`notify-${item.type}`} size="4rem" />
										<div class="ml-4">
											<div class="flex items-center mb-1">
												<span class="mr-2 font-bold">{item.name}</span>
												{isChannelConfigured(item.type) && (
													<NTag size="small" round class={styles.gradientTag} type="success">
														{$t('t_8_1745735765753')} {getConfiguredCount(item.type)}
													</NTag>
												)}
											</div>
											<div class="text-color5 text-[1.2rem]">{item.description}</div>
										</div>
									</div>
									<div>{getChannelActionButton(item.type)}</div>
								</div>
							</NGridItem>
						))}
					</NGrid>
				</div>

				{/* 已配置的通知渠道列表 */}
				{notifyChannels.value.length > 0 && (
					<div class="noti-settings-container px-[2rem] py-[2.4rem] bg-[var(--content-bg-base)] rounded-[6px]">
						<div class="flex items-center mb-6">
							<NIcon size="24">
								<BellFilled />
							</NIcon>
							<h2 class="ml-2 text-[1.8rem] font-semibold">已配置的通知渠道</h2>
						</div>
						<NCard class={styles.notifyChannelsCard}>
							<NList show-divider={false} class="flex flex-col gap-6">
								{notifyChannels.value.map((item) => (
									<NListItem key={item.id}>
										<div class=" items-center justify-between p-2 grid grid-cols-12">
											<div class="flex items-center col-span-6">
												<SvgIcon icon={`notify-${item.type}`} size="3rem" />
												<div class="font-medium mx-[1rem]">{item.name}</div>
												<div class="flex items-center ">
													<NTag type="info" class={styles.gradientTag} round size="small">
														{(channelTypes.value as Record<string, string>)[item.type] || item.id}
													</NTag>
												</div>
											</div>
											<div class="flex items-center gap-4 col-span-3 justify-end">
												<NSwitch
													v-model:value={item.config.enabled}
													onUpdateValue={() => handleEnableChange(item)}
													checkedValue={'1'}
													uncheckedValue={'0'}
													v-slots={{
														checked: () => <span>{$t('t_0_1745457486299')}</span>,
														unchecked: () => <span>{$t('t_15_1746676856567')}</span>,
													}}
												/>
											</div>
											<div class="flex items-center gap-8 col-span-3 justify-end">
												<NSpace>
													<NButton class="table-action-btn" size="small" onClick={() => editChannelConfig(item)}>
														{$t('t_11_1745215915429')}
													</NButton>
													<NButton class="table-action-btn" size="small" onClick={() => testChannelConfig(item)}>
														{$t('t_16_1746676855270')}
													</NButton>
													<NButton class="table-action-btn-danger" size="small" type="error" onClick={() => confirmDeleteChannel(item)}>
														{$t('t_12_1745215914312')}
													</NButton>
												</NSpace>
											</div>
										</div>
									</NListItem>
								))}
							</NList>
						</NCard>
					</div>
				)}
			</div>
		)
	},
})
