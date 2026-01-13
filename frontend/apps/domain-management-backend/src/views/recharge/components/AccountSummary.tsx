import { defineComponent } from "vue";
import { NCard, NGrid, NGridItem, NButton, NStatistic } from "naive-ui";
import { useRechargeState } from "../useStore";
import { useRechargeController } from "../useController";

export default defineComponent({
  name: "AccountSummary",
  setup() {
		const state = useRechargeState();
		const { openRechargeModal } = useRechargeController();

    return () => (
			<NGrid cols={2} xGap={16} yGap={16} responsive="screen">
				<NGridItem>
					<NCard title="账户余额">
						<NStatistic tabularNums value={`¥${(state.overview.value?.balance || 0).toFixed(2)}`} />
						<div class="mt-3">
							<NButton type="success" onClick={() => openRechargeModal()}>
								+ 充值
							</NButton>
						</div>
					</NCard>
				</NGridItem>
				<NGridItem>
					<NCard title="可开票余额">
						<NStatistic tabularNums value={`¥${(state.overview.value?.invoiceableAmount || 0).toFixed(2)}`} />
						<div class="mt-6">
							<NButton type="primary" text onClick={() => state.hrefInvoice()}>
								申请开票
							</NButton>
						</div>
					</NCard>
				</NGridItem>
			</NGrid>
		)
  },
}); 