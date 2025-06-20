package apply

import (
	"ALLinSSL/backend/internal/access"
	"ALLinSSL/backend/internal/cert"
	"ALLinSSL/backend/internal/cert/apply/lego/jdcloud"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	azcorecloud "github.com/Azure/azure-sdk-for-go/sdk/azcore/cloud"
	"github.com/go-acme/lego/v4/certcrypto"
	"github.com/go-acme/lego/v4/certificate"
	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/log"
	"github.com/go-acme/lego/v4/providers/dns/alidns"
	"github.com/go-acme/lego/v4/providers/dns/azuredns"
	"github.com/go-acme/lego/v4/providers/dns/baiducloud"
	"github.com/go-acme/lego/v4/providers/dns/bunny"
	"github.com/go-acme/lego/v4/providers/dns/cloudflare"
	"github.com/go-acme/lego/v4/providers/dns/cloudns"
	"github.com/go-acme/lego/v4/providers/dns/gcore"
	"github.com/go-acme/lego/v4/providers/dns/godaddy"
	"github.com/go-acme/lego/v4/providers/dns/huaweicloud"
	"github.com/go-acme/lego/v4/providers/dns/namecheap"
	"github.com/go-acme/lego/v4/providers/dns/namedotcom"
	"github.com/go-acme/lego/v4/providers/dns/namesilo"
	"github.com/go-acme/lego/v4/providers/dns/ns1"
	"github.com/go-acme/lego/v4/providers/dns/route53"
	"github.com/go-acme/lego/v4/providers/dns/tencentcloud"
	"github.com/go-acme/lego/v4/providers/dns/volcengine"
	"github.com/go-acme/lego/v4/providers/dns/westcn"
	"github.com/go-acme/lego/v4/registration"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

var AlgorithmMap = map[string]certcrypto.KeyType{
	"RSA2048": certcrypto.RSA2048,
	"RSA3072": certcrypto.RSA3072,
	"RSA4096": certcrypto.RSA4096,
	"RSA8192": certcrypto.RSA8192,
	"EC256":   certcrypto.EC256,
	"EC384":   certcrypto.EC384,
}

var CADirURLMap = map[string]string{
	"Let's Encrypt": "https://acme-v02.api.letsencrypt.org/directory",
	"zerossl":       "https://acme.zerossl.com/v2/DV90",
	"google":        "https://dv.acme-v02.api.pki.goog/directory",
	"sslcom":        "https://acme.ssl.com/sslcom-dv-rsa",
	"sslcom-rsa":    "https://acme.ssl.com/sslcom-dv-rsa",
	"sslcom-ecc":    "https://acme.ssl.com/sslcom-dv-ecc",
	"buypass":       "https://api.buypass.com/acme/directory",
}

func GetSqlite() (*public.Sqlite, error) {
	s, err := public.NewSqlite("data/accounts.db", "")
	if err != nil {
		return nil, err
	}
	s.TableName = "accounts"
	return s, nil
}

func GetDNSProvider(providerName string, creds map[string]string, httpClient *http.Client, maxWait time.Duration) (challenge.Provider, error) {
	switch providerName {
	case "tencentcloud":
		config := tencentcloud.NewDefaultConfig()
		config.SecretID = creds["secret_id"]
		config.SecretKey = creds["secret_key"]
		config.PropagationTimeout = maxWait
		return tencentcloud.NewDNSProviderConfig(config)
	case "cloudflare":
		config := cloudflare.NewDefaultConfig()
		config.AuthEmail = creds["email"]
		config.AuthKey = creds["api_key"]
		config.PropagationTimeout = maxWait
		return cloudflare.NewDNSProviderConfig(config)
	case "aliyun":
		config := alidns.NewDefaultConfig()
		config.APIKey = creds["access_key_id"]
		config.SecretKey = creds["access_key_secret"]
		config.PropagationTimeout = maxWait
		return alidns.NewDNSProviderConfig(config)
	case "huaweicloud":
		config := huaweicloud.NewDefaultConfig()
		config.AccessKeyID = creds["access_key"]
		config.SecretAccessKey = creds["secret_key"]
		// 不传会报错
		config.Region = "cn-north-1"
		config.PropagationTimeout = maxWait
		return huaweicloud.NewDNSProviderConfig(config)
	case "baidu":
		config := baiducloud.NewDefaultConfig()
		config.AccessKeyID = creds["access_key"]
		config.SecretAccessKey = creds["secret_key"]
		config.PropagationTimeout = maxWait
		return baiducloud.NewDNSProviderConfig(config)
	case "westcn":
		config := westcn.NewDefaultConfig()
		config.Username = creds["username"]
		config.Password = creds["password"]
		config.PropagationTimeout = maxWait
		return westcn.NewDNSProviderConfig(config)
	case "volcengine":
		config := volcengine.NewDefaultConfig()
		config.AccessKey = creds["access_key"]
		config.SecretKey = creds["secret_key"]
		config.PropagationTimeout = maxWait
		return volcengine.NewDNSProviderConfig(config)
	case "godaddy":
		config := godaddy.NewDefaultConfig()
		config.APIKey = creds["api_key"]
		config.APISecret = creds["api_secret"]
		if httpClient != nil {
			config.HTTPClient = httpClient
		}
		config.PropagationTimeout = maxWait
		return godaddy.NewDNSProviderConfig(config)
	case "namecheap":
		config := namecheap.NewDefaultConfig()
		config.APIUser = creds["api_user"]
		config.APIKey = creds["api_key"]
		config.PropagationTimeout = maxWait
		return namecheap.NewDNSProviderConfig(config)
	case "ns1":
		config := ns1.NewDefaultConfig()
		config.APIKey = creds["api_key"]
		config.PropagationTimeout = maxWait
		return ns1.NewDNSProviderConfig(config)
	case "cloudns":
		config := cloudns.NewDefaultConfig()
		config.AuthID = creds["auth_id"]
		config.AuthPassword = creds["auth_password"]
		config.PropagationTimeout = maxWait
		return cloudns.NewDNSProviderConfig(config)
	case "aws":
		config := route53.NewDefaultConfig()
		config.AccessKeyID = creds["access_key_id"]
		config.SecretAccessKey = creds["secret_access_key"]
		config.PropagationTimeout = maxWait
		return route53.NewDNSProviderConfig(config)
	case "azure":
		config := azuredns.NewDefaultConfig()
		config.TenantID = creds["tenant_id"]
		config.ClientID = creds["client_id"]
		config.ClientSecret = creds["client_secret"]
		switch strings.ToLower(creds["environment"]) {
		case "", "default", "public", "azurecloud":
			config.Environment = azcorecloud.AzurePublic
		case "china", "chinacloud", "azurechina", "azurechinacloud":
			config.Environment = azcorecloud.AzureChina
		case "usgovernment", "government", "azureusgovernment", "azuregovernment":
			config.Environment = azcorecloud.AzureGovernment
		default:
			return nil, fmt.Errorf("不支持的 Azure 环境: %s", creds["environment"])
		}
		config.PropagationTimeout = maxWait
		return azuredns.NewDNSProviderConfig(config)
	case "namesilo":
		config := namesilo.NewDefaultConfig()
		config.APIKey = creds["api_key"]
		config.PropagationTimeout = maxWait
		return namesilo.NewDNSProviderConfig(config)
	case "namedotcom":
		config := namedotcom.NewDefaultConfig()
		config.Username = creds["username"]
		config.APIToken = creds["api_token"]
		config.PropagationTimeout = maxWait
		return namedotcom.NewDNSProviderConfig(config)
	case "bunny":
		config := bunny.NewDefaultConfig()
		config.APIKey = creds["api_key"]
		config.PropagationTimeout = maxWait
		return bunny.NewDNSProviderConfig(config)
	case "gcore":
		config := gcore.NewDefaultConfig()
		config.APIToken = creds["api_token"]
		config.PropagationTimeout = maxWait
		return gcore.NewDNSProviderConfig(config)
	case "jdcloud":
		config := jdcloud.NewDefaultConfig()
		config.AccessKeyID = creds["access_key_id"]
		config.AccessKeySecret = creds["secret_access_key"]
		config.RegionId = "cn-north-1"
		config.PropagationTimeout = maxWait
		return jdcloud.NewDNSProviderConfig(config)

	default:
		return nil, fmt.Errorf("不支持的 DNS Provider: %s", providerName)
	}
}

func GetZeroSSLEabFromEmail(email string, httpClient *http.Client) (map[string]any, error) {
	APIPath := "https://api.zerossl.com/acme/eab-credentials-email"
	data := map[string]any{
		"email": email,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", APIPath, strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if httpClient == nil {
		httpClient = &http.Client{}
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取ZeroSSL EAB信息失败，状态码：%d", resp.StatusCode)
	}
	var result map[string]any
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("解析ZeroSSL EAB信息失败：%v", err)
	}
	if result["eab_kid"] == nil || result["eab_hmac_key"] == nil {
		return nil, fmt.Errorf("ZeroSSL EAB信息不完整，缺少kid或hmacEncoded")
	}
	return map[string]any{
		"Kid":         result["eab_kid"],
		"HmacEncoded": result["eab_hmac_key"],
	}, nil
}

