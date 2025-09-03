/**
 * 核心工具集合
 *
 * 包含：深取值、模板渲染/列表渲染、防抖、价格格式化、URL 查询参数读写、localStorage 包装、
 * 响应式深代理状态、以及下拉位置计算等纯工具方法。
 */

/**
 * 深取值：根据以点分隔的路径安全访问对象属性
 *
 * @template T
 * @param obj 输入对象
 * @param path 使用 `a.b.c` 形式的取值路径
 * @returns 取到的值或 `undefined`
 * @example
 * getDeepValue<number>({ a: { b: 1 } }, 'a.b') // => 1
 */
export function getDeepValue<T = any>(obj: any, path: string): T | undefined {
  if (!obj || !path) return undefined
  return path.split('.').reduce<any>((acc, part) => {
    if (acc == null) return undefined
    return (acc as any)[part]
  }, obj) as T | undefined
}

// ---------------- Template Engine（支持缓存、if/elseif/else、each、嵌套） ----------------

type TemplateNode =
  | { type: 'text'; value: string }
  | { type: 'var'; path: string }
  | { type: 'if'; branches: Array<{ cond?: string; body: TemplateNode[] }> }
  | { type: 'each'; list: string; item: string; index: string; body: TemplateNode[] }

const templateCache: Map<string, { ast: TemplateNode[]; fn: (ctx: any, reactive?: boolean) => string }> = new Map()

function tokenize(template: string): TemplateNode[] {
  let i = 0
  const len = template.length
  const readUntil = (str: string, start: number) => {
    const idx = template.indexOf(str, start)
    return idx === -1 ? len : idx
  }

  // 将 "#end if" / "#end each" 等结束语法标准化为 "/if" / "/each"
  const normalizeTag = (raw: string): string => {
    const t = raw.trim()
    if (t.startsWith('#end')) {
      const name = t.slice(4).trim().split(/\s+/)[0] || ''
      if (name) return `/${name}`
      return '/end'
    }
    return t
  }

  function parseBlock(endTags: string[]): TemplateNode[] {
    const nodes: TemplateNode[] = []
    while (i < len) {
      const open = template.indexOf('{{', i)
      if (open === -1) {
        if (i < len) nodes.push({ type: 'text', value: template.slice(i) })
        i = len
        break
      }
      if (open > i) nodes.push({ type: 'text', value: template.slice(i, open) })
      const close = readUntil('}}', open + 2)
      const tag = template.slice(open + 2, close).trim()
      const normalizedTag = normalizeTag(tag)
      i = close + 2

      if (endTags.includes(normalizedTag)) {
        // 不消费结束标签本身，回退到 '{{' 让上层语义节点消费（支持嵌套）
        i = open
        break
      }

      if (tag.startsWith('#if ')) {
        const branches: Array<{ cond?: string; body: TemplateNode[] }> = []
        const firstCond = tag.slice(4).trim()
        const firstBody = parseBlock(['#elseif', '#else', '/if'])
        branches.push({ cond: firstCond, body: firstBody })
        // 消费 elseif/else
        while (i < len) {
          const lookOpen = template.indexOf('{{', i)
          if (lookOpen === -1) break
          const lookClose = readUntil('}}', lookOpen + 2)
          const lookTag = template.slice(lookOpen + 2, lookClose).trim()
          const normalizedLookTag = normalizeTag(lookTag)
          i = lookClose + 2
          if (lookTag === '#else') {
            const elseBody = parseBlock(['/if'])
            branches.push({ body: elseBody })
            break
          }
          if (lookTag.startsWith('#elseif')) {
            const cond = lookTag.slice('#elseif'.length).trim()
            const body = parseBlock(['#elseif', '#else', '/if'])
            branches.push({ cond, body })
            continue
          }
          if (normalizedLookTag === '/if') break
          // 如果遇到其他标签，回退（防止解析越界）
          i = lookOpen
          break
        }
        // 消费紧随其后的结束标签 /if（或 #end if）
        const afterOpen = template.indexOf('{{', i)
        if (afterOpen > -1) {
          const afterClose = readUntil('}}', afterOpen + 2)
          const afterTag = template.slice(afterOpen + 2, afterClose).trim()
          if (normalizeTag(afterTag) === '/if') {
            i = afterClose + 2
          }
        }
        nodes.push({ type: 'if', branches })
        continue
      }

      if (tag.startsWith('#each ')) {
        const expr = tag.slice(6).trim()
        let list = expr
        let item = 'item'
        let index = 'index'
        const asIdx = expr.indexOf(' as ')
        if (asIdx > -1) {
          list = expr.slice(0, asIdx).trim()
          const rest = expr.slice(asIdx + 4).trim()
          const [it, idx] = rest.split(',').map(s => s.trim())
          if (it) item = it
          if (idx) index = idx
        }
        const body = parseBlock(['/each'])
        // 消费紧随其后的结束标签 /each（或 #end each）
        const afterOpen = template.indexOf('{{', i)
        if (afterOpen > -1) {
          const afterClose = readUntil('}}', afterOpen + 2)
          const afterTag = template.slice(afterOpen + 2, afterClose).trim()
          if (normalizeTag(afterTag) === '/each') {
            i = afterClose + 2
          }
        }
        nodes.push({ type: 'each', list, item, index, body })
        continue
      }

      // '#else' 和 '#elseif' 仅用于 if 分支解析，这里回退以便上层 if 解析消费
      if (tag === '#else' || tag.startsWith('#elseif')) {
        i = open
        break
      }

      nodes.push({ type: 'var', path: tag })
    }
    return nodes
  }

  i = 0
  return parseBlock([])
}

