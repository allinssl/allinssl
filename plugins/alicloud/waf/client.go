package waf

import (
	"fmt"
	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	openapiutil "github.com/alibabacloud-go/openapi-util/service"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	aliyunwaf "github.com/alibabacloud-go/waf-openapi-20211001/v5/client"
)

type AliyunWafClient struct {
	aliyunwaf.Client
	accessKey    string
	accessSecret string
	region       string
}

func ClientAliWaf(accessKey, accessSecret, region string) (_result *AliyunWafClient, err error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKey),
		AccessKeySecret: tea.String(accessSecret),
		Endpoint:        tea.String(fmt.Sprintf("wafopenapi.%s.aliyuncs.com", region)),
	}
	client, err := aliyunwaf.NewClient(config)
	if err != nil {
		return nil, err
	}
	aliyunwafClient := &AliyunWafClient{
		Client:       *client,
		accessKey:    accessKey,
		accessSecret: accessSecret,
		region:       region,
	}
	return aliyunwafClient, nil
}

type CreateCertsResponseBody struct {
	CertIdentifier *string `json:"CertIdentifier,omitempty" xml:"DomainInfo,omitempty"`
	RequestId      *string `json:"RequestId,omitempty" xml:"RequestId,omitempty"`
}

type CreateCertsResponse struct {
	Headers    map[string]*string       `json:"headers,omitempty" xml:"headers,omitempty"`
	StatusCode *int32                   `json:"statusCode,omitempty" xml:"statusCode,omitempty"`
	Body       *CreateCertsResponseBody `json:"body,omitempty" xml:"body,omitempty"`
}

func (client *AliyunWafClient) ICreateCerts(certName, certContent, certKey, instanceId string) (certId *string, _err error) {
	query := map[string]interface{}{
		"CertName":    certName,
		"CertContent": certContent,
		"CertKey":     certKey,
		"InstanceId":  instanceId,
	}
	req := &openapi.OpenApiRequest{Query: openapiutil.Query(query)}
	params := &openapi.Params{
		Action:      tea.String("CreateCerts"),
		Version:     tea.String("2021-10-01"),
		Protocol:    tea.String("HTTPS"),
		Pathname:    tea.String("/"),
		Method:      tea.String("POST"),
		AuthType:    tea.String("AK"),
		Style:       tea.String("RPC"),
		ReqBodyType: tea.String("formData"),
		BodyType:    tea.String("json"),
	}
	createCertsResponse := &CreateCertsResponse{}
	runtime := &util.RuntimeOptions{}
	_body, _err := client.CallApi(params, req, runtime)
	if _err != nil {
		return nil, _err
	}
	_err = tea.Convert(_body, &createCertsResponse)
	certId = createCertsResponse.Body.CertIdentifier
	return certId, _err
}

func (client *AliyunWafClient) IGetInstanceId() (instanceId *string, _err error) {
	req := &aliyunwaf.DescribeInstanceRequest{RegionId: tea.String(client.region)}
	response, _err := client.DescribeInstance(req)
	if _err != nil {
		return nil, _err
	}
	instanceId = response.Body.InstanceId
	if instanceId == nil || *instanceId == "" {
		_err = fmt.Errorf("未找到WAF实例ID，请检查是否已创建WAF实例")
		return nil, _err
	}
	return instanceId, _err
}

func (client *AliyunWafClient) IDescribeDomainDetail(instanceId, domain string) (describeDomainDetailResponseBody *aliyunwaf.DescribeDomainDetailResponseBody, _err error) {
	req := &aliyunwaf.DescribeDomainDetailRequest{
		InstanceId: tea.String(instanceId),
		RegionId:   tea.String(client.region),
		Domain:     tea.String(domain),
	}
	response, _err := client.DescribeDomainDetail(req)
	if _err != nil {
		return nil, _err
	}
	describeDomainDetailResponseBody = response.Body
	return describeDomainDetailResponseBody, _err
}

func (client *AliyunWafClient) IUpdateDomain(domainDesc *aliyunwaf.DescribeDomainDetailResponseBody, instanceId, certId string) error {
	modifyDomainReq := &aliyunwaf.ModifyDomainRequest{
		InstanceId: tea.String(instanceId),
		RegionId:   tea.String(client.region),
		Domain:     domainDesc.Domain,
		Listen:     &aliyunwaf.ModifyDomainRequestListen{CertId: tea.String(certId)},
	}
	assignDomain(domainDesc, modifyDomainReq)
	_, err := client.ModifyDomain(modifyDomainReq)
	if err != nil {
		return err
	}
	return nil
}

