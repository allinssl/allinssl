package workflow

import (
	"ALLinSSL/backend/internal/cert"
	certApply "ALLinSSL/backend/internal/cert/apply"
	certDeploy "ALLinSSL/backend/internal/cert/deploy"
	"ALLinSSL/backend/internal/report"
	"ALLinSSL/backend/public"
	"errors"
	"fmt"
	"strconv"
)

// var executors map[string]func(map[string]any) (any, error)
//
// func RegistExector(executorName string, executor func(map[string]any) (any, error)) {
// 	executors[executorName] = executor
// }

func Executors(exec string, params map[string]any) (any, error) {
	switch exec {
	case "apply":
		return apply(params)
	case "deploy":
		return deploy(params)
	case "upload":
		return upload(params)
	case "notify":
		return notify(params)
	default:
		return nil, nil
	}
}

func apply(params map[string]any) (any, error) {
	logger := params["logger"].(*public.Logger)

	logger.Info("=============申请证书=============")
	certificate, err := certApply.Apply(params, logger)
	if err != nil {
		logger.Error(err.Error())
		logger.Info("=============申请失败=============")
		return nil, err
	}
	logger.Info("=============申请成功=============")
	return certificate, nil
}

func deploy(params map[string]any) (any, error) {
	logger := params["logger"].(*public.Logger)
	logger.Info("=============部署证书=============")
	certificate := params["certificate"]
	if certificate == nil {
		logger.Error("证书不存在")
		logger.Info("=============部署失败=============")
		return nil, errors.New("证书不存在")
	}
	certificateMap, ok := params["certificate"].(map[string]any)
	if !ok {
		logger.Error("证书不存在")
		logger.Info("=============部署失败=============")
		return nil, errors.New("证书不存在")
	}
	certStr, ok := certificateMap["cert"].(string)
	if !ok {
		logger.Error("证书格式错误")
		logger.Info("=============部署失败=============")
		return nil, errors.New("证书格式错误")
	}
	nowSha256, err := public.GetSHA256(certStr)
	if err != nil {
		logger.Error("解析证书sha256失败：" + err.Error())
		logger.Info("=============部署失败=============")
		return nil, err
	}

	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		logger.Error("新建数据库连接失败" + err.Error())
		logger.Info("=============部署失败=============")
		return nil, err
	}
	defer s.Close()
	s.TableName = "workflow_history"
	historyData, err := s.Where("id=?", []any{params["_runId"]}).Find()
	if err != nil {
		logger.Error("查询表workflow_history失败" + err.Error())
		logger.Info("=============部署失败=============")
		return nil, err
	}
	workflowId := historyData["workflow_id"]
	s.TableName = "workflow_deploy"
	deployData, err := s.Where("workflow_id=? and id=?", []any{workflowId, params["NodeId"]}).Select()
	if err != nil {
		logger.Error("查询表workflow_deploy失败" + err.Error())
		logger.Info("=============部署失败=============")
		return nil, err
	}

	if params["skip"] != nil {
		var skip int
		switch v := params["skip"].(type) {
		case int:
			skip = v
		case float64:
			skip = int(v)
		case string:
			skip, _ = strconv.Atoi(v)
		}
		if skip == 1 {
			if len(deployData) > 0 {
				beSha256, ok := deployData[0]["cert_hash"].(string)
				if !ok {
					logger.Error("证书hash格式错误")
					logger.Info("=============部署失败=============")
					return nil, errors.New("证书hash格式错误")
				}
				if beSha256 == nowSha256 && deployData[0]["status"].(string) == "success" {
					logger.Info("与上次部署的证书sha256相同且上次部署成功，跳过重复部署")
					logger.Info("=============部署成功=============")
					return map[string]any{
						"skip": true,
					}, nil
				}
			}
		}
	}

	err = certDeploy.Deploy(params, logger)
	var status string
	if err != nil {
		status = "fail"
		logger.Error(err.Error())
		logger.Info("=============部署失败=============")
	} else {
		status = "success"
		logger.Info("=============部署成功=============")
	}
	if len(deployData) > 0 {
		s.Where("workflow_id=? and id=?", []any{workflowId, params["NodeId"]}).Update(map[string]interface{}{"cert_hash": nowSha256, "status": status})
	} else {
		s.Insert(map[string]interface{}{"cert_hash": nowSha256, "workflow_id": workflowId, "id": params["NodeId"], "status": status})
	}
	return nil, err
}

func upload(params map[string]any) (any, error) {
	logger := params["logger"].(*public.Logger)
	logger.Info("=============上传证书=============")
	// 判断证书id走本地还是走旧上传，应在之后的迭代中移除旧代码
	if params["cert_id"] == nil {
		keyStr, ok := params["key"].(string)
		if !ok {
			logger.Error("上传的密钥有误")
			logger.Info("=============上传失败=============")
			return nil, errors.New("上传的密钥有误")
		}
		certStr, ok := params["cert"].(string)
		if !ok {
			logger.Error("上传的证书有误")
			logger.Info("=============上传失败=============")
			return nil, errors.New("上传的证书有误")
		}
		_, err := cert.UploadCert(keyStr, certStr)
		if err != nil {
			logger.Error(err.Error())
			logger.Info("=============上传失败=============")
			return nil, err
		}
		logger.Info("=============上传成功=============")

		return params, nil
	} else {
		certId := ""
		switch v := params["cert_id"].(type) {
		case float64:
			certId = strconv.Itoa(int(v))
		case string:
			certId = v
		default:
			logger.Info("=============上传证书获取失败=============")
			return nil, errors.New("证书 ID 类型错误")
		}
		result := map[string]any{}
		certObj, err := cert.GetCert(certId)
		if err != nil {
			logger.Error(err.Error())
			logger.Info("=============上传证书获取失败=============")
			return nil, err
		}
		if certObj == nil {
			logger.Error("证书不存在")
			logger.Info("=============上传证书获取失败=============")
			return nil, errors.New("证书不存在")
		}
		logger.Debug(fmt.Sprintf("证书 ID: %s", certId))
		result["cert"] = certObj["cert"]
		result["key"] = certObj["key"]
		return result, nil
	}
}

func notify(params map[string]any) (any, error) {
	// fmt.Println("通知:", params)
	logger := params["logger"].(*public.Logger)
	logger.Info("=============发送通知=============")

	if fromNodeData, ok := params["fromNodeData"].(map[string]any); ok && fromNodeData != nil {
		if v, ok := fromNodeData["skip"].(bool); ok && v {
			// 如果 skip 是 true，则跳过通知
			var skip bool
			switch v := params["skip"].(type) {
			case int:
				skip = v == 1
			case float64:
				skip = v == 1
			case string:
				skip = v == "1" || v == "true"
			case bool:
				skip = v
			default:
				skip = false
			}
			if skip {
				logger.Debug("上个节点已跳过操作，跳过通知")
				logger.Info("=============发送执行完成=============")
				return map[string]any{
					"skip": true,
				}, nil
			}
		}
	}

	logger.Debug(fmt.Sprintf("发送通知：%s", params["subject"].(string)))
	err := report.Notify(params)
	if err != nil {
		logger.Error(err.Error())
		logger.Info("=============发送失败=============")
		return nil, err
	}
	logger.Info("=============发送成功=============")
	return fmt.Sprintf("通知到: %s", params["message"]), nil
}
