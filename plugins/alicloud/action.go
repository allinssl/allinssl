package main

import (
	casPkg "ALLinSSL/plugins/alicloud/cas"
	cdnPkg "ALLinSSL/plugins/alicloud/cdn"
	dcdnPkg "ALLinSSL/plugins/alicloud/dcdn"
	esaPkg "ALLinSSL/plugins/alicloud/esa"
	ossPkg "ALLinSSL/plugins/alicloud/oss"
	wafPkg "ALLinSSL/plugins/alicloud/waf"
)

func Cdn(cfg map[string]any) (*Response, error) {
	if err := cdnPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}

func Dcdn(cfg map[string]any) (*Response, error) {
	if err := dcdnPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}

func Oss(cfg map[string]any) (*Response, error) {
	if err := ossPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}

func Esa(cfg map[string]any) (*Response, error) {
	if err := esaPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}

func Cas(cfg map[string]any) (*Response, error) {
	if err := casPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}

func Waf(cfg map[string]any) (*Response, error) {
	if err := wafPkg.Deploy(cfg); err != nil {
		return nil, err
	}
	return &Response{Status: "success", Message: "OK", Result: nil}, nil
}