function renderNodes(nodes: TemplateNode[], ctx: any, reactive = false): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.value
    } else if (node.type === 'var') {
      const val = getDeepValue(ctx, node.path.trim())
      const text = val !== undefined && val !== null ? String(val) : ''
      out += reactive ? `<span data-t-bind="${node.path.trim()}">${text}</span>` : text
    } else if (node.type === 'if') {
      let matched = false
      for (const br of node.branches) {
        if (br.cond == null) {
          if (!matched) out += renderNodes(br.body, ctx, reactive)
          matched = true
          break
        }
        const condVal = getDeepValue(ctx, br.cond.trim())
        if (!!condVal) {
          out += renderNodes(br.body, ctx, reactive)
          matched = true
          break
        }
      }
      if (!matched) {
        // no else body, ignore
      }
    } else if (node.type === 'each') {
      const listVal: any = getDeepValue(ctx, node.list.trim()) || []
      if (Array.isArray(listVal)) {
        listVal.forEach((it, idx) => {
          const childCtx = Object.create(ctx)
          childCtx[node.item] = it
          childCtx[node.index] = idx
          childCtx['this'] = it
          out += renderNodes(node.body, childCtx, reactive)
        })
      }
    }
  }
  return out
}

function compileTemplate(templateId: string) {
  const template = (window as any).$(`#${templateId}`).html?.()
  if (!template) return null
  const ast = tokenize(template)
  const fn = (ctx: any, reactive = false) => renderNodes(ast, ctx, reactive)
  return { ast, fn }
}

export type RenderTemplateInstance<T extends object = any> = {
  html: string
  state: T
  bind: ($root: any) => void
  destroy: () => void
}

/**
 * 模板渲染
 *
 * - 非响应模式：返回渲染后的 HTML 字符串
 * - 响应模式：返回带有 `state` 的实例，通过 `createState` 代理可触发 DOM 中 `data-t-bind` 节点更新
 *
 * 使用说明：
 * 1) 放置模板：`<script type="text/template" id="tpl">姓名：{{user.name}}</script>`
 * 2) 渲染：`renderTemplate('tpl', { user: { name: '张三' } })`
 * 3) 响应式：`renderTemplate('tpl', { user: { name: '张三' } }, { reactive: true })`
 *
 * @param templateId 模板节点 id（如 `tpl`）
 * @param data 模板数据对象
 * @param options 传入 `{ reactive: true }` 开启响应模式
 * @returns HTML 字符串或带 `state/bind/destroy` 的实例
 */