func getEABFromAccData(accData map[string]any, eabData *map[string]any) bool {
	if accData == nil {
		return false
	}
	kid := accData["Kid"]
	hmac := accData["HmacEncoded"]
	if kid != nil && hmac != nil {
		*eabData = map[string]any{
			"Kid":         kid,
			"HmacEncoded": hmac,
		}
		return true
	}
	return false
}

func GetAcmeClient(email, algorithm, eabId, ca string, httpClient *http.Client, logger *public.Logger) (*lego.Client, error) {
	var (
		eabData map[string]any
		err     error
	)
	switch eabId {
	case "":
		if ca == "" || ca == "letsencrypt" {
			ca = "Let's Encrypt"
		}
	case "let":
		ca = "Let's Encrypt"
	case "buy", "buypass":
		ca = "buypass"
	default:
		eabData, err = access.GetEAB(eabId)
		if err != nil {
			return nil, err
		}
		if eabData == nil {
			return nil, fmt.Errorf("未找到EAB信息")
		}
		if eabData["Kid"] == nil {
			return nil, fmt.Errorf("Kid不能为空")
		}
		if eabData["HmacEncoded"] == nil {
			return nil, fmt.Errorf("HmacEncoded不能为空")
		}
		ca = eabData["ca"].(string)
	}

	CADirURL := CADirURLMap[ca]
	if ca == "sslcom" {
		if algorithm == "EC256" || algorithm == "EC384" {
			CADirURL = CADirURLMap["sslcom-ecc"]
		} else {
			CADirURL = CADirURLMap["sslcom-rsa"]
		}
	}
	db, err := GetSqlite()
	var accData map[string]any
	if err != nil {
		logger.Debug("获取数据库连接失败", err)
		if ca != "Let's Encrypt" && ca != "zerossl" && ca != "buypass" {
			return nil, fmt.Errorf("当前CA【%s】 需要从数据库获取预设账号，但是连接数据库失败，请稍后重试，err:%w", ca, err)
		}
	} else {
		defer db.Close()
		accData, err = GetAccount(db, email, ca)
		if err != nil || accData == nil {
			logger.Debug("获取acme账号信息失败")
			if ca != "Let's Encrypt" && ca != "zerossl" && ca != "buypass" {
				return nil, fmt.Errorf("未找到%s账号信息，请先在账号管理中添加%s账号, email:%s", ca, ca, email)
			}
		}
		if CADirURL == "" {
			accCADirURL, ok := accData["CADirURL"].(string)
			if !ok || accCADirURL == "" {
				logger.Debug("未找到此CA的请求地址")
				return nil, fmt.Errorf("未找到CA【%s】请求地址，请先在账号管理中检查%s账号, email:%s", ca, ca, email)
			}
			CADirURL = accCADirURL
		}
	}
	user := GetAcmeUser(email, logger, accData)
	config := lego.NewConfig(user)
	config.Certificate.KeyType = AlgorithmMap[algorithm]
	config.CADirURL = CADirURL
	if httpClient != nil {
		config.HTTPClient = httpClient
	}
	client, err := lego.NewClient(config)
	if err != nil {
		return nil, err
	}
	if user.Registration == nil {
		logger.Debug("正在注册账号：" + email)
		if eabData == nil {
			// 走新的逻辑，eab已合并到账号中
			if !getEABFromAccData(accData, &eabData) {
				switch ca {
				case "zerossl":
					eabData, err = GetZeroSSLEabFromEmail(email, httpClient)
					if err != nil {
						return nil, fmt.Errorf("获取ZeroSSL EAB信息失败: %v", err)
					}
				case "sslcom", "google":
					return nil, fmt.Errorf("未找到EAB信息，请在账号管理中添加%s账号", ca)
				}
			}
		}
		var (
			reg              *registration.Resource
			Kid, HmacEncoded string
		)
		if eabData != nil {
			Kid = eabData["Kid"].(string)
			HmacEncoded = eabData["HmacEncoded"].(string)
		}
		if Kid != "" && HmacEncoded != "" {
			Kid := eabData["Kid"].(string)
			HmacEncoded := eabData["HmacEncoded"].(string)
			reg, err = client.Registration.RegisterWithExternalAccountBinding(registration.RegisterEABOptions{
				TermsOfServiceAgreed: true,
				Kid:                  Kid,
				HmacEncoded:          HmacEncoded,
			})
		} else {
			reg, err = client.Registration.Register(registration.RegisterOptions{TermsOfServiceAgreed: true})
		}
		if err != nil {
			return nil, err
		}
		user.Registration = reg

		err = SaveUserToDB(db, user, ca)
		if err != nil {
			logger.Debug("acme账号注册成功，但保存到数据库失败", err)
		}
		logger.Debug("acme账号注册并保存成功")
	}
	return client, nil
}

