import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import type { RechargeState } from "./types.d";

export const useRechargeStore = defineStore(
  "recharge-store",
  () => {
    const loading = ref(false);
    const overview = ref<RechargeState["overview"]>(null);

    const bills = ref<RechargeState["bills"]>([]);
    const billTotal = ref(0);
    const billPage = ref(1);
    const billPageSize = ref(10);

    const recharges = ref<RechargeState["recharges"]>([]);
    const rechargeTotal = ref(0);
    const rechargePage = ref(1);
    const rechargePageSize = ref(10);

    const createPayload = ref<RechargeState["createPayload"]>({
      amount: 2000,
      channel: "wechat",
    });

    const qrWxUrl = ref<string>("");
    const qrAliUrl = ref<string>("");

    const pollingOrderId = ref<RechargeState["pollingOrderId"]>();

    const setLoading = (val: boolean) => (loading.value = val);
    const setOverview = (val: NonNullable<RechargeState["overview"]>) =>
      (overview.value = val);

    const setBills = (list: RechargeState["bills"], total: number) => {
      bills.value = list;
      billTotal.value = total;
    };

    const setRecharges = (
      list: RechargeState["recharges"],
      total: number,
    ) => {
      recharges.value = list;
      rechargeTotal.value = total;
    };

    const setCreatePayload = (payload: RechargeState["createPayload"]) =>
      (createPayload.value = payload);

    const setQrLinks = (wx: string, ali: string) => {
      qrWxUrl.value = wx || "";
      qrAliUrl.value = ali || "";
    };

    const setBillPage = (page: number, pageSize?: number) => {
      billPage.value = page;
      if (pageSize) billPageSize.value = pageSize;
    };

    const setRechargePage = (page: number, pageSize?: number) => {
      rechargePage.value = page;
      if (pageSize) rechargePageSize.value = pageSize;
    };

    const setPollingOrderId = (id?: RechargeState["pollingOrderId"]) =>
      (pollingOrderId.value = id);

    const hrefInvoice = () => {
      window.open('https://www.bt.cn/admin/product_orders', '_blank')
    }

    return {
      // state
      loading,
      overview,
      bills,
      billTotal,
      billPage,
      billPageSize,
      recharges,
      rechargeTotal,
      rechargePage,
      rechargePageSize,
      createPayload,
      qrWxUrl,
      qrAliUrl,
      pollingOrderId,
      // actions
      setLoading,
      setOverview,
      setBills,
      setRecharges,
      setCreatePayload,
      setQrLinks,
      setBillPage,
      setRechargePage,
      setPollingOrderId,
      hrefInvoice,
    };
  },
  { persist: false },
);

export const useRechargeState = () => {
  const store = useRechargeStore();
  return { ...store, ...storeToRefs(store) };
}; 
 