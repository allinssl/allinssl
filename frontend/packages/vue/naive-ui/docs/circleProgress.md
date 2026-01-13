以下是 `CircleProgress` 组件的使用文档，说明如何在 JSX 文件中使用该组件。

---

# CircleProgress 组件使用文档

`CircleProgress` 是一个功能强大的环形/横向进度条组件，支持自定义大小、颜色、渐变色、动画等功能。

## 安装

确保组件已正确导入到项目中：

```tsx
import CircleProgress from './path/to/CircleProgress'
```

## 基本用法

### 环形进度条

```tsx
<CircleProgress percent={75} />
```

### 横向进度条

```tsx
<CircleProgress type="horizontal" percent={50} />
```

### 使用渐变色

```tsx
<CircleProgress
  percent={75}
  progressColor={[
    { offset: 0, color: '#ff0000' },
    { offset: 0.5, color: '#00ff00' },
    { offset: 1, color: '#0000ff' },
  ]}
/>
```

### 自定义样式

```tsx
<CircleProgress
  percent={90}
  size={200}
  strokeWidth={15}
  textColorFollowProgress={true}
/>
```

### 自定义进度文字

```tsx
<CircleProgress
  percent={65}
  progressText={({ percent, color }) => (
    <span style={{ color }}>{percent}% 完成</span>
  )}
/>
```

## 属性说明

| 属性名                  | 类型                          | 默认值          | 描述                                                                 |
|-------------------------|-------------------------------|-----------------|----------------------------------------------------------------------|
| `type`                 | `'circle' | 'horizontal'`    | `'circle'`     | 进度条类型，支持环形或横向进度条。                                   |
| `percent`              | `number`                     | `0`             | 当前进度值，范围为 0-100。                                           |
| `size`                 | `number`                     | `300`           | 环形进度条的直径（像素）。                                           |
| `strokeWidth`          | `number`                     | `10`            | 进度条的宽度（像素）。                                               |
| `trackColor`           | `string`                     | `'#e5f1fa'`     | 轨道颜色。                                                           |
| `progressColor`        | `string | ColorStop[]`       | `'#2ba0fb'`     | 进度条颜色，支持纯色或渐变色数组。                                   |
| `textColor`            | `string`                     | `'#333'`        | 进度文字颜色。                                                       |
| `textColorFollowProgress` | `boolean`                  | `false`         | 是否让文字颜色跟随进度条颜色变化。                                   |
| `startAngle`           | `number`                     | `-Math.PI / 2`  | 环形进度条的起始角度（弧度）。                                       |
| `clockwise`            | `boolean`                    | `true`          | 是否顺时针绘制进度条。                                               |
| `animationSpeed`       | `number`                     | `0.1`           | 动画过渡速度，范围为 0-1，值越大动画越快。                           |
| `width`                | `number`                     | `300`           | 横向进度条的宽度（像素，仅横向进度条生效）。                         |
| `height`               | `number`                     | `20`            | 横向进度条的高度（像素，仅横向进度条生效）。                         |
| `rounded`              | `boolean`                    | `true`          | 是否启用圆角。                                                       |
| `textPosition`         | `'front' | 'back' | 'follow'`| `'follow'`     | 横向进度条文字的位置。                                               |
| `progressText`         | `(props: SlotProps) => any`   | `undefined`     | 自定义进度文字的渲染函数。                                           |

## 示例

### 在 JSX 文件中完整示例

```tsx
import React from 'react'
import CircleProgress from './path/to/CircleProgress'

const App = () => {
  return (
    <div>
      <h1>环形进度条</h1>
      <CircleProgress percent={75} />

      <h1>横向进度条</h1>
      <CircleProgress type="horizontal" percent={50} />

      <h1>渐变色进度条</h1>
      <CircleProgress
        percent={75}
        progressColor={[
          { offset: 0, color: '#ff0000' },
          { offset: 0.5, color: '#00ff00' },
          { offset: 1, color: '#0000ff' },
        ]}
      />

      <h1>自定义文字</h1>
      <CircleProgress
        percent={65}
        progressText={({ percent, color }) => (
          <span style={{ color }}>{percent}% 完成</span>
        )}
      />
    </div>
  )
}

export default App
```

---

通过以上文档，您可以轻松在 JSX 文件中使用 `CircleProgress` 组件并根据需求进行自定义。