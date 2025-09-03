import { defineComponent, computed } from 'vue'
import { NTag, NAlert, NButton, NFlex } from 'naive-ui'
import { formatDate } from '@baota/utils/date'
import type { DomainTransferItem } from '@/types/transfer'

export default defineComponent({
	name: 'TransferDetailsDialog',
	props: {
		record: { type: Object as () => DomainTransferItem, required: true },
		close: { type: Function as unknown as () => () => void, required: false },
	},
	setup(props) {
		const tagType = computed(() => {
			const map: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
				0: 'warning', // 申请已提交
				1: 'error', // 申请失败
				2: 'default', // 取消转入
				3: 'error', // 转入失败
				4: 'success', // 转入成功
			}
			return map[Number(props.record?.status ?? 0)] || 'default'
		})

		const Row = (label: string, value: any) => (
			<div class="flex items-center whitespace-nowrap py-3">
				<div class="text-sm text-gray-500 mr-4 whitespace-nowrap w-26">{label}</div>
				<div class="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[70%]">{value}</div>
			</div>
		)

		return () => (
			<div class="p-2">
				{Row('域名', props.record?.domain || '-')}
				{Row('状态', <NTag type={tagType.value} bordered={false} size="small">{props.record?.status_text || '-'}</NTag>)}
				{Row('转入提交时间', formatDate(props.record?.created_at || 0, 'yyyy-MM-dd HH:mm:ss'))}
				{Row('失败时间', formatDate(props.record?.updated_at || 0, 'yyyy-MM-dd HH:mm:ss'))}
				{Row('失败原因', props.record?.msg || '')}

				<NAlert type="warning" showIcon title="注意事项" class="mt-3">
					<ul class="list-disc pl-5 leading-7 text-sm">
						<li>请确认域名在原注册商处已解锁</li>
						<li>确认转移码（Auth Code）正确无误</li>
						<li>域名距离上次转移需超过60天</li>
						<li>域名未处于争议、冻结等特殊状态</li>
					</ul>
				</NAlert>

				<div class="border-b border-gray-200 mt-3" />

				<NFlex justify="end" class="mt-3">
					<NButton onClick={() => (props.close ? props.close() : undefined)} type="primary">关闭</NButton>
				</NFlex>
			</div>
		)
	},
})