export function renderTemplate(templateId: string, data: Record<string, any>): string
export function renderTemplate<T extends object = any>(
  templateId: string,
  data: T,
  options: { reactive: true }
): RenderTemplateInstance<T>
export function renderTemplate<T extends object = any>(
  templateId: string,
  data: T,
  options?: { reactive?: boolean }
): string | RenderTemplateInstance<T> {
  let compiled = templateCache.get(templateId)
  if (!compiled) {
    const c = compileTemplate(templateId)
    if (!c) {
      console.error(`模板 ${templateId} 不存在`)
      return '' as any
    }
    templateCache.set(templateId, c)
    compiled = c
  }
  const reactive = !!options?.reactive
  const html = compiled.fn(data, reactive)
  if (!reactive) return html

  // reactive 模式：基于 Proxy 更新 data-t-bind 节点
  const subscribers = new Map<string, Set<HTMLElement>>()
  const instance: RenderTemplateInstance<T> = {
    html,
    state: createState(data as any, (path, value) => {
      const set = subscribers.get(path)
      if (set) set.forEach(el => (el.textContent = value == null ? '' : String(value)))
    }) as T,
    bind: ($root: any) => {
      const $ = (window as any).$
      const root = typeof $root === 'string' ? $(String($root)) : $root
      root.find('[data-t-bind]').each(function (this: HTMLElement) {
        const key = (this as any).getAttribute('data-t-bind') || ''
        if (!subscribers.has(key)) subscribers.set(key, new Set())
        subscribers.get(key)!.add(this)
      })
    },
    destroy: () => subscribers.clear(),
  }
  return instance
}

/**
 * 批量渲染模板列表并拼接为一个 HTML 字符串
 * @param templateId 模板 id
 * @param dataArray 数据列表
 * @returns 合并后的 HTML 字符串
 */
export function renderTemplateList(templateId: string, dataArray: Array<Record<string, any>>): string {
  return dataArray.map(data => renderTemplate(templateId, data)).join('')
}

/**
 * 防抖：返回一个在指定延迟后执行的函数
 *
 * @template T
 * @param func 目标函数
 * @param delay 毫秒延迟
 * @returns 包裹后的防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeoutId: any
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 价格格式化
 * @param price 数值价格
 * @returns 形如 `¥100`
 */
export const formatPrice = (price: number): string => `¥${price}`

/**
 * 格式化价格为整数
 * @param price 数值价格
 * @returns 形如 `¥100`
 */
export const formatPriceInteger = (price: number): string => `¥${Math.round(price)}`

/**
 * 读取 URL 查询参数
 * @param name 参数名
 * @returns 参数值或 `null`
 */
export const getUrlParam = (name: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

/**
 * 更新 URL 查询参数（存在则设置，不传值则删除），通过 `history.pushState` 无刷更新
 * @param name 参数名
 * @param value 参数值，省略时表示删除该参数
 */
export const updateUrlParam = (name: string, value?: string) => {
  const url = new URL(window.location.href)
  if (value) {
    url.searchParams.set(name, value)
  } else {
    url.searchParams.delete(name)
  }
  window.history.pushState({}, '', url)
}

/**
 * 简易 storage：基于 localStorage 的 JSON 包装
 */
export const storage = {
  /**
   * 读取
   * @param key 键名
   * @returns 反序列化后的对象或 `null`
   */
  get<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : null
    } catch (e) {
      console.error('localStorage读取失败:', e)
      return null
    }
  },
  /**
   * 写入
   * @param key 键名
   * @param value 任意可序列化值
   * @returns 是否写入成功
   */
  set<T = any>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('localStorage保存失败:', e)
      return false
    }
  },
  /**
   * 删除
   * @param key 键名
   */
  remove(key: string) {
    localStorage.removeItem(key)
  },
}