func GetCert(runId string, domainArr []string, endDay int, logger *public.Logger) (map[string]any, error) {
	if runId == "" {
		return nil, fmt.Errorf("参数错误：_runId")
	}
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
	if len(wh) <= 0 {
		return nil, fmt.Errorf("未获取到对应的workflowId")
	}
	s.TableName = "cert"
	certs, err := s.Where("workflow_id=?", []interface{}{wh[0]["workflow_id"]}).Select()
	if err != nil {
		return nil, err
	}
	if len(certs) <= 0 {
		return nil, fmt.Errorf("未获取到当前工作流下的证书")
	}
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
	if maxItem == nil {
		return nil, fmt.Errorf("未获取到对应的证书")
	}
	if int(maxDays) <= endDay {
		return nil, fmt.Errorf("证书已过期或即将过期，剩余天数：%d 小于%d天", int(maxDays), endDay)
	}
	// 证书未过期，直接返回
	logger.Debug(fmt.Sprintf("上次证书申请成功,域名：%s，剩余天数：%d 大于%d天，已跳过申请复用此证书", maxItem["domains"], int(maxDays), endDay))
	return map[string]any{
		"cert":       maxItem["cert"],
		"key":        maxItem["key"],
		"issuerCert": maxItem["issuer_cert"],
		"skip":       true,
	}, nil
}

