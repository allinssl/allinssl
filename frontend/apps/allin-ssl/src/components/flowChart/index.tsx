import { NButton, NIcon, NInput } from 'naive-ui'
import { useTheme } from "@baota/naive-ui/theme";
import { SaveOutlined, ArrowLeftOutlined, ReloadOutlined } from "@vicons/antd";
import { $t } from '@locales/index'
import SvgIcon from '@components/SvgIcon'

import { useController } from './useController'
import { useStore } from './useStore'

import EndNode from './components/base/endNode'
import NodeWrap from './components/render/nodeWrap'

import styles from './index.module.css'
import type { FlowNode, FlowNodeProps } from './types'
import { useThemeCssVar } from '@baota/naive-ui/theme'

export default defineComponent({
  name: "FlowChart",
  props: {
    isEdit: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String as PropType<"quick" | "advanced">,
      default: "quick",
    },
    node: {
      type: Object as PropType<FlowNode>,
      default: () => ({}),
    },
    // 任务节点列表
    taskComponents: {
      type: Object as PropType<Record<string, Component>>,
      default: () => ({}),
    },
  },
  setup(props: FlowNodeProps, { slots }) {
	const { isDark } = useTheme()
    const cssVars = useThemeCssVar([
      "borderColor",
      "dividerColor",
      "textColor1",
      "textColor2",
      "primaryColor",
      "primaryColorHover",
      "bodyColor",
    ]);
    const { flowData, selectedNodeId, flowZoom, resetFlowData, setZoomValue } =
      useStore();
    const { initData, handleSaveConfig, handleZoom, goBack } = useController({
      type: props?.type,
      node: props?.node,
      isEdit: props?.isEdit,
    });

    // 拖拽状态管理
    const dragState = reactive({
      isDragging: false,
      startX: 0,
      startY: 0,
      hasDragged: false,
    });

    // 画布容器引用
    const canvasRef = ref<HTMLElement | null>(null);

    // 鼠标按下事件
    const handleMouseDown = (e: MouseEvent) => {
      // 只有左键点击才触发拖拽
      if (e.button !== 0) return;

      dragState.isDragging = true;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.hasDragged = false;

      // 添加鼠标样式反馈
      document.body.style.cursor = "grabbing";
    };

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !isComponentMounted.value || !canvasRef.value) return;

      try {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          dragState.hasDragged = true;
        }

        // 通过 scrollLeft/scrollTop 平移，与原生滚动条同步
        canvasRef.value.scrollLeft -= deltaX;
        canvasRef.value.scrollTop -= deltaY;

        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
      } catch (error) {
        console.warn("拖拽移动处理出错:", error);
      }
    };

    // 鼠标抬起事件
    const handleMouseUp = () => {
      if (dragState.isDragging) {
        dragState.isDragging = false;
        document.body.style.cursor = ""; // 恢复鼠标样式
        // 实际发生了拖拽时，拦截紧接的 click 事件，避免误选节点
        if (dragState.hasDragged) {
          document.addEventListener('click', (e) => e.stopPropagation(), { once: true, capture: true });
          dragState.hasDragged = false;
        }
      }
    };

    // 重置缩放和位置
    const handleReset = () => {
      try {
        // 重置缩放为100%
        setZoomValue(100);
        // 重置滚动位置
        if (canvasRef.value) {
          canvasRef.value.scrollLeft = 0;
          canvasRef.value.scrollTop = 0;
        }
      } catch (error) {
        console.warn("重置处理出错:", error);
      }
    };

    // 滚轮缩放事件（带节流优化）
    let wheelTimeout: number | null = null;
    const isComponentMounted = ref(true);

    const handleWheel = (e: WheelEvent) => {
      // 只有捏合手势（ctrlKey）才触发缩放，普通双指滑动交给原生滚动
      if (!e.ctrlKey) return;

      e.preventDefault();

      if (!isComponentMounted.value) return;

      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }

      wheelTimeout = window.setTimeout(() => {
        if (!isComponentMounted.value) return;

        try {
          const delta = e.deltaY > 0 ? -10 : 10;
          const newZoom = Math.max(50, Math.min(300, flowZoom.value + delta));

          if (newZoom !== flowZoom.value) {
            setZoomValue(newZoom);
          }
        } catch (error) {
          console.warn("滚轮缩放处理出错:", error);
        }
      }, 16);
    };

    // 提供任务节点组件映射给后代组件使用
    provide("taskComponents", props.taskComponents);

    onMounted(() => {
      initData();
      // 绑定全局事件
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // 绑定滚轮事件到画布容器
      if (canvasRef.value) {
        canvasRef.value.addEventListener("wheel", handleWheel, {
          passive: false,
        });
      }
    });

    onUnmounted(() => {
      // 标记组件已卸载
      isComponentMounted.value = false;

      resetFlowData();
      // 解绑事件，避免内存泄漏
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // 解绑滚轮事件
      if (canvasRef.value) {
        canvasRef.value.removeEventListener("wheel", handleWheel);
      }
      // 清理定时器
      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
        wheelTimeout = null;
      }
    });
    const zoomIconColor = computed(() =>
      isDark.value ? "#ffffff" : "#5a5e66"
    );

    return () => (
      <div class="flex flex-col w-full h-full" style={cssVars.value}>
        <div class="w-full h-[6rem] px-[2rem] mb-[2rem] rounded-lg flex items-center gap-2 justify-between">
          <div class="flex items-center">
            <NButton class="gradient-default-btn" onClick={goBack}>
              <NIcon class="mr-1">
                <ArrowLeftOutlined />
              </NIcon>
              {$t("t_0_1744861190562")}
            </NButton>
          </div>
          <div class="flex items-center ml-[.5rem]">
            <NInput
              v-model:value={flowData.value.name}
              placeholder={$t("t_0_1745490735213")}
              class="!w-[30rem] !border-none !bg-[var(--workflow-header-input-bg)]"
            />
          </div>
          <div class="flex items-center gap-2">
            <NButton
              type={isDark.value ? "tertiary" : "primary"}
              onClick={handleSaveConfig}
              disabled={!selectedNodeId}
            >
              <NIcon class="mr-1">
                <SaveOutlined />
              </NIcon>
              {$t("t_2_1744861190040")}
            </NButton>
          </div>
        </div>
        <div
          class={styles.flowContainer}
          ref={canvasRef}
          onMousedown={handleMouseDown}
          onMouseleave={handleMouseUp}
        >
          {/* 流程容器*/}
          <div
            class={styles.flowProcess}
            style={{
              transform: `scale(${flowZoom.value / 100})`,
            }}
          >
            {/* 渲染流程节点 */}
            <NodeWrap node={flowData.value.childNode} />
            {/* 流程结束节点  */}
            <EndNode />
          </div>
        </div>
        {/*  缩放控制区 */}
        <div class={[styles.flowZoom, isDark.value ? styles.flowZoomDark : ""]}>
          <div
            class={[
              styles.flowZoomIcon,
              isDark.value ? styles.flowZoomIconDark : "",
            ]}
            onClick={() => handleZoom(1)}
          >
            <SvgIcon
              icon="subtract"
              class={`${flowZoom.value === 50 ? styles.disabled : ""}`}
              color={zoomIconColor.value}
            />
          </div>
          <div
            class={[
              styles.flowZoomValue,
              isDark.value ? styles.flowZoomValueDark : "",
            ]}
          >
            {flowZoom.value}%
          </div>
          <div
            class={[
              styles.flowZoomIcon,
              isDark.value ? styles.flowZoomIconDark : "",
            ]}
            onClick={() => handleZoom(2)}
          >
            <SvgIcon
              icon="plus"
              class={`${flowZoom.value === 300 ? styles.disabled : ""}`}
              color={zoomIconColor.value}
            />
          </div>
          <div
            class={[
              styles.flowZoomIcon,
              isDark.value ? styles.flowZoomIconDark : "",
            ]}
            onClick={handleReset}
            title="重置视图"
          >
            <NIcon size="16" color={zoomIconColor.value}>
              <ReloadOutlined />
            </NIcon>
          </div>
        </div>
        {/* 保留原有插槽 */}
        {slots.default?.()}
      </div>
    );
  },
});
