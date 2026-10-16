import * as vue from 'vue'
import * as ui from 'naive-ui'
import { RouterLink, useRoute, type Router } from 'vue-router'
import * as routing from 'vue-router'
import { instance } from '@/api'
import type { MenuOption } from 'naive-ui'
import type { Bootstrap, ModuleEntry, ModuleFrontend, ModuleHost, ModuleMenu } from './types'

const replacements = new Map<string, vue.Component>()
const slots = vue.shallowReactive<{ target: string; component: vue.Component }[]>([])
const menus = vue.shallowReactive<(ModuleMenu & { iconComponent?: vue.Component })[]>([])
export const frontendErrors = vue.reactive<Record<string, string>>({})
let loginComponent: vue.Component | undefined
let rootComponent: vue.Component | undefined
const sources = import.meta.glob(['../{views,components}/**/*.{ts,tsx,vue}', '!../**/*.{spec,test}.{ts,tsx}', '!../**/*.d.ts'])

async function loadHostModule(path: string): Promise<Record<string, unknown>> {
  const load = sources[`../${path}`]
  if (!load) throw new Error(`宿主组件或交互模块不存在：${path}`)
  return await load() as Record<string, unknown>
}

function moduleError(message: string): vue.Component {
  return vue.defineComponent({ setup: () => () => vue.h(ui.NAlert, { type: 'error', title: '模块加载失败' }, () => message) })
}

function loadStyles(id: string, styles: string[] = []) {
  for (const path of styles) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `/plugins/${id}/static/${path}`
    link.dataset.module = id
    document.head.appendChild(link)
  }
}

async function loadEntry(id: string, entry: string, version: string, host: ModuleHost) {
  const url = `/plugins/${id}/static/${entry}?v=${encodeURIComponent(version)}`
  const source = await import(/* @vite-ignore */ url) as { default: ModuleEntry }
  return source.default({ ...host, api: `/v1/plugins/${id}/api` })
}

function registerFrontend(id: string, frontend: ModuleFrontend, components: Record<string, vue.Component>, router: Router) {
  const needed: { component: string }[] = [...(frontend.pages ?? []), ...(frontend.slots ?? [])]
  if (frontend.root) needed.push({ component: frontend.root })
  if (needed.some(item => !components[item.component])) throw new Error(`模块 ${id} 未导出声明的组件`)
  if (frontend.menus?.some(menu => menu.icon && !components[menu.icon])) throw new Error(`模块 ${id} 未导出声明的菜单图标组件`)
  if (frontend.pages?.some(page => page.replace ? !router.hasRoute(page.replace) : router.hasRoute(page.name))) throw new Error(`模块 ${id} 页面目标不存在或名称冲突`)
  if (frontend.root) rootComponent = vue.markRaw(components[frontend.root]!)
  for (const page of frontend.pages ?? []) {
    const component = components[page.component]
    if (!component) throw new Error(`模块 ${id} 未导出组件 ${page.component}`)
    if (page.replace) {
      if (!router.hasRoute(page.replace)) throw new Error(`模块 ${id} 替换的页面不存在：${page.replace}`)
      replacements.set(page.replace, vue.markRaw(component))
      continue
    }
    if (router.hasRoute(page.name)) throw new Error(`模块页面名称重复：${page.name}`)
    router.addRoute('layout', { name: page.name, path: page.path!, component, meta: { title: page.title } })
  }
  for (const slot of frontend.slots ?? []) {
    const component = components[slot.component]
    if (!component) throw new Error(`模块 ${id} 未导出组件 ${slot.component}`)
    slots.push({ target: slot.target, component: vue.markRaw(component) })
  }
  menus.push(...(frontend.menus ?? []).map(menu => ({ ...menu, iconComponent: menu.icon ? vue.markRaw(components[menu.icon]!) : undefined })))
}

