import {
	NFormItem,
	NInputNumber,
	NSwitch,
	NSelect,
	NInput,
	NFlex,
	NText,
	NButton,
	NGrid,
	NFormItemGi,
	NSpin,
	NDropdown,
} from 'naive-ui'
import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useStore } from '@components/FlowChart/useStore'
import { useRoute } from '@baota/router'
import { $t } from '@locales/index'
import rules from './verify'
import DnsProviderSelect from '@components/DnsProviderSelect'
import type { ApplyNodeConfig } from '@components/FlowChart/types'
import { deepClone } from '@baota/utils/data'
import { noSideSpace } from '@lib/utils'
import { getEabList } from '@api/access'
import SvgIcon from '@components/SvgIcon'
import { CACertificateAuthorization } from '@config/data'

export default defineComponent({
	name: 'ApplyNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: ApplyNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					domains: '',
					email: '',
					eabId: '',
					ca: '',
					proxy: '',
					provider_id: '',
					provider: '',
					end_day: 30,
					name_server: '',
					skip_check: 0,
					algorithm: 'RSA2048',
					close_cname: 0,
					max_wait: undefined,
					ignore_check: 0,
				},
			}),
		},
	},
	setup(props) {
    const { updateNodeConfig, advancedOptions, isRefreshNode } = useStore();
    // 获取路由信息
    const route = useRoute();
    // 弹窗辅助
    const { confirm } = useModalHooks();
    // 获取表单助手函数
    const {
      useFormInput,
      useFormSelect,
      useFormMore,
      useFormHelp,
      useFormSwitch,
    } = useFormHooks();
    // 表单参数
    const param = ref(deepClone(props.node.config));

    // 获取路由参数
    const isEdit = computed(() => route.query.isEdit === "true");
    const routeEmail = computed(() => (route.query.email as string) || "");

    // CA选项状态
    const caOptions = ref<
      Array<{ label: string; value: string; icon: string }>
    >([]);
    const emailOptions = ref<
      Array<{ label: string; value: string; id: number; email: string }>
    >([]);
    const isLoadingCA = ref(false);
    const isLoadingEmails = ref(false);
    const showEmailDropdown = ref(false);
    const emailInputRef = ref<InstanceType<typeof NInput> | null>(null);

    // 加载CA选项
    const loadCAOptions = async () => {
      isLoadingCA.value = true;
      try {
        const { data } = await getEabList({
          ca: "",
          p: 1,
          limit: 1000,
        }).fetch();
        const uniqueCATypes = new Set<string>();
        const caList: Array<{ label: string; value: string; icon: string }> =
          [];

        // 优先添加重要的CA类型（确保始终显示）
        const priorityCATypes = ["litessl", "letsencrypt", "buypass", "zerossl"];
        priorityCATypes.forEach((caType) => {
          if (!uniqueCATypes.has(caType)) {
            uniqueCATypes.add(caType);
            const predefinedCA = Object.values(CACertificateAuthorization).find(
              (ca) => ca.type === caType
            );
            caList.push({
              label: predefinedCA ? predefinedCA.name : caType.toUpperCase(),
              value: caType,
              icon: `cert-${caType}`,
            });
          }
        });

        // 添加API返回的其他CA类型（去重）
        data?.forEach((item) => {
          if (item.ca && !uniqueCATypes.has(item.ca)) {
            uniqueCATypes.add(item.ca);

            // 查找预定义配置中对应的CA信息
            const predefinedCA = Object.values(CACertificateAuthorization).find(
              (ca) => ca.type === item.ca
            );
            caList.push({
              label: predefinedCA ? predefinedCA.name : item.ca.toUpperCase(),
              value: item.ca,
              icon: predefinedCA ? `cert-${item.ca}` : "cert-custom", // 如果不在预定义配置中，使用custom图标；否则使用对应的cert图标
            });
          }
        });

        caOptions.value = caList;
      } catch (error) {
        console.error("加载CA选项失败:", error);
      } finally {
        isLoadingCA.value = false;
      }
    };

    // 加载邮件选项
    const loadEmailOptions = async (ca: string) => {
      if (!ca) return;
      isLoadingEmails.value = true;
      try {
        const { data } = await getEabList({ ca, p: 1, limit: 1000 }).fetch();
        emailOptions.value =
          data
            ?.map((item) => ({
              label: item.email,
              value: `${item.id}`, // 使用 id 作为 value 确保唯一性
              id: item.id,
              email: item.email,
            }))
            .filter((item) => item.email) || [];

        // 检查是否为编辑模式且有外部传入的邮箱
        if (isEdit.value && routeEmail.value) {
          // 编辑模式：使用外部传入的邮箱地址
          param.value.email = routeEmail.value;
        } else {
          // 非编辑模式：保持原有逻辑
          if (!emailOptions.value.length) {
            param.value.email = "";
            param.value.eabId = "";
          } else {
            // 如果邮箱数组有内容，自动填充第一个邮箱地址
            // 移除 !param.value.email 条件，让切换CA时总是更新为第一个选项
            if (emailOptions.value[0]) {
              param.value.email = emailOptions.value[0].email;
              param.value.eabId = emailOptions.value[0].id.toString();
            }
          }
        }

        if (example.value) {
          example.value.restoreValidation();
        }
      } catch (error) {
        console.error("加载邮件选项失败:", error);
      } finally {
        isLoadingEmails.value = false;
      }
    };

    // 处理CA选择变化
    const handleCAChange = (value: string) => {
      param.value.ca = value;
      // 移除直接调用 loadEmailOptions，让 watch 监听器统一处理
      // 这样避免了用户切换CA时的重复 API 请求
    };

    // 跳转到CA管理页面
    const goToAddCAProvider = () => {
      window.open("/auto-deploy?type=caManage", "_blank");
    };

    // 渲染CA选择器标签
    const renderLabel = (option: {
      label: string;
      value: string;
      icon: string;
    }) => {
      return (
        <NFlex align="center">
          <SvgIcon icon={option.icon} size="2rem" />
          <NText>{option.label}</NText>
        </NFlex>
      );
    };

    // 渲染CA选择器单选标签
    const renderSingleSelectTag = ({ option }: any) => {
      return (
        <NFlex align="center">
          {option.label ? (
            renderLabel(option)
          ) : (
            <NText class="text-[#aaa]">{$t("t_0_1747990228780")}</NText>
          )}
        </NFlex>
      );
    };

    // 过滤函数
    const handleFilter = (pattern: string, option: any): boolean => {
      return option.label.toLowerCase().includes(pattern.toLowerCase());
    };

    // 处理邮箱输入框焦点
    const handleEmailFocus = () => {
      if (emailOptions.value.length > 0) {
        showEmailDropdown.value = true;
      }
    };

    // 处理邮箱输入框失焦
    const handleEmailBlur = () => {
      // 延迟关闭下拉，确保点击选项有时间触发
      setTimeout(() => {
        showEmailDropdown.value = false;
      }, 200);
    };

    // 选择邮箱地址
    const handleSelectEmail = (email: string) => {
      param.value.email = email;
      showEmailDropdown.value = false;
      emailInputRef.value?.blur();
    };

    // 创建邮箱下拉选项
    const emailDropdownOptions = computed(() => {
      return emailOptions.value.map((item) => ({
        label: item.email,
        key: item.email,
      }));
    });

    // 计算输入框宽度用于下拉菜单
    const inputWidth = computed(() => {
      if (emailInputRef.value?.$el) {
        return emailInputRef.value.$el.offsetWidth;
      }
      return 0;
    });

    // 判断是否需要输入框（letsencrypt、buypass、zerossl）
    const shouldUseInputForEmail = computed(() => {
      return ["litessl", "letsencrypt", "buypass", "zerossl"].includes(param.value.ca);
    });

    // 计算当前选中的邮箱选项的 value（用于 NSelect）
    const currentEmailValue = computed(() => {
      if (!param.value.eabId) return null;
      // 优先使用 eabId 来查找匹配的选项
      const matchedOption = emailOptions.value.find(
        (item) => item.id.toString() === param.value.eabId
      );
      return matchedOption ? matchedOption.value : null;
    });

    // 表单渲染配置
    const config = computed(() => {
      // 基本选项
      return [
        useFormInput($t("t_17_1745227838561"), "domains", {
          placeholder: $t("t_0_1745735774005"),
          allowInput: noSideSpace,
          onInput: (val: string) => {
            param.value.domains = val.replace(/，/g, ",").replace(/;/g, ","); // 中文逗号分隔
          },
        }),
        {
          type: "custom" as const,
          render: () => {
            return (
              <DnsProviderSelect
                type="dns"
                path="provider_id"
                value={param.value.provider_id}
                valueType="value"
                isAddMode={true}
                {...{
                  "onUpdate:value": (val: { value: string; type: string }) => {
                    param.value.provider_id = val.value;
                    param.value.provider = val.type;
                  },
                }}
              />
            );
          },
        },
        {
          type: "custom" as const,
          render: () => {
            return (
              <NSpin show={isLoadingCA.value}>
                <NGrid cols={24}>
                  <NFormItemGi
                    span={13}
                    label={$t("t_3_1750399513606")}
                    path="ca"
                    showRequireMark={true}
                  >
                    <NSelect
                      value={param.value.ca}
                      options={caOptions.value}
                      renderLabel={renderLabel}
                      renderTag={renderSingleSelectTag}
                      filterable
                      filter={handleFilter}
                      loading={isLoadingCA.value}
                      placeholder={$t("t_0_1747990228780")}
                      onUpdateValue={handleCAChange}
                      class="flex-1 w-full"
                      v-slots={{
                        empty: () => {
                          return (
                            <span class="text-[1.4rem]">
                              {$t("t_2_1747990228008")}
                            </span>
                          );
                        },
                      }}
                    />
                  </NFormItemGi>
                  <NFormItemGi span={11}>
                    <NButton class="mx-[8px]" onClick={goToAddCAProvider}>
                      {$t("t_4_1747903685371")}
                    </NButton>
                    <NButton
                      onClick={loadCAOptions}
                      loading={isLoadingCA.value}
                    >
                      {$t("t_0_1746497662220")}
                    </NButton>
                  </NFormItemGi>
                </NGrid>
              </NSpin>
            );
          },
        },
        {
          type: "custom" as const,
          render: () => {
            return (
              <NFormItem label={$t("t_68_1745289354676")} path="email">
                {shouldUseInputForEmail.value ? (
                  <NDropdown
                    trigger="manual"
                    show={showEmailDropdown.value}
                    options={emailDropdownOptions.value}
                    onSelect={handleSelectEmail}
                    placement="bottom-start"
                    menu-props={() => ({
                      style: {
                        width: `${inputWidth.value}px`,
                        maxHeight: "40rem",
                        overflowY: "auto",
                      },
                    })}
                    node-props={(option: any) => ({
                      style: {
                        padding: "8px 12px",
                        cursor: "pointer",
                      },
                      class: "hover:bg-[var(--setting-input-bg)]",
                    })}
                  >
                    <NInput
                      ref={emailInputRef}
                      v-model:value={param.value.email}
                      placeholder={$t("t_2_1748052862259")}
                      clearable
                      loading={isLoadingEmails.value}
                      onFocus={handleEmailFocus}
                      onBlur={handleEmailBlur}
                      class="w-full"
                    />
                  </NDropdown>
                ) : (
                  <NSelect
                    value={currentEmailValue.value}
                    options={emailOptions.value}
                    placeholder={$t("t_2_1748052862259")}
                    clearable
                    filterable
                    loading={isLoadingEmails.value}
                    class="w-full"
                    onUpdateValue={(value: string) => {
                      // 根据选择的 id 找到对应的邮箱地址和 eabId
                      const selectedOption = emailOptions.value.find(
                        (item) => item.value === value
                      );
                      if (selectedOption) {
                        param.value.email = selectedOption.email;
                        param.value.eabId = selectedOption.id.toString();
                      } else {
                        param.value.email = value;
                        param.value.eabId = "";
                      }
                    }}
                  />
                )}
              </NFormItem>
            );
          },
        },

        {
          type: "custom" as const,
          render: () => {
            return (
              <NFormItem label={$t("t_4_1747990227956")} path="end_day">
                <div class="flex items-center">
                  <span class="text-[1.4rem] mr-[1.2rem]">
                    {$t("t_5_1747990228592")}
                  </span>
                  <NInputNumber
                    v-model:value={param.value.end_day}
                    showButton={false}
                    min={1}
                    class="w-[120px]"
                  />
                  <span class="text-[1.4rem] ml-[1.2rem]">
                    {$t("t_6_1747990228465")}
                  </span>
                </div>
              </NFormItem>
            );
          },
        },
        useFormMore(advancedOptions),
        ...(advancedOptions.value
          ? [
              useFormSelect(
                $t("t_0_1747647014927"),
                "algorithm",
                [
                  { label: "RSA2048", value: "RSA2048" },
                  { label: "RSA3072", value: "RSA3072" },
                  { label: "RSA4096", value: "RSA4096" },
                  { label: "RSA8192", value: "RSA8192" },
                  { label: "EC256", value: "EC256" },
                  { label: "EC384", value: "EC384" },
                ],
                {},
                { showRequireMark: false }
              ),
              useFormInput(
                $t("t_7_1747990227761"),
                "proxy",
                {
                  placeholder: $t("t_8_1747990235316"),
                  allowInput: noSideSpace,
                },
                { showRequireMark: false }
              ),
              useFormSwitch(
                $t("t_2_1749204567193"),
                "close_cname",
                {
                  checkedValue: 1,
                  uncheckedValue: 0,
                },
                { showRequireMark: false }
              ),
              useFormSwitch(
                $t("t_2_1747106957037"),
                "skip_check",
                {
                  checkedValue: 1,
                  uncheckedValue: 0,
                },
                { showRequireMark: false }
              ),
              // 只有在跳过预检查关闭时才显示DNS递归服务器、预检查超时时间和忽略预检查结果
              ...(param.value.skip_check === 0
                ? [
                    useFormInput(
                      $t("t_0_1747106957037"),
                      "name_server",
                      {
                        placeholder: $t("t_1_1747106961747"),
                        allowInput: noSideSpace,
                        onInput: (val: string) => {
                          param.value.name_server = val
                            .replace(/，/g, ",")
                            .replace(/;/g, ","); // 中文逗号分隔
                        },
                      },
                      { showRequireMark: false }
                    ),
                    {
                      type: "custom" as const,
                      render: () => {
                        return (
                          <NFormItem
                            label={$t("t_0_1749263105073")}
                            path="max_wait"
                          >
                            <NInputNumber
                              v-model:value={
                                (
                                  param.value as ApplyNodeConfig & {
                                    max_wait?: number;
                                  }
                                ).max_wait
                              }
                              showButton={false}
                              min={1}
                              class="w-full"
                              placeholder={$t("t_1_1749263104936")}
                            />
                          </NFormItem>
                        );
                      },
                    },
                    {
                      type: "custom" as const,
                      render: () => {
                        return (
                          <NFormItem
                            label={$t("t_2_1749263103765")}
                            path="ignore_check"
                          >
                            <div class="flex items-center">
                              <span class="text-[1.4rem] mr-[1.2rem]">
                                {$t("t_3_1749263104237")}
                              </span>
                              <NSwitch
                                v-model:value={param.value.ignore_check}
                                checkedValue={1}
                                uncheckedValue={0}
                                class="mx-[.5rem]"
                                v-slots={{
                                  checked: () => $t("t_4_1749263101853"),
                                  unchecked: () => $t("t_5_1749263101934"),
                                }}
                              />
                              <span class="text-[1.4rem] ml-[1.2rem]">
                                {$t("t_6_1749263103891")}
                              </span>
                            </div>
                          </NFormItem>
                        );
                      },
                    },
                  ]
                : []),
            ]
          : []),
        useFormHelp([
          {
            content: $t("t_0_1747040228657"),
          },
          {
            content: $t("t_1_1747040226143"),
          },
        ]),
      ];
    });

    // 创建表单实例
    const {
      component: Form,
      data,
      example,
    } = useForm<ApplyNodeConfig>({ defaultValue: param, config, rules });

    // 监听CA值变化，自动加载邮箱选项
    watch(
      () => param.value.ca,
      async (newCA) => {
        if (newCA) {
          await loadEmailOptions(newCA);
        } else {
          emailOptions.value = [];
          param.value.email = "";
          param.value.eabId = "";
          showEmailDropdown.value = false;
        }
      }
    );

    // 监听邮箱选项变化，如果当前下拉显示且没有选项了就关闭下拉
    watch(
      () => emailOptions.value,
      (newOptions) => {
        if (showEmailDropdown.value && newOptions.length === 0) {
          showEmailDropdown.value = false;
        }
      }
    );

    onMounted(async () => {
      advancedOptions.value = false;
      await loadCAOptions();

      // 如果是编辑模式且有外部传入的邮箱，直接设置邮箱值
      if (isEdit.value && routeEmail.value) {
        param.value.email = routeEmail.value;
      } else {
        // 非编辑模式：如果当前已经有CA值，主动加载对应的邮件选项
        if (param.value.ca) {
          await loadEmailOptions(param.value.ca);
        }
      }

      // 移除重复调用，让 watch 监听器处理 CA 值变化
      // 这样避免了 onMounted 和 watch 同时调用 loadEmailOptions 导致的重复请求
    });

    // 确认事件触发
		confirm(async (close) => {
      try {
				await example.value?.validate();
				data.value.eabId = "";
        updateNodeConfig(props.node.id, data.value); // 更新节点配置
        isRefreshNode.value = props.node.id; // 刷新节点
        close();
      } catch (error) {
        console.log(error);
      }
    });

    return () => (
      <div class="apply-node-drawer">
        <Form labelPlacement="top" />
      </div>
    );
  },
})
