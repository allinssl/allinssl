# 数据处理工具函数文档

这个模块提供了一系列用于数据处理的实用工具函数。该模块使用 Ramda.js 进行函数式编程，并提供了完整的 TypeScript 类型支持。

## 目录

1. [数据转换](#数据转换)
2. [数据校验](#数据校验)
3. [数据过滤与重组](#数据过滤与重组)
4. [数据映射](#数据映射)

## 数据转换

### 对象值转字符串

```typescript
objectToString(obj: Record<string, any>): Record<string, string>
```

将对象的所有值转换为字符串。使用 Ramda.js 的 `map` 函数进行转换。

示例：

```typescript
objectToString({ age: 25, score: 98.5 }) // 返回: { age: "25", score: "98.5" }
```

### 数组转对象

```typescript
arrayToObject<T extends Record<string, any>>(key: string, array: T[]): Record<string, T>
```

将数组转换为对象，使用指定的 key 作为新对象的键。提供柯里化支持。

示例：

```typescript
const users = [
	{ id: '1', name: 'Alice' },
	{ id: '2', name: 'Bob' },
]
arrayToObject('id', users) // 返回: { '1': { id: '1', name: 'Alice' }, '2': { id: '2', name: 'Bob' } }
```

### 对象深度扁平化

```typescript
flattenObject<T extends Record<string, any>>(obj: T): Record<string, any>
```

将嵌套的对象结构扁平化，使用点号连接键名。

示例：

```typescript
const nested = {
	user: {
		info: {
			name: 'Alice',
			age: 25,
		},
	},
}
flattenObject(nested) // 返回: { 'user.info.name': 'Alice', 'user.info.age': 25 }
```

## 数据校验

### 正则匹配验证

```typescript
matchesPattern<T extends RegExp>(pattern: T, str: string): boolean
```

验证字符串是否符合指定的正则表达式模式。提供柯里化支持。

示例：

```typescript
const isEmail = matchesPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
isEmail('test@example.com') // 返回: true
```

### 必需键验证

```typescript
hasRequiredKeys<T extends Record<string, any>>(requiredKeys: string[], obj: T): boolean
```

验证对象是否包含所有指定的必需键。提供柯里化支持。

示例：

```typescript
const requiredFields = ['name', 'email']
hasRequiredKeys(requiredFields, { name: 'Alice', email: 'alice@example.com' }) // 返回: true
```

### 数值范围验证

```typescript
isInRange<T extends number>(min: T, max: T, value: T): boolean
```

验证数值是否在指定的范围内。提供柯里化支持。

示例：

```typescript
const isValidAge = isInRange(0, 120)
isValidAge(25) // 返回: true
```

## 数据过滤与重组

### 对象属性过滤

```typescript
filterObject<T extends Record<string, any>>(predicate: (value: any) => boolean, obj: T): Record<string, any>
```

根据条件函数过滤对象的属性。提供柯里化支持。

示例：

```typescript
const removeEmpty = filterObject((value) => value !== '')
removeEmpty({ name: 'Alice', title: '', age: 25 }) // 返回: { name: 'Alice', age: 25 }
```

### 数组分组

```typescript
groupByKey<T extends Record<string, any>>(key: string, array: T[]): Record<string, T[]>
```

按照指定的键对数组进行分组。提供柯里化支持。

示例：

```typescript
const users = [
	{ role: 'admin', name: 'Alice' },
	{ role: 'user', name: 'Bob' },
	{ role: 'admin', name: 'Charlie' },
]
groupByKey('role', users)
// 返回: {
//   admin: [{ role: 'admin', name: 'Alice' }, { role: 'admin', name: 'Charlie' }],
//   user: [{ role: 'user', name: 'Bob' }]
// }
```

### 深层属性提取

```typescript
pluckDeep<T extends Record<string, any>>(path: string[], list: T[]): T[]
```

从对象数组中提取指定路径的值。提供柯里化支持。

示例：

```typescript
const users = [{ info: { name: 'Alice', age: 25 } }, { info: { name: 'Bob', age: 30 } }]
pluckDeep(['info', 'name'], users) // 返回: ['Alice', 'Bob']
```

### 数组扁平化去重

```typescript
flattenAndUniq<T>(array: T[]): T[]
```

对嵌套数组进行扁平化处理并去除重复元素。

示例：

```typescript
flattenAndUniq([
	[1, 2],
	[2, 3],
	[3, 4],
]) // 返回: [1, 2, 3, 4]
```

## 数据映射

### 对象映射

```typescript
mapData(
  mapper: [string, string][] | Record<string, string>,
  data: Record<string, unknown> | Record<string, unknown>[],
  options: MapperOption = { deep: true }
): Record<string, unknown> | Record<string, unknown>[]
```

根据映射表将对象或数组映射为新的数据结构。

参数：

- `mapper`: 映射表，可以是键值对数组或对象
- `data`: 要映射的数据，可以是对象或对象数组
- `options`: 映射选项
  - `inherit`: 要继承的字段数组
  - `deep`: 是否深度映射（默认 true）
  - `ignore`: 要忽略的字段数组

特点：

- 支持深度映射
- 支持字段继承和忽略
- 支持嵌套路径映射
- 自动处理数组数据

示例：

```typescript
const mapper = {
	'user.name': 'userName',
	'user.age': 'userAge',
}
const data = {
	user: {
		name: 'Alice',
		age: 25,
	},
}
mapData(mapper, data) // 返回: { userName: 'Alice', userAge: 25 }

// 使用继承选项
mapData(mapper, data, { inherit: ['user.name'] })
// 返回: { userName: 'Alice' }

// 使用忽略选项，或者在映射表中直接忽略，如果未启用
mapData(mapper, data, { ignore: ['user.age'] })
// 返回: { userName: 'Alice' }
```

### 生成映射表

```typescript
generateMapper(obj: Record<string, unknown>): [string, unknown][]
```

将对象的所有字段转换为小驼峰格式的映射表。

示例：

```typescript
const obj = {
	user_name: 'name',
	user_age: 'age',
}
generateMapper(obj) // 返回: [['userName', 'name'], ['userAge', 'age']]
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 所有函数都提供柯里化支持
4. 支持深层数据结构处理
5. 提供丰富的数据验证方法

## 注意事项

1. 所有函数都是纯函数，不会修改原始数据
2. 对象扁平化会处理所有层级的嵌套
3. 数组转对象时要确保指定的 key 在数组对象中存在
4. 数据映射的 inherit 和 ignore 选项不能同时使用
5. 映射表中的路径必须存在于源数据中
