// Package modules 提供进程入口使用的模块管理接口。
package modules

import "ALLinSSL/backend/internal/module"

type Invoke = module.Invoke
type Reply = module.Reply
type HTTPRequest = module.HTTPRequest
type HTTPResponse = module.HTTPResponse
type Manifest = module.Manifest
type Hook = module.Hook
type Frontend = module.Frontend
type Page = module.Page
type Menu = module.Menu
type Slot = module.Slot
type PublicRoute = module.PublicRoute

func Initialize(dir, dataDir string) (*module.Manager, error) {
	manager, err := module.New(dir, dataDir)
	if err == nil {
		module.Default = manager
	}
	return manager, err
}

func Disable(dataDir, id string) error { return module.DisableOnDisk(dataDir, id) }
