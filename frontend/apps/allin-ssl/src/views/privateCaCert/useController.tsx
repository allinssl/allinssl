import { NButton, NFlex, NTag, type DataTableColumns, NRadioGroup, NRadio, NInput, NSelect, NFormItem, type FormRules } from 'naive-ui';
import {
  useTable,
  useSearch,
  useMessage,
  useDialog,
  useModal,
  useFormHooks,
  useForm,
  useModalHooks,
  useLoadingMask,
} from "@baota/naive-ui/hooks";

import { useError } from "@baota/hooks/error";
import { useStore } from './useStore';
import type { 
	CertItem, 
	IntermediateCa,
	LeafCertFormData,
	SanItem,
	SanTypeOption,
	UsageOption,
	KeyLengthOption,
	ValidityUnit
} from './types';
import { createLeafCert, deleteLeafCert, downloadCaCert } from '@/api/ca';
import type { CreateLeafCertParams, DeleteLeafCertParams, DownloadCaCertParams } from '@/types/ca';
import type { GetLeafCertListParams } from '@/types/ca';

const { handleError } = useError();

/**
 * useController
 * @description 私有CA证书管理业务逻辑控制器
 * @returns {object} 返回controller对象
 */
export const useController = () => {
  const { intermediateCaList, fetchLeafCertList, getIntermediateCaList } =
    useStore();

  const message = useMessage();

  // 获取状态标签类型和文本
  const getStatusInfo = (notAfter: string) => {
    const calculateRemainingDays = (expiryDate: string) => {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const remainingDays = calculateRemainingDays(notAfter);

    if (remainingDays > 30) {
      return { type: "success" as const, text: "正常" };
    } else if (remainingDays > 0) {
      return { type: "warning" as const, text: "即将过期" };
    } else if (remainingDays === 0) {
      return { type: "warning" as const, text: "今天到期" };
    } else {
      return { type: "error" as const, text: "已过期" };
    }
  };

  // 创建表格列
  const createColumns = (): DataTableColumns<CertItem> => [
    {
      title: "名称",
      key: "cn",
      width: 250,
      render: (row: CertItem) => {
        const formatSanData = (sanData: string) => {
          try {
            const parsed = JSON.parse(sanData);
            const allValues = [
              ...(parsed.dns_names || []),
              ...(parsed.ip_addresses || []),
              ...(parsed.email_addresses || []),
            ].filter((value) => value && value.trim() !== "");

            if (allValues.length === 0) {
              return null;
            }

            return allValues.join(", ");
          } catch {
            // 如果解析失败，直接返回原始数据
            return sanData && sanData.trim() !== "" ? sanData : null;
          }
        };

        const sanText = formatSanData(row.san);

        return (
          <div class="flex flex-col">
            <div class="text-gray-900">{row.cn}</div>
            {sanText && <div class="text-xl text-gray-500">SAN: {sanText}</div>}
          </div>
        );
      },
    },
    {
      title: "证书用途",
      key: "usage",
      width: 120,
      render: (row: CertItem) => {
        const getUsageText = (usage: number) => {
          switch (usage) {
            case 1:
              return "服务器证书";
            case 2:
              return "客户端证书";
            case 4:
              return "邮件证书";
            default:
              return `未知用途(${usage})`;
          }
        };

        return <NTag size="small">{getUsageText(row.usage)}</NTag>;
      },
    },
    {
      title: "颁发者",
      key: "parentId",
      width: 100,
      render: (row: CertItem) => <div>{row.ca_cn}</div>,
    },
    {
      title: "算法",
      key: "algorithm",
      width: 120,
      render: (row: CertItem) => {
        return <NTag size="small">{row.algorithm.toUpperCase()}</NTag>;
      },
    },
    {
      title: "有效期",
      key: "not_after",
      width: 200,
      render: (row: CertItem) => {
        const calculateRemainingDays = (expiryDate: string) => {
          const expiry = new Date(expiryDate);
          const now = new Date();
          const diffTime = expiry.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        };

        const remainingDays = calculateRemainingDays(row.not_after);
        let remainingText = "";
        let textColor = "";

        if (remainingDays > 0) {
          if (remainingDays <= 30) {
            remainingText = `${remainingDays} 天后`;
            textColor = "text-orange-500";
          } else {
            remainingText = `${remainingDays} 天后`;
            textColor = "text-gray-500";
          }
        } else if (remainingDays === 0) {
          remainingText = "今天到期";
          textColor = "text-orange-500";
        } else {
          remainingText = `已过期 ${Math.abs(remainingDays)} 天`;
          textColor = "text-red-500";
        }

        return (
          <div class="flex flex-col">
            <div class="text-gray-900">{row.not_after}</div>
            <div class={`text-xl ${textColor}`}>{remainingText}</div>
          </div>
        );
      },
    },
    {
      title: "状态",
      key: "status",
      width: 100,
      render: (row: CertItem) => {
        const statusInfo = getStatusInfo(row.not_after);
        return (
          <NTag type={statusInfo.type} size="small">
            {statusInfo.text}
          </NTag>
        );
      },
    },
    {
      title: "创建时间",
      key: "not_before",
      width: 150,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right" as const,
      align: "right",
      width: 200,
      render: (row: CertItem) => (
        <NFlex justify="end">
          <NButton
            size="tiny"
            strong
            secondary
            type="primary"
            onClick={() => handleDownload(row)}
          >
            下载
          </NButton>
          <NButton
            size="tiny"
            strong
            secondary
            type="error"
            onClick={() => handleDelete(row)}
          >
            删除
          </NButton>
        </NFlex>
      ),
    },
  ];

  // 表格实例
  const { TableComponent, PageComponent, loading, param, data, fetch } =
    useTable<CertItem, GetLeafCertListParams>({
      config: createColumns(),
      request: async (params: GetLeafCertListParams) => {
        const result = await fetchLeafCertList(params);
        return result as any;
      },
      defaultValue: { p: "1", limit: "20", ca_id: "", search: "" },
      alias: { page: "p", pageSize: "limit" },
      watchValue: ["p", "limit", "search", "ca_id"],
    });

  // 搜索组件
  const { SearchComponent } = useSearch({
    onSearch: async (keyword: string) => {
      param.value.search = keyword;
    },
  });

  // 处理中间CA选择变化
  const handleCaIdChange = (caId: string | null) => {
    param.value.ca_id = caId || "";
  };

  // 获取行样式类名
  const getRowClassName = (row: CertItem): string => {
    const statusInfo = getStatusInfo(row.not_after);
    if (statusInfo.type === "error") return "bg-red-500/10";
    if (statusInfo.type === "warning") return "bg-orange-500/10";
    return "";
  };

  // 下载证书
  const handleDownload = (cert: CertItem) => {
    try {
      const downloadUrl = downloadCaCert({
        id: cert.id.toString(),
        type: "leaf",
      } as DownloadCaCertParams);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      handleError(error);
    }
  };

  // 删除证书
	const handleDelete = async (cert: CertItem) => {
		const { open: openLoad, close: close } = useLoadingMask({
			text: "正在删除，请稍后...",
			zIndex: 3000,
    });
    useDialog({
      title: "确认删除",
      content: `确定要删除证书 "${cert.cn}" 吗？此操作不可恢复。`,
      onPositiveClick: async () => {
        try {
          openLoad();
          const {
            message,
            fetch: deleteFetch,
            data,
          } = deleteLeafCert({
            id: cert.id.toString(),
          } as DeleteLeafCertParams);
          message.value = true;
          await deleteFetch();
          if (data.value.status) {
            useMessage().success(data.value.message);
            await fetch();
          } else {
            useMessage().error(data.value?.message || "删除失败");
          }
        } catch (error) {
          handleError(error);
        } finally {
          close();
        }
      },
    });
  };

  // 打开签发证书模态框
  const openCreateLeafCertModal = async () => {
    try {
      await getIntermediateCaList();
      useModal({
        title: "签发私有证书",
        area: 700,
        component: () =>
          import("./components/CreateLeafCertForm").then((m) => m.default),
        footer: true,
        componentProps: { list: intermediateCaList.value },
        onUpdateShow: (show) => {
          if (!show) {
            fetch();
          }
        },
      });
    } catch (error) {
      handleError(error);
    }
  };

  onMounted(() => {
    fetch();
  });

  return {
    loading,
    TableComponent,
    PageComponent,
    SearchComponent,
    getRowClassName,
    handleDownload,
    handleDelete,
    openCreateLeafCertModal,
    fetch,
    handleCaIdChange,
  };
};

/**
 * @description 签发证书表单控制器
 * @returns {Object} 返回签发证书表单控制器对象
 */
export const useCreateLeafCertController = (list: IntermediateCa[]) => {
  const { handleError } = useError();
  const { confirm } = useModalHooks();
  const { useFormInput, useFormSelect, useFormCustom } = useFormHooks();

  // 表单数据
  const formData = ref<LeafCertFormData>({
    usage: "1",
    algorithm: "",
    valid_days: "",
    cn: "",
    san: "",
  });

  // 获取密钥长度选项
  const getKeyLengthOptions = (algorithm: string): KeyLengthOption[] => {
    switch (algorithm) {
      case "ecdsa":
        return [
          { label: "P-256 (256 bit)", value: 256 },
          { label: "P-384 (384 bit)", value: 384 },
          { label: "P-521 (521 bit)", value: 521 },
        ];
      case "rsa":
        return [
          { label: "2048 bit", value: 2048 },
          { label: "3072 bit", value: 3072 },
          { label: "4096 bit", value: 4096 },
        ];
      case "sm2":
        return [{ label: "SM2 (256 bit)", value: 256 }];
      default:
        return [];
    }
  };

  // 有效期单位
  const validityUnit = ref<ValidityUnit>("day");

  // SAN输入相关
  const sanType = ref<SanItem['type']>("dns_names");
  const sanInputValue = ref("");
  const sanList = ref<SanItem[]>([]);

  // 用途选项
  const usageOptions: UsageOption[] = [
    { label: "服务器证书", value: "1" },
    { label: "客户端证书", value: "2" },
    { label: "邮件证书", value: "4" },
  ];

  // SAN类型选项
  const sanTypeOptions: SanTypeOption[] = [
    { label: "DNS名称", value: "dns_names" },
    { label: "IP地址", value: "ip_addresses" },
    { label: "邮箱地址", value: "email_addresses" },
  ];

  const currentKeyLengthOptions = computed(() => {
    const options = getKeyLengthOptions(formData.value.algorithm);
    return options;
  });

  // 添加SAN输入
  const addSanInput = () => {
    if (!sanInputValue.value.trim()) {
      useMessage().warning("请输入主题备用名称");
      return;
    }

    const existingItem = sanList.value.find(
      (item) =>
        item.type === sanType.value && item.value === sanInputValue.value.trim()
    );

    if (existingItem) {
      useMessage().warning("该值已存在，请勿重复添加");
      return;
    }

    let isValid = true;
    let errorMessage = "";

    switch (sanType.value) {
      case "dns_names":
        const dnsPattern = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        isValid = dnsPattern.test(sanInputValue.value);
        if (!isValid) {
          errorMessage = "DNS名称格式不正确，支持格式：example.com 或 *.example.com";
        }
        break;
      case "ip_addresses":
        isValid =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            sanInputValue.value
          );
        if (!isValid) {
          errorMessage = "IP地址格式不正确，请输入有效的IPv4地址";
        }
        break;
      case "email_addresses":
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanInputValue.value);
        if (!isValid) {
          errorMessage = "邮箱地址格式不正确，请输入有效的邮箱地址";
        }
        break;
    }

    if (!isValid) {
      useMessage().error(errorMessage);
      return;
    }

    sanList.value.push({
      type: sanType.value,
      value: sanInputValue.value.trim(),
    });
    sanInputValue.value = "";
    updateSanFormData();
  };

  // 删除SAN输入
  const removeSanInput = (index: number) => {
    const item = sanList.value[index];
    if (!item) return;
    sanList.value.splice(index, 1);
    updateSanFormData();
  };

  // 更新SAN表单数据
  const updateSanFormData = () => {
    const dnsNames = sanList.value
      .filter((item) => item.type === "dns_names")
      .map((item) => item.value);
    const ipAddresses = sanList.value
      .filter((item) => item.type === "ip_addresses")
      .map((item) => item.value);
    const emailAddresses = sanList.value
      .filter((item) => item.type === "email_addresses")
      .map((item) => item.value);

    formData.value.san = JSON.stringify({
      dns_names: dnsNames,
      ip_addresses: ipAddresses,
      email_addresses: emailAddresses,
    });
  };

  const initSanListFromData = (sanData: string) => {
    if (!sanData) {
      sanList.value = [];
      return;
    }

    try {
      const parsed = JSON.parse(sanData);
      sanList.value = [];

      // 添加DNS名称
      if (parsed.dns_names && Array.isArray(parsed.dns_names)) {
        parsed.dns_names.forEach((value: string) => {
          if (value && value.trim()) {
            sanList.value.push({
              type: "dns_names" as const,
              value: value.trim(),
            });
          }
        });
      }

      // 添加IP地址
      if (parsed.ip_addresses && Array.isArray(parsed.ip_addresses)) {
        parsed.ip_addresses.forEach((value: string) => {
          if (value && value.trim()) {
            sanList.value.push({
              type: "ip_addresses" as const,
              value: value.trim(),
            });
          }
        });
      }

      // 添加邮箱地址
      if (parsed.email_addresses && Array.isArray(parsed.email_addresses)) {
        parsed.email_addresses.forEach((value: string) => {
          if (value && value.trim()) {
            sanList.value.push({
              type: "email_addresses" as const,
              value: value.trim(),
            });
          }
        });
      }
    } catch (error) {
      console.warn("解析SAN数据失败:", error);
      sanList.value = [];
    }
  };

  // 重置SAN相关数据
  const resetSanData = () => {
    sanList.value = [];
    sanInputValue.value = "";
    sanType.value = "dns_names";
    formData.value.san = "";
  };

  // 切换SAN类型时清空输入框
  watch(sanType, () => {
    sanInputValue.value = "";
  });

  // 监听formData.san的变化，自动更新sanList
  watch(
    () => formData.value.san,
		(newSanData) => {
      if (newSanData && newSanData !== formData.value.san) {
        initSanListFromData(newSanData);
      }
    },
    { immediate: true }
  );

  // 表单配置
  const formConfig = computed(() => [
    useFormSelect(
      "中间CA",
      "ca_id",
      list.map((ca) => ({
        label: ca.name,
        value: ca.id.toString(),
      })),
      {
        placeholder: "请选择中间CA",
        onUpdateValue: (value: string) => {
          const ca = list.find((ca) => ca.id.toString() === value);
          if (ca) {
            formData.value.ca_id = value;
            formData.value.algorithm = ca.algorithm;
            formData.value.key_length = ca.key_length;
            console.log(
              "设置中间CA:",
              ca.name,
              "算法:",
              ca.algorithm,
              "密钥长度:",
              ca.key_length
            );
          }
        },
      }
    ),
    useFormCustom(() => (
      <NFormItem label="证书用途">
        <NRadioGroup
          v-model:value={formData.value.usage}
          onUpdateValue={(value: string) => {
            sanType.value = value === "1" ? "dns_names" : "email_addresses";
            resetSanData();
          }}
        >
          {usageOptions.map((option) => (
            <NRadio key={option.value} value={option.value}>
              {option.label}
            </NRadio>
          ))}
        </NRadioGroup>
      </NFormItem>
    )),
    useFormInput("算法", "algorithm", {
      value: (formData.value.algorithm || "").toUpperCase(),
      disabled: true,
      placeholder: "请选择中间CA",
    }),
    useFormSelect("密钥长度", "key_length", currentKeyLengthOptions.value, {
      placeholder: "请选择密钥长度",
      value: formData.value?.key_length,
      onUpdateValue: (value: number) => {
        formData.value.key_length = value;
      },
    }),
    useFormCustom(() => (
      <NFormItem label="有效期" required path="valid_days">
        <NFlex wrap={false} align="center" size="small" class="flex-1">
          <NInput
            v-model:value={formData.value.valid_days}
            placeholder="请输入有效期"
          />
          <NSelect
            v-model:value={validityUnit.value}
            options={[
              { label: "天", value: "day" },
              { label: "年", value: "year" },
            ]}
            style={{ width: "80px" }}
          />
        </NFlex>
      </NFormItem>
    )),
    useFormInput(
      "通用名称",
      "cn",
      {
        placeholder: "请输入通用名称，如：example.com",
        onUpdateValue: (value: string) => {
          formData.value.cn = value;
        },
      },
      {
        required: formData.value.usage === "2",
      }
    ),
    useFormCustom(() => (
      <NFormItem label="主题备用名称 (SAN)">
        <div class="w-full">
          <NFlex align="center" size="small" class="mb-3">
            <NInput
              v-model:value={sanInputValue.value}
              placeholder="请输入主题备用名称"
              class="flex-1"
              onKeydown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSanInput();
                }
              }}
            />
            <NSelect
              v-model:value={sanType.value}
              options={[
                {
                  label: "IP地址",
                  value: "ip_addresses",
                  disabled: formData.value.usage !== "1",
                },
                {
                  label: "DNS名称",
                  value: "dns_names",
                  disabled: formData.value.usage !== "1",
                },
                {
                  label: "邮箱地址",
                  value: "email_addresses",
                  disabled: formData.value.usage === "1",
                },
              ]}
              style={{ width: "160px" }}
            />
            <NButton
              type="primary"
              onClick={addSanInput}
              disabled={!sanInputValue.value.trim()}
            >
              添加
            </NButton>
          </NFlex>

          {sanList.value.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {sanList.value.map((item, index) => (
                <NTag
                  key={`${item.type}-${index}`}
                  type="info"
                  closable
                  class="mb-2"
                  onClose={() => removeSanInput(index)}
                >
                  <NFlex align="center" size="small">
                    <span class="text-xl text-gray-500 mr-1">
                      {
                        sanTypeOptions.find((opt) => opt.value === item.type)
                          ?.label
                      }
                    </span>
                    <span>{item.value}</span>
                  </NFlex>
                </NTag>
              ))}
            </div>
          )}
        </div>
      </NFormItem>
    )),
  ]);

  // 表单实例
  const {
    component: CreateLeafCertForm,
    data,
    fetch,
  } = useForm({
    config: formConfig,
    defaultValue: formData.value as any,
		request: async (params: CreateLeafCertParams & { algorithm?: string }) => {
			const { open: openLoad, close: close } = useLoadingMask({
				text: "正在创建，请稍后...",
				zIndex: 3000,
			});
      try {
        openLoad();
        const {
          message,
          fetch: createLeafCertFetch,
          data,
        } = createLeafCert(params);
        message.value = true;
        await createLeafCertFetch();

        if (data.value?.status) {
          useMessage().success(data.value.message);
          resetSanData();
          return { success: true, data: data.value };
        } else {
          useMessage().error(data.value.message || "创建失败");
          return false;
        }
      } catch (error) {
        handleError(error);
      } finally {
        close();
      }
    },
    rules: {
      ca_id: {
        required: true,
        message: "请选择中间CA",
        trigger: "blur",
      },
      valid_days: [
        {
          validator: (rule: any, value: any) => {
            if (!value) return new Error("请输入有效期");
            const num = parseInt(value);
            if (isNaN(num) || num <= 0)
              return new Error("有效期必须是大于0的数字");
            return true;
          },
          trigger: "blur",
        },
      ],
      cn: {
        validator: (rule: any, value: any) => {
          if (formData.value.usage === "2" && (!value || value.trim() === "")) {
            return new Error("请输入通用名称");
          }
          return true;
        },
        trigger: "change",
      },
    } as FormRules,
  });

  confirm(async (close) => {
    try {
      if (validityUnit.value === "year" && data.value.valid_days) {
        const years = parseInt(data.value.valid_days);
        if (!isNaN(years)) {
          data.value.valid_days = (years * 365).toString();
        }
      }
      updateSanFormData();
      const result = await fetch();
      if (result) close();
    } catch (error) {
      handleError(error);
    }
  });

  return {
    CreateLeafCertForm,
    data,
    loading: computed(() => false),
    fetch,
    // SAN相关方法
    sanType,
    sanInputValue,
    sanList,
    sanTypeOptions,
    addSanInput,
    removeSanInput,
    validityUnit,
  };
};
