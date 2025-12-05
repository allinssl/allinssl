import { NCard, NButton, NTooltip } from "naive-ui";
import { $t } from "@locales/index";
import { useStore } from "../useStore";
import { useController, useGeneralSettingsController } from "../useController";
import styles from "./index.module.css";

/**
 * 常用设置标签页组件
 */
export default defineComponent({
  name: "GeneralSettings",
  setup() {
    const { generalSettings } = useStore();
    const { handleSaveGeneralSettings, handleDownloadData } = useController();
    const { GeneralForm } = useGeneralSettingsController();
    return () => (
      <div class={`${styles.generalSettingsCard} flex flex-col`}>
        <NCard class={styles.baseCard}>
          <GeneralForm labelPlacement="top" class={styles.formGrid} />
        </NCard>
        <div class="mt-[1rem] flex">
          <NButton
            type="primary"
            class="gradient-primary-btn mr-[2rem]"
            onClick={() => handleSaveGeneralSettings(generalSettings.value)}
          >
            {$t("t_9_1745464078110")}
          </NButton>
          <NTooltip
            v-slots={{
              trigger: () => (
                <NButton
                  class="gradient-primary-btn"
                  type="primary"
                  onClick={handleDownloadData}
                >
                  下载数据
                </NButton>
              ),
            }}
          >
            下载工作流、通知、证书、api授权数据，可直接将数据库文件复制到allinssl的data下使用
          </NTooltip>
        </div>
      </div>
    );
  },
});
