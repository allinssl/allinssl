package cert

import (
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strings"
)

// workflowNode 仅用于回填时解析工作流 JSON，字段与 workflow.WorkflowNode 对齐。
type workflowNode struct {
	Type           string          `json:"type"`
	Config         map[string]any  `json:"config"`
	ChildNode      *workflowNode   `json:"childNode"`
	ConditionNodes []*workflowNode `json:"conditionNodes"`
}

// BackfillACMEMetadata 为历史证书补全 acme_email / acme_ca。
// 从关联工作流 content 中查找 apply 节点的 email、ca 配置。
// 返回成功回填的条数。
func BackfillACMEMetadata() (int, error) {
	s, err := GetSqlite()
	if err != nil {
		return 0, err
	}
	defer s.Close()

	rows, err := s.Where("source=? and (acme_email is null or acme_email='') and workflow_id is not null and workflow_id!=''", []interface{}{"workflow"}).Select()
	if err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, nil
	}

	type meta struct {
		email string
		ca    string
	}
	cache := map[string]meta{}
	updated := 0

	for _, row := range rows {
		wfID, _ := row["workflow_id"].(string)
		if wfID == "" {
			continue
		}
		m, ok := cache[wfID]
		if !ok {
			email, ca, err := extractACMEFromWorkflow(wfID)
			if err != nil || email == "" {
				cache[wfID] = meta{}
				continue
			}
			if ca == "" || ca == "letsencrypt" {
				ca = "Let's Encrypt"
			}
			m = meta{email: email, ca: ca}
			cache[wfID] = m
		}
		if m.email == "" {
			continue
		}
		_, err = s.Where("id=?", []interface{}{row["id"]}).Update(map[string]interface{}{
			"acme_email": m.email,
			"acme_ca":    m.ca,
		})
		if err != nil {
			return updated, fmt.Errorf("更新证书 %v 失败: %w", row["id"], err)
		}
		updated++
	}
	return updated, nil
}

func extractACMEFromWorkflow(workflowID string) (email, ca string, err error) {
	s, err := public.NewSqlite("data/data.db", "")
	if err != nil {
		return "", "", err
	}
	defer s.Close()
	s.TableName = "workflow"
	rows, err := s.Where("id=?", []interface{}{workflowID}).Select()
	if err != nil {
		return "", "", err
	}
	if len(rows) == 0 {
		return "", "", fmt.Errorf("workflow %s not found", workflowID)
	}
	content, _ := rows[0]["content"].(string)
	if content == "" {
		return "", "", fmt.Errorf("empty content")
	}
	var root workflowNode
	if err := json.Unmarshal([]byte(content), &root); err != nil {
		return "", "", err
	}
	email, ca = findApplyACME(&root)
	return email, ca, nil
}

func findApplyACME(node *workflowNode) (email, ca string) {
	if node == nil {
		return "", ""
	}
	if node.Type == "apply" && node.Config != nil {
		if e, ok := node.Config["email"].(string); ok && strings.TrimSpace(e) != "" {
			email = strings.TrimSpace(e)
			if c, ok := node.Config["ca"].(string); ok {
				ca = strings.TrimSpace(c)
			}
			if ca == "" {
				if eab, ok := node.Config["eabId"].(string); ok {
					switch eab {
					case "", "let":
						ca = "Let's Encrypt"
					case "buy", "buypass":
						ca = "buypass"
					}
				}
			}
			return email, ca
		}
	}
	if e, c := findApplyACME(node.ChildNode); e != "" {
		return e, c
	}
	for _, child := range node.ConditionNodes {
		if e, c := findApplyACME(child); e != "" {
			return e, c
		}
	}
	return "", ""
}
