package apply

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert"
	"ALLinSSL/backend/public"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"github.com/go-acme/lego/v4/certcrypto"
	"github.com/go-acme/lego/v4/certificate"
	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/providers/dns/alidns"
	"github.com/go-acme/lego/v4/providers/dns/baiducloud"
	"github.com/go-acme/lego/v4/providers/dns/cloudflare"
	"github.com/go-acme/lego/v4/providers/dns/huaweicloud"
	"github.com/go-acme/lego/v4/providers/dns/tencentcloud"
	"github.com/go-acme/lego/v4/providers/dns/volcengine"
	"github.com/go-acme/lego/v4/providers/dns/westcn"
	"github.com/go-acme/lego/v4/registration"
	"strconv"
	"strings"
	"time"
)

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "_accounts"
	return s, nil
}

func GetDNSProvider(providerName string, creds map[string]string) (challenge.Provider, error) {
	switch providerName {
	case "tencentcloud":
		config := tencentcloud.NewDefaultConfig()
		config.SecretID = creds["secret_id"]
		config.SecretKey = creds["secret_key"]
		return tencentcloud.NewDNSProviderConfig(config)
	case "cloudflare":
		config := cloudflare.NewDefaultConfig()
		config.AuthEmail = creds["email"]
		config.AuthKey = creds["api_key"]
		return cloudflare.NewDNSProviderConfig(config)
	case "aliyun":
		config := alidns.NewDefaultConfig()
		config.APIKey = creds["access_key_id"]
		config.SecretKey = creds["access_key_secret"]
		return alidns.NewDNSProviderConfig(config)
	case "huaweicloud":
		config := huaweicloud.NewDefaultConfig()
		config.AccessKeyID = creds["access_key"]
		config.SecretAccessKey = creds["secret_key"]
		// 不传会报错
		config.Region = "cn-north-1"
		return huaweicloud.NewDNSProviderConfig(config)
	case "baidu":
		config := baiducloud.NewDefaultConfig()
		config.AccessKeyID = creds["access_key"]
		config.SecretAccessKey = creds["secret_key"]
		return baiducloud.NewDNSProviderConfig(config)
	case "westcn":
		config := westcn.NewDefaultConfig()
		config.Username = creds["username"]
		config.Password = creds["password"]
		return westcn.NewDNSProviderConfig(config)
	case "volcengine":
		config := volcengine.NewDefaultConfig()
		config.AccessKey = creds["access_key"]
		config.SecretKey = creds["secret_key"]
		return volcengine.NewDNSProviderConfig(config)

	// case "godaddy":
	// 	config := godaddy.NewDefaultConfig()
	// 	config.APIKey = creds["api_key"]
	// 	config.APISecret = creds["api_secret"]
	// 	return godaddy.NewDNSProviderConfig(config)

	default:
		return nil, fmt.Errorf("不支持的 DNS Provider: %s", providerName)
	}
}

