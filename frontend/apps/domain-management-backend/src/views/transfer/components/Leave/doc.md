# 域名转出组件开发文档

## 项目概述

本文档详细记录了域名转出组件的重构过程，该组件100%参考域名转入组件的实现方式，使用现代化的Vue 3 + TypeScript + Naive UI技术栈，实现了完整的表格管理、移动端适配和响应式设计。

## 开发过程中的错误分析

### 1. 架构设计错误

#### 1.1 useTable Hook使用不当

**错误现象：** 初始版本没有使用标准的`useTable` Hook，而是自定义实现表格逻辑
**错误原因：**

- 未参考域名转入组件的标准实现
- 缺乏对项目架构规范的理解
- 自定义实现导致代码不一致

**解决方案：**

- 完全重构`useController.tsx`，使用`useTable` Hook
- 配置标准的`alias`和`watchValue`参数
- 返回`TableComponent`和`PageComponent`组件

#### 1.2 Store状态管理不规范

**错误现象：** 使用传统的ref状态管理，未使用Pinia
**错误原因：**

- 未遵循项目的状态管理规范
- 缺乏对defineStore的正确使用
- 数据返回格式不标准

**解决方案：**

- 使用`defineStore`重构状态管理
- 实现标准的`TableResponse<T>`数据格式
- 添加统一的错误处理机制

### 2. 组件结构错误

#### 2.1 移动端适配缺失

**错误现象：** 缺少移动端卡片组件和响应式布局
**错误原因：**

- 未考虑移动端用户体验
- 缺乏响应式设计思维

**解决方案：**

- 添加`TransferOutCardList`移动端卡片组件
- 实现响应式布局切换
- 使用`useApp()`获取移动端判断

#### 2.2 导入路径错误

**错误现象：** 使用错误的移动端判断导入

```typescript
// 错误
import { useResponsive } from '@baota/naive-ui/hooks'

// 正确
import { useApp } from '@/components/layout/useStore'
```

**解决方案：**

- 100%参考域名转入组件的导入方式
- 统一项目中的移动端判断逻辑

### 3. 数据处理错误

#### 3.1 API调用格式不统一

**错误现象：** 直接使用API调用，未使用标准的fetch模式
**解决方案：**

- 使用`{ fetch, data }`解构模式
- 实现统一的错误处理
- 返回标准的`TableResponse`格式

## 界面架构设计

### 1. 整体架构

```
域名转出组件
├── index.tsx (主视图层)
├── useController.tsx (业务逻辑层)
├── useStore.tsx (状态管理层)
└── 共享组件
    ├── TransferOutCardList (移动端卡片)
    └── FilterForm (搜索表单)
```

### 2. 组件层次结构

#### 2.1 主视图层 (index.tsx)

- **职责：** 负责UI渲染和布局
- **特点：**
  - 响应式设计，桌面端和移动端自适应
  - 使用`NFlex`实现灵活布局
  - 集成搜索、表格、分页功能

#### 2.2 业务逻辑层 (useController.tsx)

- **职责：** 处理业务逻辑和用户交互
- **核心功能：**
  - 表格配置和数据处理
  - 搜索表单管理
  - 移动端卡片组件
  - 用户操作处理（取消转出等）

#### 2.3 状态管理层 (useStore.tsx)

- **职责：** 管理组件状态和数据流
- **使用技术：** Pinia + defineStore
- **核心状态：**
  - `loading`: 加载状态
  - `filterFormData`: 搜索表单数据
  - `fetchTransferOutListData`: 数据获取函数

### 3. 数据流设计

```
用户操作 → useController → useStore → API调用 → 数据更新 → UI重渲染
```

## 内容布局和响应式设计

### 1. 桌面端布局

```
┌─────────────────────────────────────┐
│ 操作区域 (NFlex horizontal)          │
│ ├── 转出按钮                        │
│ └── 搜索表单 (inline)               │
├─────────────────────────────────────┤
│ 数据表格 (TableComponent)           │
│ ├── 域名列                          │
│ ├── 状态列                          │
│ ├── 时间列                          │
│ └── 操作列                          │
├─────────────────────────────────────┤
│ 分页组件 (PageComponent)            │
└─────────────────────────────────────┘
```

### 2. 移动端布局

```
┌─────────────────────────────────────┐
│ 操作区域 (NFlex vertical)           │
│ ├── 转出按钮 + 搜索切换按钮          │
│ └── 搜索表单 (展开/收起)            │
├─────────────────────────────────────┤
│ 卡片列表 (TransferOutCardList)      │
│ ├── 卡片1 (域名信息 + 状态 + 操作)   │
│ ├── 卡片2                          │
│ └── ...                            │
├─────────────────────────────────────┤
│ 分页组件 (PageComponent)            │
└─────────────────────────────────────┘
```

### 3. 响应式实现机制

#### 3.1 断点判断

```typescript
const { isMobile } = useApp()
```

#### 3.2 条件渲染

```typescript
{isMobile.value ? (
  <TransferOutCardList data={tableData.value?.list || []} />
) : (
  <TableComponent />
)}
```

#### 3.3 布局适配

- **桌面端：** 使用表格展示，搜索表单inline布局
- **移动端：** 使用卡片展示，搜索表单可折叠

## 技术栈和关键实现

### 1. 核心技术栈

