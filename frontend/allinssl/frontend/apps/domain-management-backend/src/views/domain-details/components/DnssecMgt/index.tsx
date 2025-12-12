/**
 * DNSSEC管理内容组件
 * 职责：管理DNSSEC记录，包括添加、删除、同步DS记录
 */

import { defineComponent, PropType } from 'vue'
import { 
  NButton, 
  NDataTable, 
  NSpace, 
  NText, 
  NAlert,
} from 'naive-ui'
import { AddOutline, SyncOutline } from '@vicons/ionicons5'
import { useController } from './useController'
import { useDnssecManagementState } from './useStore'
import type { DnssecManagementProps } from './types.d'

export default defineComponent({
  name: 'DnssecManagement',
  props: {
    domainId: {
      type: Number,
      required: true,
    },
    domainName: {
      type: String,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props: DnssecManagementProps) {
    // 获取store状态
    const store = useDnssecManagementState()
    
    // 获取控制器
    const {
      loading,
      records,
      recordsCount,
      canAddMore,
      hasRecords,
      isMaxRecords,
      DnssecTable,
      handleAddRecord,
      handleDeleteRecord,
      handleSyncRecords,
    } = useController(props)

    return () => (
			<div class="space-y-4">
				{/* 操作按钮 */}
				<div class="flex justify-between items-center">
					<NSpace>
						<NButton type="primary" onClick={handleAddRecord} disabled={!canAddMore} class="!px-4">
							添加DS记录
						</NButton>
						<NButton
							type="primary"
							ghost
							onClick={async () => {
								await handleSyncRecords()
							}}
							disabled={store.syncLoading.value}
							loading={store.syncLoading.value}
							class="!px-4"
						>
							同步DS记录
						</NButton>
					</NSpace>
				</div>

				{/* DS记录表格 */}
				{hasRecords ? (
					<DnssecTable loading={loading.value} maxHeight="300px" scrollX="800px" class="border rounded" />
				) : (
					<div class="text-center py-8 text-gray-500">
						<div class="text-lg mb-2">暂无DS记录</div>
						<div class="text-sm">点击"添加DS记录"按钮开始添加</div>
					</div>
				)}

				{/* 使用说明 */}
				<NAlert>
					<div class="space-y-2">
						<div class="font-medium text-sm">DNSSEC功能使用说明：</div>
						<div class="text-sm space-y-1">
							<div>
								1.
								域名系统安全扩展（DNSSEC）是添加到域名的DNS域名系统确定源域名的可靠性数字签名，并有助于防止恶意活动缓存中毒、域欺骗和拦截中的攻击。
							</div>
							<div>2.我司DNS暂时不支持DNSSEC功能，若需要使用该功能，DNSSEC信息请在DNS服务商获取。</div>
							<div>3. 一个域名最多可添加8条DS记录。</div>
						</div>
					</div>
				</NAlert>
			</div>
		)
  },
})