func assignDomain(from *aliyunwaf.DescribeDomainDetailResponseBody, to *aliyunwaf.ModifyDomainRequest) *aliyunwaf.ModifyDomainRequest {
	if from == nil {
		return to
	}
	if from.Listen != nil {
		if to.Listen == nil {
			to.Listen = &aliyunwaf.ModifyDomainRequestListen{}
		}
		if from.Listen.CipherSuite != nil {
			to.Listen.CipherSuite = tea.Int32(int32(*from.Listen.CipherSuite))
		}
		if from.Listen.CustomCiphers != nil {
			to.Listen.CustomCiphers = from.Listen.CustomCiphers
		}
		if from.Listen.EnableTLSv3 != nil {
			to.Listen.EnableTLSv3 = from.Listen.EnableTLSv3
		}
		if from.Listen.ExclusiveIp != nil {
			to.Listen.ExclusiveIp = from.Listen.ExclusiveIp
		}
		if from.Listen.FocusHttps != nil {
			to.Listen.FocusHttps = from.Listen.FocusHttps
		}
		if from.Listen.Http2Enabled != nil {
			to.Listen.Http2Enabled = from.Listen.Http2Enabled
		}
		if from.Listen.IPv6Enabled != nil {
			to.Listen.IPv6Enabled = from.Listen.IPv6Enabled
		}
		if from.Listen.ProtectionResource != nil {
			to.Listen.ProtectionResource = from.Listen.ProtectionResource
		}
		if from.Listen.TLSVersion != nil {
			to.Listen.TLSVersion = from.Listen.TLSVersion
		}
		if from.Listen.XffHeaderMode != nil {
			to.Listen.XffHeaderMode = tea.Int32(int32(*from.Listen.XffHeaderMode))
		}
		if from.Listen.XffHeaders != nil {
			to.Listen.XffHeaders = from.Listen.XffHeaders
		}
		if from.Listen.HttpPorts != nil {
			to.Listen.HttpPorts = make([]*int32, len(from.Listen.HttpPorts))
			for i, port := range from.Listen.HttpPorts {
				if port != nil {
					to.Listen.HttpPorts[i] = tea.Int32(int32(*port))
				}
			}
		}
		if from.Listen.HttpsPorts != nil {
			to.Listen.HttpsPorts = make([]*int32, len(from.Listen.HttpsPorts))
			for i, port := range from.Listen.HttpsPorts {
				if port != nil {
					to.Listen.HttpsPorts[i] = tea.Int32(int32(*port))
				}
			}
		}
	}
	if from.Redirect != nil {
		if to.Redirect == nil {
			to.Redirect = &aliyunwaf.ModifyDomainRequestRedirect{}
		}
		if from.Redirect.ConnectTimeout != nil {
			to.Redirect.ConnectTimeout = from.Redirect.ConnectTimeout
		}
		if from.Redirect.FocusHttpBackend != nil {
			to.Redirect.FocusHttpBackend = from.Redirect.FocusHttpBackend
		}
		if from.Redirect.Keepalive != nil {
			to.Redirect.Keepalive = from.Redirect.Keepalive
		}
		if from.Redirect.KeepaliveRequests != nil {
			to.Redirect.KeepaliveRequests = from.Redirect.KeepaliveRequests
		}
		if from.Redirect.KeepaliveTimeout != nil {
			to.Redirect.KeepaliveTimeout = from.Redirect.KeepaliveTimeout
		}
		if from.Redirect.Loadbalance != nil {
			to.Redirect.Loadbalance = from.Redirect.Loadbalance
		}
		if from.Redirect.ReadTimeout != nil {
			to.Redirect.ReadTimeout = from.Redirect.ReadTimeout
		}
		if from.Redirect.Retry != nil {
			to.Redirect.Retry = from.Redirect.Retry
		}
		if from.Redirect.SniEnabled != nil {
			to.Redirect.SniEnabled = from.Redirect.SniEnabled
		}
		if from.Redirect.SniHost != nil {
			to.Redirect.SniHost = from.Redirect.SniHost
		}
		if from.Redirect.WriteTimeout != nil {
			to.Redirect.WriteTimeout = from.Redirect.WriteTimeout
		}
		if from.Redirect.XffProto != nil {
			to.Redirect.XffProto = from.Redirect.XffProto
		}
		if from.Redirect.Backends != nil {
			to.Redirect.Backends = make([]*string, len(from.Redirect.Backends))
			for i, backend := range from.Redirect.Backends {
				if backend != nil {
					to.Redirect.Backends[i] = backend.Backend
				}
			}
		}
		if from.Redirect.BackupBackends != nil {
			to.Redirect.BackupBackends = make([]*string, len(from.Redirect.BackupBackends))
			for i, backend := range from.Redirect.BackupBackends {
				if backend != nil {
					to.Redirect.BackupBackends[i] = backend.Backend
				}
			}
		}
		if from.Redirect.RequestHeaders != nil {
			to.Redirect.RequestHeaders = make([]*aliyunwaf.ModifyDomainRequestRedirectRequestHeaders, len(from.Redirect.RequestHeaders))
			for i, header := range from.Redirect.RequestHeaders {
				if header != nil {
					to.Redirect.RequestHeaders[i] = &aliyunwaf.ModifyDomainRequestRedirectRequestHeaders{Key: header.Key, Value: header.Value}
				}
			}
		}
	}
	return to
}
