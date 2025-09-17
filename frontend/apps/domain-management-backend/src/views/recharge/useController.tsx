import { ref } from 'vue'
import { useMessage, useModal } from "@baota/naive-ui/hooks";
import { getCreditChangeLogs, getCreditAddRecords, createCreditRecharge, getPayStatus } from "@api/recharge-legacy";
import { getAccountBalance } from "@api/order";
import { useRechargeState } from "./useStore";
import { CREDIT_CHANGE_TYPE_TEXT, CHANNEL_TEXT, RECHARGE_STATUS_TO_VM, toVmInvoiceStatus } from "@/types/recharge.d";
import RechargeDialogContent from "./components/RechargeModal"; // 内容组件

const fenToYuan = (fen: number): number => Number((Number(fen || 0) / 100).toFixed(2));
const yuanToFen = (yuan: number): number => Math.round(Number(yuan || 0) * 100);
const formatTs = (v: number | string): string => {
  const n = Number(v);
  if (!isNaN(n) && n.toString().length >= 10) {
    const ms = n < 1e12 ? n * 1000 : n;
    return new Date(ms).toLocaleString();
  }
  return String(v || "");
};
const openRechargeDialog = ref()
let rechargeTimer: any = null

export const useRechargeController = () => {
  const state = useRechargeState();
  const message = useMessage();

  // 停止充值轮询
  const stopRechargePolling = () => {
    if (rechargeTimer) {
      clearTimeout(rechargeTimer);
      rechargeTimer = null;
    }
  };

  const openRechargeModal = () => {
    openRechargeDialog.value = useModal({
			title: '账户充值',
			area: '520px',
			component: RechargeDialogContent,
			componentProps: {},
			footer: false,
			onClose: () => {
				stopRechargePolling(); // 对话框关闭时停止轮询
			},
		})
	};

	const loadAccountBalance = async () => {
		const { fetch, data } = getAccountBalance()
		await fetch()
		state.setOverview({ balance: fenToYuan(data.value?.data.balance || 0) });
	};


  const loadBills = async () => {
    try {
      const { data } = await getCreditChangeLogs({
        page: state.billPage.value,
        pageSize: state.billPageSize.value,
      });
      const list = (data?.res?.list || []).map((it: any) => ({
        time: formatTs(it.create_time),
        amount: fenToYuan(it.credit),
        type: CREDIT_CHANGE_TYPE_TEXT[(it.type as any) as import('@/types/recharge').CreditChangeTypeCode] || '未知',
        balance: fenToYuan(it.rest_credit),
        description: it.remark || '',
      }));
      state.setBills(list, Number(data?.res?.total || 0));
      const first = Array.isArray(data?.res?.list) && data.res.list.length > 0 ? data.res.list[0] : undefined;
      if (first) {
        state.setOverview({
          invoiceableAmount: state.overview.value?.invoiceableAmount || 0,
        });
      }
    } catch {
      message.error("加载账单列表失败");
		}
  };

  const loadRecharges = async () => {
    try {
      const { data } = await getCreditAddRecords({
        page: state.rechargePage.value,
        pageSize: state.rechargePageSize.value,
      });
      const list = (data?.res?.list || []).map((it: any) => ({
        time: formatTs(it.pay_time),
        amount: fenToYuan(it.credit),
        channel: CHANNEL_TEXT[(it.channel as any) as import('@/types/recharge').ChannelCode] || '未知',
        status: RECHARGE_STATUS_TO_VM[(it.status as any) as import('@/types/recharge').RechargeStatusCode],
        invoiceStatus: toVmInvoiceStatus((it.channel as any) as import('@/types/recharge').ChannelCode, (it.invoice_status as any) as import('@/types/recharge').InvoiceStatusCode),
      }));
      state.setRecharges(list, Number(data?.res?.total || 0));
    } catch {
      message.error("加载充值记录失败");
    }
  };

  const loadAll = async () => {
    state.setLoading(true);
    try {
      await Promise.all([loadAccountBalance(),loadBills(), loadRecharges()])
    } finally {
      state.setLoading(false);
    }
  };

  // 仅用于二维码更新的下单
  const createRechargeOrder = async (amount?: number, channel?: 'wechat' | 'alipay') => {
    const amt = amount ?? state.createPayload.value.amount;
    const ch = channel ?? state.createPayload.value.channel;
    state.setCreatePayload({ amount: amt, channel: ch });
    const { data } = await createCreditRecharge({ credit: yuanToFen(amt) });
    const info = data?.res;
    state.setQrLinks(info?.wx || '', info?.ali || '');
    await pollRechargeStatus(info.ca_id, info.price)
    return info;
  };

  const pollRechargeStatus = async (caId: string, priceYuan: number) => {
    stopRechargePolling(); // 先停止已有轮询
    let attempts = 0;
    const maxAttempts = 20;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        stopRechargePolling();
        return;
      }

      attempts++;
      try {
        const { data: statusData } = await getPayStatus({ ca_id: caId });
        const result = statusData?.res;
        if (result && (result.channel || result.status)) {
          stopRechargePolling();
          state.setOverview({
            balance: Number(((state.overview.value?.balance || 0) + Number(priceYuan || 0)).toFixed(2)),
            invoiceableAmount: state.overview.value?.invoiceableAmount || 0,
          });
          await loadAll();
          openRechargeDialog.value?.close?.();
          message.success('充值成功');
          return;
        }
      } catch (error) {
        console.error('轮询查询失败:', error);
      }

      // 继续轮询
      if (attempts < maxAttempts) {
        rechargeTimer = setTimeout(checkStatus, 3000);
    }
    };

    checkStatus();
  };

  return {
    state,
    loadAll,
    loadBills,
    loadAccountBalance,
    openRechargeModal,
    createRechargeOrder,
    stopRechargePolling,
  };
}; 