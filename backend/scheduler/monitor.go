package scheduler

import (
	"ALLinSSL/backend/internal/monitor"
	"ALLinSSL/backend/internal/report"
	"ALLinSSL/backend/public"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	MonitorErrCount   = make(map[int64]int)
	monitorErrCountMu sync.Mutex
)

// 通知模板，先写死，后续做成配置
var MonitorErrTemplate = "监控名称：%v\n类型：%v\n域名：%v\n错误信息：%v\n请及时处理！\n检测时间：%v"

func Monitor() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Monitor 主流程捕获 panic: %v\n", r)
		}
	}()

	s, err := monitor.GetSqlite()
	if err != nil {
		fmt.Println(err)
	}
	defer s.Close()
	s1, err := report.GetSqlite()
	if err != nil {
		fmt.Println(err)
		return
	}
	defer s1.Close()
	s1.TableName = "report"

	data, err := s.Select()
	if err != nil {
		fmt.Println(err)
	}
	now := time.Now()
	loc := now.Location()
	var wg sync.WaitGroup
	for _, v := range data {
		if v["active"].(int64) == 1 {
			lastTimeStr, ok := v["last_time"].(string)
			if !ok || lastTimeStr == "" {
				lastTimeStr = "1970-01-01 00:00:00"
			}
			lastTime, err := time.ParseInLocation("2006-01-02 15:04:05", lastTimeStr, loc)
			if err != nil {
				// fmt.Println(err)
				continue
			}
			monitorType, ok := v["monitor_type"].(string)
			if !ok {
				fmt.Println("监控类型错误")
				return
			}
			target, ok := v["target"].(string)
			if !ok {
				fmt.Println("监控目标错误")
				return
			}
			advanceDay, ok := v["advance_day"].(int64)
			if !ok {
				advanceDay = 30 // 默认提前30天
			}
			if now.Sub(lastTime).Minutes() >= float64(v["cycle"].(int64)) {
				wg.Add(1)
				go func(v map[string]any) {
					defer func() {
						if r := recover(); r != nil {
							fmt.Printf("监控任务发生错误: %v\n", r)
						}
					}()
					defer wg.Done()
					gs := *s
					var (
						certInfo *monitor.CertInfo
						certJson string
						Err      error
						checkErr string
					)
					switch monitorType {
					case "https":
						certInfo, Err = monitor.CheckHttps(target, int(advanceDay))
					case "smtp":
						certInfo, Err = monitor.CheckSmtp(target, int(advanceDay))
					default:
						Err = fmt.Errorf("不支持的监控类型:%s", monitorType)
					}

					if Err != nil {
						checkErr = strings.Split(Err.Error(), "：")[0] // 只取错误信息的第一部分
					} else {
						if certInfo.VerifyError != "" && (!certInfo.Valid || certInfo.DaysLeft <= int(advanceDay)) {
							checkErr = certInfo.VerifyError
						}
						certBytes, err := json.Marshal(certInfo)
						if err == nil {
							certJson = string(certBytes)
						}
					}
					id := v["id"].(int64)

					// 此处应该发送错误邮件
					if checkErr != "" {
						// 更新监控记录
						gs.Where("id=?", []interface{}{id}).Update(map[string]any{
							"last_time":       now.Format("2006-01-02 15:04:05"),
							"except_end_time": now.Format("2006-01-02 15:04:05"),
							"info":            certJson,
							"valid":           -1, // 状态为异常
						})
						// 新增错误记录
						if certInfo == nil || !certInfo.Valid {
							gs.TableName = "err_record"
							gs.Insert(map[string]any{
								"id":          public.GenerateUUID(),
								"monitor_id":  id,
								"create_time": now.Format("2006-01-02 15:04:05"),
								"msg":         checkErr,
								"info":        certJson,
							})
						}
						monitorErrCountMu.Lock()
						MonitorErrCount[id] += 1
						errCount := MonitorErrCount[id]
						monitorErrCountMu.Unlock()

						repeatSendGap, ok := v["repeat_send_gap"].(int64)
						if !ok {
							repeatSendGap = 10
						}
						reportTypes, ok := v["report_types"].(string)
						if ok && errCount == 1 {
							reportTypeArr := strings.Split(reportTypes, ",")
							for _, reportType := range reportTypeArr {
								if reportType == "" {
									continue
								}
								rdata, err := s1.Where("type=?", []interface{}{reportType}).Select()
								if err != nil {
									return
								}
								if len(rdata) <= 0 {
									return
								}
								report.Notify(map[string]any{
									"provider":    reportType,
									"provider_id": strconv.FormatInt(rdata[0]["id"].(int64), 10),
									"subject":     "ALLinSSL 监控通知",
									"body":        fmt.Sprintf(MonitorErrTemplate, v["name"], monitorType, v["target"], checkErr, now.Format("2006-01-02 15:04:05")),
								})
							}
						}
						monitorErrCountMu.Lock()
						if MonitorErrCount[id] >= int(repeatSendGap) {
							MonitorErrCount[id] = 0
						}
						monitorErrCountMu.Unlock()
					} else {
						// 更新监控记录
						gs.Where("id=?", []interface{}{id}).Update(map[string]any{
							"last_time": now.Format("2006-01-02 15:04:05"),
							"info":      certJson,
							"valid":     1, // 状态为正常
						})
						monitorErrCountMu.Lock()
						MonitorErrCount[id] = 0
						monitorErrCountMu.Unlock()
					}
				}(v)
			}
		}
	}
	wg.Wait()
}
