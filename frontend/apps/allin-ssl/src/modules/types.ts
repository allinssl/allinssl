import type * as Vue from 'vue'
import type * as NaiveUI from 'naive-ui'
import type { Router } from 'vue-router'
import type * as Routing from 'vue-router'
import type { instance } from '@/api'

export interface ModulePage {
  name: string
  path?: string
  title?: string
  component: string
  replace?: string
}

export interface ModuleMenu {
  key: string
  title?: string
  path?: string
  icon?: string
  order?: number
  group?: string
  hidden?: boolean
}

export interface ModuleFrontend {
  root?: string
  entry?: string
  login?: string
  styles?: string[]
  pages?: ModulePage[]
  menus?: ModuleMenu[]
  slots?: { target: string; component: string }[]
}

export interface ModuleInfo {
  id: string
  name: string
  type: 'module'
  version: string
  protocol: number
  backend?: string
  enabled: boolean
  status: string
  error?: string
  frontend: ModuleFrontend
}

export interface ModuleHost {
  vue: typeof Vue
  ui: typeof NaiveUI
  router: Router
  http: typeof instance
  api: string
  app?: Vue.App
  Root?: Vue.Component
  RouterView: Vue.Component
  routing: typeof Routing
  views: Record<string, Vue.Component>
  load: (path: string) => Promise<Record<string, unknown>>
}

export type ModuleEntry = (host: ModuleHost) => Record<string, Vue.Component> | Promise<Record<string, Vue.Component>>

export interface Bootstrap {
  authenticated: boolean
  authentication: null | { id: string; entry: string; styles?: string[]; status: string; error?: string; version: string }
  modules: Pick<ModuleInfo, 'id' | 'version' | 'status' | 'error' | 'frontend'>[]
}
