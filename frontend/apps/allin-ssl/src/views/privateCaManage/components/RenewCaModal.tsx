import { defineComponent, ref } from "vue";
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NButton,
  NAlert,
  useMessage,
} from "naive-ui";
import { useModalClose } from "@baota/naive-ui/hooks";
import { renewCa } from "@/api/ca";
import type { PrivateCaItem } from "../types";

/**
 * 续期CA模态框组件
 * @description 保持私钥不变重新签发CA证书，已签发的证书与信任链不受影响
 */
export default defineComponent({
  name: "RenewCaModal",
  props: {
    ca: {
      type: Object as () => PrivateCaItem,
      required: true,
    },
  },
  emits: ["success"],
  setup(props, { emit }) {
    const message = useMessage();
    const closeModal = useModalClose();

    const validDays = ref<string>("");
    const validityUnit = ref<"day" | "year">("year");
    const submitting = ref(false);

    // 处理续期提交（消息提示由请求封装自动显示：成功走响应消息，失败走错误中间件，避免双提示）
    const handleSubmit = async () => {
      const num = parseInt(validDays.value);
      if (isNaN(num) || num <= 0) {
        message.error("请输入大于0的有效期");
        return;
      }
      const days = validityUnit.value === "year" ? num * 365 : num;
      try {
        submitting.value = true;
        const { fetch, data, message: apiMessage } = renewCa({
          id: props.ca.id.toString(),
          valid_days: days.toString(),
        });
        apiMessage.value = true;
        await fetch();
        if (data.value?.status) {
          emit("success");
          closeModal();
        }
      } catch (error: any) {
        console.error("续期CA失败:", error);
      } finally {
        submitting.value = false;
      }
    };

    return () => (
      <NForm labelPlacement="left" labelWidth="auto">
        <NAlert type="info" class="mb-4">
          续期将保持私钥不变，在当前到期时间基础上增加有效期（已过期的从现在开始计算），该CA已签发的证书不受影响。
        </NAlert>
        <NFormItem label="CA名称">
          <NInput value={props.ca.name} disabled />
        </NFormItem>
        <NFormItem label="类型">
          <NInput
            value={props.ca.type === "root" ? "根CA" : "中间CA"}
            disabled
          />
        </NFormItem>
        <NFormItem label="当前有效期至">
          <NInput value={props.ca.validTo} disabled />
        </NFormItem>
        <NFormItem label="增加有效期" required>
          <NSpace align="center">
            <NInput
              v-model:value={validDays.value}
              placeholder="请输入要增加的有效期"
            />
            <NSelect
              v-model:value={validityUnit.value}
              options={[
                { label: "天", value: "day" },
                { label: "年", value: "year" },
              ]}
              style={{ width: "80px" }}
            />
          </NSpace>
        </NFormItem>
        <div class="flex justify-end gap-3 mt-6">
          <NButton onClick={closeModal}>取消</NButton>
          <NButton
            class="gradient-primary-btn"
            type="primary"
            loading={submitting.value}
            onClick={handleSubmit}
          >
            确定
          </NButton>
        </div>
      </NForm>
    );
  },
});
