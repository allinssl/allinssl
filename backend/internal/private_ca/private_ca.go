package private_ca

import (
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

func CreateRootCA(name, commonName, organization, organizationalUnit, country, province, locality, keyType string, keyBits, validDays int64) error {
	var err error
	var data *CAConfig

	if keyType == "sm2" {
		// 国密SM2根证书 - 生成签名和加密双证书, 使用不同私钥
		data, err = GenerateRootCASM2(name, commonName, organization, organizationalUnit, country, province, locality, int(validDays))
	} else {
		// 标准根证书 - 生成单一证书
		data, err = GenerateRootCAStandard(name, commonName, organization, organizationalUnit, country, province, locality, KeyType(keyType), int(keyBits), int(validDays))
	}
	if err != nil {
		return err
	}

	// 保存到数据库
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()

	_, err = s.Insert(public.StructToMap(data, true))
	if err != nil {
		return err
	}
	return nil
}

func CreateIntermediateCA(name, commonName, organization, organizationalUnit, country, province, locality string, rootId, keyBits, validDays int64) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()

	issuers, err := s.Where("id=?", []interface{}{rootId}).Select()
	if err != nil {
		return err
	}
	if len(issuers) == 0 {
		return fmt.Errorf("issuer with id %d not found", rootId)
	}
	issuer := issuers[0]
	keyType := issuer["algorithm"].(string)
	cert := issuer["cert"].(string)
	key := issuer["key"].(string)

	var data *CAConfig

	if keyType == "sm2" {
		// 国密SM2中级证书 - 生成签名和加密双证书, 使用不同私钥
		enCert := issuer["en_cert"].(string)
		enKey := issuer["en_key"].(string)
		data, err = GenerateIntermediateCASM2(name, commonName, organization, organizationalUnit, country, province, locality, cert, key, enCert, enKey, int(validDays))
	} else {
		// 标准中级证书 - 生成单一证书
		data, err = GenerateIntermediateCAStandard(name, commonName, organization, organizationalUnit, country, province, locality, cert, key, keyType, int(keyBits), int(validDays))
	}
	if err != nil {
		return err
	}
	// 保存到数据库
	insertData := public.StructToMap(data, true)
	insertData["root_id"] = rootId

	_, err = s.Insert(insertData)
	if err != nil {
		return err
	}

	return nil
}

func DeleteCA(id int64) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	// 检查是否有子证书
	children, err := s.Where("root_id=?", []interface{}{id}).Select()
	if err != nil {
		return err
	}
	if len(children) > 0 {
		return fmt.Errorf("cannot delete CA with id %d: it has child CAs", id)
	}

	_, err = s.Where("id=?", []interface{}{id}).Delete()
	if err != nil {
		return err
	}
	return nil
}

func ListCAs(search, level string, p, limit int64) ([]map[string]interface{}, int, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, 0, err
	}
	defer s.Close()
	var data []map[string]any
	var count int64
	var limits []int64

	if p >= 0 && limit >= 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
	}
	whereStr := "1=1"
	var params []interface{}
	if search != "" {
		whereStr += " and (name like ? or cn like ?)"
		params = append(params, "%"+search+"%", "%"+search+"%")
	}
	if level == "root" {
		whereStr += " and root_id is null"
	}
	if level == "intermediate" {
		whereStr += " and root_id is not null"
	}

	data, err = s.Where(whereStr, params).Limit(limits).Order("create_time", "desc").Select()
	count, err = s.Where(whereStr, params).Limit(limits).Count()

	if err != nil {
		return data, int(count), err
	}
	return data, int(count), nil
}

