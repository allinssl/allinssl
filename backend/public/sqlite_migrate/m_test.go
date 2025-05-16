package sqlite_migrate

import (
	"fmt"
	"os"
	"testing"
)

func Test(t *testing.T) {
	err := os.Chdir("D:/code/ALLinSSL")
	if err != nil {
		fmt.Fprintf(os.Stderr, "切换目录失败: %v\n", err)
		os.Exit(1)
	}
	err = EnsureDatabaseWithTables(
		"data/111.db",
		"data/data.db",
		[]string{"1111"}, // 你要迁移的表
	)
	if err != nil {
		fmt.Println("错误:", err)
	}
}
