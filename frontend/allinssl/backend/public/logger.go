package public

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var (
	infoLogger  *log.Logger
	errorLogger *log.Logger
	warnLogger  *log.Logger
	logFile     *os.File
)

// InitLogger 初始化日志器（仅写入文件）
func InitLogger(logPath string) {
	// 确保日志目录存在
	dir := filepath.Dir(logPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic("创建日志目录失败: " + err.Error())
	}

	var err error
	logFile, err = os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic("无法打开日志文件: " + err.Error())
	}

	infoLogger = log.New(logFile, "[INFO] ", log.LstdFlags|log.Lshortfile)
	errorLogger = log.New(logFile, "[ERROR] ", log.LstdFlags|log.Lshortfile)
	warnLogger = log.New(logFile, "[WARN] ", log.LstdFlags|log.Lshortfile)
}

// Info 输出 Info 级别日志
func Info(msg string) {
	infoLogger.Println(msg)
}

// Error 输出 Error 级别日志
func Error(msg string) {
	errorLogger.Println(msg)
}

// Warn 输出 Warn 级别日志
func Warn(msg string) {
	warnLogger.Println(msg)
}

// CloseLogger 关闭日志文件（建议在程序退出前调用）
func CloseLogger() {
	if logFile != nil {
		logFile.Close()
	}
}

type Logger struct {
	filePath string
	logger   *log.Logger
	file     *os.File
	mutex    sync.Mutex
}

func NewLogger(filePath string) (*Logger, error) {
	// 确保日志目录存在
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		panic("创建日志目录失败: " + err.Error())
	}

	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	l := log.New(file, "", 0) // 不设置前缀，我们手动格式化
	return &Logger{
		filePath: filePath,
		logger:   l,
		file:     file,
	}, nil
}

// Close 关闭日志文件
func (l *Logger) Close() {
	l.file.Close()
}

// write 写日志，内部使用锁保证线程安全
func (l *Logger) write(level string, args ...interface{}) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	message := fmt.Sprintln(args...) // 自动拼接参数并换行
	logLine := "[" + level + "] " + timestamp + " - " + message
	logLine = strings.TrimRight(logLine, "\n") // 去掉 Sprintln 自动加的换行
	l.logger.Println(logLine)
}

// Info 输出 info 级别日志
func (l *Logger) Info(args ...interface{}) {
	l.write("INFO", args...)
}

// Error 输出 error 级别日志
func (l *Logger) Error(args ...interface{}) {
	l.write("ERROR", args...)
}

// Debug 输出 debug 级别日志
func (l *Logger) Debug(args ...interface{}) {
	l.write("DEBUG", args...)
}

// 获取底层 logger 实例
func (l *Logger) GetLogger() *log.Logger {
	return l.logger
}