func Apply(cfg map[string]any, logger *public.Logger) (map[string]any, error) {
	log.Logger = logger.GetLogger()
	var err error
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
	endDay := 30
	switch v := cfg["end_day"].(type) {
	case float64:
		endDay = int(v)
	case int:
		endDay = v
	case string:
		if v != "" {
			endDay, err = strconv.Atoi(v)
			if err != nil {
				return nil, fmt.Errorf("参数错误：end_day")
			}
		}
	case int64:
		endDay = int(v)
	}
	algorithm, ok := cfg["algorithm"].(string)
	if !ok {
		algorithm = "RSA2048"
	}
	var httpClient *http.Client
	proxy, ok := cfg["proxy"].(string)
	if ok && proxy != "" {
		// 构建代理 HTTP 客户端
		proxyURL, err := url.Parse(proxy) // 替换为你的代理地址
		if err != nil {
			return nil, fmt.Errorf("无效的代理地址: %v", err)
		}
		httpClient = &http.Client{
			Transport: &http.Transport{
				Proxy: http.ProxyURL(proxyURL),
			},
			Timeout: 30 * time.Second,
		}
	}
	var eabId string
	switch v := cfg["eabId"].(type) {
	case float64:
		eabId = strconv.Itoa(int(v))
	case string:
		eabId = v
	default:
		eabId = ""
	}
	ca, ok := cfg["ca"].(string)
	if !ok {
		ca = ""
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
		skipCheck = false
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
	var ignoreCheck bool
	if cfg["ignore_check"] == nil {
		// 默认不忽略预检查
		ignoreCheck = false
	} else {
		switch v := cfg["ignore_check"].(type) {
		case int:
			if v > 0 {
				ignoreCheck = true
			} else {
				ignoreCheck = false
			}
		case float64:
			if v > 0 {
				ignoreCheck = true
			} else {
				ignoreCheck = false
			}
		case string:
			if v == "true" || v == "1" {
				ignoreCheck = true
			} else {
				ignoreCheck = false
			}
		case bool:
			ignoreCheck = v
		default:
			return nil, fmt.Errorf("参数错误：ignore_check")
		}
	}
	var closeCname bool
	if cfg["close_cname"] == nil {
		// 默认开启CNAME跟随
		closeCname = false
	} else {
		switch v := cfg["close_cname"].(type) {
		case int:
			if v > 0 {
				closeCname = true
			} else {
				closeCname = false
			}
		case float64:
			if v > 0 {
				closeCname = true
			} else {
				closeCname = false
			}
		case string:
			if v == "true" || v == "1" {
				closeCname = true
			} else {
				closeCname = false
			}
		case bool:
			closeCname = v
		default:
			return nil, fmt.Errorf("参数错误：close_cname")
		}
	}
	var maxWait time.Duration
	if cfg["max_wait"] == nil {
		// 默认最大等待时间为2分钟
		maxWait = 2 * time.Minute
	} else {
		switch v := cfg["max_wait"].(type) {
		case int:
			maxWait = time.Duration(v) * time.Second
		case float64:
			maxWait = time.Duration(v) * time.Second
		case string:
			maxWait = 2 * time.Minute // 默认值
			if v != "" {
				d, err := strconv.Atoi(v)
				if err == nil {
					maxWait = time.Duration(d) * time.Second
				}
			}
		default:
			maxWait = 2 * time.Minute
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
	certData, err := GetCert(runId, domainArr, endDay, logger)
	if err != nil {
		logger.Debug("未获取到符合条件的本地证书:" + err.Error())
	} else {
		return certData, nil
	}
	logger.Debug("正在申请证书，域名: " + domains)
	os.Setenv("LEGO_DISABLE_CNAME_SUPPORT", strconv.FormatBool(closeCname))
	// 创建 ACME 客户端
	client, err := GetAcmeClient(email, algorithm, eabId, ca, httpClient, logger)
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
	provider, err := GetDNSProvider(providerStr, providerConfig, httpClient, maxWait)
	if err != nil {
		return nil, fmt.Errorf("创建 DNS provider 失败: %v", err)
	}

	if skipCheck {
		// 跳过预检查
		err = client.Challenge.SetDNS01Provider(provider,
			dns01.WrapPreCheck(func(domain, fqdn, value string, check dns01.PreCheckFunc) (bool, error) {
				return true, nil
			}),
		)
	} else {
		start := time.Now()
		if ignoreCheck {
			err = client.Challenge.SetDNS01Provider(provider,
				dns01.AddRecursiveNameservers(NameServers),
				dns01.WrapPreCheck(func(domain, fqdn, value string, check dns01.PreCheckFunc) (bool, error) {
					ok, err := check(fqdn, value)
					elapsed := time.Since(start)
					if err != nil {
						log.Printf("[WARN] DNS precheck error for %s: %v", fqdn, err)
						if elapsed >= maxWait {
							log.Printf("[WARN] Precheck error but forcing continue due to timeout for %s", fqdn)
							return true, nil
						}
						return false, nil
					}
					if ok {
						log.Printf("[OK] TXT record for %s is present.", fqdn)
						return true, nil
					}
					if elapsed >= maxWait {
						log.Printf("[WARN] TXT record for %s not found after %v, forcing continue.", fqdn, elapsed)
						return true, nil
					}
					log.Printf("[INFO] TXT record for %s not yet found, waiting... elapsed %v", fqdn, elapsed)
					return false, nil
				}),
			)
		} else {
			err = client.Challenge.SetDNS01Provider(provider,
				dns01.AddRecursiveNameservers(NameServers),
			)
		}
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
