import type { RouteRecordRaw } from "vue-router";
import { kebabCase } from "@baota/utils/string";

// 路由配置选项
export interface RouteOptions {
  framework: string[]; // 框架路由
  system: string[]; // 系统路由
  sort: { name: string; title: string }[]; // 路由排序
  disabled: string[]; // 禁用路由
}

/**
 * 自动导入路由配置
 * 自动导入 src/views 下的路由组件
 *
 * 路由命名规则：
 * 1. 路由路径使用 kebab-case 命名法（短横线命名法）
 * 2. 路由名称使用 camelCase 命名法（驼峰命令法）
 * 3. 子路由路径会自动拼接父路由路径
 *
 * 例如：
 * src/views/userManagement/index.tsx -> /user-management
 * src/views/userManagement/children/userDetail/index.tsx -> /user-management/user-detail
 */
export function generateRoutes(
  mainRoute: Record<string, () => Promise<unknown>>,
  childrenRoutes: Record<string, () => Promise<unknown>>,
  routesOptions: RouteOptions
): {
  system: RouteRecordRaw[];
  framework: RouteRecordRaw[];
  routes: RouteRecordRaw[];
} {
  const {
    framework,
    system,
    sort: routesSort,
    disabled: routesDisabled,
  } = routesOptions;

  const routes: RouteRecordRaw[] = []; // 路由列表
  const systemRoutes: RouteRecordRaw[] = []; // 系统路由
  const frameworkRoutes: RouteRecordRaw[] = []; // 框架路由

  // 导入所有视图组件，基于 src/views 目录
  // 使用 Vite 的 import.meta.glob 进行自动导入
  const modules = mainRoute;
  const childrenModules = childrenRoutes;
  const modulesRegex = /\/views\/([^/]+)\/index\.tsx$/;
  const childrenModulesRegex =
    /\/views\/([^/]+)\/children\/([^/]+)\/index\.tsx$/;

  // 遍历所有视图组件
  for (const path in modules) {
    // 路由禁用，用于测试和开发处理
    if (routesDisabled.includes(path)) continue;

    // 提取路由名称
    const routeName = path.match(modulesRegex)![1] || "";

    // 获取路由中文标题
    const metaName = routesSort.find((item) => item.name === routeName);

    // 创建路由配置
    const route: RouteRecordRaw = {
      name: routeName,
      path: `/${kebabCase(routeName)}`,
      meta: { title: metaName?.title || routeName, icon: routeName },
      component: modules[path],
      children: [],
    };

    // 系统路由
    if (system.length && system.includes(routeName)) {
      systemRoutes.push(route);
      // 框架路由
    } else if (framework.length && framework.includes(routeName)) {
      route.path = "/"; // 框架路由路径为根路径
      // 查找第一个未禁用的路由作为重定向目标
      const firstEnabledRoute = routesSort.find(
        (item) => !routesDisabled.includes(item.name)
      );
      route.redirect = firstEnabledRoute?.name; // 框架路由重定向为第一个未禁用的路由
      frameworkRoutes.push(route);
    } else {
      // 非系统路由，添加到路由列表，并处理子路由
      for (const childPath in childrenModules) {
        const [, routeName, childRouteName] =
          childPath.match(childrenModulesRegex) || [];

        // 非当前路由的子路由，跳过
        if (routeName !== route.name) continue;
        // 获取路由中文标题
        const metaName = routesSort.find(
          (item) => item.name === childRouteName
        );
        // 添加子路由配置
        route.children.push({
          path: kebabCase(childRouteName || ""),
          name: kebabCase(childRouteName || ""),
          meta: { title: metaName?.title || routeName },
          component: childrenModules[childPath] as unknown as Promise<unknown>,
        });
      }
      routes.push(route);
    }
  }
  return { system: systemRoutes, framework: frameworkRoutes, routes };
}

/**
 * 过滤系统路由
 * @param {RouteRecordRaw[]} routes 路由配置
 * @param {string[]} rolesName 允许的路由名称列表
 * @returns {RouteRecordRaw[]} 过滤后的路由配置
 */
export function filterSystemRoutes(
  routes: RouteRecordRaw[],
  rolesName: string[]
): RouteRecordRaw[] {
  return routes.filter((route) => {
    const routeName = route.name;
    return typeof routeName === "string" && rolesName.includes(routeName);
  });
}

/**
 * 排序路由
 * @param {RouteRecordRaw[]} routes 路由配置
 * @returns {RouteRecordRaw[]} 排序后的路由配置
 */
export function sortRoutes(
  routes: RouteRecordRaw[],
  rolesSort: { name: string; title: string }[]
): RouteRecordRaw[] {
  // 根据 rolesSort 顺序进行排序
  return routes.sort((a, b) => {
    const aIndex = rolesSort.findIndex((item) => item.name === a.name);
    const bIndex = rolesSort.findIndex((item) => item.name === b.name);
    return aIndex - bIndex;
  });
}

/**
 * 获取异步路由，基于框架路由和系统路由
 * @param {string[]} frameworkRoutes 框架路由
 * @param {string[]} systemRoutes 系统路由
 * @param {RouteRecordRaw[]} routesSort 路由排序
 * @returns {RouteRecordRaw[]} 异步路由配置
 */
export function getBuildRoutes(
  mainRoute: Record<string, () => Promise<unknown>>,
  childrenRoutes: Record<string, () => Promise<unknown>>,
  routesOptions: RouteOptions
): { routeGroup: RouteRecordRaw[]; routes: RouteRecordRaw[] } {
  // 生成框架路由
  const { framework, system, routes } = generateRoutes(
    mainRoute,
    childrenRoutes,
    routesOptions
  );
  // 排序路由
  const sortedRoutes = sortRoutes(routes, [...routesOptions.sort]);

  // console.log(sortedRoutes);
  // 如果框架路由存在，则将排序后的路由添加到框架路由的子路由中
  if (framework[0]) framework[0].children = [...sortedRoutes];
  // 返回排序后的路由
  return { routeGroup: [...framework, ...system], routes };
}

export default getBuildRoutes;
