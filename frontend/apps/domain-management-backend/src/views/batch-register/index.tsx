import { defineComponent } from "vue";
import { NCard, NResult } from "naive-ui";

export default defineComponent({
  name: "BatchRegister",
  setup() {
    return () => (
      <div class="min-h-[60vh] flex items-center justify-center">
        <NCard
          class="max-w-[400px]"
          contentStyle={{ padding: "40px 20px" }}
          bordered={false}
        >
          <NResult
            status="info"
            title="功能开发中"
            description="批量注册功能正在开发中，暂不支持使用。请耐心等待，我们将尽快完善此功能。"
          />
        </NCard>
      </div>
    );
  },
});
