import { NCard, NButton, NTooltip, NInput, NCollapse, NCollapseItem } from "naive-ui";
import { $t } from "@locales/index";
import { useStore } from "../useStore";
import { useController, useGeneralSettingsController, useApiKeyController } from "../useController";
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
    const { generateApiKey, handleSaveApiKey, handleClearApiKey } = useApiKeyController();
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

        <NCard class={`${styles.baseCard} mt-4`} title="API 接口访问">
          <div class="flex items-center gap-3 mb-3">
            <NInput
              value={generalSettings.value.api_key}
              onUpdateValue={(val: string) => { generalSettings.value.api_key = val; }}
              type="password"
              showPasswordOn="click"
              placeholder="未设置 API Key（设置后可通过签名方式调用接口）"
              class="flex-1"
            />
            <NButton onClick={generateApiKey}>生成</NButton>
          </div>
          <div class="flex gap-3 mb-4">
            <NButton type="primary" class="gradient-primary-btn" onClick={handleSaveApiKey}>保存</NButton>
            <NButton onClick={handleClearApiKey}>清除（关闭API）</NButton>
          </div>
          <NCollapse>
            <NCollapseItem title="使用说明" name="usage">
              <div class="text-sm leading-7 font-mono">
                <p>签名算法：</p>
                <p>keyMd5 = MD5(api_key)</p>
                <p>api_token = MD5(timestamp + keyMd5)</p>
                <p class="mt-2">请求时附带参数（Query 或 Form）：</p>
                <p>api_token=&lt;签名&gt;&amp;timestamp=&lt;Unix秒级时间戳&gt;</p>
                <p class="mt-2 text-gray-500">时间戳误差不超过 5 分钟。可用于以下接口：</p>
                <p>GET /v1/cert/download?id=xxx&amp;api_token=xxx&amp;timestamp=xxx</p>
                <p>POST /v1/cert/upload_cert</p>
                <p>POST /v1/cert/get_list</p>
              </div>
            </NCollapseItem>
          </NCollapse>
        </NCard>
      </div>
    );
  },
});
