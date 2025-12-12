/**
 * 域名详情页面配置
 * 包含常量定义、映射关系和选项配置
 */
import type { TagType } from "./types.d";

// 常量配置
export const DOMAIN = {
  // 域名状态
  STATUS: {
    PENDING: 0, // 注册中
    NORMAL: 1, // 正常
    EXPIRING: 2, // 即将到期
    EXPIRED: 3, // 已过期
    BE_RENEWED: 4, // 待赎回
    RENEW_FAILED: 5, // 注册失败
  },
  // 实名状态
  REAL_NAME_STATUS: {
    NONE: 0,
    PENDING: 1,
    VERIFIED: 2,
    FAILED: 3,
  },
  // 锁定状态
  LOCK_STATUS: {
    UNLOCKED: 0,
    LOCKED: 1,
  },
} as const;

// 映射配置
export const MAPS = {
  // 域名状态映射
  STATUS: {
    [DOMAIN.STATUS.PENDING]: {
      type: "info" as TagType,
      text: "注册中",
    },
    [DOMAIN.STATUS.NORMAL]: {
      type: "success" as TagType,
      text: "正常",
    },
    [DOMAIN.STATUS.EXPIRING]: {
      type: "warning" as TagType,
      text: "即将到期",
    },
    [DOMAIN.STATUS.EXPIRED]: {
      type: "error" as TagType,
      text: "已过期",
    },
    [DOMAIN.STATUS.BE_RENEWED]: {
      type: "default" as TagType,
      text: "待赎回",
    },
    [DOMAIN.STATUS.RENEW_FAILED]: {
      type: "error" as TagType,
      text: "注册失败",
    },
    unknown: { type: "default" as TagType, text: "未知状态", color: "#666666" },
  },
  // 实名状态映射
  REAL_NAME_STATUS: {
    [DOMAIN.REAL_NAME_STATUS.NONE]: {
      type: "warning" as TagType,
      text: "未实名",
    },
    [DOMAIN.REAL_NAME_STATUS.PENDING]: {
      type: "warning" as TagType,
      text: "审核中",
    },
    [DOMAIN.REAL_NAME_STATUS.VERIFIED]: {
      type: "success" as TagType,
      text: "已实名",
    },
    [DOMAIN.REAL_NAME_STATUS.FAILED]: {
      type: "error" as TagType,
      text: "实名失败",
    },

    unknown: { type: "default" as TagType, text: "未知状态", color: "#666666" },
  },
  // 锁定状态映射
  LOCK_STATUS: {
    [DOMAIN.LOCK_STATUS.UNLOCKED]: {
      type: "success" as TagType,
      text: "未锁定",
    },
    [DOMAIN.LOCK_STATUS.LOCKED]: {
      type: "warning" as TagType,
      text: "已锁定",
    },
    unknown: { type: "default" as TagType, text: "未知状态", color: "#666666" },
  },
} as const;

// DNS记录类型选项
export const DNS_TYPE_OPTIONS = [
  { value: "A", label: "A", description: "IPv4地址", example: "192.168.0.1" },
  {
    value: "AAAA",
    label: "AAAA",
    description: "IPv6地址",
    example: "2001:db8::1",
  },
  {
    value: "CNAME",
    label: "CNAME",
    description: "别名记录",
    example: "example.com",
  },
  {
    value: "MX",
    label: "MX",
    description: "邮件交换记录",
    example: "mail.example.com",
  },
  {
    value: "TXT",
    label: "TXT",
    description: "文本记录",
    example: "v=spf1 include:_spf.example.com ~all",
  },
  {
    value: "NS",
    label: "NS",
    description: "域名服务器记录",
    example: "ns1.example.com",
  },
  {
    value: "SRV",
    label: "SRV",
    description: "服务定位记录",
    example: "0 5 5060 sip.example.com",
  },
  {
    value: "CAA",
    label: "CAA",
    description: "证书颁发机构授权",
    example: '0 issue "letsencrypt.org"',
  },
];

// TTL选项
export const TTL_OPTIONS = [
  { value: 600, label: "10分钟" },
  { value: 1800, label: "30分钟" },
  { value: 3600, label: "1小时" },
  { value: 43200, label: "12小时" },
  { value: 86400, label: "1天" },
];

// 工具方法
export const domainUtils = {
  // 域名状态相关
  status: {
    /**
     * 获取域名状态文本
     * @param status 状态码
     */
    getText: (status: number): string => {
      return (MAPS.STATUS as any)[status]?.text || MAPS.STATUS.unknown.text;
    },
    /**
     * 获取域名状态类型
     * @param status 状态码
     */
    getType: (status: number): TagType => {
      return (MAPS.STATUS as any)[status]?.type || MAPS.STATUS.unknown.type;
    },
    /**
     * 获取域名状态颜色
     * @param status 状态码
     */
    getColor: (status: number): string => {
      return (MAPS.STATUS as any)[status]?.color || MAPS.STATUS.unknown.color;
    },
  },
  // 实名状态相关
  realName: {
    /**
     * 获取实名状态文本
     * @param status 状态码
     */
    getText: (status: number): string => {
      return (
        (MAPS.REAL_NAME_STATUS as any)[status]?.text ||
        MAPS.REAL_NAME_STATUS.unknown.text
      );
    },
    /**
     * 获取实名状态类型
     * @param status 状态码
     */
    getType: (status: number): TagType => {
      return (
        (MAPS.REAL_NAME_STATUS as any)[status]?.type ||
        MAPS.REAL_NAME_STATUS.unknown.type
      );
    },
    /**
     * 获取实名状态颜色
     * @param status 状态码
     */
    getColor: (status: number): string => {
      return (
        (MAPS.REAL_NAME_STATUS as any)[status]?.color ||
        MAPS.REAL_NAME_STATUS.unknown.color
      );
    },
  },
  // 锁定状态相关
  lock: {
    /**
     * 获取锁定状态文本
     * @param status 状态码
     */
    getText: (status: number): string => {
      return (
        (MAPS.LOCK_STATUS as any)[status]?.text || MAPS.LOCK_STATUS.unknown.text
      );
    },
    /**
     * 获取锁定状态类型
     * @param status 状态码
     */
    getType: (status: number): TagType => {
      return (
        (MAPS.LOCK_STATUS as any)[status]?.type || MAPS.LOCK_STATUS.unknown.type
      );
    },
    /**
     * 获取锁定状态颜色
     * @param status 状态码
     */
    getColor: (status: number): string => {
      return (
        (MAPS.LOCK_STATUS as any)[status]?.color ||
        MAPS.LOCK_STATUS.unknown.color
      );
    },
  },
};
