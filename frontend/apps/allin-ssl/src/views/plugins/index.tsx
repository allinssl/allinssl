import { defineComponent, ref, onMounted } from 'vue'
import { NAlert, NButton, NCard, NDataTable, NSpace, NTag, type DataTableColumns } from 'naive-ui'
import { instance } from '@/api'
import type { ModuleInfo } from '@/modules/types'
import { frontendErrors } from '@/modules'

export default defineComponent({
  name: 'Plugins',
  setup() {
    const items = ref<ModuleInfo[]>([])
    const loading = ref(false)
    const error = ref('')
    const changed = ref(false)
    const statusNames: Record<string, string> = { disabled: '已停用', starting: '启动中', running: '运行中', stopping: '停止中', error: '运行异常', invalid: '清单无效' }
    const fetchList = async () => {
      loading.value = true
      try {
        const { data } = await instance.post<{ data: ModuleInfo[] }>('/v1/plugins/list')
        items.value = data.data
      } catch (reason) { error.value = String(reason) }
      finally { loading.value = false }
    }
    const change = async (id: string, action: string) => {
      loading.value = true
      error.value = ''
      try {
        await instance.post(`/v1/plugins/${action}`, { id })
        changed.value = true
        await fetchList()
      } catch (reason) { error.value = String(reason); await fetchList() }
      finally { loading.value = false }
    }
    const columns: DataTableColumns<ModuleInfo> = [
      { title: '插件', key: 'name', render: item => item.name || item.id },
      { title: '标识', key: 'id' },
      { title: '类型', key: 'type', render: item => item.backend ? '模块（含后端）' : '模块（纯前端）' },
      { title: '版本', key: 'version' },
      { title: '启用', key: 'enabled', render: item => item.enabled ? '已启用' : '已停用' },
      { title: '运行状态', key: 'status', render: item => <NTag type={item.status === 'running' ? 'success' : item.error ? 'error' : 'default'}>{item.status === 'running' && !item.backend ? '已加载' : statusNames[item.status] || item.status}</NTag> },
      { title: '最近错误', key: 'error', render: item => item.error || frontendErrors[item.id] || '—' },
      { title: '操作', key: 'actions', render: item => <NSpace>
        <NButton size="small" disabled={loading.value || item.status === 'invalid'} onClick={() => change(item.id, item.enabled ? 'disable' : 'enable')}>{item.enabled ? '停用' : '启用'}</NButton>
        <NButton size="small" disabled={loading.value || !item.enabled} onClick={() => change(item.id, 'restart')}>重启</NButton>
      </NSpace> },
    ]
    onMounted(fetchList)
    return () => <NCard title="插件管理">
      <NSpace vertical size="large">
        <NAlert type="info">将模块包放入已配置的插件目录后刷新列表。纯前端主题无需可执行程序，含后端的模块独立维护数据。停用和重启不会删除插件数据。</NAlert>
        {error.value && <NAlert type="error">{error.value}</NAlert>}
        {changed.value && <NAlert type="warning">插件状态已变更，刷新页面后加载界面调整。<NButton text onClick={() => location.reload()}>立即刷新</NButton></NAlert>}
        <NSpace><NButton onClick={fetchList} loading={loading.value}>刷新列表</NButton></NSpace>
        <NDataTable columns={columns} data={items.value} loading={loading.value} rowKey={item => item.id} scrollX={1000} />
      </NSpace>
    </NCard>
  },
})
