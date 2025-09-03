import type {
  FormRules,
  FormProps,
  FormItemProps,
  GridProps,
  InputProps,
  InputNumberProps,
  SelectProps,
  RadioGroupProps,
  RadioProps,
  RadioButtonProps,
  CheckboxGroupProps,
  SwitchProps,
  DatePickerProps,
  TimePickerProps,
  ColorPickerProps,
  SliderProps,
  RateProps,
  TransferProps,
  MentionProps,
  DynamicInputProps,
  AutoCompleteProps,
  CascaderProps,
  TreeSelectProps,
  UploadProps,
  InputGroupProps,
  FormInst,
  FormProps,
  GridItemProps,
} from "naive-ui";
import type { Ref, ShallowRef, ComputedRef, ToRefs } from "vue";

/** 选项接口 */
export interface RadioOptionItem extends Partial<RadioProps> {
  label: string;
  value: string | number;
}

/** 复选框选项接口 */
export interface CheckboxOptionItem extends Partial<CheckboxProps> {
  label: string;
  value: string | number;
}

/** 表单元素类型定义 */
export type FormElementType =
  | "input" // 输入框
  | "inputNumber" // 数字输入框
  | "inputGroup" // 输入框组
  | "select" // 选择器
  | "radio" // 单选框
  | "radioButton" // 单选按钮
  | "checkbox" // 复选框
  | "switch" // 开关
  | "datepicker" // 日期选择器
  | "timepicker" // 时间选择器
  | "colorPicker" // 颜色选择器
  | "slider" // 滑块
  | "rate" // 评分
  | "transfer" // 穿梭框
  | "mention" // 提及
  | "dynamicInput" // 动态输入
  | "dynamicTags" // 动态标签
  | "autoComplete" // 自动完成
  | "cascader" // 级联选择
  | "treeSelect" // 树选择
  | "upload" // 上传
  | "uploadDragger" // 拖拽上传
  | "formItem" // 表单项
  | "formItemGi" // 表单项 - Grid
  | "slot" // 插槽
  | "render"; // 自定义渲染

/** Props 类型映射 */
type FormElementPropsMap = {
  input: InputProps;
  inputNumber: InputNumberProps;
  inputGroup: InputGroupProps;
  select: SelectProps;
  radio: RadioProps & { options: RadioOptionItem[] };
  radioButton: RadioButtonProps & { options: RadioOptionItem[] };
  checkbox: CheckboxGroupProps & { options: CheckboxOptionItem[] };
  switch: SwitchProps;
  datepicker: DatePickerProps;
  timepicker: TimePickerProps;
  colorPicker: ColorPickerProps;
  slider: SliderProps;
  rate: RateProps;
  transfer: TransferProps;
  mention: MentionProps;
  dynamicInput: DynamicInputProps;
  dynamicTags: InputProps;
  autoComplete: AutoCompleteProps;
  cascader: CascaderProps;
  treeSelect: TreeSelectProps;
  upload: UploadProps;
  uploadDragger: UploadProps;
  formItem: FormItemProps;
  formItemGi: FormItemProps & GridProps;
};

/** 基础表单元素接口 */
export type BaseFormElement<T extends FormElementType = FormElementType> = {
  /** 元素类型 */
  type: T;
  /** 字段名称 */
  field: string;
} & (T extends keyof FormElementPropsMap
  ? FormElementPropsMap[T]
  : Record<string, any>);

/** 插槽表单元素接口 */
export interface SlotFormElement {
  type: "slot";
  /** 插槽名称 */
  slot: string;
}

/** 自定义渲染表单元素接口 */
export interface RenderFormElement {
  type: "custom";
  /** 自定义渲染函数 */
  render: (formData: any, formRef: any) => any;
}

/** 表单元素联合类型 */
export type FormElement = BaseFormElement | SlotFormElement | RenderFormElement;

/** 栅格项配置接口 */
export interface GridItemConfig extends Partial<GridProps> {
  type: "grid";
  /** 栅格子元素 */
  children: FormItemGiConfig[];
}

/** 表单项 - Grid 配置接口 */
export interface FormItemGiConfig
  extends Partial<FormItemProps & GridItemProps> {
  type: "formItemGi";
  /** 栅格子元素 */
  children: FormElement[];
}

/** 表单项配置接口 */
export interface FormItemConfig extends Partial<FormItemProps> {
  type: "formItem";
  /** 子元素配置 */
  children: FormElement[];
}

/** 表单项 - 自定义渲染配置接口 */
// export interface FormItemCustomConfig extends Partial<FormItemProps> {
// 	type: 'custom'
// 	/** 自定义渲染函数 */
// 	render: (formData: Ref<any>, formRef: Ref<FormInst | null>) => any
// }

/** 表单配置类型 */
export type FormBaseConfig = (
  | FormItemConfi
  | GridItemConfig
  | FormItemCustomConfig
)[]; /** 表单配置类型-动态表单 */
export type FormConfig =
  | Ref<FormBaseConfig>
  | ComputedRef<FormBaseConfig>
  | FormBaseConfig;

/** 表单 Hook 配置项接口 */
export interface UseFormOptions<T, Z = any> {
  /** 表单配置 */
  config: FormConfig;
  /** 表单提交请求函数 */
  request?: (data: T, formRef: Ref<FormInst>) => Promise<Z>;
  /** 默认表单数据 */
  defaultValue?: T | Ref<T>;
  /** 表单验证规则 */
  rules?: FormRules;
}

/**
 * 扩展表单实例接口
 * 在基础表单实例的基础上添加表单渲染组件方法
 */
export interface FormInstanceWithComponent<T> {
  component: (
    attrs: FormProps & ComponentProps,
    context: unknown
  ) => JSX.Element; // 表单渲染组件
  example: Ref<FormInst | null>; // 表单实例引用
  data: Ref<T>; // 表单数据引用
  loading: Ref<boolean>; // 加载状态
  config: Ref<FormConfig>; // 表单配置引用
  props: Ref<FormProps>; // 表单属性引用
  rules: ShallowRef<FormRules>; // 表单验证规则引用
  dataToRef: () => ToRefs<T>; // 响应式数据转ref
  validate: () => Promise<boolean>; // 验证方法
  fetch: () => Promise<T>; // 提交方法
  reset: () => void; // 重置方法
}
