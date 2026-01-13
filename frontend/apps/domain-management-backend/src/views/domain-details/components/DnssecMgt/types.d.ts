/**
 * DNSSEC管理组件类型定义
 */

/**
 * DNSSEC DS记录
 */
export interface DnssecRecord {
  /** 记录ID */
  id: number
  /** 密钥标签 */
  keyTag: number
  /** 加密算法 */
  algorithm: number
  /** 摘要类型 */
  digestType: number
  /** 摘要值 */
  digest: string
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/**
 * DNSSEC管理组件Props
 */
export interface DnssecManagementProps {
  /** 域名ID */
  domainId: number
  /** 域名名称 */
  domainName: string
  /** 是否显示模态框 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * 添加DS记录表单数据
 */
export interface AddDnssecRecordForm {
  /** 域名ID */
  domainId: number
  /** 密钥标签 */
  keyTag: number | null
  /** 加密算法 */
  algorithm: number
  /** 摘要类型 */
  digestType: number
  /** 摘要值 */
  digest: string
}

/**
 * 同步DS记录请求参数
 */
export interface SyncDnssecRecordsRequest {
  /** 域名ID */
  domainId: number
}

/**
 * 删除DS记录请求参数
 */
export interface DeleteDnssecRecordRequest {
  /** 记录ID */
  recordId: number
  /** 域名ID */
  domainId: number
}

/**
 * 表格列配置
 */
export interface DnssecTableColumn {
  title: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  ellipsis?: { tooltip: boolean }
  render?: (row: DnssecRecord) => any
}
