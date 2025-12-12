import { NCard, NIcon } from "naive-ui";
import {
  SettingFilled,
  BellOutlined,
  InfoCircleFilled,
} from "@vicons/antd";

import { useStore } from "./useStore";
import { useController } from "./useController";
import BaseComponent from "@components/BaseLayout";
import GeneralSettings from "./components/GeneralSettings";
import NotificationSettings from "./components/NotificationSettings";
import AboutSettings from "./components/AboutSettings";

/**
 * 设置页面组件
 */
export default defineComponent({
  name: "Settings",
  setup() {
    const { tabOptions } = useStore();
    const { fetchAllSettings } = useController();

    // 渲染图标组件
    const renderIcon = (iconName: string) => {
      const icons: Record<string, any> = {
        SettingFilled: <SettingFilled />,
        BellOutlined: <BellOutlined />,
        InfoCircleFilled: <InfoCircleFilled />,
      };
      return <NIcon size="20">{icons[iconName]}</NIcon>;
    };

    onMounted(() => {
      fetchAllSettings();
    });

    return () => (
      <div class="h-full flex flex-col">
        <div class="mx-auto max-w-[1600px] w-full p-6">
          <BaseComponent
            v-slots={{
              content: () => (
                <div class="w-full space-y-6">
                  {/* 常用设置 */}
                  <NCard>
                    <div>
                      <div class="flex items-center mb-6">
                        {renderIcon("SettingFilled")}
                        <h2 class="ml-2 text-[1.8rem] font-semibold">
                          {tabOptions.value[0]?.title || "常用设置"}
                        </h2>
                      </div>
                      <GeneralSettings />
                    </div>
                  </NCard>

                  {/* 告警通知 */}
				  <div>
					<NotificationSettings
                      title={tabOptions.value[1]?.title || "告警通知"}
                    />
				  </div>

                  {/* 关于我们 */}
                  <NCard>
                    <div class="p-6">
                      <div class="flex items-center mb-6">
                        {renderIcon("InfoCircleFilled")}
                        <h2 class="ml-2 text-[1.8rem] font-semibold">
                          {tabOptions.value[2]?.title || "关于我们"}
                        </h2>
                      </div>
                      <AboutSettings />
                    </div>
                  </NCard>
                </div>
              ),
            }}
          />
        </div>
      </div>
    );
  },
});
