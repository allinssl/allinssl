package scheduler

import (
	"ALLinSSL/backend/internal/report"
	"ALLinSSL/backend/internal/siteMonitor"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

func SiteMonitor() {
	s, err := siteMonitor.GetSqlite()
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
	data, err := s.Select()
	if err != nil {
		fmt.Println(err)
	}
	now := time.Now()
	loc := now.Location()
	var wg sync.WaitGroup
	for _, v := range data {
		if v["active"].(int64) == 1 {
			lastTimeStr := v["last_time"].(string)
			lastTime, err := time.ParseInLocation("2006-01-02 15:04:05", lastTimeStr, loc)
			if err != nil {
				// fmt.Println(err)
				continue
			}
			if now.Sub(lastTime).Minutes() >= float64(v["cycle"].(int64)) {
				wg.Add(1)
				go func() {
					defer wg.Done()
					Err := siteMonitor.UpdInfo(fmt.Sprintf("%d", v["id"].(int64)), v["site_domain"].(string), s, v["report_type"].(string))

					path := fmt.Sprintf("data/site_monitor/%d", v["id"].(int64))
					dir := filepath.Dir(path)
					if err := os.MkdirAll(dir, os.ModePerm); err != nil {
						return
					}
					errCount := 0
					file, err := os.ReadFile(path)
					if err != nil {
						errCount = 0
					}
					errCount, err = strconv.Atoi(string(file))
					if err != nil {
						errCount = 0
					}

					// 此处应该发送错误邮件
					if Err != nil {
						errCount += 1
						os.WriteFile(path, []byte(strconv.Itoa(errCount)), os.ModePerm)
						repeatSendGap, ok := v["repeat_send_gap"].(int64)
						if !ok {
							repeatSendGap = 10
						}
						reportType, ok := v["report_type"].(string)
						if ok && errCount >= int(repeatSendGap) {
							s1.TableName = "report"
							rdata, err := s1.Where("type=?", []interface{}{reportType}).Select()
							if err != nil {
								return
							}
							if len(rdata) <= 0 {
								return
							}
							_ = report.Notify(map[string]any{
								"provider":    reportType,
								"provider_id": strconv.FormatInt(rdata[0]["id"].(int64), 10),
								"body":        fmt.Sprintf("检测到域名为%s的网站出现异常，请保持关注！\n检测时间：%s", v["site_domain"].(string), now.Format("2006-01-02 15:04:05")),
								"subject":     "ALLinSSL网站监控通知",
							})
							os.Remove(path)
						}
					} else {
						os.Remove(path)
					}
				}()
			}
		}
	}
	wg.Wait()
}