func Apply(cfg map[string]any, logger *public.Logger) (map[string]any, error) {
	db, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	email, ok := cfg["email"].(string)
	if !ok {
		return nil, fmt.Errorf("参数错误：email")
	}
	domains, ok := cfg["domains"].(string)
	if !ok {
		return nil, fmt.Errorf("参数错误：domains")
	}
	providerStr, ok := cfg["provider"].(string)
	if !ok {
		return nil, fmt.Errorf("参数错误：provider")
	}
	var providerID string
	switch v := cfg["provider_id"].(type) {
	case float64:
		providerID = strconv.Itoa(int(v))
	case string:
		providerID = v
	default:
		return nil, fmt.Errorf("参数错误：provider_id")
	}
	var NameServers []string
	if cfg["name_server"] == nil {
		NameServers = []string{
			"8.8.8.8:53",
			"1.1.1.1:53",
		}
	} else {
		if nameServerStr, ok := cfg["name_server"].(string); ok {
			NameServers = strings.Split(nameServerStr, ",")
			for i := range NameServers {
				NameServers[i] = strings.TrimSpace(NameServers[i])
			}
		} else {
			return nil, fmt.Errorf("参数错误：name_server")
		}
	}

	var skipCheck bool
	if cfg["skip_check"] == nil {
		// 默认跳过预检查
		skipCheck = true
		// cf 默认不跳过预检查
		if providerStr == "cloudflare" {
			skipCheck = false
		}
	} else {
		switch v := cfg["skip_check"].(type) {
		case int:
			if v > 0 {
				skipCheck = true
			} else {
				skipCheck = false
			}
		case float64:
			if v > 0 {
				skipCheck = true
			} else {
				skipCheck = false
			}
		case string:
			if v == "true" || v == "1" {
				skipCheck = true
			} else {
				skipCheck = false
			}
		case bool:
			skipCheck = v
		default:
			return nil, fmt.Errorf("参数错误：skip_check")
		}
	}

	domainArr := strings.Split(domains, ",")
	for i := range domainArr {
		domainArr[i] = strings.TrimSpace(domainArr[i])
	}

	// 获取上次申请的证书
	runId, ok := cfg["_runId"].(string)
	if !ok {
		return nil, fmt.Errorf("参数错误：_runId")
	}
	if runId != "" {
		s, err := public.NewSqlite("data/data.db", "")
		if err != nil {
			return nil, err
		}
		s.TableName = "workflow_history"
		defer s.Close()
		// 查询 workflowId
		wh, err := s.Where("id=?", []interface{}{runId}).Select()
		if err != nil {
			return nil, err
		}
		if len(wh) > 0 {
			s.TableName = "cert"
			certs, err := s.Where("workflow_id=?", []interface{}{wh[0]["workflow_id"]}).Select()
			if err != nil {
				return nil, err
			}
			if len(certs) > 0 {
				layout := "2006-01-02 15:04:05"
				var maxDays float64
				var maxItem map[string]any
				for i := range certs {
					if !public.ContainsAllIgnoreBRepeats(strings.Split(certs[i]["domains"].(string), ","), domainArr) {
						continue
					}
					endTimeStr, ok := certs[i]["end_time"].(string)
					if !ok {
						continue
					}
					endTime, err := time.Parse(layout, endTimeStr)
					if err != nil {
						continue
					}
					diff := endTime.Sub(time.Now()).Hours() / 24
					if diff > maxDays {
						maxDays = diff
						maxItem = certs[i]
					}
				}
				certObj := maxItem
				// 判断证书是否过期
				cfgEnd, ok := cfg["end_day"].(int)
				if !ok || cfgEnd <= 0 {
					cfgEnd = 30
				}

				if int(maxDays) > cfgEnd {
					// 证书未过期，直接返回
					logger.Debug(fmt.Sprintf("上次证书申请成功,域名：%s，剩余天数：%d 大于%d天，已跳过申请复用此证书", certObj["domains"], int(maxDays), cfgEnd))
					return map[string]any{
						"cert":       certObj["cert"],
						"key":        certObj["key"],
						"issuerCert": certObj["issuer_cert"],
					}, nil
				}
			}
		}
	}
	logger.Debug("正在申请证书，域名: " + domains)

	user, err := LoadUserFromDB(db, email)
	if err != nil {
		logger.Debug("acme账号不存在，注册新账号")
		privateKey, _ := ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
		user = &MyUser{
			Email: email,
			key:   privateKey,
		}

		config := lego.NewConfig(user)
		config.Certificate.KeyType = certcrypto.EC384

		client, err := lego.NewClient(config)
		if err != nil {
			return nil, err
		}
		logger.Debug("正在注册账号：" + email)
		reg, err := client.Registration.Register(registration.RegisterOptions{TermsOfServiceAgreed: true})
		if err != nil {
			return nil, err
		}
		user.Registration = reg

		err = SaveUserToDB(db, user)
		if err != nil {
			return nil, err
		}
		logger.Debug("账号注册并保存成功")
	}

	// 初始化 ACME 客户端
	client, err := lego.NewClient(lego.NewConfig(user))
	if err != nil {
		return nil, err
	}
	// 获取 DNS 验证提供者
	providerData, err := access.GetAccess(providerID)
	if err != nil {
		return nil, err
	}
	providerConfigStr, ok := providerData["config"].(string)
	if !ok {
		return nil, fmt.Errorf("api配置错误")
	}
	// 解析 JSON 配置
	var providerConfig map[string]string
	err = json.Unmarshal([]byte(providerConfigStr), &providerConfig)
	if err != nil {
		return nil, err
	}

	// DNS 验证
	provider, err := GetDNSProvider(providerStr, providerConfig)
	if err != nil {
		return nil, fmt.Errorf("创建 DNS provider 失败: %v", err)
	}

	if skipCheck {
		// 跳过预检查
		err = client.Challenge.SetDNS01Provider(provider,
			dns01.WrapPreCheck(func(domain, fqdn, value string, check dns01.PreCheckFunc) (bool, error) {
				return true, nil
			}),
			dns01.AddRecursiveNameservers(NameServers),
		)
	} else {
		err = client.Challenge.SetDNS01Provider(provider,
			dns01.AddRecursiveNameservers(NameServers),
		)
	}
	if err != nil {
		return nil, err
	}

	// fmt.Println(strings.Split(domains, ","))
	request := certificate.ObtainRequest{
		Domains: domainArr,
		Bundle:  true,
	}
	certObj, err := client.Certificate.Obtain(request)
	if err != nil {
		return nil, err
	}

	certStr := string(certObj.Certificate)
	keyStr := string(certObj.PrivateKey)
	issuerCertStr := string(certObj.IssuerCertificate)

	// 保存证书和私钥
	data := map[string]any{
		"cert":       certStr,
		"key":        keyStr,
		"issuerCert": issuerCertStr,
	}

	_, err = cert.SaveCert("workflow", keyStr, certStr, issuerCertStr, runId)
	if err != nil {
		return nil, err
	}
	return data, nil
}
