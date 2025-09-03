/**
 * 页面头部组件
 * 提供页面标题、描述和面包屑导航功能
 */

import { computed, defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/components/layout/useStore";
import { NBreadcrumb, NBreadcrumbItem, NIcon, NSpace, NText } from "naive-ui";
import type { Component } from "vue";

/**
 * 面包屑项接口
 */
interface BreadcrumbItem {
  /** 标题 */
  title: string;
  /** 路径 */
  path?: string;
  /** 是否可点击 */
  clickable?: boolean;
  /** 图标 - 可以是字符串或Vue组件 */
  icon?: string | Component;
}

/**
 * 页面头部组件属性
 */
interface PageHeaderProps {
  /** 页面标题 */
  title?: string;
  /** 页面描述 */
  description?: string;
  /** 面包屑导航数据 */
  breadcrumbs?: BreadcrumbItem[];
  /** 是否显示面包屑 */
  showBreadcrumb?: boolean;
}

/**
 * 页面头部组件
 */
export default defineComponent({
  name: "PageHeader",
  props: {
    title: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      default: undefined,
    },
    breadcrumbs: {
      type: Array as () => BreadcrumbItem[],
      default: undefined,
    },
    showBreadcrumb: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: PageHeaderProps, { slots }) {
    const router = useRouter();
    const appStore = useAppStore();

    // 计算属性：获取面包屑数据，统一转换为ExtendedBreadcrumbItem格式
    const computedBreadcrumbs = computed(() => {
      if (props.breadcrumbs) {
        return props.breadcrumbs;
      }
      // 将appStore的breadcrumbs转换为ExtendedBreadcrumbItem格式
      return appStore.breadcrumbs.map(
        (item) =>
          ({
            title: item.name,
            path: item.path,
            clickable: !!item.path,
          }) as BreadcrumbItem,
      );
    });

    // 计算属性：获取页面标题
    const computedTitle = computed(() => {
      return props.title || appStore.appTitle;
    });

    // 计算属性：获取页面描述
    const computedDescription = computed(() => {
      return props.description || "";
    });

    /**
     * 处理面包屑点击
     * @param item 面包屑项
     */
    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
      if (item.clickable !== false && item.path) {
        router.push(item.path);
      }
    };

    return () => (
      <NSpace vertical size="small" class="mb-4">
        {/* 面包屑导航 */}
        {props.showBreadcrumb && computedBreadcrumbs.value.length > 0 && (
          <NSpace class="mb-2">
            <NBreadcrumb>
              {computedBreadcrumbs.value.map((item, index) => (
                <NBreadcrumbItem
                  key={index}
                  clickable={item.clickable !== false && !!item.path}
                  onClick={() => handleBreadcrumbClick(item)}
                >
                  {{
                    icon: item.icon
                      ? () => (
                          <NIcon>
                            {typeof item.icon === "string" ? (
                              <i class={item.icon} />
                            ) : (
                              h(item.icon as Component)
                            )}
                          </NIcon>
                        )
                      : undefined,
                    default: () => (
                      <span class="text-[#20a53a]">{item.title}</span>
                    ),
                  }}
                </NBreadcrumbItem>
              ))}
            </NBreadcrumb>
          </NSpace>
        )}

        {/* 页面标题和描述 */}
        <NSpace vertical size="small" style={{ paddingLeft: "4px" }}>
          {computedTitle.value && (
            <NText
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                margin: "0",
                marginBottom: "4px",
              }}
            >
              {computedTitle.value}
            </NText>
          )}
          {computedDescription.value && (
            <NText depth={3} style={{ margin: "0" }}>
              {computedDescription.value}
            </NText>
          )}
        </NSpace>

        {/* 插槽：额外内容 */}
        {slots.default?.()}
      </NSpace>
    );
  },
});
