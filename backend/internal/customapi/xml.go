package customapi

import (
	"encoding/xml"
	"fmt"
	"io"
	"strings"
)

// xmlNode 通用 XML 节点：同名子节点合并为列表，文本内容作为节点值
type xmlNode struct {
	children map[string][]*xmlNode
	text     string
}

// parseXML 把 XML 文本解析为通用节点树（宽容模式）
func parseXML(data string) (*xmlNode, error) {
	dec := xml.NewDecoder(strings.NewReader(data))
	dec.Strict = false
	var root *xmlNode
	var stack []*xmlNode
	for {
		tok, err := dec.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("XML 解析失败: %w", err)
		}
		switch t := tok.(type) {
		case xml.StartElement:
			node := &xmlNode{children: make(map[string][]*xmlNode)}
			if len(stack) == 0 {
				if root != nil {
					return nil, fmt.Errorf("XML 存在多个根元素")
				}
				root = node
			} else {
				parent := stack[len(stack)-1]
				parent.children[t.Name.Local] = append(parent.children[t.Name.Local], node)
			}
			stack = append(stack, node)
		case xml.EndElement:
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
		case xml.CharData:
			if len(stack) > 0 {
				stack[len(stack)-1].text += string(t)
			}
		}
	}
	if root == nil {
		return nil, fmt.Errorf("XML 解析失败：无根元素")
	}
	return root, nil
}

// xmlPathExtract 按 a.b[0].c 路径从 XML 文本提取值（未指定下标时取第一个同名节点）
func xmlPathExtract(body, path string) (string, error) {
	root, err := parseXML(body)
	if err != nil {
		return "", err
	}
	cur := []*xmlNode{root}
	for _, part := range strings.Split(path, ".") {
		if part == "" {
			continue
		}
		key, idx, isIndex := parsePathPart(part)
		next := cur
		if key != "" {
			next = nil
			for _, n := range cur {
				next = append(next, n.children[key]...)
			}
		}
		if len(next) == 0 {
			return "", fmt.Errorf("xml 路径 %s 不存在", part)
		}
		if isIndex {
			if idx < 0 || idx >= len(next) {
				return "", fmt.Errorf("xml 数组越界: %s", part)
			}
			next = []*xmlNode{next[idx]}
		}
		cur = next[:1]
	}
	return strings.TrimSpace(cur[0].text), nil
}
