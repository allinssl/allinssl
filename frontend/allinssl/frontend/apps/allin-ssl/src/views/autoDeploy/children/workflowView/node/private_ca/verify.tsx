import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'

// 创建私有CA节点验证器
const validator = createNodeValidator('自签')

// 导出私有CA节点验证规则
export default {
  ca_id: validator.custom((rule, value) => {
    // 检查值是否存在
    if (!value || value === "" || value === undefined || value === null) {
      return new Error("请选择中间CA");
    }
    return true;
  }),

  key_length: validator.custom((rule, value) => {
    // 检查值是否存在且大于0
    if (!value || value === "" || value === undefined || value === null) {
      return new Error("请选择密钥长度");
    }
    // 如果是数字类型，检查是否大于0
    if (typeof value === "number" && value <= 0) {
      return new Error("请选择密钥长度");
    }
    return true;
  }),

  end_day: validator.custom((rule, value) => {
    // 检查值是否为数字类型且大于0
    if (typeof value !== "number" || isNaN(value) || value < 1) {
      return new Error($t("t_9_1747990229640"));
    }
    return true;
  }),

	valid_days: validator.custom((rule, value) => {
		if (value === undefined || value === null || value === "") {
			return new Error("请输入有效期");
		}
		const num = Number(value);
		if (!Number.isFinite(num) || num <= 0) {
			return new Error("请输入大于 0 的数字");
		}
		return true;
	}, 'input'),
  cn: validator.required("cn", "请输入通用名称", "input"),
} as FormRules;