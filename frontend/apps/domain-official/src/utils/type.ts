/**
 * 类型工具集合
 *
 * 包含：类型判断、浅深合并、克隆、空值判断等
 */

/** 判断是否为 null 或 undefined */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/** 判断是否为普通对象（原型为 Object.prototype 或 null） */
export function isPlainObject(value: unknown): value is Record<string, any> {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

/** 判断是否为数组 */
export function isArray<T = unknown>(value: unknown): value is Array<T> {
  return Array.isArray(value)
}

/** 判断是否为函数 */
export function isFunction<T extends Function = Function>(value: unknown): value is T {
  return typeof value === 'function'
}

/** 判断是否为字符串 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** 判断是否为数字（排除 NaN） */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/** 判断是否为布尔 */
export function isBoolean(value: unknown): value is boolean {
  return value === true || value === false
}

/** 判断是否为有效 Date 对象 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * 浅合并（前者为基础，后者覆盖）
 * @returns 合并后的新对象
 */
export function shallowMerge<T extends object, S extends object>(base: T, override: S): T & S {
  return Object.assign({}, base, override) as T & S
}

/**
 * 深合并：数组直接替换，对象递归合并
 * @returns 合并后的新对象
 */
export function deepMerge<T extends object, S extends object>(target: T, source: S): T & S {
  const result: any = { ...target }
  Object.keys(source as any).forEach(key => {
    const sVal: any = (source as any)[key]
    const tVal: any = (result as any)[key]
    if (isPlainObject(tVal) && isPlainObject(sVal)) {
      ;(result as any)[key] = deepMerge(tVal, sVal)
    } else {
      ;(result as any)[key] = sVal
    }
  })
  return result
}

/**
 * 深克隆：处理对象/数组/Date/RegExp/Map/Set
 * @returns 深拷贝后的新对象
 */
export function deepClone<T>(input: T): T {
  if (isNullish(input) || typeof input !== 'object') return input
  if (isDate(input)) return new Date(input.getTime()) as any
  if (input instanceof RegExp) return new RegExp(input) as any
  if (input instanceof Map)
    return new Map(Array.from(input.entries()).map(([k, v]) => [deepClone(k), deepClone(v)])) as any
  if (input instanceof Set) return new Set(Array.from(input.values()).map(v => deepClone(v))) as any
  if (Array.isArray(input)) return input.map(item => deepClone(item)) as any
  const out: any = {}
  Object.keys(input as any).forEach(key => {
    out[key] = deepClone((input as any)[key])
  })
  return out
}

/**
 * 判断对象是否为空（无可枚举属性）
 */
export function isEmptyObject(value: unknown): value is Record<string, never> {
  return isPlainObject(value) && Object.keys(value).length === 0
}

export default {
  isNullish,
  isPlainObject,
  isArray,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isDate,
  shallowMerge,
  deepMerge,
  deepClone,
  isEmptyObject,
}