/**
 * 深层响应回调状态：通过 Proxy 递归代理对象，任意层级 set 时回调
 *
 * @template T
 * @param initialState 初始状态对象
 * @param callback 属性变更回调 `(propertyPath, value, state)`
 * @returns 代理后的响应式状态对象
 */
export function createState<T extends object>(
  initialState: T,
  callback: (propertyPath: string, value: any, state: T) => void
): T {
  const deepProxy = (target: any, path: Array<string | number>): any => {
    return new Proxy(target, {
      get(obj, prop: string | symbol) {
        const value = Reflect.get(obj, prop)
        if (typeof value === 'object' && value !== null) {
          return deepProxy(value, path.concat(prop as string))
        }
        return value
      },
      set(obj, prop: string | symbol, value: any) {
        const oldValue = Reflect.get(obj, prop)
        if (oldValue !== value) {
          const result = Reflect.set(obj, prop, value)
          if (result) {
            const fullPath = path.concat(prop as string).join('.')
            callback(fullPath, value, initialState)
          }
          return result
        }
        return true
      },
    })
  }
  return deepProxy(initialState, [])
}

/**
 * 基于 Proxy 的响应式 Store：支持订阅监听与计算属性（computed）
 *
 * 用法：
 * const { state, subscribe, getSnapshot } = createStore({ count: 0 }, {
 *   double: s => s.count * 2,
 * })
 * const unsub = subscribe((path, value, s) => { console.log(path, value) })
 * state.count++ // 触发订阅，computed 自动随源值变化
 *
 * @template TState extends object
 * @template TComputed extends Record<string, (s: TState) => any>
 * @param initialState 初始状态
 * @param computed 计算属性集合，如 `{ double: s => s.count * 2 }`
 * @param options 可选项：`persistKey` 持久化键、`debug` 调试日志
 * @returns `{ state, subscribe, getSnapshot }`
 */
