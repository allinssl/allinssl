import {
	FormItemRule,
	FormProps,
	FormRules,
	NAlert,
	NButton,
	NFlex,
	NFormItem,
	NFormItemGi,
	NGrid,
	NInput,
	NInputNumber,
	NSelect,
	NSpace,
	NTag,
	NText,
	NTooltip,
  NEmpty,
	type DataTableColumns,
} from 'naive-ui'
import {
	useModal,
	useDialog,
	useTable,
	useSearch,
	useModalHooks,
	useFormHooks,
	useForm,
	useLoadingMask,
} from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { isEmail, isIp, isPort, isUrl, isDomain } from '@baota/utils/business'
import { $t } from '@locales/index'
import { useStore } from './useStore'
import { ApiProjectConfig } from '@config/data'
import type {
  AccessItem,
  AccessListParams,
  AddAccessParams,
  SshAccessConfig,
  UpdateAccessParams,
  PanelAccessConfig,
  NamecheapAccessConfig,
  NS1AccessConfig,
  CloudnsAccessConfig,
  AwsAccessConfig,
  AzureAccessConfig,
  NamesiloAccessConfig,
  NamedotcomAccessConfig,
  BunnyAccessConfig,
  GcoreAccessConfig,
  JdcloudAccessConfig,
  DogeAccessConfig,
  PluginAccessConfig,
  LecdnAccessConfig,
  ConstellixAccessConfig,
  WebhookAccessConfig,
  AcmeDnsAccessConfig,
  SpaceshipAccessConfig,
  BTDomainAccessConfig,
} from "@/types/access";
import type { VNode, Ref } from "vue";
import { testAccess, getPlugins } from "@/api/access";
// import { useLocalStorage } from '@vueuse/core'

import ApiManageForm from "./components/ApiManageModel";
import SvgIcon from "@components/svgIcon";
import TypeIcon from "@components/typeIcon";
import { noSideSpace } from "@lib/utils";
import { JSX } from "vue/jsx-runtime";

/**
 * 授权API管理控制器接口
 */
interface AuthApiManageControllerExposes {
  loading: Ref<boolean>;
  fetch: (resetPage?: boolean) => Promise<void>;
  TableComponent: (
    props: Record<string, unknown>,
    context: Record<string, unknown>
  ) => VNode;
  PageComponent: (
    props: Record<string, unknown>,
    context: Record<string, unknown>
  ) => VNode;
  SearchComponent: (
    props: Record<string, unknown>,
    context: Record<string, unknown>
  ) => VNode;
  param: Ref<AccessListParams>;
  openAddForm: () => void;
}

/**
 * API表单控制器接口
 */
interface ApiFormControllerExposes {
  ApiManageForm: (
    props: FormProps,
    context: Record<string, unknown>
  ) => any;
}

// 获取Store中的状态和方法
const {
  accessTypeMap,
  apiFormProps,
  fetchAccessList,
  deleteExistingAccess,
  addNewAccess,
  updateExistingAccess,
  resetApiForm,
} = useStore();

// 错误处理钩子
const { handleError } = useError();

/**
 * 授权API管理业务逻辑控制器
 * @description 处理授权API相关的业务逻辑，包括列表展示、表单操作等
 * @returns {AuthApiManageControllerExposes} 返回授权API相关的状态数据和处理方法
 */
