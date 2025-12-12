# 类型检查工具函数文档

这个模块提供了一系列用于数据类型检查的实用工具函数。该模块使用 Ramda.js 进行函数式编程，并提供了完整的 TypeScript 类型支持。

## 目录

1. [基础类型检查](#基础类型检查)
2. [复杂类型检查](#复杂类型检查)
3. [特殊类型检查](#特殊类型检查)
4. [类型获取](#类型获取)

## 基础类型检查

### 数字类型检查

```typescript
isNumber(value: unknown): value is number
```

检查值是否为数字类型。

示例：

```typescript
isNumber(123) // 返回: true
isNumber('123') // 返回: false
```

### 字符串类型检查

```typescript
isString(value: unknown): value is string
```

检查值是否为字符串类型。

示例：

```typescript
isString('hello') // 返回: true
isString(123) // 返回: false
```

### 布尔类型检查

```typescript
isBoolean(value: unknown): value is boolean
```

检查值是否为布尔类型。

示例：

```typescript
isBoolean(true) // 返回: true
isBoolean('true') // 返回: false
```

## 复杂类型检查

### 对象类型检查

```typescript
isObject(value: unknown): value is object
```

检查值是否为对象类型（不包括数组）。

示例：

```typescript
isObject({}) // 返回: true
isObject([]) // 返回: false
```

### 数组类型检查

```typescript
isArray(value: unknown): value is any[]
```

检查值是否为数组类型。

示例：

```typescript
isArray([1, 2, 3]) // 返回: true
isArray({ length: 3 }) // 返回: false
```

### 函数类型检查

```typescript
isFunction(value: unknown): value is Function
```

检查值是否为函数类型。

示例：

```typescript
isFunction(() => {}) // 返回: true
isFunction({}) // 返回: false
```

## 特殊类型检查

### Promise 类型检查

```typescript
isPromise(value: unknown): value is Promise<unknown>
```

检查值是否为 Promise 类型。

示例：

```typescript
isPromise(Promise.resolve()) // 返回: true
isPromise({ then: () => {} }) // 返回: false
```

### 正则表达式检查

```typescript
isRegExp(value: unknown): value is RegExp
```

检查值是否为正则表达式。

示例：

```typescript
isRegExp(/test/) // 返回: true
isRegExp('test') // 返回: false
```

### 日期类型检查

```typescript
isDate(value: unknown): value is Date
```

检查值是否为日期类型。

示例：

```typescript
isDate(new Date()) // 返回: true
isDate('2024-02-27') // 返回: false
```

### null 检查

```typescript
isNull(value: unknown): value is null
```

检查值是否为 null（与 undefined 区分）。

示例：

```typescript
isNull(null) // 返回: true
isNull(undefined) // 返回: false
```

### undefined 检查

```typescript
isUndefined(value: unknown): value is undefined
```

检查值是否为 undefined。

示例：

```typescript
isUndefined(undefined) // 返回: true
isUndefined(null) // 返回: false
```

### 空值检查

```typescript
isEmpty(value: unknown): value is '' | any[] | object
```

检查值是否为空（'', [], {}），但不包括 null 和 undefined。

示例：

```typescript
isEmpty('') // 返回: true
isEmpty([]) // 返回: true
isEmpty({}) // 返回: true
isEmpty(null) // 返回: false
```

## 类型获取

### 获取类型

```typescript
getType(value: unknown): string
```

获取值的类型字符串。

示例：

```typescript
getType(123) // 返回: 'Number'
getType('hello') // 返回: 'String'
getType(null) // 返回: 'Null'
```

### 类型比较

```typescript
isType<T>(type: string, value: unknown): value is T
```

检查值是否为指定类型。

示例：

```typescript
isType('Number', 123) // 返回: true
isType('String', 123) // 返回: false
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 所有检查函数都提供类型守卫
4. 支持复杂类型和特殊类型检查
5. 提供类型获取和比较功能

## 注意事项

1. 对象检查不包括数组类型
2. null 和 undefined 检查是严格区分的
3. 空值检查不包括 null 和 undefined
4. 类型获取返回首字母大写的类型字符串
5. 所有函数都是类型安全的
