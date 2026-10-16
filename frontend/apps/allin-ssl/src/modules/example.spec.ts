import { expect, it } from 'vitest'
import * as vue from 'vue'
import { renderToString } from 'vue/server-renderer'
import entry from '../../../../../plugins/module-example/frontend/index.js'
import login from '../../../../../plugins/module-example/frontend/login.js'

it('示例 ES 模块能导出声明的组件，并渲染跟随菜单颜色的 SVG 图标', async () => {
  const host = { vue, ui: {}, api: '/v1/plugins/module-example/api', http: {}, router: {} }
  expect(Object.keys(entry(host))).toEqual(['MenuIcon', 'Dashboard', 'Home', 'Header', 'MonitorNotice'])
  expect(Object.keys(login(host))).toEqual(['Login'])
  const svg = await renderToString(vue.h(entry(host).MenuIcon))
  expect(svg).toContain('viewBox="0 0 24 24"')
  expect(svg).toContain('stroke="currentColor"')
  expect(svg.match(/<rect /g)).toHaveLength(4)
})