export const useController = (): AuthApiManageControllerExposes => {
  /**
   * 测试授权API
   * @param {AccessItem} row - 授权API信息
   */
  const handleTestAccess = async (row: AccessItem): Promise<void> => {
    try {
      const { fetch, message } = testAccess({ id: row.id, type: row.type });
      message.value = true;
      await fetch();
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * 创建表格列配置
   * @returns {DataTableColumns<AccessItem>} 返回表格列配置数组
   */
  const createColumns = (): DataTableColumns<AccessItem> => [
    {
      title: $t("t_2_1745289353944"),
      key: "name",
      width: 200,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: $t("t_1_1746754499371"),
      key: "type",
      width: 140,
      render: (row) => <TypeIcon round  class="!py-[4px] !px-[10px]" icon={row.type} type="success" />,
    },
    {
      title: $t("t_2_1746754500270"),
      key: "type",
      width: 200,
      render: (row) => (
        <NSpace>
          {row.access_type?.map((type) => {
            return (
              <NTag
                key={type}
                type={type === "dns" ? "success" : "info"}
                size="small"
                round
              >
                {accessTypeMap[type as keyof typeof accessTypeMap]}
              </NTag>
            );
          })}
        </NSpace>
      ),
    },
    {
      title: $t("t_7_1745215914189"),
      key: "create_time",
      width: 180,
    },
    {
      title: $t("t_0_1745295228865"),
      key: "update_time",
      width: 180,
    },
    {
      title: $t("t_8_1745215914610"),
      key: "actions",
      width: 200,
      align: "right",
      fixed: "right",
      render: (row) => {
        return (
          <NSpace justify="end">
            <NButton
              size="tiny"
              strong
              secondary
			  type="primary"
			  class="table-action-btn"
              onClick={() => handleTestAccess(row)}
            >
              {$t("t_16_1746676855270")}
            </NButton>
            <NButton
              size="tiny"
              strong
              secondary
              type="primary"
			  class="table-action-btn"
              onClick={() => openEditForm(row)}
            >
              {$t("t_11_1745215915429")}
            </NButton>
            <NButton
              size="tiny"
              strong
              secondary
              type="error"
			  class="table-action-btn-danger"
              onClick={() => confirmDelete(row.id)}
            >
              {$t("t_12_1745215914312")}
            </NButton>
          </NSpace>
        );
      },
    },
  ];

  // 表格实例
  const { TableComponent, PageComponent, loading, param, fetch } = useTable<
    AccessItem,
    AccessListParams
  >({
    config: createColumns(),
    request: fetchAccessList,
    watchValue: ["p", "limit"],
    storage: "authApiManage",
    alias: { page: "p", pageSize: "limit" },
    defaultValue: {
      p: 1,
      limit: 10,
      search: "",
    },
  });

  // 搜索实例
  const { SearchComponent, search } = useSearch({
    onSearch: (value) => {
      param.value.search = value;
      fetch();
    },
  });

  /**
   * 打开添加授权API弹窗
   */
  const openAddForm = (): void => {
    useModal({
      title: $t("t_0_1745289355714"),
      area: 500,
      component: ApiManageForm,
      footer: true,
      onUpdateShow: (show) => {
        if (!show) fetch();
        resetApiForm();
      },
    });
  };

  /**
   * 打开编辑授权API弹窗
   * @param {AccessItem} row - 授权API信息
   */
  const openEditForm = (row: AccessItem): void => {
    useModal({
      title: $t("t_4_1745289354902"),
      area: 500,
      component: ApiManageForm,
      componentProps: { data: row },
      footer: true,
      onUpdateShow: (show) => {
        if (!show) fetch();
        resetApiForm();
      },
    });
  };

  /**
   * 确认删除授权API
   * @param {string} id - 授权API ID
   */
  const confirmDelete = (id: string): void => {
    useDialog({
      title: $t("t_5_1745289355718"),
      content: $t("t_6_1745289358340"),
      confirmText: $t("t_5_1744870862719"),
      cancelText: $t("t_4_1744870861589"),
      onPositiveClick: async () => {
        await deleteExistingAccess(id);
        await fetch();
      },
    });
  };

  // 挂载时，获取数据
  onMounted(fetch);

  return {
    loading,
    fetch,
    TableComponent,
    PageComponent,
    SearchComponent,
    param,
    openAddForm,
  };
};

/**
 * 表单控制器Props接口
 */
interface ApiFormControllerProps {
  data?: AccessItem;
}

interface PluginOption {
  label: string;
  value: string;
  description?: string;
  pluginName?: string;
  config?: ConfigItem[];
  params?: string;
}

interface ConfigItem {
  name: string;
  type: 'string' | 'boolean' | 'enum';
  description: string;
  required: boolean;
  options?: Array<string | { label: string; value: string }>;
  config?: any
}

/**
 * 授权API表单控制器
 * @description 处理授权API表单相关的业务逻辑
 * @param {ApiFormControllerProps} props - 表单控制器属性
 * @returns {ApiFormControllerExposes} 返回表单控制器对象
 */
export const useApiFormController = (
  props: ApiFormControllerProps
): ApiFormControllerExposes => {
  const { confirm } = useModalHooks(); // 弹窗挂载方法
  const { open: openLoad, close: closeLoad } = useLoadingMask({
    text: $t("t_0_1746667592819"),
  });
  const {
    useFormInput,
    useFormRadioButton,
    useFormSwitch,
    useFormTextarea,
    useFormCustom,
    useFormSelect,
    useFormHelp,
  } = useFormHooks();
  const param = (
    props.data?.id
      ? ref({ ...props.data, config: JSON.parse(props.data.config) })
      : apiFormProps
  ) as Ref<AddAccessParams | UpdateAccessParams>;
  const pluginActionTips = ref("");

  // 插件列表
  const pluginList = ref<Array<PluginOption>>([]);
  
  // 生成插件配置表单控件的辅助函数
  const generatePluginFormControl = (configItem: ConfigItem, fieldPath: string, noSideSpace: any) => {
    const itemAttrs = {
        required: configItem.required || false,
        showRequireMark: configItem.required || false,
        trigger: configItem.required ? 'input' : undefined
      };
    
    // 根据配置项类型渲染不同的表单控件
    switch (configItem.type) {
      case 'string':
        return useFormInput(
          configItem.description,
          fieldPath,
          { allowInput: noSideSpace },
          itemAttrs
        );
      case 'boolean':
        return useFormSwitch(
          configItem.description,
          fieldPath,
          { 
            checkedValue: true, 
            uncheckedValue: false 
          },
          itemAttrs
        );
      case 'enum':
        // 确保options存在且是数组
        const options = configItem.options || [];
        return useFormSelect(
          configItem.description,
          fieldPath,
          options.map((opt: any) => ({
            label: typeof opt === 'string' ? opt : opt.label || opt,
            value: typeof opt === 'string' ? opt : opt.value || opt
          })),
          {},
          itemAttrs
        );
      default:
        // 默认使用字符串输入框
        return useFormInput(
          configItem.description,
          fieldPath,
          { allowInput: noSideSpace },
          itemAttrs
        );
    }
  };

  // 表单规则
  const rules: Record<string, any> = {
    name: {
      required: true,
      message: $t("t_27_1745289355721"),
      trigger: "input",
    },
    type: {
      required: true,
      message: $t("t_28_1745289356040"),
      trigger: "change",
    },
    config: {
      host: {
        required: true,
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!isIp(value) && !isDomain(value)) {
            return callback(new Error($t("t_0_1749119980577")));
          }
          callback();
        },
      },
      port: {
        required: true,
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: number,
          callback: (error?: Error) => void
        ) => {
          if (!isPort(value.toString())) {
            return callback(new Error($t("t_1_1745317313096")));
          }
          callback();
        },
      },
      user: {
        required: true,
        trigger: "input",
        message: $t("t_3_1744164839524"),
      },
      username: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value) {
            const mapTips = {
              westcn: $t("t_0_1747365600180"),
              namedotcom: "请输入用户名",
              lecdn: "请输入用户名",
            };
            return callback(
              new Error(
                mapTips[param.value.type as keyof typeof mapTips] ||
                  $t("t_0_1747365600180")
              )
            );
          }
          callback();
        },
      },
      password: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          // SSH 类型的密码字段在密码模式下是必填的，在密钥模式下是可选的
          if (param.value.type === "ssh") {
            const sshConfig = param.value.config as SshAccessConfig;
            if (sshConfig?.mode === "password" && !value) {
              return callback(new Error($t("t_0_1747711335067")));
            }
            // 密钥模式下密码是可选的，不需要验证
            callback();
            return;
          }

          if (!value) {
            const mapTips = {
              westcn: $t("t_1_1747365603108"),
              lecdn: "请输入密码",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      key: {
        required: true,
        message: $t("t_31_1745289355715"),
        trigger: "input",
      },
      url: {
        required: true,
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!isUrl(value)) {
            const mapTips = {
              btpanel: $t("t_2_1745317314362"),
              btwaf: $t("t_0_1747271295174"),
              safeline: $t("t_0_1747300383756"),
              lecdn: "请输入正确的URL地址",
              webhook: "请输入回调地址",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      server_url: {
        required: true,
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!isUrl(value)) {
            return callback(new Error("请输入正确的 Server URL"));
          }
          callback();
        },
      },
      credentials: {
        required: true,
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value || value.trim() === "") {
            return callback(new Error("请输入 Credentials JSON"));
          }
          try {
            JSON.parse(value);
          } catch (error) {
            return callback(new Error("Credentials 必须是合法 JSON"));
          }
          callback();
        },
      },
      api_key: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value || !value.length) {
            const mapTips = {
              cloudflare: $t("t_0_1747042966820"),
              btpanel: $t("t_1_1747042969705"),
              btwaf: $t("t_1_1747300384579"),
              godaddy: $t("t_0_1747984137443"),
              ns1: "请输入API Key",
              namecheap: "请输入API Key",
              constellix: "请输入API Key",
              spaceship: "请输入 Spaceship API Key",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      api_secret: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value) {
            const mapTips = {
              godaddy: $t("t_1_1747984133312"),
              spaceship: "请输入 Spaceship API Secret",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      account_id: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value) {
            const mapTips = {
              btdomain: "请输入 宝塔域名 Account ID",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      access_secret: {
        required: true,
        message: $t("t_2_1747984134626"),
        trigger: "input",
      },
      api_token: {
        required: true,
        message: $t("t_0_1747617113090"),
        trigger: "input",
      },
      // access_key_id: {
      // 	trigger: 'input',
      // 	validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
      // 		if (!value) {
      // 			const mapTips = {
      // 				aliyun: $t('t_4_1745317314054'),
      // 				doge: '请输入多吉云AccessKeyId',
      // 			}
      // 			return callback(new Error(mapTips[param.value.type as keyof typeof mapTips] || $t('t_4_1745317314054')))
      // 		}
      // 		callback()
      // 	},
      // },
      // access_key_secret: {
      // 	trigger: 'input',
      // 	validator: (rule: FormItemRule, value: string, callback: (error?: Error) => void) => {
      // 		if (!value) {
      // 			const mapTips = {
      // 				aliyun: $t('t_5_1745317315285'),
      // 				doge: '请输入多吉云AccessKeySecret',
      // 			}
      // 			return callback(new Error(mapTips[param.value.type as keyof typeof mapTips] || $t('t_5_1745317315285')))
      // 		}
      // 		callback()
      // 	},
      // },
      secret_access_key: {
        required: true,
        message: "请输入Secret Access Key",
        trigger: "input",
      },
      api_user: {
        required: true,
        message: "请输入API User",
        trigger: "input",
      },
      auth_id: {
        required: true,
        message: "请输入Auth ID",
        trigger: "input",
      },
      auth_password: {
        required: true,
        message: "请输入Auth Password",
        trigger: "input",
      },
      tenant_id: {
        required: true,
        message: "请输入Tenant ID",
        trigger: "input",
      },
      client_id: {
        required: true,
        message: "请输入Client ID",
        trigger: "input",
      },
      client_secret: {
        required: true,
        message: "请输入Client Secret",
        trigger: "input",
      },
      secret_id: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value || !value.length) {
            const mapTips = {
              tencentcloud: $t("t_2_1747042967277"),
              edgeone: "请输入正确的 EdgeOne SecretId",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      access_key: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value) {
            const mapTips = {
              huawei: $t("t_2_1747271295877"),
              baidu: $t("t_3_1747271294475"),
              volcengine: $t("t_3_1747365600828"),
              qiniu: $t("t_3_1747984134586"),
              doge: $t("t_0_1750320239265"),
              btdomain: "请输入 宝塔域名 Access Key",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      secret_key: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (!value || !value.length) {
            const mapTips = {
              tencentcloud: $t("t_2_1747042967277"),
              edgeone: "请输入 EdgeOne Secret Key",
              huawei: $t("t_3_1747042967608"),
              baidu: $t("t_4_1747271294621"),
              volcengine: $t("t_4_1747365600137"),
              doge: $t("t_1_1750320241427"),
              constellix: "请输入Secret Key",
              btdomain: "请输入 宝塔域名 Secret Key",
            };
            return callback(
              new Error(mapTips[param.value.type as keyof typeof mapTips])
            );
          }
          callback();
        },
      },
      email: {
        trigger: "input",
        validator: (
          rule: FormItemRule,
          value: string,
          callback: (error?: Error) => void
        ) => {
          if (
            param.value.type === "cloudflare" &&
            (!value || value.trim() === "")
          ) {
            return callback();
          }

          if (!isEmail(value)) {
            return callback(new Error($t("t_5_1747042965911")));
          }
          callback();
        },
      },
      region: {
        required: true,
        message: "请输入Region",
        trigger: "input",
      },
      "config.name": {
        required: true,
        message: $t("t_0_1750144125193"),
        trigger: "change",
      },
    },
  };

  // 类型列表
  const typeList = Object.entries(ApiProjectConfig)
    .filter(
      ([_, value]) => !(typeof value.notApi === "boolean" && !value.notApi)
    )
    .map(([key, value]) => ({
      label: value.name,
      value: key,
      access: value.type || [],
    }));

  const typeUrlMap = new Map<string, string>([
    ["btwaf", "宝塔WAF-URL"],
    ["btpanel", "宝塔面板-URL"],
    ["1panel", "1Panel-URL"],
    ["safeline", "雷池WAF-URL"],
  ]);

  // 表单配置
  const config = computed(() => {
    const items = [
      useFormInput($t("t_2_1745289353944"), "name"),
      useFormCustom(() => {
        return (
          <NFormItem label={$t("t_41_1745289354902")} path="type">
            <NSelect
              class="w-full"
              options={typeList}
              renderLabel={renderTypeLabel}
              renderTag={renderSingleSelectTag}
              disabled={!!props.data?.id}
              filterable
              placeholder={$t("t_0_1745833934390")}
              v-model:value={param.value.type}
              v-slots={{
                empty: () => {
                  return (
                    <span class="text-[1.4rem]">{$t("t_0_1745833934390")}</span>
                  );
                },
              }}
            />
          </NFormItem>
        );
      }),
    ] as any;

    // 根据不同类型渲染不同的表单项
    switch (param.value.type) {
      case "ssh": {
        // SSH 基础配置项
        const sshBaseItems = [
          useFormCustom(() => {
            return (
              <NGrid cols={24} xGap={4}>
                <NFormItemGi
                  label={$t("t_1_1747711335336")}
                  span={16}
                  path="config.host"
                >
                  <NInput
                    v-model:value={(param.value.config as SshAccessConfig).host}
                    placeholder={$t("t_2_1747711337958")}
                    allow-input={noSideSpace}
                  />
                </NFormItemGi>
                <NFormItemGi
                  label={$t("t_2_1745833931404")}
                  span={8}
                  path="config.port"
                >
                  <NInputNumber
                    v-model:value={(param.value.config as SshAccessConfig).port}
                    showButton={false}
                  />
                </NFormItemGi>
              </NGrid>
            );
          }),
          useFormInput($t("t_44_1745289354583"), "config.user"),
          useFormRadioButton($t("t_45_1745289355714"), "config.mode", [
            { label: $t("t_48_1745289355714"), value: "password" },
            { label: $t("t_1_1746667588689"), value: "key" },
          ]),
        ];

        // 根据认证模式添加对应的字段
        const sshAuthItems = [];
        if ((param.value.config as SshAccessConfig)?.mode === "password") {
          sshAuthItems.push(
            useFormInput($t("t_48_1745289355714"), "config.password", {
              type: "password",
              showPasswordOn: "click",
              allowInput: noSideSpace,
            })
          );
        } else if ((param.value.config as SshAccessConfig)?.mode === "key") {
          sshAuthItems.push(
            useFormTextarea($t("t_1_1746667588689"), "config.key", {
              rows: 3,
              placeholder: $t("t_0_1747709067998"),
            }),
            // 私钥密码输入框（使用 password 字段）
            useFormInput(
              "私钥密码",
              "config.password",
              {
                type: "password",
                showPasswordOn: "click",
                allowInput: noSideSpace,
                placeholder: "请输入私钥密码（可选）",
              },
              { showRequireMark: false }
            )
          );
        }

        // 合并所有 SSH 配置项
        items.push(...sshBaseItems, ...sshAuthItems);
        break;
      }
      case "1panel":
        items.push(
          // 1Panel版本选择下拉框
          useFormCustom(() => {
            const config = param.value.config as PanelAccessConfig;
            // 如果version为空或者没有version字段，默认为v1
            const currentVersion = config.version || "v1";

            return (
              <NFormItem
                label="版本"
                path="config.version"
                showRequireMark={false}
              >
                <NSelect
                  class="w-full"
                  options={[
                    { label: "v1", value: "v1" },
                    { label: "v2", value: "v2" },
                  ]}
                  placeholder="请选择版本"
                  value={currentVersion}
                  onUpdateValue={(value: "v1" | "v2") => {
                    (param.value.config as PanelAccessConfig).version = value;
                  }}
                />
              </NFormItem>
            );
          }),
          useFormInput(typeUrlMap.get(param.value.type) || "", "config.url", {
            allowInput: noSideSpace,
          }),
          useFormInput($t("t_55_1745289355715"), "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormSwitch(
            $t("t_3_1746667592270"),
            "config.ignore_ssl",
            { checkedValue: "1", uncheckedValue: "0" },
            { showRequireMark: false }
          )
        );
        break;
      case "btpanel":
      case "btwaf":
      case "safeline":
        items.push(
          useFormInput(typeUrlMap.get(param.value.type) || "", "config.url", {
            allowInput: noSideSpace,
          }),
          useFormInput(
            param.value.type === "safeline"
              ? $t("t_1_1747617105179")
              : $t("t_55_1745289355715"),
            param.value.type === "safeline"
              ? "config.api_token"
              : "config.api_key",
            {
              type: "password",
              showPasswordOn: "click",
              allowInput: noSideSpace,
            }
          ),
          useFormSwitch(
            $t("t_3_1746667592270"),
            "config.ignore_ssl",
            { checkedValue: "1", uncheckedValue: "0" },
            { showRequireMark: false }
          )
        );
        break;
      case "aliyun":
        items.push(
          useFormInput("AccessKeyId", "config.access_key_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("AccessKeySecret", "config.access_key_secret", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "tencentcloud":
        items.push(
          useFormInput("SecretId", "config.secret_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("SecretKey", "config.secret_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "huaweicloud":
      case "baidu":
      case "volcengine":
      case "doge":
        items.push(
          useFormInput("AccessKey", "config.access_key", {
            allowInput: noSideSpace,
          }),
          useFormInput("SecretKey", "config.secret_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "cloudflare":
        items.push(
          useFormInput(
            "邮箱",
            "config.email",
            { allowInput: noSideSpace },
            { showRequireMark: false }
          ),
          useFormInput("APIKey", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormCustom(() => {
            return (
              <NAlert
                type="error"
                class="mt-[1.2rem] whitespace-nowrap"
                showIcon={false}
              >
                <span class="text-[1.3rem]">
                  使用API令牌时不要填写邮箱，否则将作为Global Key请求Cloudflare
                </span>
              </NAlert>
            );
          })
        );
        break;
      case "westcn":
        items.push(
          useFormInput("Username", "config.username", {
            allowInput: noSideSpace,
          }),
          useFormInput("Password", "config.password", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "godaddy":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormInput("API Secret", "config.api_secret", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "qiniu":
        items.push(
          useFormInput("AccessKey", "config.access_key", {
            allowInput: noSideSpace,
          }),
          useFormInput("AccessSecret", "config.access_secret", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "namecheap":
        items.push(
          useFormInput("API User", "config.api_user", {
            allowInput: noSideSpace,
          }),
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "ns1":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "cloudns":
        items.push(
          useFormInput("Auth ID", "config.auth_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("Auth Password", "config.auth_password", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "aws":
        items.push(
          useFormInput("Access Key ID", "config.access_key_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("Secret Access Key", "config.secret_access_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormInput("Region", "config.region", {
            allowInput: noSideSpace,
          })
        );
        break;
      case "azure":
        items.push(
          useFormInput("Tenant ID", "config.tenant_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("Client ID", "config.client_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("Client Secret", "config.client_secret", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormInput("Environment", "config.environment", {
            allowInput: noSideSpace,
            placeholder: "public",
          })
        );
        break;
      case "namesilo":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "namedotcom":
        items.push(
          useFormInput("Username", "config.username", {
            allowInput: noSideSpace,
          }),
          useFormInput("API Token", "config.api_token", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "bunny":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "gcore":
        items.push(
          useFormInput("API Token", "config.api_token", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "jdcloud":
        items.push(
          useFormInput("Access Key ID", "config.access_key_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("Secret Access Key", "config.secret_access_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "lecdn":
        items.push(
          useFormInput("URL", "config.url", { allowInput: noSideSpace }),
          useFormInput("Username", "config.username", {
            allowInput: noSideSpace,
          }),
          useFormInput("Password", "config.password", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormSwitch(
            $t("t_3_1746667592270"),
            "config.ignore_ssl",
            { checkedValue: "1", uncheckedValue: "0" },
            { showRequireMark: false }
          )
        );
        break;
      case "constellix":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormInput("Secret Key", "config.secret_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "webhook":
        items.push(
          useFormInput("WebHook回调地址", "config.url"),
          useFormSelect("请求方式", "config.method", [
            { label: "POST", value: "POST" },
            { label: "GET", value: "GET" },
          ]),
          useFormTextarea(
            "WebHook请求头（可选）",
            "config.headers",
            { rows: 3, placeholder: "Content-Type: application/json" },
            { showRequireMark: false }
          ),
          useFormTextarea(
            "WebHook推送通知回调数据（可选）",
            "config.data",
            {
              rows: 3,
              placeholder:
                '请使用JSON格式，例如：{"title":"test","content":"test"}',
            },
            { showRequireMark: false }
          ),
          useFormSwitch(
            $t("t_3_1746667592270"),
            "config.ignore_ssl",
            { checkedValue: "1", uncheckedValue: "0" },
            { showRequireMark: false }
          ),
          useFormCustom(() => {
            return (
              <div class="mt-4 p-4 bg-[var(--form-log-bg)] rounded-md">
                <div class="space-y-4 text-lg">
                  <div>
                    <div class="font-medium mb-3 text-xl">
                      用于部署时可用的模板变量：
                    </div>
                    <div class="space-y-2 ml-4">
                      <div>
                        <code class="px-2 py-1 bg-[var(--form-log-code-bg)] rounded text-lg font-mono">
                          __cert__
                        </code>
                        <span class="text-color5">：证书内容</span>
                      </div>
                      <div>
                        <code class="px-2 py-1 bg-[var(--form-log-code-bg)] rounded text-lg font-mono">
                          __key__
                        </code>
                        <span class="text-color5">：私钥内容</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium mb-3 text-xl">
                      用于申请时可用的模板变量：
                    </div>
                    <div class="space-y-2 ml-4">
                      <div>
                        <code class="px-2 py-1 bg-[var(--form-log-code-bg)] rounded text-lg font-mono">
                          __domain__
                        </code>
                        <span class="text-color5">：完整域名，如：_acme-challenge.allinssl.com</span>
                      </div>
                      <div>
                        <code class="px-2 py-1 bg-[var(--form-log-code-bg)] rounded text-lg font-mono">
                          __keyAuth__
                        </code>
                        <span class="text-color5">：域名解析值</span>
                      </div>
                      <div>
                        <code class="px-2 py-1 bg-[var(--form-log-code-bg)] rounded text-lg font-mono">
                          __action__
                        </code>
                        <span class="text-color5">：执行的操作，需要自行根据参数值判断，为present时执行写入，cleanup清理记录</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        );
        break;
      case "acmedns":
        items.push(
          useFormInput("Server URL", "config.server_url", {
            allowInput: noSideSpace,
            placeholder: "https://auth.acme-dns.io",
          }),
          useFormTextarea(
            "Credentials(JSON)",
            "config.credentials",
            {
              rows: 8,
              placeholder:
                '{\n  "username": "xxx",\n  "password": "xxx",\n  "subdomain": "xxx",\n  "fulldomain": "xxx.auth.acme-dns.io"\n}',
            }
          ),
          useFormCustom(() => {
            return (
              <NAlert
                type="info"
                class="mt-[1.2rem] whitespace-normal"
                showIcon={false}
              >
                <span class="text-[1.3rem]">
                  Credentials 需要填写 acme-dns <code>/register</code>{" "}
                  接口返回的单条 JSON。
                  <a
                    href="https://github.com/acme-dns/acme-dns"
                    target="_blank"
                    rel="noreferrer"
                    class="ml-2 text-[#3296FA] underline"
                  >
                    官方项目地址
                  </a>
                </span>
              </NAlert>
            );
          })
        );
        break;
      case "spaceship":
        items.push(
          useFormInput("API Key", "config.api_key", {
            allowInput: noSideSpace,
          }),
          useFormInput("API Secret", "config.api_secret", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "btdomain":
        items.push(
          useFormInput("Access Key", "config.access_key", {
            allowInput: noSideSpace,
          }),
          useFormInput("Secret Key", "config.secret_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
          useFormInput("Account ID", "config.account_id", {
            allowInput: noSideSpace,
          })
        );
        break;
      case "rainyun":
        items.push(
          useFormInput("API Key", "config.api_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          }),
        );
        break;
      case "edgeone":
        items.push(
          useFormInput("SecretId", "config.secret_id", {
            allowInput: noSideSpace,
          }),
          useFormInput("SecretKey", "config.secret_key", {
            type: "password",
            showPasswordOn: "click",
            allowInput: noSideSpace,
          })
        );
        break;
      case "plugin":
        // 插件名称选择器
        items.push(
          useFormCustom(function() {
            return (
              <NFormItem
                label={$t("t_1_1750144122230")}
                path="config.name"
                showRequireMark={true}
              >
                <NSelect
                  class="w-full"
                  options={pluginList.value}
                  placeholder={$t("t_2_1750144123753")}
                  filterable
                  renderLabel={renderPluginLabel}
                  renderTag={renderPluginTag}
                  v-model:value={param.value.config.name}
                  onUpdateValue={(value, option) => {
                      param.value.config.name = value;
                      pluginActionTips.value = renderPluginTips(option.config || {});
                      if (!param.value.config.config || typeof param.value.config.config === 'string') {
                        param.value.config.config = {};
                      }
                  }}
                  v-slots={{
                    empty: function() { return <span class="text-[1.4rem]">{$t("t_0_1750210698345")}</span>; }
                  }}
                />
              </NFormItem>
            );
          })
        );
        
        // 配置模式选择器
        items.push(
          useFormRadioButton(
            "配置模式",
            "config.mode",
            [
              { label: "默认", value: "default" },
              { label: "自定义", value: "custom" }
            ],
            {},
            { showRequireMark: false }
          )
        );
        
        // 获取插件配置
        var pluginConfig = param.value.config as PluginAccessConfig;
        pluginConfig.mode = pluginConfig.mode || "default";
        var selectedPlugin = pluginList.value.find(function(item) {
          return item.value === pluginConfig.name;
        });
        
        // 根据配置模式初始化不同类型的config
        if (pluginConfig.mode === "default") {
          // 默认模式下确保config是对象类型
          if (!pluginConfig.config || typeof pluginConfig.config !== 'object') {
            // 如果是字符串，尝试解析为JSON对象
            if (typeof pluginConfig.config === 'string' && pluginConfig.config.trim()) {
              try {
                pluginConfig.config = JSON.parse(pluginConfig.config.trim());
              } catch {
                pluginConfig.config = {};
              }
            } else {
              pluginConfig.config = {};
            }
          }
        } else {
          // 自定义模式下确保config是字符串类型
          if (pluginConfig.config === undefined || pluginConfig.config === null) {
            pluginConfig.config = '';
          } else if (typeof pluginConfig.config === 'object') {
            // 空对象时，根据插件配置生成默认的空值对象
            if (Object.keys(pluginConfig.config).length === 0 && selectedPlugin?.config) {
              const defaultConfig: Record<string, string> = {};
              selectedPlugin.config.forEach(configItem => {
                defaultConfig[configItem.name] = '';
              });
              pluginConfig.config = JSON.stringify(defaultConfig);
            } else {
              try {
                // 不使用缩进，生成紧凑的JSON字符串
                pluginConfig.config = JSON.stringify(pluginConfig.config);
              } catch {
                pluginConfig.config = '';
              }
            }
          }
        }
        
        // 未选择插件时显示提示
        if (!selectedPlugin) {
          items.push(
            useFormCustom(function() {
              return (
                <NFormItem path="config.placeholder" showRequireMark={false}>
                  <NEmpty description="请选择插件以查看配置项" />
                </NFormItem>
              );
            })
          );
        } else if (pluginConfig.mode === "default") {
          // 默认模式 - 动态表单
          if (!selectedPlugin.config || selectedPlugin.config.length === 0) {
            items.push(
              useFormCustom(function() {
                return (
                  <NFormItem path="config.placeholder" showRequireMark={false}>
                    <NEmpty description="该插件暂无配置项" />
                  </NFormItem>
                );
              })
            );
          } else {
            selectedPlugin.config.forEach(function(configItem) {
              console.log('configItem', configItem)
              var fieldPath = 'config.config.' + configItem.name;
              // 为动态字段添加验证规则
              if (!rules.config.config) rules.config.config = {};
              rules.config.config[configItem.name] = {
                required: configItem.required,
                trigger: 'input',
                message: '请输入' + (configItem.description || configItem.name)
              };
              items.push(generatePluginFormControl(configItem, fieldPath, noSideSpace));
            });
          }
        } else {
          // 自定义模式 - JSON文本框
          items.push(
            useFormCustom(function() {
              const getConfigValue = () => {
                // 确保当config为undefined、null或空对象时返回空字符串
                if (pluginConfig.config === undefined || pluginConfig.config === null) {
                  return '';
                }
                // 如果是对象且为空对象，也返回空字符串
                if (typeof pluginConfig.config === 'object' && Object.keys(pluginConfig.config).length === 0) {
                  return '';
                }
                return typeof pluginConfig.config === "string"
                  ? pluginConfig.config
                  : JSON.stringify(pluginConfig.config, null, 2);
              };
              
              return (
                <NFormItem
                  path="config.config"
                  v-slots={{
                    label: function() {
                      return (
                        <div>
                          <NText>自定义参数</NText>
                          <NTooltip
                            v-slots={{
                              trigger: function() {
                                return (
                                  <span class="inline-flex ml-2 -mt-1 cursor-pointer text-base rounded-full w-[14px] h-[14px] justify-center items-center text-orange-600 border border-orange-600">
                                    ?
                                  </span>
                                );
                              }
                            }}
                          >
                            {pluginActionTips.value}
                          </NTooltip>
                        </div>
                      );
                    }
                  }}
                >
                  <NInput
                    type="textarea"
                    value={getConfigValue()}
                    onUpdateValue={(value) => {
                      pluginConfig.config = value;
                    }}
                    placeholder={pluginActionTips.value}
                    rows={4}
                  />
                </NFormItem>
              );
            }),
            useFormHelp([{
              content: '<span class="text-[1.4rem] text-[#FF4314]">未来版本将取消自定义参数填写。</span>',
              isHtml: true,
            }])
          );
        }
        break;
      default:
        break;
    }
    return items;
  });

  // 切换类型时，重置表单
  watch(
    () => param.value.type,
    (newVal) => {
      switch (newVal) {
        case "ssh":
          param.value.config = {
            host: "",
            port: 22,
            user: "root",
            mode: "password",
            password: "",
          } as SshAccessConfig;
          break;
        case "1panel":
          param.value.config = {
            url: "",
            api_key: "",
            ignore_ssl: "0",
            version: "v1", // 默认选择 v1 版本
          } as PanelAccessConfig;
          break;
        case "btpanel":
        case "btwaf":
          param.value.config = {
            url: "",
            api_key: "",
            ignore_ssl: "0",
          };
          break;
        case "aliyun":
          param.value.config = {
            access_key_id: "",
            access_key_secret: "",
          };
          break;
        case "baidu":
        case "huaweicloud":
          param.value.config = {
            access_key: "",
            secret_key: "",
          };
          break;
        case "cloudflare":
          param.value.config = {
            email: "",
            api_key: "",
          };
          break;
        case "tencentcloud":
          param.value.config = {
            secret_id: "",
            secret_key: "",
          };
          break;
        case "edgeone":
          param.value.config = {
            secret_id: "",
            secret_key: "",
          };
          break;
        case "godaddy":
          param.value.config = {
            api_key: "",
            api_secret: "",
          };
          break;
        case "qiniu":
          param.value.config = {
            access_key: "",
            access_secret: "",
          };
          break;
        case "namecheap":
          param.value.config = {
            api_user: "",
            api_key: "",
          } as NamecheapAccessConfig;
          break;
        case "ns1":
          param.value.config = {
            api_key: "",
          } as NS1AccessConfig;
          break;
        case "cloudns":
          param.value.config = {
            auth_id: "",
            auth_password: "",
          } as CloudnsAccessConfig;
          break;
        case "aws":
          param.value.config = {
            access_key_id: "",
            secret_access_key: "",
            region: "",
          } as AwsAccessConfig;
          break;
        case "azure":
          param.value.config = {
            tenant_id: "",
            client_id: "",
            client_secret: "",
            environment: "",
          } as AzureAccessConfig;
          break;
        case "namesilo":
          param.value.config = {
            api_key: "",
          } as NamesiloAccessConfig;
          break;
        case "namedotcom":
          param.value.config = {
            username: "",
            api_token: "",
          } as NamedotcomAccessConfig;
          break;
        case "bunny":
          param.value.config = {
            api_key: "",
          } as BunnyAccessConfig;
          break;
        case "gcore":
          param.value.config = {
            api_token: "",
          } as GcoreAccessConfig;
          break;
        case "jdcloud":
          param.value.config = {
            access_key_id: "",
            secret_access_key: "",
          } as JdcloudAccessConfig;
          break;
        case "lecdn":
          param.value.config = {
            url: "",
            username: "",
            password: "",
            ignore_ssl: "0",
          } as LecdnAccessConfig;
          break;
        case "constellix":
          param.value.config = {
            api_key: "",
            secret_key: "",
          } as ConstellixAccessConfig;
          break;
        case "doge":
          param.value.config = {
            access_key: "",
            secret_key: "",
          } as DogeAccessConfig;
          break;
        case "webhook":
          param.value.config = {
            url: "",
            method: "POST",
            headers: "Content-Type: application/json",
            data: "",
            ignore_ssl: "0",
          } as WebhookAccessConfig;
          break;
        case "acmedns":
          param.value.config = {
            server_url: "https://auth.acme-dns.io",
            credentials: "",
          } as AcmeDnsAccessConfig;
          break;
        case "spaceship":
          param.value.config = {
            api_key: "",
            api_secret: "",
          } as SpaceshipAccessConfig;
					break;
				case "btdomain":
					param.value.config = {
						access_key: "",
						secret_key: "",
						account_id: "",
					} as BTDomainAccessConfig;
					break;
        case "plugin":
          param.value.config = {
            name: pluginList.value[0]?.value || "",
            mode: "default",
            config: {},
          } as PluginAccessConfig;
          break;
      }
    }
  );

  // 获取插件列表
  const loadPlugins = async (): Promise<void> => {
    try {
      const { data } = await getPlugins().fetch();
      if (data && Array.isArray(data)) {
        // 处理插件数据，将每个插件的 actions 展开为选项
        const pluginOptions: Array<PluginOption> = [];
        data.forEach(
          (plugin: {
            name: string;
            actions: { name: string; description: string }[];
            params?: string;
            config?: any;
          }) => {
            // 如果没有 actions，直接使用插件名称
            pluginOptions.push({
              label: plugin.name,
              value: plugin.name,
              description: plugin.actions
                .map((action: { description: string }) => action.description)
                .join("、"),
              pluginName: plugin.name,
              config: plugin.config,
            });
          }
        );
        pluginList.value = pluginOptions;
        pluginActionTips.value = renderPluginTips(
          pluginOptions[0]?.config || {}
        );
      }
    } catch (error) {
      console.error($t("t_1_1750210699272"), error);
    }
  };

  /**
   * 渲染单选标签
   * @param {Record<string, any>} option - 选项
   * @returns {VNode} 渲染后的VNode
   */
  const renderSingleSelectTag = ({ option }: Record<string, any>): VNode => {
    return (
      <NFlex class="w-full">
        {option.label ? (
          renderTypeLabel(option)
        ) : (
          <span class="text-[1.4rem] text-gray-400">
            {$t("t_0_1745833934390")}
          </span>
        )}
      </NFlex>
    );
  };

  /**
   * 类型选项接口
   */
  interface TypeOption {
    label: string;
    value: string;
    access: string[];
  }

  /**
   * 渲染类型选择器标签
   * @param {TypeOption} option - 类型选项
   * @returns {VNode} 渲染后的VNode
   */
  const renderTypeLabel = (option: TypeOption): VNode => {
    const accessTypeMap = {
      dns: $t("t_3_1745735765112"),
      host: $t("t_0_1746754500246"),
      plugin: "插件",
    };

    return (
      <NFlex align="center" size="small" class="w-full py-1">
        <SvgIcon icon={`resources-${option.value}`} size="1.6rem" />
        <NText class="flex-1">{option.label}</NText>
        {option.access && option.access.length > 0 && (
          <NFlex size="small" class="ml-auto">
            {option.access.map((type: string) => (
              <NTag
                key={type}
                type={type === "dns" ? "success" : "info"}
                size="small"
              >
                {accessTypeMap[type as keyof typeof accessTypeMap] || type}
              </NTag>
            ))}
          </NFlex>
        )}
      </NFlex>
    );
  };

  /**
   * 渲染插件标签
   * @param {Record<string, any>} option - 选项
   * @returns {VNode} 渲染后的VNode
   */
  const renderPluginLabel = (option: PluginOption): VNode => {
    return (
      <NFlex justify="space-between" class="w-[38rem]">
        <NFlex size="small" vertical={true} class="py-[8px]">
          <div class="flex items-center gap-2">
            <SvgIcon icon={`resources-${option.value}`} size="1.6rem" />
            <NText class="text-[var(--color-card-title)]">{option.label}</NText>
          </div>
          <div title={option.description}>
            {option.description && (
              <div class="text-[1.2rem] text-color5 mt-[0.2rem]">
                {option.description}
              </div>
            )}
          </div>
        </NFlex>
      </NFlex>
    );
  };

  /**
   * 渲染插件选中标签
   * @param props - 属性对象
   * @returns {VNode} 渲染后的VNode
   */
  const renderPluginTag = (props: { option: PluginOption }): VNode => {
    const { option } = props;
    return (
      <NFlex class="w-full">
        {option?.label ? (
          <NFlex align="center" size="small">
            <SvgIcon icon={`resources-${option.value}`} size="1.4rem" />
            <NText>{option.label}</NText>
          </NFlex>
        ) : (
          <span class="text-[1.4rem] text-gray-400">
            {$t("t_2_1750210698518")}
          </span>
        )}
      </NFlex>
    );
  };

  /**
   * 提交授权API表单
   * @param {UpdateAccessParams | AddAccessParams} param 请求参数
   * @param {Ref<FormInst>} formRef 表单实例
   */
  const submitApiManageForm = async (
    param: UpdateAccessParams | AddAccessParams
  ): Promise<void> => {
    try {
      let data: UpdateAccessParams<string> | AddAccessParams<string>;

      if (param.type === "plugin") {
        let finalConfig;
        
        if (typeof param.config.config === 'string') {
          finalConfig = {
            name: param.config.name,
            config: JSON.parse(param.config.config)
          };
        } else {
          finalConfig = {
            name: param.config.name,
            config: param.config.config
          };
        }
        
        data = {
          ...param,
          config: JSON.stringify(finalConfig),
        } as UpdateAccessParams<string>;
      } else {
        data = {
          ...param,
          config: JSON.stringify(param.config),
        } as UpdateAccessParams<string>;
      }
      
      if ("id" in data) {
        const { id, name, config } = data;
        await updateExistingAccess({
          id: id.toString(),
          name,
          config,
        } as UpdateAccessParams<string>);
      } else {
        await addNewAccess(data as AddAccessParams<string>);
      }
    } catch (error) {
      throw handleError(new Error($t("t_4_1746667590873")));
    }
  };

  /**
   * @description 渲染插件tips
   * @param {PluginOption} option - 插件选项
   * @returns {VNode} 渲染后的VNode
   */
  const renderPluginTips = (tips: Record<string, any>): string => {
    return $t("t_3_1750210706775") + JSON.stringify(tips || {});
  };

  // 使用表单hooks
  const { component: ApiManageForm, fetch, validate } = useForm({
    config,
    defaultValue: param,
    request: submitApiManageForm,
    rules: rules as any,
  });

  // 关联确认按钮
  confirm(async (close) => {
    try {
      // 先进行表单校验
      await validate();
      openLoad();
      await fetch();
      resetApiForm();
      close();
    } catch (error) {
      return handleError(error);
    } finally {
      closeLoad();
    }
  });

  // 组件初始化时获取插件列表
  onMounted(loadPlugins);

  return {
    ApiManageForm,
  };
};
