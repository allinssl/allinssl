#### 安全页面全局状态

v1/user/security/get_security_status

```json
/**接口响应**/
{
  "data": {
    "global_transfer_lock": 0,   // 全局转移锁开关
    "has_security_questions": 1, // 密保问题状态
    "operation_protection": false,  //敏感操作限制开关
    "phone": "18316397383",
    "phone_verified": 0,
    "questions":"您母亲的姓名是什么？"
  },
  "msg": "操作成功",
  "status": true
}
```

#### 发送手机验证码

v1/user/security/send_phone_code

```json
/**接口参数**/

{
  "phone": "18316397383"  // 手机号码，必填，11位数字
}

/**接口响应**/

{
  "data": {
    "code": 839264,
    "message": "验证码发送成功"
  },
  "msg": "操作成功",
  "status": true
}
```

#### 验证手机号

v1/user/security/verify_phone

```json
/**接口参数**/
{
  "phone": "18316397383",  // 手机号码，必填，需与发送验证码时一致
  "code": "510770"         // 验证码，必填，6位数字
}
/**接口响应**/
//成功
{
  "data": {
    "message": "手机号验证成功",
    "phone": "18316397383",
    "temp_expires_in": 300,
    "temp_verified": true
  },
  "msg": "操作成功",
  "status": true
}

//错误
{
  "code": 3001,
  "data": null,
  "msg": "验证码错误",
  "status": false
}

```

#### 获取密保问题列表

v1/user/security/get_security_questions_list

```json
/**接口响应**/
{
  "data": {
    "questions": { // 后端会动态调整（非固定项）
      "1": "您的第一个宠物的名字是什么?",
      "2": "您母亲的姓名是什么?",
      "3": "您的出生地是哪里?",
      "4": "您最喜欢的电影是什么?",
      "5": "您小学班主任的姓名是什么?"
    }
  },
  "msg": "操作成功",
  "status": true
}
```

#### 设置密保问题

v1/user/security/setup_security_questions

```json
/**接口参数**/
{
  "questions": [                    // 密保问题数组
    {
      "question_id": 1,             // 问题ID：1-您的第一个宠物的名字，2-您母亲的姓名，3-您的出生地，4-您最喜欢的电影，5-您小学班主任的姓名
      "answer": "北京",              // 答案会自动去空格并转小写后加盐哈希存储
      "confirm_answer":"北京"
    }
  ]
}
/**接口响应**/
{
  "data": {
    "is_reset": true,
    "message": "设置密保问题成功",
    "question_count": 1
  },
  "msg": "操作成功",
  "status": true
}

```

#### 更新安全设置

v1/user/security/update_protection_settings

```json
/**接口参数**/
{
  "domain_transfer_protection": true,     // 域名转移保护开关，可选，布尔值
  "dns_modify_protection": false,         // DNS修改保护开关，可选，布尔值
  "operation_protection": true,           // 敏感域名操作保护开关，可选，布尔值
  "global_transfer_lock": false           // 全局转移锁开关，可选，布尔值。开启后所有域名转移/转出操作被锁定，开启所有域名的转移锁
}
/**接口响应**/
{
  "data": {
    "message": "保护设置更新成功"
  },
  "msg": "操作成功",
  "status": true
}

```

#### 获取验证用的密保问题

v1/user/security/get_security_questions_for_verification

```json
/**接口响应**/
{
  "data": {
    "questions": [
      {
        "question_id": 1,
        "question_text": "您的第一个宠物的名字是什么?"
      }
    ]
  },
  "msg": "操作成功",
  "status": true
}
```

#### 验证密保问题答案

v1/user/security/verify_security_questions

```json
/**接口参数**/
{
  "operation_type": "operation_protection",  // 操作类型，必填。operation_protection 操作保护
  "answers": [                          // 密保问题答案数组，至少3个答案
    {
      "question_id": 1,                 // 问题ID，需与获取的问题ID一致
      "answer": "北京"                  // 答案，大小写不敏感，会自动去空格
    }
  ]
}
/**接口响应**/
{
  "code": 0,
  "data": {
    "expires_in": 30,
    "message": "验证成功",
    "operation_type": "operation_protection",
    "security_token": "sec_GW7n_HIfylr8w1Yxtnb5E_n2n4ifcFOq-wM2ZGWQJgo" //安全的token，添加到所需接口
  },
  "msg": "验证成功",
  "status": false
}
```
