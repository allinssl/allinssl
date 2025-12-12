package workflow

import (
	"ALLinSSL/backend/public"
	"sync"
)

type ExecutionStatus string

const (
	StatusSuccess ExecutionStatus = "success"
	StatusFailed  ExecutionStatus = "fail"
)

type WorkflowNodeParams struct {
	Name       string `json:"name"`
	FromNodeID string `json:"fromNodeId,omitempty"`
}

type WorkflowNode struct {
	Id   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`

	Config map[string]any       `json:"config"`
	Inputs []WorkflowNodeParams `json:"inputs"`
	// Outputs []WorkflowNodeParams `json:"outputs"`

	ChildNode      *WorkflowNode   `json:"childNode,omitempty"`
	ConditionNodes []*WorkflowNode `json:"conditionNodes,omitempty"`

	Validated bool `json:"validated"`
}

type ExecutionContext struct {
	Data   map[string]any
	Status map[string]ExecutionStatus
	mu     sync.RWMutex
	RunID  string
	Logger *public.Logger
}

type ExecTime struct {
	Type   string `json:"type"`
	Month  int    `json:"month,omitempty"`
	Week   int    `json:"week,omitempty"`
	Hour   int    `json:"hour"`
	Minute int    `json:"minute"`
}
