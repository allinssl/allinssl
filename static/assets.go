package static

import "embed"

//go:embed monitor_templates/*
var MonitorTemplatesFS embed.FS

//go:embed build/*
var BuildFS embed.FS
