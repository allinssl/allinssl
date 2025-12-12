# 日期处理工具函数文档

这个模块提供了一系列用于日期处理的实用工具函数。该模块使用 Ramda.js 进行函数式编程，并提供了完整的 TypeScript 类型支持。

## 目录

1. [日期格式化](#日期格式化)
2. [日期计算](#日期计算)
3. [日期判断](#日期判断)
4. [时间获取](#时间获取)

## 日期格式化

### 日期格式化

```typescript
formatDate(date: string | number | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string
```

将日期转换为指定格式的字符串。

参数：

- `date`: 日期字符串、时间戳或 Date 对象
- `format`: 格式化字符串，默认为 'YYYY-MM-DD HH:mm:ss'

支持的格式化占位符：

- YYYY: 年份
- MM: 月份（01-12）
- DD: 日期（01-31）
- HH: 小时（00-23）
- mm: 分钟（00-59）
- ss: 秒钟（00-59）

示例：

```typescript
formatDate(new Date(), 'YYYY-MM-DD') // 返回: '2024-02-27'
formatDate('2024-02-27 14:30:00', 'MM/DD HH:mm') // 返回: '02/27 14:30'
```

### 相对时间格式化

```typescript
formatRelativeTime(date: string | number | Date): string
```

将日期转换为相对时间描述。

返回格式：

- 1分钟内：'刚刚'
- 1小时内：'x分钟前'
- 24小时内：'x小时前'
- 30天内：'x天前'
- 超过30天：显示具体日期（YYYY-MM-DD）

示例：

```typescript
formatRelativeTime(new Date()) // 返回: '刚刚'
formatRelativeTime(Date.now() - 3600000) // 返回: '1小时前'
```

## 日期计算

### 天数差计算

```typescript
getDaysDiff(startDate: string | number | Date, endDate: string | number | Date): number
getDaysDiffCurried(startDate: string | number | Date)(endDate: string | number | Date): number
```

计算两个日期之间的天数差。提供普通版本和柯里化版本。

示例：

```typescript
getDaysDiff('2024-02-01', '2024-02-27') // 返回: 26
const diffFromToday = getDaysDiffCurried(new Date())
diffFromToday('2024-03-27') // 返回: 30
```

### 添加天数

```typescript
addDays(days: number, date: string | number | Date): Date
addDaysCurried(days: number)(date: string | number | Date): Date
```

在指定日期上添加或减少天数。提供普通版本和柯里化版本。

示例：

```typescript
addDays(7, new Date()) // 返回: 7天后的日期
addDays(-7, new Date()) // 返回: 7天前的日期
```

## 日期判断

### 日期范围判断

```typescript
isDateInRange(date: string | number | Date, startDate: string | number | Date, endDate: string | number | Date): boolean
isDateInRangeCurried(date: string | number | Date)(startDate: string | number | Date)(endDate: string | number | Date): boolean
```

判断日期是否在指定范围内。提供普通版本和柯里化版本。

示例：

```typescript
isDateInRange('2024-02-27', '2024-02-01', '2024-03-01') // 返回: true
const checkDateRange = isDateInRangeCurried('2024-02-27')
checkDateRange('2024-02-01')('2024-03-01') // 返回: true
```

## 时间获取

### 获取一天的开始时间

```typescript
getStartOfDay(date: string | number | Date): Date
```

获取指定日期的开始时间（00:00:00）。

示例：

```typescript
getStartOfDay('2024-02-27 15:30:00') // 返回: 2024-02-27 00:00:00
```

### 获取一天的结束时间

```typescript
getEndOfDay(date: string | number | Date): Date
```

获取指定日期的结束时间（23:59:59.999）。

示例：

```typescript
getEndOfDay('2024-02-27 15:30:00') // 返回: 2024-02-27 23:59:59.999
```

### 获取星期几

```typescript
getDayOfWeek(date: string | number | Date): string
```

获取指定日期是星期几。

示例：

```typescript
getDayOfWeek('2024-02-27') // 返回: '星期二'
```

### 获取到期时间

```typescript
getDaysUntilExpiration(date: string | number | Date, expirationDate?: string | number | Date): string
```

获取距离到期时间的天数。

参数：

- `date`: 目标日期
- `expirationDate`: 到期日期，默认为当前时间

示例：

```typescript
getDaysUntilExpiration('2024-03-27') // 返回: '30天'
getDaysUntilExpiration('2024-01-27') // 返回: '已过期'
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 提供多个函数的柯里化版本
4. 支持多种日期输入格式
5. 丰富的日期处理功能

## 注意事项

1. 所有接收日期的函数都支持字符串、时间戳和 Date 对象作为输入
2. 日期格式化函数会自动补零，确保输出格式统一
3. 天数差计算会忽略时分秒，只计算日期差
4. 范围判断包含起始和结束日期
5. 使用柯里化函数时注意参数顺序