func CreateLeafCert(caId, usage, keyBits, validDays int64, cn, san string) (*LeafCertConfig, error) {
	if caId <= 0 {
		return nil, fmt.Errorf("CA ID不能为空")
	}
	if usage < UsageServer || usage > UsageServer|UsageClient|UsageEmail {
		return nil, fmt.Errorf("证书用途参数错误")
	}
	if san == "" {
		return nil, fmt.Errorf("备用名称不能为空")
	}
	var sans SAN
	err := json.Unmarshal([]byte(san), &sans)
	if err != nil {
		return nil, fmt.Errorf("备用名称格式错误: %v", err)
	}
	if cn == "" {
		if len(sans.DNSNames) > 0 {
			cn = sans.DNSNames[0]
		} else if len(sans.IPAddresses) > 0 {
			cn = string(sans.IPAddresses[0])
		} else if len(sans.EmailAddresses) > 0 {
			cn = sans.EmailAddresses[0]
		} else {
			return nil, fmt.Errorf("CN和SAN不能为空")
		}
	}
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	issuers, err := s.Where("id=?", []interface{}{caId}).Select()
	if err != nil {
		return nil, err
	}
	if len(issuers) == 0 {
		return nil, fmt.Errorf("issuer with id %d not found", caId)
	}
	issuer := issuers[0]
	if issuer["root_id"] == "" || issuer["root_id"] == nil {
		return nil, fmt.Errorf("不允许使用根证书直接签发叶子证书，请先创建中间证书")
	}

	keyType := issuer["algorithm"].(string)
	cert := issuer["cert"].(string)
	key := issuer["key"].(string)
	var issuerObj *Certificate
	if keyType == "sm2" {
		enCert := issuer["en_cert"].(string)
		enKey := issuer["en_key"].(string)
		issuerObj, err = NewCertificateFromPEMSM2([]byte(cert), []byte(key), []byte(enCert), []byte(enKey))
	} else {
		issuerObj, err = NewCertificateFromPEMStandard([]byte(cert), []byte(key), KeyType(keyType))

	}
	leafObj, err := GenerateLeafCertificate(cn, sans, issuerObj, KeyType(keyType), int(usage), int(keyBits), int(validDays))
	if err != nil {
		return nil, err
	}
	s.TableName = "leaf"
	// 保存到数据库
	leafObj.SAN = san
	leafObj.CaId = caId
	insertData := public.StructToMap(leafObj, true)
	_, err = s.Insert(insertData)
	if err != nil {
		return nil, err
	}
	return leafObj, nil
}

func ListLeafCerts(caId int64, search string, p, limit int64) ([]map[string]interface{}, int, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, 0, err
	}
	defer s.Close()
	s.TableName = "leaf"
	var data []map[string]any
	var count int64
	var limits []int64

	sql := `
	select leaf.*, ca.name as ca_name, ca.cn as ca_cn 
	from leaf
	left join ca on leaf.ca_id = ca.id
	where 1=1
`
	// 拼接查询条件
	var params []interface{}
	if caId > 0 {
		sql += " and leaf.ca_id = ?"
		params = append(params, caId)
	}
	if search != "" {
		sql += " and (leaf.cn like ? or leaf.san like ?)"
		params = append(params, "%"+search+"%", "%"+search+"%")
	}
	sql += " order by leaf.create_time desc"
	sqlCount := "select count(id) as count from (" + sql + ")"
	if p > 0 && limit > 0 {
		limits = []int64{0, limit}
		if p > 1 {
			limits[0] = (p - 1) * limit
			limits[1] = limit
		}
		sql += fmt.Sprintf(" limit %d offset %d", limits[1], limits[0])
	}
	data, err = s.Query(sql, params...)
	if err != nil {
		return data, 0, err
	}
	countResult, err := s.Query(sqlCount, params...)
	if err != nil {
		return data, 0, err
	}
	if len(countResult) > 0 {
		count = countResult[0]["count"].(int64)
	}

	return data, int(count), nil
}

func DeleteLeafCert(id int64) error {
	s, err := GetSqlite()
	if err != nil {
		return err
	}
	defer s.Close()
	s.TableName = "leaf"

	_, err = s.Where("id=?", []interface{}{id}).Delete()
	if err != nil {
		return err
	}
	return nil
}

