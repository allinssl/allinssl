import { defineComponent, ref, watch, onMounted, computed } from "vue";
import { NForm, NFormItem, NRadioGroup, NRadioButton, NSpace, NAlert, NSelect, NQrCode } from 'naive-ui'
import { useRechargeState } from "../useStore";
import { useRechargeController } from "../useController";

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 400) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default defineComponent({
  name: "RechargeDialogContent",
  setup() {
    const { createPayload, setCreatePayload, qrWxUrl, qrAliUrl } = useRechargeState();
    const { createRechargeOrder } = useRechargeController();

    const presets = [2000, 3000, 5000];
    const amountOptions = presets.map((p) => ({ label: `${p}元`, value: p }));
    const updating = ref(false);

    const requestOrder = async () => {
      try {
        updating.value = true;
        await createRechargeOrder();
      } finally {
        updating.value = false;
      }
    };

    const triggerOrder = debounce(requestOrder, 300);

    onMounted(async () => {
      setCreatePayload({ amount: 2000, channel: 'wechat' });
      await requestOrder();
    });

    watch(
      [() => createPayload.value.amount],
      () => triggerOrder(),
    );

    const onAmountChange = (v: number) => setCreatePayload({ ...createPayload.value, amount: Number(v || 0) });
    const onChannelChange = (v: 'wechat' | 'alipay') => setCreatePayload({ ...createPayload.value, channel: v });

    const qrLink = computed(() => (createPayload.value.channel === 'wechat' ? qrWxUrl.value : qrAliUrl.value) || '');

    return () => (
			<>
				<NAlert type="warning" showIcon>
					充值的金额可以在后台购买所有堡塔产品，包括但不限于linux专业版、linux企业版、windows专业版、windows企业版、云监控
				</NAlert>
				<NForm labelPlacement="left" class="p-4">
					<NFormItem label="充值金额">
						<NSelect
							style={{ width: '180px' }}
							value={createPayload.value.amount}
							options={amountOptions}
							onUpdateValue={(v) => onAmountChange(Number(v || 0))}
						/>
					</NFormItem>
					<NFormItem label="充值方式">
						<NRadioGroup value={createPayload.value.channel} onUpdateValue={(v) => onChannelChange(v as any)}>
							<NSpace>
								<NRadioButton value="wechat">微信支付</NRadioButton>
								<NRadioButton value="alipay">支付宝</NRadioButton>
							</NSpace>
						</NRadioGroup>
					</NFormItem>
					<NFormItem label="">
						<div style="width: 256px; height: 256px; display:flex; align-items:center; justify-content:center; border: 1px dashed #ececec;">
							{qrLink.value ? (
								<NQrCode value={qrLink.value} size={220} />
							) : (
								<span>{updating.value ? '生成中...' : '请选择金额与方式'}</span>
							)}
						</div>
					</NFormItem>
				</NForm>
			</>
		)
  },
}); 