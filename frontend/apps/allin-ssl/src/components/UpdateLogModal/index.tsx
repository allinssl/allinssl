// External Libraries
import { defineComponent } from 'vue'
import { NModal, NButton, NSpace, NScrollbar, NIcon } from 'naive-ui'
import { LogoGithub } from '@vicons/ionicons5'

// Type Imports
import type { PropType } from 'vue'
import type { UpdateLogModalProps } from './types'
import type { VersionData } from '@/types/setting'

// Relative Internal Imports - Controller
import { useUpdateLogModalController } from './useController'

/**
 * @description 更新日志弹窗组件。显示版本更新信息和更新日志。
 * @example
 * <UpdateLogModal
 *   v-model:show="showModal"
 *   :versionData="versionData"
 * />
 */
export default defineComponent({
	name: 'UpdateLogModal',
	props: {
		/**
		 * 是否显示弹窗
		 * @default false
		 */
		show: {
			type: Boolean as PropType<UpdateLogModalProps['show']>,
			default: false,
		},
		/**
		 * 版本数据
		 * @default null
		 */
		versionData: {
			type: Object as PropType<VersionData | null>,
			default: null,
		},
	},
	/**
	 * @event update:show - 当弹窗显示状态更新时触发
	 * @param {boolean} show - 弹窗显示状态
	 */
	emits: {
		'update:show': (payload: boolean) => typeof payload === 'boolean',
	},
	setup(props: UpdateLogModalProps, { emit }) {
		const { formattedLog, goToGitHub, handleClose } = useUpdateLogModalController(props, emit)

		return () => (
			<NModal
				show={props.show}
				onUpdateShow={(show: boolean) => emit('update:show', show)}
				preset="card"
				title="发现新版本"
				style={{ width: '600px', maxWidth: '90vw' }}
				maskClosable={false}
				closable={true}
				onClose={handleClose}
			>
				{props.versionData && (
					<div class="update-log-content">
						{/* 版本信息 */}
						<div class="mb-[1.6rem]">
							<div class="flex items-center justify-between mb-[.8rem]">
								<span class="text-[1.5rem] font-medium">当前版本: {props.versionData.version}</span>
								<span class="text-[1.5rem] font-medium text-primary">最新版本: {props.versionData.new_version}</span>
							</div>
							<div class="text-[1.4rem] text-gray-500">发布日期: {props.versionData.date}</div>
						</div>

						{/* 更新日志 */}
						<div class="mb-[2.4rem]">
							<h3 class="text-[1.6rem] font-medium mb-[1.2rem]">更新日志</h3>
							<NScrollbar style={{ maxHeight: '300px' }}>
								<div class="update-log-list">
									{formattedLog.value.map((line, index) => (
										<div key={index} class="mb-[.8rem]">
											{line.startsWith('■') ? (
												<div class="text-[1.4rem] font-medium text-primary mb-[.4rem]">{line}</div>
											) : line.startsWith('新增：') || line.startsWith('调整：') ? (
												<div class="ml-[1.6rem] text-[1.3rem] text-green-600">{line}</div>
											) : (
												<div class="ml-[1.6rem] text-[1.3rem] text-gray-700">{line}</div>
											)}
										</div>
									))}
								</div>
							</NScrollbar>
						</div>

						{/* 操作按钮 */}
						<div class="flex justify-end">
							<NSpace size="medium">
								<NButton size="medium" onClick={handleClose}>
									<span class="text-[1.4rem]">稍后更新</span>
								</NButton>
								<NButton size="medium" type="primary" onClick={goToGitHub}>
									<div class="flex items-center">
										<NIcon size="18" class="mr-[.8rem]">
											<LogoGithub />
										</NIcon>
										<span class="text-[1.4rem]">前往GitHub下载</span>
									</div>
								</NButton>
							</NSpace>
						</div>
					</div>
				)}
			</NModal>
		)
	},
})
