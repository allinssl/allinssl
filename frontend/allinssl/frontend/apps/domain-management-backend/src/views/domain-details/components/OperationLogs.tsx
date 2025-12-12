/**
 * 域名详情 - 操作日志组件
 * 职责：展示域名的操作历史记录
 */

import {
  defineComponent,
  PropType,
  ref,
  reactive,
  onMounted,
  watch,
} from "vue";
import {
  NCard,
  NDatePicker,
  NSelect,
  NSpace,
  NTable,
  NBadge,
  NSkeleton,
  NPagination,
  useMessage,
} from "naive-ui";
import { formatDate } from "@baota/utils/date";
import { useDomainDetailState } from "../useStore";
import type { LogFilterFormData, OperationLogItem } from "../types.d";

/**
 * 操作类型选项
 */
const OPERATION_TYPE_OPTIONS = [
  { label: "全部操作", value: null },
  { label: "添加DNS解析记录", value: "add_dns_record" },
  { label: "修改DNS解析记录", value: "update_dns_record" },
  { label: "删除DNS解析记录", value: "delete_dns_record" },
  { label: "域名续费", value: "renew_domain" },
  { label: "开启禁止转移锁", value: "enable_transfer_lock" },
  { label: "关闭禁止转移锁", value: "disable_transfer_lock" },
  { label: "修改DNS服务器", value: "update_dns_server" },
  { label: "实名认证", value: "real_name_auth" },
];

/**
 * 操作日志组件
 */
export default defineComponent({
  name: "DomainOperationLogs",
  props: {
    domainId: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    logs: {
      type: Array as PropType<OperationLogItem[]>,
      default: () => [],
    },
  },
  setup(props) {
    const message = useMessage();
    const store = useDomainDetailState();

    // 本地显示用列表，默认使用父组件传入的 logs，如果为空则使用 store 中的
    const logs = ref<OperationLogItem[]>(
      props.logs?.length
        ? props.logs
        : (store.operationLogs.value as unknown as OperationLogItem[]),
    );

    // 是否正在加载日志（使用 store 的状态）
    const loadingLogs = store.logsLoading;

    // 分页信息（前端分页占位，实际可由后端分页返回total）
    const pagination = reactive({
      page: 1,
      pageSize: 10,
      total: 0,
    });

    // 筛选表单数据
    const filterForm = reactive<LogFilterFormData>({
      operation_type: null,
      start_time: null,
      end_time: null,
    });

    // 获取操作日志列表（通过 store 调用实际 API）
    const getOperationLogs = async () => {
      try {
        await store.fetchOperationLogList(props.domainId);
        // 同步到本地 logs 显示
        logs.value = store.operationLogs.value as unknown as OperationLogItem[];
        // 如果后端有提供 total/pageSize 可在此设置 pagination.total
      } catch (error) {
        console.error("获取操作日志出错:", error);
        message.error("获取操作日志出错，请稍后重试");
      }
    };

    // 当父组件传入的 logs 变化时，更新本地 logs
    watch(
      () => props.logs,
      (newVal) => {
        if (newVal) logs.value = newVal;
      },
    );

    // 处理筛选变化（当前占位，后续把筛选参数传给 API）
    const handleFilterChange = () => {
      pagination.page = 1;
      getOperationLogs();
    };

    // 处理分页变化（当前占位）
    const handlePageChange = (page: number) => {
      pagination.page = page;
      getOperationLogs();
    };

    // 表格列定义
    const columns = [
      {
        title: "操作类型",
        key: "operation_type",
        render: (row: OperationLogItem) => {
          const option = OPERATION_TYPE_OPTIONS.find(
            (item) => item.value === row.operation_type,
          );
          return (
            <NBadge
              type={
                row.status === "success"
                  ? "success"
                  : row.status === "warning"
                    ? "warning"
                    : row.status === "error"
                      ? "error"
                      : "info"
              }
              dot
            >
              {option ? option.label : row.operation_type}
            </NBadge>
          );
        },
      },
      {
        title: "操作内容",
        key: "content",
      },
      {
        title: "操作人",
        key: "operator",
      },
      {
        title: "操作IP",
        key: "ip",
      },
      {
        title: "操作时间",
        key: "created_at",
        render: (row: OperationLogItem) => formatDate(row.created_at),
      },
    ];

    // 组件挂载时获取操作日志列表
    onMounted(() => {
      getOperationLogs();
    });

    return () => (
      <NCard>
        {/* 筛选区 */}
        <div class="mb-4">
          <NSpace>
            <NSelect
              v-model:value={filterForm.operation_type}
              options={OPERATION_TYPE_OPTIONS}
              placeholder="全部操作"
              class="w-200px"
              clearable
              onUpdateValue={handleFilterChange}
            />
            <NDatePicker
              v-model:value={filterForm.start_time}
              type="date"
              placeholder="开始日期"
              clearable
              onUpdateValue={handleFilterChange}
            />
            <NDatePicker
              v-model:value={filterForm.end_time}
              type="date"
              placeholder="结束日期"
              clearable
              onUpdateValue={handleFilterChange}
            />
          </NSpace>
        </div>

        {/* 日志列表 */}
        {loadingLogs.value ? (
          <NSkeleton text repeat={3} />
        ) : (
          <NTable columns={columns} data={logs.value} bordered striped />
        )}

        {/* 分页 */}
        <div class="mt-4 flex justify-end">
          <NPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageCount={Math.ceil(pagination.total / pagination.pageSize)}
            onUpdatePage={handlePageChange}
          />
        </div>
      </NCard>
    );
  },
});
