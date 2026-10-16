// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { ModuleHost } from './types'

const get = vi.hoisted(() => vi.fn())
vi.mock('@/api', () => ({ instance: { get } }))
vi.mock('naive-ui', () => ({ NAlert: defineComponent({ props: ['title'], setup: props => () => h('div', props.title) }) }))
let app: App | undefined

beforeEach(() => { vi.resetModules(); get.mockReset() })
afterEach(() => { app?.unmount(); app = undefined; document.body.innerHTML = ''; document.head.querySelectorAll('[data-module]').forEach(link => link.remove()) })

it('纯前端主题能替换根、布局、多级子页面并执行自己的交互，保留路由参数', async () => {
  const originalSetup = vi.fn()
  const unused = defineComponent({ setup() { originalSetup(); return () => h('div', '原页面') } })
  let provided: ModuleHost | undefined
  vi.doMock('/plugins/theme/static/frontend/index.js?v=1', () => ({ default: (host: ModuleHost) => {
    provided = host
    return {
      Root: defineComponent({ setup: () => () => h('main', [h('header', '主题根'), h(host.RouterView)]) }),
      Layout: defineComponent({ setup: () => () => h('section', [h('nav', '主题导航'), h(host.RouterView)]) }),
      Parent: defineComponent({ setup: () => () => h('article', [h('h2', '主题父页面'), h(host.RouterView)]) }),
      Child: defineComponent({ props: ['id'], setup(props) {
        const clicks = ref(0)
        return () => h('button', { onClick: () => { clicks.value++ } }, `子页面 ${props.id} 点击 ${clicks.value}`)
      } }),
    }
  } }))
  const runtime = await import('./index')
  const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'layout', path: '/', component: unused, children: [
    { name: 'parent', path: 'parent', component: unused, children: [{ name: 'child', path: ':id', props: true, component: unused }] },
  ] }] })
  get.mockResolvedValue({ data: { status: true, data: { authenticated: false, authentication: null, modules: [{ id: 'theme', version: '1', status: 'running', frontend: {
    entry: 'frontend/index.js', root: 'Root', pages: [
      { name: 'layout-theme', replace: 'layout', component: 'Layout' },
      { name: 'parent-theme', replace: 'parent', component: 'Parent' },
      { name: 'child-theme', replace: 'child', component: 'Child' },
    ],
  } }] } } })
  const baseRoot = defineComponent({ setup: () => () => h(runtime.ModuleRouterView) })
  app = createApp(runtime.ModuleRoot, { view: baseRoot })
  await runtime.initializeModules(router, app, baseRoot)
  expect(provided!.app).toBe(app)
  expect(provided!.Root).toBe(baseRoot)
  expect(Object.keys(provided!.views).sort()).toEqual(['child', 'layout', 'parent'])
  await expect(provided!.load('不存在.tsx')).rejects.toThrow('不存在')
  await router.push('/parent/42')
  app.use(router)
  app.mount(document.body.appendChild(document.createElement('div')))
  expect(document.body.textContent).toContain('主题根主题导航主题父页面子页面 42 点击 0')
  document.querySelector('button')!.click()
  await nextTick()
  expect(document.body.textContent).toContain('点击 1')
  expect(originalSetup).not.toHaveBeenCalled()
})

it.each(['login', 'plugins', '404'])('可替换 %s 页，未启用模块时仍显示原页面', async name => {
  vi.doMock('/plugins/page-theme/static/frontend/index.js?v=1', () => ({ default: () => ({ Page: defineComponent({ render: () => h('div', '主题页面') }) }) }))
  const runtime = await import('./index')
  const router = createRouter({ history: createMemoryHistory(), routes: [{ name, path: '/page', component: defineComponent({ render: () => h('div', '原页面') }) }] })
  get.mockResolvedValue({ data: { status: true, data: { authenticated: false, authentication: null, modules: [{ id: 'page-theme', version: '1', status: 'running', frontend: {
    entry: 'frontend/index.js', pages: [{ name: 'page-theme', replace: name, component: 'Page' }],
  } }] } } })
  await runtime.initializeModules(router)
  await router.push('/page')
  app = createApp(runtime.ModuleRouterView)
  app.use(router)
  app.mount(document.body.appendChild(document.createElement('div')))
  expect(document.body.textContent).toBe('主题页面')
  app.unmount()
  vi.resetModules()
  const restored = await import('./index')
  app = createApp(restored.ModuleRouterView)
  app.use(router)
  await router.push('/page')
  app.mount(document.body.appendChild(document.createElement('div')))
  expect(document.body.textContent).toBe('原页面')
})

it('根组件加载失败明确展示错误，不执行原根组件', async () => {
  const runtime = await import('./index')
  const router = createRouter({ history: createMemoryHistory(), routes: [] })
  get.mockResolvedValue({ data: { status: true, data: { authenticated: false, authentication: null, modules: [{ id: 'broken', version: '1', status: 'error', error: '主题缺失', frontend: { root: 'Root' } }] } } })
  await runtime.initializeModules(router)
  app = createApp(runtime.ModuleRoot, { view: defineComponent({ render: () => h('div', '原根组件') }) })
  app.mount(document.body.appendChild(document.createElement('div')))
  expect(document.body.textContent).toBe('模块加载失败')
  expect(runtime.frontendErrors.broken).toContain('主题缺失')
})