func GetCert(id int64, certType string) (map[string]any, error) {
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	s.TableName = certType
	leafs, err := s.Where("id=?", []interface{}{id}).Select()
	if err != nil {
		return nil, err
	}
	if len(leafs) == 0 {
		return nil, fmt.Errorf("leaf cert with id %d not found", id)
	}
	return leafs[0], nil
}

// GetRootCACert 沿 root_id 向上找到证书链顶端的根CA，返回其证书（公钥）与名称，
// 用于导出挂载到客户端信任库（如 Windows 证书管理器）
func GetRootCACert(id int64) (certPEM string, name string, err error) {
	s, err := GetSqlite()
	if err != nil {
		return "", "", err
	}
	defer s.Close()
	currentId := id
	for depth := 0; depth < 10 && currentId > 0; depth++ {
		rows, err := s.Where("id=?", []interface{}{currentId}).Select()
		if err != nil {
			return "", "", err
		}
		if len(rows) == 0 {
			return "", "", fmt.Errorf("CA with id %d not found", currentId)
		}
		ca := rows[0]
		rootId := dbInt64(ca["root_id"])
		if rootId <= 0 {
			// 到达根CA
			return dbString(ca["cert"]), dbString(ca["name"]), nil
		}
		currentId = rootId
	}
	return "", "", fmt.Errorf("证书链层级过深，未找到根CA")
}

