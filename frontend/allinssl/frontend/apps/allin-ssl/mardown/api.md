分别生成以下相关的类型文件，在 types/ 目录下，以及 api 文件，在 api/目录下

文件名称如下：
home
autoDeploy
certManage
certApply
authAPIManage
monitor
settings

1、types文件命名方式：{视图名称}.d.ts

2、api文件命名方式：{视图名称}.ts

3、api文件结构如下：

```typescript
import { useApi } from './index'
import type { loginParams, loginResponse } from '@/types/public'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录
 */
export const loginCloudControl = (params?: loginParams) => useApi<loginResponse, loginParams>('/v1/user/login', params)
```
