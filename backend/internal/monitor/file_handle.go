package monitor

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"github.com/tealeg/xlsx"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
)

func ParseMonitorFile(fileHeader *multipart.FileHeader) ([]*Monitor, error) {
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))

	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("无法打开文件: %v", err)
	}
	defer file.Close()

	switch ext {
	case ".csv", ".txt":
		return parseCSV(file)
	case ".json":
		return parseJSON(file)
	case ".xlsx":
		return parseXLSX(file)
	default:
		return nil, fmt.Errorf("不支持的文件类型: %s", ext)
	}
}

func parseCSV(reader io.Reader) ([]*Monitor, error) {
	csvReader := csv.NewReader(reader)
	var monitors []*Monitor
	isHeader := true

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("CSV 解析失败: %v", err)
		}

		if isHeader {
			isHeader = false
			continue
		}

		if len(record) < 8 {
			continue
		}

		monitor := &Monitor{
			Name:          record[0],
			Target:        record[1],
			MonitorType:   record[2],
			ReportTypes:   record[3],
			Cycle:         record[4],
			RepeatSendGap: record[5],
			Active:        record[6],
			AdvanceDay:    record[7],
		}
		monitors = append(monitors, monitor)
	}

	return monitors, nil
}

func parseJSON(reader io.Reader) ([]*Monitor, error) {
	var monitors []*Monitor
	err := json.NewDecoder(reader).Decode(&monitors)
	if err != nil {
		return nil, fmt.Errorf("JSON 解析失败: %v", err)
	}
	return monitors, nil
}

func parseXLSX(file multipart.File) ([]*Monitor, error) {
	var monitors []*Monitor

	// 读取文件内容到内存
	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	// 解析 XLSX 内容
	xlFile, err := xlsx.OpenBinary(data)
	if err != nil {
		return nil, fmt.Errorf("解析 xlsx 失败: %v", err)
	}

	if len(xlFile.Sheets) == 0 {
		return nil, fmt.Errorf("未找到工作表")
	}

	sheet := xlFile.Sheets[0]
	for i, row := range sheet.Rows {
		if i == 0 {
			continue // 跳过表头
		}
		if len(row.Cells) < 8 {
			continue
		}
		monitor := &Monitor{
			Name:          row.Cells[0].String(),
			Target:        row.Cells[1].String(),
			MonitorType:   row.Cells[2].String(),
			ReportTypes:   row.Cells[3].String(),
			Cycle:         row.Cells[4].String(),
			RepeatSendGap: row.Cells[5].String(),
			Active:        row.Cells[6].String(),
			AdvanceDay:    row.Cells[7].String(),
		}
		monitors = append(monitors, monitor)
	}

	return monitors, nil
}
