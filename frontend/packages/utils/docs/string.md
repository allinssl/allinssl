# 字符串处理工具函数文档

这个模块提供了一系列用于字符串处理的实用工具函数。该模块使用 Ramda.js 进行函数式编程，并提供了完整的 TypeScript 类型支持。

## 目录

1. [URL 处理](#url-处理)
2. [HTML 转义](#html-转义)
3. [命名格式转换](#命名格式转换)

## URL 处理

### URL 参数转对象

```typescript
urlToObject(url: string): Record<string, string>
urlToObjectCurried(url: string): Record<string, string>
```

将 URL 字符串中的查询参数转换为对象。提供普通版本和柯里化版本。

示例：

```typescript
const url = 'https://example.com?name=Alice&age=25'
urlToObject(url) // 返回: { name: 'Alice', age: '25' }

const parseUrl = urlToObjectCurried('https://example.com?name=Alice&age=25')
parseUrl // 返回: { name: 'Alice', age: '25' }
```

## HTML 转义

### HTML 字符转义

```typescript
htmlEscape(str: string, isReverse: boolean = false): string
```

对 HTML 字符串进行转义或反转义。

参数：

- `str`: 要转义的字符串
- `isReverse`: 是否进行反转义（默认 false）

支持的转义字符：

- & -> &amp;
- < -> &lt;
- > -> &gt;
- " -> &quot;
- ' -> &apos;

示例：

```typescript
// 转义
htmlEscape('<div>Hello & World</div>')
// 返回: '&lt;div&gt;Hello &amp; World&lt;/div&gt;'

// 反转义
htmlEscape('&lt;div&gt;Hello &amp; World&lt;/div&gt;', true)
// 返回: '<div>Hello & World</div>'
```

## 命名格式转换

### 小驼峰转下划线

```typescript
camelToUnderline(str: string): string
```

将小驼峰命名转换为下划线命名。

示例：

```typescript
camelToUnderline('userName') // 返回: 'user_name'
```

### 下划线转小驼峰

```typescript
underlineToCamel(str: string): string
```

将下划线命名转换为小驼峰命名。

示例：

```typescript
underlineToCamel('user_name') // 返回: 'userName'
```

### 下划线转大驼峰

```typescript
underlineToBigCamel(str: string): string
```

将下划线命名转换为大驼峰命名。

示例：

```typescript
underlineToBigCamel('user_name') // 返回: 'UserName'
```

### 大驼峰转下划线

```typescript
bigCamelToUnderline(str: string): string
```

将大驼峰命名转换为下划线命名。

示例：

```typescript
bigCamelToUnderline('UserName') // 返回: 'user_name'
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 提供 URL 参数解析的柯里化版本
4. 支持 HTML 字符的双向转义
5. 提供完整的命名格式转换工具

## 注意事项

1. URL 解析使用标准的 URL API
2. HTML 转义支持最常用的五种字符
3. 命名格式转换保持原字符串的大小写特性
4. 柯里化函数便于函数组合
5. 所有函数都是纯函数，不会修改原始数据
