# useForm 使用文档

## 基本介绍

`useForm` 是一个基于 Naive UI 的表单构建工具，它提供了一种声明式的方式来创建和管理复杂的表单。通过这个钩子函数，你可以轻松地构建表单、管理表单状态、处理验证和提交等操作。

## 核心函数

### useForm

```typescript
function useForm<T>(options: UseFormOptions<T>): FormInstanceWithComponent<T>
```

**参数**:

- `options`: 表单配置选项
  - `config`: 表单配置，定义表单的结构和布局
  - `request`: 可选，表单提交时调用的请求函数
  - `defaultValue`: 可选，表单的默认值

**返回值**:

- `component`: 表单渲染组件
- `example`: 当前组件实例 (FormInst)
- `data`: 响应式表单数据
- `loading`: 加载状态
- `config`: 表单配置
- `props`: 表单属性
- `rules`: 验证规则
- `fetch`: 提交方法
- `reset`: 重置方法
- `validate`: 验证方法

**示例**:

```typescript
const form = useForm({
  config: [...], // 表单配置
  request: async (data) => {
    // 处理表单提交
    return await api.submit(data)
  },
  defaultValue: { name: '', age: 0 }
})
```

## 表单项构建函数

### useFormInput

创建一个文本输入框表单项。

```typescript
function useFormInput(
	label: string,
	key: string,
	other?: InputProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，输入框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormTextarea

创建一个多行文本输入框表单项。

```typescript
function useFormTextarea(
	label: string,
	key: string,
	other?: InputProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemCustomConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，文本域组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 自定义表单项配置对象

### useFormPassword

创建一个密码输入框表单项。

```typescript
function useFormPassword(
	label: string,
	key: string,
	other?: InputProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemCustomConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，密码输入框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 自定义表单项配置对象

### useFormInputNumber

创建一个数字输入框表单项。

```typescript
function useFormInputNumber(
	label: string,
	key: string,
	other?: InputNumberProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，数字输入框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormSelect

创建一个下拉选择框表单项。

```typescript
function useFormSelect(
	label: string,
	key: string,
	options: SelectOption[],
	other?: SelectProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `options`: 选择项数组
- `other`: 可选，选择框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormRadio

创建一个单选框组表单项。

```typescript
function useFormRadio(
	label: string,
	key: string,
	options: RadioOptionItem[],
	other?: RadioProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `options`: 单选项数组
- `other`: 可选，单选框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormCheckbox

创建一个复选框组表单项。

```typescript
function useFormCheckbox(
	label: string,
	key: string,
	options: CheckboxOptionItem[],
	other?: CheckboxProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `options`: 复选项数组
- `other`: 可选，复选框组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormSwitch

创建一个开关表单项。

```typescript
function useFormSwitch(
	label: string,
	key: string,
	other?: SwitchProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，开关组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormDatepicker

创建一个日期选择器表单项。

```typescript
function useFormDatepicker(
	label: string,
	key: string,
	other?: DatePickerProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，日期选择器组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormTimepicker

创建一个时间选择器表单项。

```typescript
function useFormTimepicker(
	label: string,
	key: string,
	other?: TimePickerProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，时间选择器组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormSlider

创建一个滑块表单项。

```typescript
function useFormSlider(
	label: string,
	key: string,
	other?: SliderProps,
	itemAttrs?: FormItemConfig,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
): FormItemConfig
```

**参数**:

- `label`: 表单项标签
- `key`: 表单数据字段名
- `other`: 可选，滑块组件的额外属性
- `itemAttrs`: 可选，表单项的额外属性
- `slot`: 可选，前缀和后缀插槽

**返回值**: 表单项配置对象

### useFormSlot

创建一个插槽表单项。

```typescript
function useFormSlot(key?: string): SlotFormElement
```

**参数**:

- `key`: 可选，插槽名称，默认为 'default'

**返回值**: 插槽表单元素配置对象

### useFormCustom

创建一个自定义渲染的表单项。

```typescript
function useFormCustom<T extends Record<string, unknown>>(
	render: (formData: Ref<T>, formRef: Ref<FormInst | null>) => JSX.Element,
): FormItemCustomConfig
```

**参数**:

- `render`: 自定义渲染函数，接收表单数据和表单实例引用作为参数

**返回值**: 自定义表单项配置对象

### useFormGroup

创建一个表单项组。

```typescript
function useFormGroup<T>(group: Record<string, any>[]): FormItemCustomConfig
```

**参数**:

- `group`: 表单项组配置数组

**返回值**: 自定义表单项配置对象

### useFormMore

创建一个"更多配置"展开/折叠控件。

```typescript
function useFormMore(isMore: Ref<boolean>, content?: string): FormItemCustomConfig
```

**参数**:

- `isMore`: 是否展开的响应式引用
- `content`: 可选，显示的内容文本

**返回值**: 自定义表单项配置对象

### useFormHelp

创建一个帮助文档表单项。

```typescript
function useFormHelp(
	options: { content: string | JSX.Element; isHtml?: boolean }[],
	other?: { listStyle?: string },
): FormItemCustomConfig
```

**参数**:

- `options`: 帮助内容配置数组
  - `content`: 帮助内容文本或JSX元素
  - `isHtml`: 可选，内容是否为HTML
- `other`: 可选，其他配置
  - `listStyle`: 可选，列表样式

**返回值**: 自定义表单项配置对象

## 使用示例

```typescript
import useForm, { useFormHooks } from 'path/to/useForm'

// 解构所有表单钩子函数
const {
  useFormInput,
  useFormSelect,
  useFormRadio,
  // ...其他钩子函数
} = useFormHooks()

// 创建表单实例
const form = useForm({
  config: [
    useFormInput('用户名', 'username', { placeholder: '请输入用户名' }),
    useFormPassword('密码', 'password'),
    useFormSelect('角色', 'role', [
      { label: '管理员', value: 'admin' },
      { label: '用户', value: 'user' }
    ]),
    useFormRadio('性别', 'gender', [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' }
    ]),
    // 使用栅格布局
    {
      type: 'grid',
      cols: 2,
      children: [
        useFormInput('姓', 'firstName'),
        useFormInput('名', 'lastName')
      ]
    },
    // 使用自定义渲染
    useFormCustom((formData) => (
      <div>当前用户名: {formData.value.username}</div>
    ))
  ],
  request: async (data) => {
    // 提交表单数据
    return await api.submitForm(data)
  },
  defaultValue: {
    username: '',
    password: '',
    role: 'user',
    gender: 'male',
    firstName: '',
    lastName: ''
  }
})

// 在组件中使用
// <form.component />

// 提交表单
// await form.fetch()

// 重置表单
// form.reset()

// 验证表单
// const valid = await form.validate()
```

## 注意事项

1. 所有表单项都支持通过 `itemAttrs` 参数配置表单项的属性，如 `required`、`rule` 等。
2. 大多数表单项都支持通过 `slot` 参数配置前缀和后缀插槽。
3. 表单的验证规则可以通过 `form.rules.value = { ... }` 进行设置。
4. 表单的属性可以通过 `form.props.value = { ... }` 进行设置。
