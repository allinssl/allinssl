import {
  NFormItem,
  NInputNumber,
  NSelect,
  NInput,
  NFlex,
  NButton,
  NTag,
} from "naive-ui";
import { useForm, useFormHooks, useModalHooks } from "@baota/naive-ui/hooks";
import { useStore } from "@components/FlowChart/useStore";
import rules from "./verify";
import type { PrivateCaNodeConfig } from "@components/FlowChart/types";
import { deepClone } from "@baota/utils/data";
import { getCaList } from "@api/ca";

export default defineComponent({
  name: "PrivateCaNodeDrawer",
  props: {
    // 节点配置数据
    node: {
      type: Object as PropType<{ id: string; config: PrivateCaNodeConfig }>,
      default: () => ({
        id: "",
        config: {
          ca_id: undefined,
          name: undefined,
          algorithm: "",
          key_length: undefined,
          end_day: 30,
          valid_days: "",
          validity_unit: "day",
          cn: "",
          san: "",
        },
      }),
    },
  },
  setup(props) {
    const { updateNodeConfig, advancedOptions, isRefreshNode } = useStore();
    const { confirm } = useModalHooks();
    const { useFormInput, useFormSelect, useFormMore, useFormHelp } =
      useFormHooks();
    const param = ref(deepClone(props.node.config));
    if (typeof (param.value as any).valid_days === 'number') {
      (param.value as any).valid_days = String((param.value as any).valid_days);
    }
    if ((param.value as any).ca_id !== undefined && (param.value as any).ca_id !== null) {
      (param.value as any).ca_id = String((param.value as any).ca_id) as unknown as string;
    }

    const caList = ref<Array<{ id: number; name: string; algorithm: string; key_length: number}>>([]);
    const caListLoading = ref(false);

    const validityUnit = ref<'day' | 'year'>('day');

    const sanType = ref<'dns_names' | 'ip_addresses' | 'email_addresses'>('dns_names');
    const sanInputValue = ref("");
    const sanList = ref<Array<{ type: string; value: string }>>([]);
    const sanInputError = ref("");

    // 获取中间CA列表
    const fetchCaList = async () => {
      try {
        caListLoading.value = true;
        const { fetch } = getCaList({
          p: '1',
          limit: '-1',
          level: 'intermediate'
        });
        const result = await fetch();
        if (result && result.data) {
          caList.value = result.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            algorithm: item.algorithm,
            key_length: item.key_length,
          }));
        }
      } catch (error) {
        console.error('获取中间CA列表失败:', error);
      } finally {
        caListLoading.value = false;
      }
    };

    const caOptions = computed(() => {
      return caList.value.map((item) => ({
        label: `${item.name}${
          item.algorithm.toLowerCase() === "sm2"
            ? " - 暂不兼容国密证书"
            : ""
        }`,
				value: item.id.toString(),
				disabled: item.algorithm.toLowerCase() === 'sm2'
      }));
    });

    // 获取密钥长度选项
    const getKeyLengthOptions = (algorithm: string) => {
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
    const currentKeyLengthOptions = computed(() => {
      const algorithm = param.value.algorithm?.toLowerCase() || '';
      return getKeyLengthOptions(algorithm);
    });

    // SAN类型选项
    const sanTypeOptions = [
      { label: "DNS名称", value: "dns_names" },
      { label: "IP地址", value: "ip_addresses" },
      { label: "邮箱地址", value: "email_addresses" },
    ];

    // 添加SAN输入
    const addSanInput = () => {
      if (!sanInputValue.value.trim()) {
        return;
      }
      
      const existingItem = sanList.value.find(
        (item) =>
          item.type === sanType.value && item.value === sanInputValue.value.trim()
      );

      if (existingItem) {
        sanInputError.value = "该SAN项已存在";
        return;
      }

      let isValid = true;
      let errorMessage = "";

      switch (sanType.value) {
        case "dns_names":
          const dnsPattern = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          isValid = dnsPattern.test(sanInputValue.value);
          if (!isValid) {
            errorMessage = `DNS名称格式不正确: ${sanInputValue.value}，支持格式：example.com 或 *.example.com`;
          }
          break;
        case "ip_addresses":
          isValid =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
              sanInputValue.value
            );
          if (!isValid) {
            errorMessage = `IP地址格式不正确: ${sanInputValue.value}，请输入有效的IPv4地址，如：192.168.1.1`;
          }
          break;
        case "email_addresses":
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanInputValue.value);
          if (!isValid) {
            errorMessage = `邮箱地址格式不正确: ${sanInputValue.value}，请输入有效的邮箱地址，如：user@example.com`;
          }
          break;
      }

      if (!isValid) {
        sanInputError.value = errorMessage;
        return;
      }

      sanList.value.push({
        type: sanType.value,
        value: sanInputValue.value.trim(),
      });
      sanInputValue.value = "";
      sanInputError.value = ""; // 清除错误信息
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

      param.value.san = JSON.stringify({
        dns_names: dnsNames,
        ip_addresses: ipAddresses,
        email_addresses: emailAddresses,
      });
    };

    // 表单渲染配置
    const config = computed(() => [
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="中间CA" path="ca_id" showRequireMark={true}>
              <NSelect
                v-model:value={param.value.ca_id}
                options={caOptions.value}
                placeholder="请选择中间CA"
                loading={caListLoading.value}
                class="w-full"
                onUpdateValue={(value: string) => {
                  const ca = caList.value.find((ca) => ca.id.toString() === value);
                  if (ca) {
                    param.value.ca_id = value;
                    param.value.name = ca.name;
                    param.value.algorithm = ca.algorithm;
                    param.value.key_length = ca.key_length;
                    console.log(
                      "设置中间CA:",
                      ca.name,
                      "算法:",
                      ca.algorithm,
                      "密钥长度:",
                      ca.key_length
                    );
                    console.log("密钥长度选项:", currentKeyLengthOptions.value);
                  }
                }}
              />
            </NFormItem>
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="算法" path="algorithm">
              <NInput
                value={(param.value.algorithm || "").toUpperCase()}
                disabled={true}
                placeholder="请选择中间CA"
                class="w-full"
              />
            </NFormItem>
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="密钥长度" path="key_length">
              <NSelect
                v-model:value={param.value.key_length}
                options={currentKeyLengthOptions.value}
                placeholder="请选择密钥长度"
                class="w-full"
              />
            </NFormItem>
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="自动续签（天）" path="end_day">
              <div class="flex items-center">
                <span class="text-[1.4rem] mr-[1.2rem]">证书有效期小于</span>
                <NInputNumber 
                  v-model:value={param.value.end_day} 
                  showButton={false} 
                  min={1} 
                  class="w-[120px]" 
                />
                <span class="text-[1.4rem] ml-[1.2rem]">天时，续签新的证书</span>
              </div>
            </NFormItem>
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="有效期" required path="valid_days">
              <NFlex wrap={false} align="center" size="small" class="flex-1">
                <NInputNumber
                  value={param.value.valid_days === '' || param.value.valid_days === undefined ? undefined : Number(param.value.valid_days)}
                  onUpdate:value={(v: number | null) => {
                    (param.value as any).valid_days = v == null ? '' : String(v);
                  }}
                  min={1}
									showButton={false}
									class="w-full"
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
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="通用名称" path="cn">
              <NInput
                v-model:value={param.value.cn}
                placeholder="请输入通用名称"
                class="w-full"
              />
            </NFormItem>
          );
        },
      },
      {
        type: "custom" as const,
        render: () => {
          return (
            <NFormItem label="主题备用名称 (SAN)" path="san">
              <div class="w-full">
                <NFlex align="center" size="small" class="mb-3">
                  <NInput
                    v-model:value={sanInputValue.value}
                    placeholder="请输入主题备用名称"
                    class="flex-1"
                    status={sanInputError.value ? "error" : undefined}
                    onKeydown={(e: KeyboardEvent) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSanInput();
                      }
                    }}
                    onInput={() => {
                      // 清除错误信息
                      if (sanInputError.value) {
                        sanInputError.value = "";
                      }
                    }}
                  />
                  <NSelect
                    v-model:value={sanType.value}
                    options={sanTypeOptions}
                    style={{ width: "160px" }}
                    onUpdateValue={() => {
                      // 切换类型时清除错误信息
                      sanInputError.value = "";
                    }}
                  />
                  <NButton
                    type="primary"
					class="gradient-primary-btn"
                    onClick={addSanInput}
                    disabled={!sanInputValue.value.trim()}
                  >
                    添加
                  </NButton>
                </NFlex>

                {/* 错误信息显示 */}
                {sanInputError.value && (
                  <div class="text-[var(--n-feedback-text-color-error)] text-xl mt-1 mb-2">
                    {sanInputError.value}
                  </div>
                )}

                {sanList.value.length > 0 && (
                  <div class="flex flex-wrap gap-2 mt-3">
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
                              sanTypeOptions.find(
                                (opt) => opt.value === item.type
                              )?.label
                            }
                          </span>
                          <span>{item.value}</span>
                        </NFlex>
                      </NTag>
                    ))}
                  </div>
                )}

                {/* 隐藏的输入框用于表单验证 */}
                <NInput
                  v-model:value={param.value.san}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </NFormItem>
          );
        },
      },
    ]);

    // 创建表单实例
    const {
      component: Form,
      data,
      example,
    } = useForm<PrivateCaNodeConfig>({
      defaultValue: param,
      config,
      rules,
    });

    // 初始化SAN数据
    const initSanListFromData = (sanData: string) => {
      if (!sanData) {
        sanList.value = [];
        return;
      }

      try {
        const parsed = JSON.parse(sanData);
        const allItems: Array<{ type: string; value: string }> = [];
        
        if (parsed.dns_names) {
          parsed.dns_names.forEach((value: string) => {
            allItems.push({ type: 'dns_names', value });
          });
        }
        
        if (parsed.ip_addresses) {
          parsed.ip_addresses.forEach((value: string) => {
            allItems.push({ type: 'ip_addresses', value });
          });
        }
        
        if (parsed.email_addresses) {
          parsed.email_addresses.forEach((value: string) => {
            allItems.push({ type: 'email_addresses', value });
          });
        }
        
        sanList.value = allItems;
      } catch (error) {
        console.error('解析SAN数据失败:', error);
        sanList.value = [];
      }
    };

    // 初始化
    onMounted(async () => {
      advancedOptions.value = false;
      await fetchCaList();

      if (param.value.ca_id) {
        param.value.ca_id = String(param.value.ca_id) as unknown as string;
        const ca = caList.value.find((it) => it.id.toString() === String(param.value.ca_id));
        if (ca) {
          param.value.ca_id = ca.id.toString() as unknown as string;
          param.value.name = ca.name;
          param.value.algorithm = ca.algorithm;
          param.value.key_length = ca.key_length;
        } else {
          param.value.name = undefined;
          param.value.algorithm = "";
          param.value.key_length = undefined;
          param.value.ca_id = undefined as unknown as string;
        }
      } else {
        param.value.name = undefined;
        param.value.algorithm = "";
        param.value.key_length = undefined;
      }

      if (param.value.validity_unit) {
        validityUnit.value = param.value.validity_unit;
      }

      if (param.value.san) {
        initSanListFromData(param.value.san);
			}
			
      if (typeof (param.value as any).valid_days === 'number') {
        (param.value as any).valid_days = String((param.value as any).valid_days);
      }
    });
    confirm(async (close) => {
      try {
        await example.value?.validate();
        const caIdNumber = Number(data.value.ca_id);
        const baseValidDays = Number(data.value.valid_days || 0);
        const validDaysNumber = validityUnit.value === 'year' ? baseValidDays * 365 : baseValidDays;

        const submitData = {
          ca_id: caIdNumber,
          name: data.value.name,
          key_length: data.value.key_length,
          end_day: data.value.end_day,
          valid_days: validDaysNumber,
          cn: data.value.cn,
          san: data.value.san,
        } as const;

        updateNodeConfig(props.node.id, submitData);
        isRefreshNode.value = props.node.id;
        close();
      } catch (error) {
        console.log(error);
      }
    });

    return () => (
      <div class="private-ca-node-drawer">
        <Form labelPlacement="top" />
      </div>
    );
  },
});
