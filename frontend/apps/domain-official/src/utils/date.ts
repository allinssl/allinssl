/**
 * 日期工具集合
 *
 * 提供常见的日期格式化、解析、计算与校验工具。
 */

export type DateInput = Date | number | string | null | undefined

function toDate(input: DateInput): Date | null {
  if (input == null) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof input === 'string') {
    // 兼容 ISO 字符串与常见日期格式
    const ts = Date.parse(input)
    if (!isNaN(ts)) return new Date(ts)
  }
  return null
}

/**
 * 格式化日期
 * @param input 日期对象/时间戳/可解析字符串
 * @param pattern 格式字符串，如：YYYY-MM-DD HH:mm:ss
 * @returns 格式化后的日期字符串
 */
export function formatDate(input: DateInput, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = toDate(input)
  if (!d) return ''
  const YYYY = String(d.getFullYear())
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const SSS = String(d.getMilliseconds()).padStart(3, '0')
  return pattern
    .replace(/YYYY/g, YYYY)
    .replace(/MM/g, MM)
    .replace(/DD/g, DD)
    .replace(/HH/g, HH)
    .replace(/mm/g, mm)
    .replace(/ss/g, ss)
    .replace(/SSS/g, SSS)
}

/**
 * 返回当日 00:00:00 的时间戳（毫秒）
 * @param input 输入日期（默认：当前日期）
 */
export function startOfDay(input: DateInput = new Date()): number {
  const d = toDate(input) || new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 返回当日 23:59:59.999 的时间戳（毫秒）
 * @param input 输入日期（默认：当前日期）
 */
export function endOfDay(input: DateInput = new Date()): number {
  const d = toDate(input) || new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/**
 * 在日期上增加/减少天数（负数为减少）
 * @param input 输入日期
 * @param days 天数，可为负数
 * @returns 新的日期对象，非法输入返回 `null`
 */
export function addDays(input: DateInput, days: number): Date | null {
  const d = toDate(input)
  if (!d) return null
  const copy = new Date(d.getTime())
  copy.setDate(copy.getDate() + days)
  return copy
}

/**
 * 友好相对时间（中文）：如 “3分钟前”，“2天后”
 * @param input 目标时间
 * @param reference 参考时间（默认：当前时间）
 * @returns 相对时间中文描述
 */
export function fromNow(input: DateInput, reference: DateInput = new Date()): string {
  const d = toDate(input)
  const r = toDate(reference)
  if (!d || !r) return ''
  const diff = d.getTime() - r.getTime()
  const abs = Math.abs(diff)
  const future = diff > 0
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  const fmt = (n: number, u: string) => `${n}${u}${future ? '后' : '前'}`
  if (abs < minute) return '刚刚'
  if (abs < hour) return fmt(Math.floor(abs / minute), '分钟')
  if (abs < day) return fmt(Math.floor(abs / hour), '小时')
  if (abs < week) return fmt(Math.floor(abs / day), '天')
  if (abs < month) return fmt(Math.floor(abs / week), '周')
  if (abs < year) return fmt(Math.floor(abs / month), '个月')
  return fmt(Math.floor(abs / year), '年')
}

/**
 * 判断是否为有效日期
 * @param input 待校验值
 * @returns 是否有效
 */
export function isValidDate(input: DateInput): boolean {
  const d = toDate(input)
  return !!d && !isNaN(d.getTime())
}

/**
 * 转换为时间戳（毫秒）
 * @param input 输入日期
 * @returns 毫秒时间戳，非法输入返回 `null`
 */
export function toTimestamp(input: DateInput): number | null {
  const d = toDate(input)
  return d ? d.getTime() : null
}

/**
 * 从时间戳构造日期
 * @param ts 毫秒时间戳或其字符串
 * @returns Date 对象，非法输入返回 `null`
 */
export function fromTimestamp(ts: number | string): Date | null {
  const num = typeof ts === 'string' ? Number(ts) : ts
  if (isNaN(num)) return null
  const d = new Date(num)
  return isNaN(d.getTime()) ? null : d
}

export default {
  formatDate,
  startOfDay,
  endOfDay,
  addDays,
  fromNow,
  isValidDate,
  toTimestamp,
  fromTimestamp,
}
