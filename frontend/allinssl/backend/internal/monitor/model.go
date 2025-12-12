package monitor

// CertInfo 用于返回证书检查的详细信息
type CertInfo struct {
	CommonName    string    `json:"common_name"`    // 证书主体 CN
	CA            string    `json:"ca"`             // 颁发机构 CN
	NotBefore     string    `json:"not_before"`     // 生效时间
	NotAfter      string    `json:"not_after"`      // 失效时间
	DaysLeft      int       `json:"days_left"`      // 证书剩余天数
	SANs          string    `json:"sans"`           // 证书 SAN 列表
	SignatureAlgo string    `json:"signature_algo"` // 签名算法
	Sha256        string    `json:"sha256"`         // 证书 SHA256 指纹
	Valid         bool      `json:"valid"`          // 是否校验通过
	VerifyError   string    `json:"verify_error"`   // 校验失败原因
	CertChain     *CertNode `json:"cert_chain"`     // 证书链结构树
}

// CertNode 代表证书链中的节点
type CertNode struct {
	CommonName string      `json:"common_name"` // 当前节点证书 CN
	Subject    string      `json:"subject"`     // 证书 Subject 字符串
	Issuer     string      `json:"issuer"`      // 证书 Issuer 字符串
	Children   []*CertNode `json:"children"`    // 下级节点
}

type Monitor struct {
	Name          string `json:"name"`
	Target        string `json:"target"`
	MonitorType   string `json:"monitor_type"`    // 监控类型
	ReportTypes   string `json:"report_types"`    // 报告类型
	Cycle         string `json:"cycle"`           // 监控周期
	RepeatSendGap string `json:"repeat_send_gap"` // 重复发送间隔
	Active        string `json:"active"`          // 是否启用
	AdvanceDay    string `json:"advance_day"`     // 提前多少天提醒
}