- **前端框架：** Vue 3 + Composition API
- **类型系统：** TypeScript
- **UI组件库：** Naive UI
- **状态管理：** Pinia
- **构建工具：** Vite
- **代码规范：** ESLint + Prettier

### 2. 关键Hook使用

#### 2.1 useTable Hook

```typescript
const {
  TableComponent,
  PageComponent,
  data: tableData,
  loading,
  fetch: gFetch,
} = useTable<DomainTransferOutItem, DomainTransferOutListRequest>({
  config: columns,
  request: fetchTransferOutListData,
  defaultValue: filterFormData,
  alias: { page: 'p', pageSize: 'rows' },
  watchValue: ['p', 'rows'],
})
```

#### 2.2 useForm Hook

```typescript
const { component: FilterForm, fetch: formFetchSearch } = useForm<DomainTransferOutListRequest>({
  config: formConfig(),
  defaultValue: filterFormData,
  request: handleSearch,
})
```

#### 2.3 useError Hook

```typescript
const { handleError } = useError()
```

### 3. 状态管理实现

#### 3.1 Store定义

```typescript
export const useTransferOutStore = defineStore('domain-transfer-out-store', () => {
  const loading = ref(false)
  const filterFormData = ref<DomainTransferOutListRequest>({ p: 1, rows: 20 })
  
  const fetchTransferOutListData = async <T = DomainTransferOutItem,>(
    params: DomainTransferOutListRequest = {},
  ): Promise<TableResponse<T>> => {
    // 实现数据获取逻辑
  }
  
  return {
    loading,
    filterFormData,
    fetchTransferOutListData,
    handleCancelTransferOut,
  }
})
```

### 4. 移动端适配实现

#### 4.1 卡片组件设计

```typescript
const TransferOutCardList = defineComponent({
  name: 'TransferOutCardList',
  props: {
    data: Array as PropType<DomainTransferOutItem[]>,
    loading: Boolean,
  },
  setup(props) {
    return () => (
      <NFlex vertical size="medium">
        {props.data.map((item) => (
          <NCard key={item.id} class="card-shadow" bordered={false}>
            {/* 卡片内容 */}
          </NCard>
        ))}
      </NFlex>
    )
  },
})
```

### 5. 错误处理机制

#### 5.1 统一错误处理

```typescript
try {
  const { fetch, data } = fetchTransferOutList(params)
  await fetch()
  return { list: data.value?.list || [], total: data.value?.total || 0 }
} catch (e) {
  handleError(e)
  message.error('加载转出列表失败')
  return { list: [], total: 0 }
}
```

## 开发最佳实践

### 1. 代码规范

- 使用TypeScript严格模式
- 遵循Vue 3 Composition API最佳实践
- 统一的命名规范和文件结构

### 2. 组件设计原则

- 单一职责原则
- 组件复用性
- 响应式优先设计

### 3. 状态管理规范

- 使用Pinia进行状态管理
- 统一的数据格式和错误处理
- 合理的状态分层

### 4. 性能优化

- 使用computed进行数据计算
- 合理的组件拆分
- 避免不必要的重渲染

## 总结

通过本次重构，域名转出组件实现了：

1. **架构统一：** 100%参考域名转入组件，确保代码一致性
2. **功能完整：** 支持表格展示、搜索、分页、取消转出等完整功能
3. **响应式设计：** 完美适配桌面端和移动端
4. **代码质量：** 使用现代化技术栈，遵循最佳实践
5. **可维护性：** 清晰的架构分层，便于后续维护和扩展

这次重构不仅解决了原有的技术债务，还为后续的功能扩展奠定了坚实的基础。

## 接口

//获取转出列表，固定参数transfer_type:2

v1/domain/transfer/get_transfer_list

```json



{
  "code": 0,
  "data": {
    "list": [
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 14:13:27 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 8,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 0,
        "status_text": "申请已提交",
        "updated_at": "Wed, 17 Sep 2025 14:13:27 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 12:21:39 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 7,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 14:13:24 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 12:21:11 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 6,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 12:21:36 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 12:20:45 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 5,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 12:21:06 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 12:16:22 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 4,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 12:20:42 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Wed, 17 Sep 2025 10:26:12 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 3,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 12:16:17 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Tue, 16 Sep 2025 18:32:27 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 2,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Wed, 17 Sep 2025 10:25:52 GMT"
      },
      {
        "complete_time": null,
        "created_at": "Tue, 16 Sep 2025 18:12:58 GMT",
        "domain": "wzznb.cn",
        "email": "305986045@qq.com",
        "id": 1,
        "msg": null,
        "remark": "用户主动申请转出",
        "status": 2,
        "status_text": "取消转出",
        "updated_at": "Tue, 16 Sep 2025 18:22:18 GMT"
      }
    ],
    "page": "<div><span class='Pcurrent'>1</span><span class='Pcount'>共8条数据</span></div>",
    "row": "20",
    "shift": "0",
    "total": 8
  },
  "msg": "查询成功",
  "status": true
}

```

//取消转出接口

/v1/domain/transfer/outside_transfer_canel

```json
{
    "domain_id": "47"
}

```

//同意域名转出接口

/v1/domain/transfer/outside_transfer_approve

```json
{
    "domain_id": "47"
}
```

// 申请域名转出

/v1/domain/transfer/outside_transfer

```json
{
    "domain_id": "47",
    "email":"305986045@qq.com"
}
```
