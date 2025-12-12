package workflow

import "ALLinSSL/backend/public"

func NewExecutionContext(RunID string) *ExecutionContext {
	Logger, _ := public.NewLogger(public.GetSettingIgnoreError("workflow_log_path") + RunID + ".log")
	return &ExecutionContext{
		Data:   make(map[string]any),
		Status: make(map[string]ExecutionStatus),
		RunID:  RunID,
		Logger: Logger,
	}
}

func (ctx *ExecutionContext) SetOutput(nodeID string, output any, status ExecutionStatus) {
	ctx.mu.Lock()
	defer ctx.mu.Unlock()
	ctx.Data[nodeID] = output
	ctx.Status[nodeID] = status
}

func (ctx *ExecutionContext) GetOutput(nodeID string) (any, bool) {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	out, ok := ctx.Data[nodeID]
	return out, ok
}

func (ctx *ExecutionContext) GetStatus(nodeID string) ExecutionStatus {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	return ctx.Status[nodeID]
}