// 在 app.use(router) 前完成，确保首次直达插件页面时路由已存在。
export async function initializeModules(router: Router, app?: vue.App, Root?: vue.Component) {
  const views: Record<string, vue.Component> = {}
  for (const route of router.getRoutes()) {
    const component = route.components?.default
    if (route.name && component) views[String(route.name)] = typeof component === 'function' ? vue.defineAsyncComponent(component as () => Promise<vue.Component>) : component
  }
  const host: ModuleHost = { vue, ui, router, http: instance, api: '', app, Root, RouterView: ModuleRouterView, routing, views, load: loadHostModule }
  const { data } = await instance.get<{ data: Bootstrap; status: boolean; message: string }>('/v1/plugins/bootstrap')
  if (!data.status) throw new Error(data.message)
  const bootstrap = data.data
  const authentication = bootstrap.authentication
  if (authentication) {
    loginComponent = moduleError(authentication.error || '认证模块没有可用的登录入口，请使用本机命令停用模块后重启')
    if (authentication.status === 'running' && authentication.entry) {
      try {
        const components = await loadEntry(authentication.id, authentication.entry, authentication.version, host)
        if (!components.Login) throw new Error('认证入口必须导出 Login 组件')
        loginComponent = vue.markRaw(components.Login)
        loadStyles(authentication.id, authentication.styles)
      } catch (error) { loginComponent = moduleError(String(error)) }
    }
  }
  const modules = [...bootstrap.modules].sort((a, b) => a.id.localeCompare(b.id))
  for (const item of modules) {
    let components: Record<string, vue.Component> = {}
    let failure = item.status === 'running' ? '' : item.error || '模块进程不可用'
    try {
      if (failure) throw new Error(failure)
      if (item.frontend.entry) components = await loadEntry(item.id, item.frontend.entry, item.version, host)
      registerFrontend(item.id, item.frontend, components, router)
      loadStyles(item.id, item.frontend.styles)
    } catch (error) {
      failure = String(error)
      frontendErrors[item.id] = failure
      const failed = moduleError(failure)
      if (item.frontend.root) components[item.frontend.root] = failed
      // 模块出错仍占用其页面，避免自动显示原业务页面。
      for (const page of item.frontend.pages ?? []) components[page.component] = failed
      const failedFrontend = { ...item.frontend, slots: [], menus: item.frontend.menus?.map(menu => ({ ...menu, icon: undefined })), pages: item.frontend.pages?.filter(page => page.replace ? router.hasRoute(page.replace) : !router.hasRoute(page.name)) }
      registerFrontend(item.id, failedFrontend, components, router)
      console.error(`模块 ${item.id} 加载失败`, error)
    }
  }
}

export const ModuleSlot = vue.defineComponent({
  props: { target: { type: String, required: true } },
  setup: props => () => slots.filter(slot => slot.target === props.target).map((slot, index) => vue.h(slot.component, { key: `${props.target}:${index}` })),
})

export const ModuleContent = vue.defineComponent({
  props: ['view', 'name'],
  setup(props) {
    const route = useRoute()
    return () => {
      const name = String(props.name ?? route.name)
      const component = name === 'login' && loginComponent ? loginComponent : replacements.get(name) || props.view
      return vue.h('div', { class: 'module-page-content h-full' }, [
        vue.h(ModuleSlot, { target: `page:${name}:before` }),
        component && vue.h(component, props.view?.props),
        vue.h(ModuleSlot, { target: `page:${name}:after` }),
      ])
    }
  },
})

// 每一级 RouterView 按自身匹配深度替换，避免父页面误用子页面的路由名。
export const ModuleRouterView = vue.defineComponent({
  setup(_, { slots }) {
    const depth = vue.inject(routing.viewDepthKey, 0)
    return () => vue.h(routing.RouterView, null, {
      default: ({ Component, route }: { Component: vue.VNode; route: routing.RouteLocationNormalizedLoaded }) => {
        let index = vue.unref(depth)
        while (route.matched[index] && !route.matched[index]!.components) index++
        const view = Component && vue.h(ModuleContent, { view: Component, name: route.matched[index]?.name })
        return slots.default ? slots.default({ Component: view, route }) : view
      },
    })
  },
})

export const ModuleRoot = vue.defineComponent({
  props: ['view'],
  setup: props => () => vue.h(rootComponent || props.view),
})

export function applyModuleMenus(original: MenuOption[], router: Router): MenuOption[] {
  const items: MenuOption[] = original.map(item => ({ ...item, children: item.children?.map(child => ({ ...child })) }))
  const groups: MenuOption[] = []
  const orders = new Map<string, number>()
  for (const change of menus) {
    let item = items.find(item => item.key === change.key)
    if (!item) item = items.flatMap(item => item.children ?? []).find(item => item.key === change.key) as typeof item
    const route = router.getRoutes().find(route => route.name === change.key)
    const isNew = !item
    if (!item && !change.hidden) {
      item = { key: change.key, label: change.title || String(route?.meta.title || change.key) }
      items.push(item)
    }
    if (!item) continue
    const path = change.path || route?.path
    if (isNew || change.title || change.path) item.label = path ? () => vue.h(RouterLink, { to: path }, () => change.title || String(route?.meta.title || change.key)) : change.title || String(route?.meta.title || change.key)
    item.show = !change.hidden
    const icon = change.iconComponent
    if (icon) item.icon = () => vue.h(ui.NIcon, null, () => vue.h(icon))
    if (change.order !== undefined) orders.set(change.key, change.order)
    if (!change.group) continue
    item.show = false
    let group = groups.find(group => group.key === change.group)
    if (!group) { group = { key: change.group, label: change.group, children: [] }; groups.push(group) }
    group.children!.push({ ...item, show: !change.hidden })
  }
  const result = [...items, ...groups]
  for (const item of result) {
    if (!item.children) continue
    const positions = new Map(item.children.map((child, index) => [String(child.key), index]))
    item.children.sort((a, b) => (orders.get(String(a.key)) ?? positions.get(String(a.key))!) - (orders.get(String(b.key)) ?? positions.get(String(b.key))!))
  }
  const positions = new Map(result.map((item, index) => [String(item.key), index]))
  return result.sort((a, b) => (orders.get(String(a.key)) ?? positions.get(String(a.key))!) - (orders.get(String(b.key)) ?? positions.get(String(b.key))!))
}
