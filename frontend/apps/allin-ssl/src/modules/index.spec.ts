import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import { defineComponent, type VNode } from 'vue'

const get = vi.hoisted(() => vi.fn())
vi.mock('@/api', () => ({ instance: { get } }))
vi.mock('naive-ui', () => ({ NAlert: () => null, NIcon: defineComponent({ render() { return this.$slots.default?.() } }) }))

beforeEach(() => { vi.resetModules(); get.mockReset() })

describe('模块前端', () => {
  it('新增和已有菜单可使用各自模块的图标，未指定时保留原图标', async () => {
    const firstIcon = defineComponent({ render: () => null })
    const secondIcon = defineComponent({ render: () => null })
    vi.doMock('/plugins/first/static/frontend/index.js?v=1', () => ({ default: () => ({ MenuIcon: firstIcon }) }))
    vi.doMock('/plugins/second/static/frontend/index.js?v=1', () => ({ default: () => ({ MenuIcon: secondIcon }) }))
    const { initializeModules, applyModuleMenus } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const originalIcon = () => null
    const original = [{ key: 'home', icon: originalIcon }, { key: 'monitor', icon: originalIcon }, { key: 'plugins', icon: originalIcon }]
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [
      { id: 'first', version: '1', status: 'running', frontend: { entry: 'frontend/index.js', menus: [{ key: 'new', icon: 'MenuIcon', group: '工具' }, { key: 'home', icon: 'MenuIcon' }, { key: 'plugins', icon: 'MenuIcon' }] } },
      { id: 'second', version: '1', status: 'running', frontend: { entry: 'frontend/index.js', menus: [{ key: 'other', icon: 'MenuIcon' }] } },
    ] } } })
    await initializeModules(router)
    const result = applyModuleMenus(original, router)
    const added = result.find(item => item.key === '工具')?.children?.[0]
    const changed = result.find(item => item.key === 'home')
    const other = result.find(item => item.key === 'other')
    for (const item of [added, changed]) {
      const node = item!.icon!() as VNode
      expect((node.children as { default: () => VNode }).default().type).toBe(firstIcon)
    }
    const node = other!.icon!() as VNode
    expect((node.children as { default: () => VNode }).default().type).toBe(secondIcon)
    expect(result.find(item => item.key === 'monitor')?.icon).toBe(originalIcon)
    const managementIcon = result.find(item => item.key === 'plugins')!.icon!() as VNode
    expect((managementIcon.children as { default: () => VNode }).default().type).toBe(firstIcon)
    expect(original[0].icon).toBe(originalIcon)
  })

  it('图标组件缺失时记录加载错误，并保留模块页面的错误展示', async () => {
    vi.doMock('/plugins/missing/static/frontend/index.js?v=1', () => ({ default: () => ({ Page: defineComponent({ render: () => null }) }) }))
    const { initializeModules, applyModuleMenus, frontendErrors } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'layout', path: '/', component: defineComponent({ render: () => null }) }] })
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'missing', version: '1', status: 'running', frontend: {
      entry: 'frontend/index.js',
      pages: [{ name: 'plugin:missing:page', path: '/plugins/missing/page', component: 'Page' }],
      menus: [{ key: 'plugin:missing:page', icon: 'MissingIcon' }],
    } }] } } })
    await initializeModules(router)
    expect(frontendErrors.missing).toContain('未导出声明的菜单图标组件')
    expect(router.hasRoute('plugin:missing:page')).toBe(true)
    expect(applyModuleMenus([], router)[0].icon).toBeUndefined()
  })

  it('支持全部已有菜单调整、分组和隐藏', async () => {
    const { initializeModules, applyModuleMenus } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'home', path: '/home', component: defineComponent({ render: () => null }) }] })
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'sample', version: '1', status: 'running', frontend: { menus: [
      { key: 'home', title: '新首页', order: 2 },
      { key: 'monitor', hidden: true },
      { key: 'child', group: '工具' },
      { key: 'plugins', hidden: true },
      { key: 'logout', hidden: true },
    ] } }] } } })
    await initializeModules(router)
    const result = applyModuleMenus([{ key: 'home', label: '首页' }, { key: 'monitor', label: '监控' }, { key: 'child', label: '子项' }, { key: 'plugins', label: '管理' }, { key: 'logout', label: '退出' }], router)
    expect(result.find(item => item.key === 'monitor')?.show).toBe(false)
    expect(result.find(item => item.key === 'plugins')?.show).toBe(false)
    expect(result.find(item => item.key === 'logout')?.show).toBe(false)
    expect(result.find(item => item.key === '工具')?.children?.[0].key).toBe('child')
    const label = result.find(item => item.key === 'home')?.label as () => { children: { default: () => string } }
    expect(label().children.default()).toBe('新首页')
  })

  it.each([
    { key: 'plugin:sample:page', title: '模块页面' },
    { key: 'plugin:sample:page' },
    { key: 'plugin:sample:page', path: '/monitor', title: '监控入口' },
  ])('新增菜单按声明路径或路由路径生成链接：%j', async change => {
    const { initializeModules, applyModuleMenus } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'plugin:sample:page', path: '/plugins/sample/page', meta: { title: '默认标题' }, component: defineComponent({ render: () => null }) }] })
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'sample', version: '1', status: 'running', frontend: { menus: [change] } }] } } })
    await initializeModules(router)
    const item = applyModuleMenus([], router)[0]
    expect(typeof item.label).toBe('function')
    const link = (item.label as () => VNode)()
    expect(link.type).toBe(RouterLink)
    expect(link.props?.to).toBe('path' in change ? change.path : '/plugins/sample/page')
    expect((link.children as { default: () => string }).default()).toBe(change.title || '默认标题')
  })

  it('隐藏分组中的已有菜单，不改动原菜单', async () => {
    const { initializeModules, applyModuleMenus } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const original = [{ key: 'monitor', label: '监控' }]
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'sample', version: '1', status: 'running', frontend: { menus: [
      { key: 'monitor', group: '工具', hidden: true },
    ] } }] } } })
    await initializeModules(router)
    const result = applyModuleMenus(original, router)
    expect(result.find(item => item.key === 'monitor')?.show).toBe(false)
    expect(result.find(item => item.key === '工具')?.children?.find(item => item.key === 'monitor')?.show).toBe(false)
    expect(original).toEqual([{ key: 'monitor', label: '监控' }])
  })

  it('对新分组及已有分组的子项排序，并保留未指定顺序的子项', async () => {
    const { initializeModules, applyModuleMenus } = await import('./index')
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const original = [
      { key: 'privateCa', label: '私有CA', children: [{ key: 'privateCaManage', label: 'CA管理' }, { key: 'privateCaCert', label: '私有证书' }, { key: 'other', label: '其他' }] },
      { key: 'first', label: '第一项' },
      { key: 'second', label: '第二项' },
      { key: 'third', label: '第三项' },
    ]
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'sample', version: '1', status: 'running', frontend: { menus: [
      { key: 'first', group: '工具', order: 1 },
      { key: 'second', group: '工具', order: 0 },
      { key: 'third', group: '工具' },
      { key: 'privateCaManage', order: 1 },
      { key: 'privateCaCert', order: 0 },
    ] } }] } } })
    await initializeModules(router)
    const result = applyModuleMenus(original, router)
    expect(result.find(item => item.key === '工具')?.children?.map(item => item.key)).toEqual(['second', 'first', 'third'])
    expect(result.find(item => item.key === 'privateCa')?.children?.map(item => item.key)).toEqual(['privateCaCert', 'privateCaManage', 'other'])
    expect(original[0].children?.map(item => item.key)).toEqual(['privateCaManage', 'privateCaCert', 'other'])
  })

  it('模块失败时保留新增页面及替换页，并记录错误', async () => {
    const { initializeModules, frontendErrors } = await import('./index')
    const component = defineComponent({ render: () => null })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'layout', path: '/', component, children: [{ name: 'home', path: 'home', component }] }] })
    get.mockResolvedValue({ data: { status: true, data: { authenticated: true, authentication: null, modules: [{ id: 'sample', version: '1', status: 'error', error: '进程退出', frontend: { pages: [
      { name: 'plugin:sample:page', path: '/plugins/sample/page', component: 'Page' },
      { name: 'replace', replace: 'home', component: 'Home' },
    ] } }] } } })
    await initializeModules(router)
    expect(router.hasRoute('plugin:sample:page')).toBe(true)
    expect(router.hasRoute('home')).toBe(true)
    expect(frontendErrors.sample).toContain('进程退出')
  })

  it('启动配置读取失败必须报错', async () => {
    const { initializeModules } = await import('./index')
    get.mockResolvedValue({ data: { status: false, message: '配置损坏' } })
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    await expect(initializeModules(router)).rejects.toThrow('配置损坏')
  })
})
