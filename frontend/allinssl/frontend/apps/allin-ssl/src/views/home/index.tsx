import { defineComponent, computed } from "vue";
import {
  NCard,
  NSpin,
  NIcon,
  NEmpty,
  NDataTable,
  NButton,
  NImage,
} from "naive-ui";
import { CloudMonitoring, Flow, ArrowRight } from "@vicons/carbon";
import { Certificate20Regular } from "@vicons/fluent";
import { useThemeCssVar, useTheme } from "@baota/naive-ui/theme";

// Absolute Internal Imports - Utilities
import { $t } from "@locales/index";

// Relative Internal Imports
import { useController } from "./useController";
import { useStore } from "./useStore";

// Side-effect Imports
import styles from "./index.module.css";

// 资源导入/主题切换逻辑已迁移至 useController

/**
 * @component HomeView
 * @description 首页视图组件。
 * 负责展示应用概览信息、工作流历史以及快捷入口。
 */
export default defineComponent({
  name: "HomeView",
  setup() {
    const { loading } = useStore();
    const {
      overviewData,
      pushToWorkflow,
      pushToCert,
      pushToMonitor,
      pushToCertManage,
      createColumns,
      statusIcons,
      quickEntryImgs,
    } = useController();
    const columns = createColumns();

    // 获取主题状态
    const { isDark } = useTheme();
    // useThemeCssVar 会将这些 camelCase 变量名转换为 kebab-case CSS 变量 (e.g., successColor -> --n-success-color)
    // 并将它们应用到绑定 style 的元素上。
    const cssVars = useThemeCssVar([
      "successColor",
      "errorColor",
      "warningColor",
      "primaryColor",
    ]);

    return () => (
      <div
        class="w-full p-[24px] mx-auto max-w-[1600px] "
        style={cssVars.value}
      >
        <NSpin show={loading.value}>
          <div class="flex flex-col h-full gap-[24px]">
            {/* 概览模块 */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              {/* 自动化工作流概览卡片 */}
              <div
                onClick={() => pushToWorkflow()}
                class="cursor-pointer relative"
              >
                <div
                  class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
                ></div>
                <NCard
                  class="transition-all duration-300 rounded-[1.2rem]"
                  hoverable={true}
                  bordered={false}
                  content-class="!p-[24px] !pl-[45px]"
                >
                  <div class="flex items-center justify-center">
                    <div class="flex-1">
                      <div class={styles.tableTitle}>
                        {$t("t_2_1746773350970")}
                      </div>
                      <div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
                        <div
                          class={`border-r-2 pr-16 mr-16 ${styles.borderColor}`}
                        >
                          <span
                            class={`xl:text-[3rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold text-color4 ${styles.gradientNumber}`}
                          >
                            {overviewData.value.workflow.count}
                          </span>
                          <p class={styles.tableSubtitle}>
                            {$t("t_3_1746773348798")}
                          </p>
                        </div>
                        <div class="!ml-0 min-h-[5rem] flex flex-col justify-center">
                          <div class="flex items-center space-x-1">
                            <NIcon size="22" class="mr-4 flex">
                              <span
                                class="inline-flex"
                                innerHTML={statusIcons.value.success}
                              />
                            </NIcon>
                            <div class={`${styles.tableText} flex`}>
                              <span class="min-w-[70px]">
                                {$t("t_0_1746782379424")}
                              </span>
                              <span class="number ml-4 font-bold">
                                {overviewData.value.workflow.active}
                              </span>
                            </div>
                          </div>
                          <div class="flex items-center space-x-1 mt-4">
                            <NIcon size="22" class="mr-4 flex">
                              <span
                                class="inline-flex"
                                innerHTML={statusIcons.value.error}
                              />
                            </NIcon>
                            <div class={`${styles.tableText} flex`}>
                              <span class="min-w-[70px]">
                                {$t("t_4_1746773348957")}
                              </span>
                              <span class="number ml-4 font-bold">
                                {overviewData.value.workflow.failure}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>

              {/* 证书管理概览卡片 */}
              <div
                onClick={() => pushToCertManage()}
                class="cursor-pointer relative"
              >
                <div
                  class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
                ></div>
                <NCard
                  class="transition-all duration-300 rounded-[1.2rem]"
                  hoverable={true}
                  bordered={false}
                  content-class="!p-[24px] !pl-[45px]"
                >
                  <div class="flex items-center justify-center">
                    <div class="flex-1">
                      <div class={styles.tableTitle}>
                        {$t("t_2_1744258111238")}
                      </div>
                      <div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
                        <div
                          class={`border-r-2 pr-16 mr-16 ${styles.borderColor}`}
                        >
                          <span
                            class={`xl:text-[3rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold text-color4 ${styles.gradientNumber}`}
                          >
                            {overviewData.value.cert.count}
                          </span>
                          <p class={styles.tableSubtitle}>
                            {$t("t_3_1746773348798")}
                          </p>
                        </div>
                        <div class="!ml-0 min-h-[5rem] flex flex-col justify-center">
                          <div class="flex items-center space-x-1">
                            <NIcon size="22" class="mr-4 flex">
                              <span
                                class="inline-flex"
                                innerHTML={statusIcons.value.toExpire}
                              />
                            </NIcon>
                            <div class={`${styles.tableText} flex`}>
                              <span class="min-w-[70px]">
                                {$t("t_5_1746773349141")}
                              </span>
                              <span class="number ml-4 font-bold">
                                {overviewData.value.cert.will}
                              </span>
                            </div>
                          </div>
                          <div class="flex items-center space-x-1 mt-4">
                            <NIcon size="22" class="mr-4 flex">
                              <span
                                class="inline-flex"
                                innerHTML={statusIcons.value.expired}
                              />
                            </NIcon>
                            <div class={`${styles.tableText} flex`}>
                              <span class="min-w-[70px]">
                                {$t("t_0_1746001199409")}
                              </span>
                              <span class="number ml-4 font-bold">
                                {overviewData.value.cert.end}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>

              {/* 实时监控概览卡片 */}
              <div
                onClick={() => pushToMonitor()}
                class="cursor-pointer relative"
              >
                <div
                  class={`absolute right-0 top-0 w-24 h-24 rounded-full opacity-70 -z-10 ${styles.bgUtilDecorative}`}
                ></div>
                <NCard
                  class="transition-all duration-300 rounded-[1.2rem]"
                  hoverable={true}
                  bordered={false}
                  content-class="!p-[24px] !pl-[45px]"
                >
                  <div class="flex items-center justify-center">
                    <div class="flex-1">
                      <div class={styles.tableTitle}>
                        {$t("t_6_1746773349980")}
                      </div>
                      <div class="flex items-center xl:space-x-5 lg:space-x-4 md:space-x-3 space-x-3">
                        <div
                          class={`border-r-2 pr-16 mr-16 ${styles.borderColor}`}
                        >
                          <span
                            class={`xl:text-[3rem] lg:text-[2.2rem] md:text-[2rem] text-[1.8rem] font-bold text-color4 ${styles.gradientNumber}`}
                          >
                            {overviewData.value.monitor.count}
                          </span>
                          <p class={styles.tableSubtitle}>
                            {$t("t_3_1746773348798")}
                          </p>
                        </div>
                        <div class="!ml-0 min-h-[5rem] flex flex-col justify-center">
                          <div class="flex items-center space-x-1">
                            <NIcon size="22" class="mr-4 flex">
                              <span
                                class="inline-flex"
                                innerHTML={statusIcons.value.abnormal}
                              />
                            </NIcon>
                            <div class={`${styles.tableText} flex`}>
                              <span class="min-w-[70px]">
                                {$t("t_7_1746773349302")}
                              </span>
                              <span class="number ml-4 font-bold">
                                {overviewData.value.monitor.exception}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>
            </div>

            {/* 工作流执行列表 */}
            <NCard
              class="rounded-[1rem] transition-all duration-300"
              hoverable={true}
              bordered={false}
              content-class="!p-[24px]"
            >
              <div class="flex justify-between items-center mb-6">
                <div class={styles.tableTitle}>{$t("t_8_1746773351524")}</div>
                <NButton
                  text
                  type="primary"
                  onClick={() => pushToWorkflow()}
                  class={`font-bold gradient-primary-txt`}
                >
                  {$t("t_9_1746773348221")}
                </NButton>
              </div>
              {overviewData.value.workflow_history.length > 0 ? (
                <NDataTable
                  columns={columns}
                  data={overviewData.value.workflow_history}
                  bordered={false}
                  size="medium"
                  singleLine={false}
                  rowClassName={() => "border-none"}
                  class="border-none"
                  style={{
                    "--n-border-color": "transparent",
                    "--n-border-radius": "0",
                  }}
                />
              ) : (
                <NEmpty description={$t("t_10_1746773351576")} />
              )}
            </NCard>

            {/* 快捷入口区域 */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              {/* 工作流构建入口 */}
              <div
                onClick={() => pushToWorkflow("create")}
                class="cursor-pointer"
              >
                <NCard
                  class={`${styles.quickEntryCard} transition-all duration-300`}
                  hoverable={true}
                  bordered={false}
                  content-class="!p-0"
                >
                  <div class="flex flex-col items-center">
                    <div class={styles.quickEntryImageWrapper}>
                      <NImage
                        class={styles.quickEntryImage}
                        src={quickEntryImgs.value[0]}
                      />
                    </div>
                    <div class={styles.quickEntryCardContent}>
                      <div
                        class={`${styles.title} text-[1.8rem] font-medium mb-3`}
                      >
                        {$t("t_11_1746773349054")}
                      </div>
                      <div class={`${styles.tableText} text-color5`}>
                        {$t("t_12_1746773355641")}
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>

              {/* 申请证书入口 */}
              <div onClick={() => pushToCert()} class="cursor-pointer">
                <NCard
                  class={`${styles.quickEntryCard} transition-all duration-300 rounded-[0.8rem]`}
                  hoverable={true}
                  bordered={false}
                  content-class="!p-0"
                >
                  <div class="flex flex-col items-center">
                    <div class={styles.quickEntryImageWrapper}>
                      <NImage
                        class={styles.quickEntryImage}
                        src={quickEntryImgs.value[1]}
                      />
                    </div>
                    <div class={styles.quickEntryCardContent}>
                      <div
                        class={`${styles.title} text-[1.8rem] font-medium mb-3`}
                      >
                        {$t("t_13_1746773349526")}
                      </div>
                      <div class={`${styles.tableText} text-color5`}>
                        {$t("t_14_1746773355081")}
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>

              {/* 添加监控入口 */}
              <div
                onClick={() => pushToMonitor("create")}
                class="cursor-pointer"
              >
                <NCard
                  class={`${styles.quickEntryCard} transition-all duration-300 rounded-[0.8rem]`}
                  hoverable={true}
                  bordered={false}
                  content-class="!p-0"
                >
                  <div class="flex flex-col items-center">
                    <div class={styles.quickEntryImageWrapper}>
                      <NImage
                        class={styles.quickEntryImage}
                        src={quickEntryImgs.value[2]}
                      />
                    </div>
                    <div class={styles.quickEntryCardContent}>
                      <div
                        class={`${styles.title} text-[1.8rem] font-medium mb-3`}
                      >
                        {$t("t_11_1745289354516")}
                      </div>
                      <div class={`${styles.tableText} text-color5`}>
                        {$t("t_1_1747019624067")}
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>
            </div>
          </div>
        </NSpin>
      </div>
    );
  },
});
