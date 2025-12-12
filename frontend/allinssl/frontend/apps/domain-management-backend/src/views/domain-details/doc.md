新增申请转移接口
/api/v1/domain/transfer/inside_transfer

```json
//接口参数
{
"to_account": "13794888912", //目标账号
"domain_id":47, //域名id
"transfer_code":"12321321"  //转移码
}
```

新增取消转出接口
/api/v1/domain/transfer/inside_transfer_canel

```json{
{
  "domain_id":47  //域名id
}
```


隐私保护修改保护信息

/api/v1/domain/privacy/update_privacy

```json
//接口参数
{
    "domain_id": "47",       // 域名id
    "email":"www@qq.com"          //隐私保护后展示的邮箱 必填
}
```

删除隐私保护信息

/api/v1/domain/privacy/del_privacy

```json
{
    "domain_id": "47"       // 域名id
}
```