func WorkflowCreateLeafCert(params map[string]any, logger *public.Logger) (map[string]any, error) {
	caId, ok := params["ca_id"].(float64)
	if !ok || caId <= 0 {
		return nil, fmt.Errorf("ca_id参数错误")
	}
	keyBits, ok := params["key_length"].(float64)
	if !ok {
		return nil, fmt.Errorf("key_length参数错误")
	}
	validDays, ok := params["valid_days"].(float64)
	if !ok {
		return nil, fmt.Errorf("valid_days参数错误")
	}
	endDay, ok := params["end_day"].(float64)
	if !ok {
		endDay = 0
	}
	// 证书用途位掩码：1服务器 2客户端 4邮件，可组合（如 3=服务器+客户端），缺省为服务器证书
	usage, ok := params["usage"].(float64)
	if !ok || usage == 0 {
		usage = UsageServer
	}
	if usage < UsageServer || usage > UsageServer|UsageClient|UsageEmail {
		return nil, fmt.Errorf("usage参数错误")
	}
	cn, ok := params["cn"].(string)
	if !ok {
		cn = ""
	}
	san, ok := params["san"].(string)
	if !ok || san == "" {
		return nil, fmt.Errorf("san参数错误")
	}

	// 先获取ca信息，确认是中间证书且不能是国密
	s, err := GetSqlite()
	if err != nil {
		return nil, err
	}
	defer s.Close()
	issuers, err := s.Where("id=?", []interface{}{caId}).Select()
	if err != nil {
		return nil, err
	}
	if len(issuers) == 0 {
		return nil, fmt.Errorf("issuer with id %d not found", caId)
	}
	issuer := issuers[0]
	if issuer["root_id"] == "" || issuer["root_id"] == nil {
		return nil, fmt.Errorf("不允许使用根证书直接签发叶子证书，请先创建中间证书")
	}
	keyType := issuer["algorithm"].(string)
	if keyType == "sm2" {
		return nil, fmt.Errorf("暂不兼容国密证书，请使用标准证书")
	}
	// 判断中间证书不能为已过期，过期时间不能超过中间证书
	caNotAfter, err := time.Parse("2006-01-02 15:04:05", issuer["not_after"].(string))
	if err != nil {
		return nil, fmt.Errorf("解析中间证书过期时间失败: %v", err)
	}
	maxValidDays := caNotAfter.Sub(time.Now()).Hours() / 24
	if maxValidDays <= 0 {
		return nil, fmt.Errorf("中间证书已过期，不能签发叶子证书")
	}
	if validDays > maxValidDays {
		return nil, fmt.Errorf("叶子证书的有效期不能超过中间证书的有效期，中间证书将在 %s 过期，距离今天还有 %d 天", caNotAfter.Format("2006-01-02"), int(maxValidDays))
	}
	// 解析san，判断数据库中是否已存在相同的cn和san
	var sans SAN
	err = json.Unmarshal([]byte(san), &sans)
	if err != nil {
		return nil, fmt.Errorf("备用名称格式错误: %v", err)
	}
	if cn == "" {
		if len(sans.DNSNames) > 0 {
			cn = sans.DNSNames[0]
		} else {
			cn = string(sans.IPAddresses[0])
		}
	}
	s.TableName = "leaf"
	// 获取所有未过期的证书，判断是否有相同的cn和san
	leafs, err := s.Where("ca_id=? and not_after>? and usage=?", []interface{}{caId, time.Now().Format("2006-01-02 15:04:05"), int64(usage)}).Select()
	if err != nil {
		return nil, err
	}
	var certificate map[string]any
	for _, v := range leafs {
		// 判断剩余天数是否满足要求
		if endDay > 0 {
			notAfter, err := time.Parse("2006-01-02 15:04:05", v["not_after"].(string))
			if err != nil {
				continue
			}
			remainDays := notAfter.Sub(time.Now()).Hours() / 24
			if remainDays < endDay {
				continue
			}
		}
		// 判断cn和san是否相同
		if v["cn"] == cn {
			var existingSAN SAN
			err = json.Unmarshal([]byte(v["san"].(string)), &existingSAN)
			if err != nil {
				continue
			}
			if public.ContainsAllIgnoreBRepeats(existingSAN.DNSNames, sans.DNSNames) {
				var existingIPs, newIPs []string
				for _, ip := range existingSAN.IPAddresses {
					existingIPs = append(existingIPs, ip.String())
				}
				for _, ip := range sans.IPAddresses {
					newIPs = append(newIPs, ip.String())
				}
				if public.ContainsAllIgnoreBRepeats(existingIPs, newIPs) {
					// 找到相同的证书，标记为跳过
					logger.Debug("找到相同的证书，跳过创建", "id", v["id"])
					certificate = map[string]any{
						"cert": v["cert"],
						"key":  v["key"],
						"skip": true,
					}
					break
				}
			}
		}
	}
	if certificate == nil {
		leaf, err := CreateLeafCert(int64(caId), int64(usage), int64(keyBits), int64(validDays), cn, san)
		if err != nil {
			return nil, err
		}
		certificate = map[string]any{
			"cert": leaf.Cert,
			"key":  leaf.Key,
		}
	}

	// 拼接完整证书链（叶子 + 中间CA + 根CA）供部署使用，否则客户端无法构建信任链
	chain, err := buildChainPEM(certificate["cert"].(string), int64(caId))
	if err != nil {
		return nil, err
	}
	certificate["cert"] = chain

	return certificate, nil
}

// buildChainPEM 自叶子证书向上拼接完整证书链：叶子 + 中间CA + ... + 根CA
func buildChainPEM(leafCert string, caId int64) (string, error) {
	s, err := GetSqlite()
	if err != nil {
		return "", err
	}
	defer s.Close()
	var sb strings.Builder
	sb.WriteString(strings.TrimSpace(leafCert))
	sb.WriteString("\n")
	currentId := caId
	for depth := 0; depth < 10 && currentId > 0; depth++ {
		rows, err := s.Where("id=?", []interface{}{currentId}).Select()
		if err != nil {
			return "", err
		}
		if len(rows) == 0 {
			return "", fmt.Errorf("证书链构建失败：CA id %d 不存在", currentId)
		}
		ca := rows[0]
		sb.WriteString(strings.TrimSpace(dbString(ca["cert"])))
		sb.WriteString("\n")
		rootId := dbInt64(ca["root_id"])
		if rootId <= 0 {
			break
		}
		currentId = rootId
	}
	return sb.String(), nil
}
