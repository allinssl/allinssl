# 随机数生成工具函数文档

这个模块提供了一系列用于生成随机数和随机字符串的工具函数。

## 目录

1. [随机数生成](#随机数生成)
2. [随机字符串生成](#随机字符串生成)

## 随机数生成

### 随机整数生成

```typescript
randomInt(min: number, max: number): number
```

生成指定范围内的随机整数。

参数：

- `min`: 最小值（包含）
- `max`: 最大值（包含）

示例：

```typescript
randomInt(1, 10) // 返回: 1-10 之间的随机整数
```

## 随机字符串生成

### 基础随机字符串

```typescript
randomChart(
  length: number = 32,
  options: {
    isSpecial?: boolean;
    isLower?: boolean;
    isUpper?: boolean;
    isNumber?: boolean;
  } = {}
): string
```

生成指定长度的随机字符串。

参数：

- `length`: 字符串长度（默认 32）
- `options`: 配置选项
  - `isSpecial`: 是否包含特殊字符（默认 false）
  - `isLower`: 是否包含小写字母（默认 true）
  - `isUpper`: 是否包含大写字母（默认 true）
  - `isNumber`: 是否包含数字（默认 true）

示例：

```typescript
// 生成默认随机字符串
randomChart() // 返回: 32位随机字符串

// 生成包含特殊字符的随机字符串
randomChart(16, { isSpecial: true })

// 仅生成数字和大写字母
randomChart(8, { isLower: false })
```

### 高级随机字符串

```typescript
randomChartWithMinLength(
  length: number = 32,
  options: {
    minUpper?: number;
    minLower?: number;
    minNumber?: number;
    minSpecial?: number;
  }
): string
```

生成满足最小字符数要求的随机字符串。

参数：

- `length`: 字符串总长度（默认 32）
- `options`: 最小字符数要求
  - `minUpper`: 大写字母最小个数（默认 1）
  - `minLower`: 小写字母最小个数（默认 1）
  - `minNumber`: 数字最小个数（默认 1）
  - `minSpecial`: 特殊字符最小个数（默认 0）

特点：

- 确保生成的字符串满足各类字符的最小数量要求
- 自动打乱字符顺序
- 支持特殊字符

示例：

```typescript
// 生成包含至少2个大写字母、2个小写字母、2个数字的16位随机字符串
randomChartWithMinLength(16, {
	minUpper: 2,
	minLower: 2,
	minNumber: 2,
})

// 生成包含特殊字符的安全密码
randomChartWithMinLength(12, {
	minUpper: 1,
	minLower: 1,
	minNumber: 1,
	minSpecial: 1,
})
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 支持灵活的字符组合配置
3. 提供基础和高级两种随机字符串生成方式
4. 支持最小字符数量要求
5. 自动字符顺序打乱

## 注意事项

1. 随机数范围包含最小值和最大值
2. 字符串生成会自动过滤掉易混淆的字符（0oO1Ii）
3. 最小字符数要求总和不能超过总长度
4. 特殊字符集合为 !@#$%^&\*?
5. 建议在需要安全性的场景使用 randomChartWithMinLength