export function createStore<TState extends object, TComputed extends Record<string, (s: TState) => any> = {}>(
  initialState: TState,
  computed?: TComputed,
  options?: { persistKey?: string; debug?: boolean }
): {
  state: TState & { [K in keyof TComputed]: ReturnType<TComputed[K]> }
  subscribe: (listener: (path: string, value: any, s: TState) => void) => () => void
  getSnapshot: () => TState & { [K in keyof TComputed]: ReturnType<TComputed[K]> }
} {
  const listeners = new Set<(path: string, value: any, s: TState) => void>()
  const persistKey = options?.persistKey
  const debug = !!options?.debug

  // 恢复持久化
  if (persistKey) {
    try {
      const raw = localStorage.getItem(persistKey)
      if (raw) Object.assign(initialState as any, JSON.parse(raw))
    } catch (err) {
      console.warn('createStore 持久化恢复失败:', err)
    }
  }

  // 计算属性容器，惰性求值 + 变更时失效
  const computedGetters = computed || ({} as TComputed)
  const computedCache: Partial<Record<keyof TComputed, any>> = {}
  const invalidateComputed = () => {
    for (const key in computedCache) delete computedCache[key]
  }

  const notify = (path: string, value: any, s: TState) => {
    listeners.forEach(fn => fn(path, value, s))
  }

  const proxy = createState(initialState, (path, value, s) => {
    if (debug) console.debug('[store:set]', { path, value })
    invalidateComputed()
    notify(path, value, s)
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(s))
      } catch {}
    }
  }) as TState

  const withComputed = new Proxy(proxy as any, {
    get(target, prop: string | symbol, receiver) {
      if (typeof prop === 'string' && computedGetters && prop in computedGetters) {
        const key = prop as keyof TComputed
        if (!(key in computedCache)) {
          // 计算并缓存
          computedCache[key] = (computedGetters as any)[prop](target)
        }
        return computedCache[key]
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as TState & { [K in keyof TComputed]: ReturnType<TComputed[K]> }

  return {
    state: withComputed,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot() {
      return withComputed
    },
  }
}

/**
 * 下拉定位：根据触发元素与窗口尺寸计算下拉菜单位置与最大高度
 * @param $trigger 触发元素（jQuery 包装）
 * @param $dropdown 下拉元素（jQuery 包装）
 * @returns 定位结果 `{ top, left, maxHeight }`
 */
export function calculateDropdownPosition(
  $trigger: any,
  $dropdown: any
): { top: number; left: number; maxHeight: number } {
  const triggerEl: HTMLElement | undefined = $trigger && $trigger[0]
  const dropdownEl: HTMLElement | undefined = $dropdown && $dropdown[0]
  const rect = triggerEl?.getBoundingClientRect?.()
  const triggerHeight = rect?.height ?? $trigger.outerHeight?.() ?? 0
  const triggerWidth = rect?.width ?? $trigger.outerWidth?.() ?? 0
  const dropdownHeight = $dropdown.outerHeight?.() || 200
  const margin = 10

  // 判断定位上下文：fixed（默认：相对视口）或 absolute（相对滚动容器）
  let position: 'fixed' | 'absolute' = 'fixed'
  try {
    const cs = dropdownEl ? window.getComputedStyle(dropdownEl) : null
    if (cs && (cs.position as any) === 'absolute') position = 'absolute'
  } catch {}

  let containerLeft = 0
  let containerTop = 0
  let boundaryWidth = (window as any).innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  let boundaryHeight =
    (window as any).innerHeight || document.documentElement.clientHeight || document.body.clientHeight
  let scrollLeft = 0
  let scrollTop = 0
  if (position === 'absolute' && dropdownEl) {
    const container = (dropdownEl.offsetParent as HTMLElement) || dropdownEl.parentElement
    if (container) {
      const cRect = container.getBoundingClientRect()
      containerLeft = cRect.left
      containerTop = cRect.top
      boundaryWidth = container.clientWidth
      boundaryHeight = container.clientHeight
      scrollLeft = container.scrollLeft
      scrollTop = container.scrollTop
    }
  }
  // 在确定边界后再计算下拉宽度，避免未定位时 auto 宽度被当作视口宽度
  let dropdownWidth: number = 0
  {
    const measuredByJquery = typeof $dropdown?.outerWidth === 'function' ? Number($dropdown.outerWidth()) : 0
    const measuredByRect = dropdownEl?.getBoundingClientRect?.().width ?? 0
    const measured = Number.isFinite(measuredByJquery) && measuredByJquery > 0 ? measuredByJquery : measuredByRect
    const minWidth = Math.max(80, triggerWidth)
    const maxAllowed = Math.max(minWidth, boundaryWidth - margin * 2)
    const isReasonable = Number.isFinite(measured) && measured > 0 && measured < maxAllowed * 0.95
    dropdownWidth = isReasonable ? measured : Math.min(Math.max(minWidth, 320), maxAllowed)
  }
  // 计算横向位置
  let left = (rect?.left ?? 0) - (position === 'absolute' ? containerLeft : 0) + scrollLeft

  if (left + dropdownWidth > boundaryWidth - margin) {
    left = boundaryWidth - dropdownWidth - margin
  }
  if (left < margin) left = margin

  // 计算纵向位置
  let top: number = 0
  let maxHeight: number = 200

  const topEdge = (rect?.top ?? 0) - (position === 'absolute' ? containerTop : 0) + scrollTop
  const bottomEdge = topEdge + triggerHeight
  const spaceBelow = boundaryHeight - bottomEdge - margin
  const spaceAbove = topEdge - margin

  if (spaceBelow >= 100 || spaceBelow >= spaceAbove) {
    top = bottomEdge + 5
    maxHeight = spaceBelow - 15
  } else {
    top = topEdge - dropdownHeight - 5
    maxHeight = spaceAbove - 15
    if (top < margin) {
      top = margin
      maxHeight = Math.max(spaceAbove - 15, 100)
    }
  }

  return { top, left, maxHeight: Math.max(100, maxHeight) }
}

const Utils = {
  calculateDropdownPosition,
  renderTemplate,
  renderTemplateList,
  debounce,
  formatPrice,
  getUrlParam,
  updateUrlParam,
  storage,
  createState,
  createStore,
}

export default Utils
