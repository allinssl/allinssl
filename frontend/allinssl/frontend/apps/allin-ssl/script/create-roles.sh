#!/bin/bash

# 遇到错误时退出
set -e

# 显示帮助信息
show_help() {
    echo "使用方法: ./create-roles.sh [选项]"
    echo "选项:"
    echo "  -h, --help                显示帮助信息"
    echo
    echo "此脚本在 src/views 目录下创建角色管理相关的 Vue3 TSX 路由视图结构"
    echo "将生成以下结构:"
    echo "src/views/<角色名称>"
    echo "├── index.tsx  # 入口文件"
    echo "├── useController.ts  # 控制器"
    echo "├── useStore.ts  # 状态管理"
    echo "├── index.module.css  # 样式文件"
    echo "├── types.d.ts  # 类型定义"
    echo "├── children/  # 子路由"
    echo "│   └── permissions  # 权限管理子路由"
    echo "│       ├── index.tsx  # 视图"
    echo "│       ├── index.module.css  # 样式"
    echo "│       ├── useController.ts  # 控制器"
    echo "│       ├── useStore.ts  # 状态管理"
    echo "│       └── types.d.ts  # 类型定义"
    echo "└── components/  # 组件"
    echo "    └── role-form  # 角色表单组件"
    echo "        ├── index.tsx  # 视图"
    echo "        ├── index.module.css  # 样式"
    echo "        ├── useController.ts  # 控制器"
    echo "        ├── useStore.ts  # 状态管理"
    echo "        └── types.d.ts  # 类型定义"
    echo
    echo "同时会创建:"
    echo "src/api/<角色名称>.ts  # API 文件"
    echo "src/types/<角色名称>.d.ts  # 类型定义文件"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "错误: 未知参数 $1"
            show_help
            exit 1
            ;;
    esac
done

# 交互式选择函数
select_option() {
    local prompt="$1"
    local options=("是" "否")
    local selected
    
    echo "$prompt"
    select choice in "${options[@]}"; do
        case $REPLY in
            1|2)
                selected=$choice
                break
                ;;
            *) 
                echo "请选择有效的选项 [1-2]"
                ;;
        esac
    done
    
    [[ "$selected" == "是" ]] && return 0 || return 1
}

# 交互式输入路由名称
read -p "请输入路由名称 (routerName): " ROUTER_NAME
if [ -z "$ROUTER_NAME" ]; then
    echo "错误: 路由名称不能为空"
    exit 1
fi

# 询问是否创建子路由
if select_option "是否创建子路由?"; then
    read -p "请输入子路由名称 [默认: list]: " CHILD_ROUTER_NAME
    CHILD_ROUTER_NAME=${CHILD_ROUTER_NAME:-"list"}
    echo "将创建子路由: $CHILD_ROUTER_NAME"
else
    CHILD_ROUTER_NAME=""
    echo "不创建子路由"
fi

# 询问是否创建组件
if select_option "是否创建组件?"; then
    read -p "请输入组件名称 [默认: todo-form]: " COMPONENT_NAME
    COMPONENT_NAME=${COMPONENT_NAME:-"todo-form"}
    echo "将创建组件: $COMPONENT_NAME"
else
    COMPONENT_NAME=""
    echo "不创建组件"
fi

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# 获取项目根目录
PROJECT_ROOT="$SCRIPT_DIR/../"

# 创建目录函数
create_dir() {
    local dir="$1"
    mkdir -p "$PROJECT_ROOT/$dir"
}

# 确保必需的目录存在
create_dir "src/views"
create_dir "src/api"
create_dir "src/types"

# 创建主目录结构
create_dir "src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME"
create_dir "src/views/$ROUTER_NAME/components/$COMPONENT_NAME"

# 创建 API 文件
cat > "$PROJECT_ROOT/src/api/${ROUTER_NAME}.ts" << ''

# 创建类型定义文件
cat > "$PROJECT_ROOT/src/types/${ROUTER_NAME}.d.ts" << ''

# 创建主路由类型文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/types.d.ts" << EOL
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface TodoState {
  todos: Todo[]
  loading: boolean
  error: string | null
}
EOL

# 创建主路由状态管理文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/useStore.ts" << EOL
import { defineStore } from '@baota/pinia'
import { ref } from 'vue'
import type { Todo, TodoState } from './types'

const store = defineStore('todo-store', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const addTodo = (title: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    }
    todos.value.push(newTodo)
  }

  const toggleTodo = (id: string) => {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  const removeTodo = (id: string) => {
    todos.value = todos.value.filter(t => t.id !== id)
  }

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    removeTodo
  }
})

export const useStore = () => store()
EOL

# 创建主路由控制器文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/useController.ts" << EOL
import { onMounted } from 'vue'
import { storeToRefs } from '@baota/pinia'
import { useStore } from './useStore'

export const useController = () => {
  const store = useStore()
  const { todos, loading, error } = storeToRefs(store)

  const handleAddTodo = (title: string) => {
    if (title.trim()) {
      store.addTodo(title.trim())
    }
  }

  const handleToggleTodo = (id: string) => {
    store.toggleTodo(id)
  }

  const handleRemoveTodo = (id: string) => {
    store.removeTodo(id)
  }

  onMounted(() => {
    // 可以在这里加载初始数据
    console.log('Todo List Component Mounted')
  })

  return {
    todos,
    loading,
    error,
    handleAddTodo,
    handleToggleTodo,
    handleRemoveTodo
  }
}
EOL

# 创建主路由样式文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/index.module.css" << EOL
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 24px;
  text-align: center;
}

.title {
  font-size: 32px;
  color: #2c3e50;
}

.form {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.button {
  padding: 8px 16px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.button:hover {
  background: #3aa876;
}

.todoList {
  list-style: none;
  padding: 0;
}

.todoItem {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.todoCheckbox {
  margin-right: 12px;
}

.todoTitle {
  flex: 1;
}

.todoTitle.completed {
  text-decoration: line-through;
  color: #999;
}

.deleteButton {
  padding: 4px 8px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.deleteButton:hover {
  background: #ff3748;
}
EOL

# 创建主路由入口文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/index.tsx" << EOL
import { defineComponent, ref } from 'vue'
import { useController } from './useController'
import styles from './index.module.css'

export default defineComponent({
  name: 'TodoList',
  
  setup() {
    const { todos, handleAddTodo, handleToggleTodo, handleRemoveTodo } = useController()
    const newTodo = ref('')

    const onSubmit = (e: Event) => {
      e.preventDefault()
      handleAddTodo(newTodo.value)
      newTodo.value = ''
    }

    return () => (
      <div class={styles.container}>
        <header class={styles.header}>
          <h1 class={styles.title}>Todo List</h1>
        </header>

        <form class={styles.form} onSubmit={onSubmit}>
          <input
            class={styles.input}
            type="text"
            v-model={newTodo.value}
            placeholder="添加新任务..."
          />
          <button class={styles.button} type="submit">
            添加
          </button>
        </form>

        <ul class={styles.todoList}>
          {todos.value.map(todo => (
            <li key={todo.id} class={styles.todoItem}>
              <input
                type="checkbox"
                class={styles.todoCheckbox}
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
              />
              <span class={[
                styles.todoTitle,
                todo.completed && styles.completed
              ]}>
                {todo.title}
              </span>
              <button
                class={styles.deleteButton}
                onClick={() => handleRemoveTodo(todo.id)}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
})
EOL

# 在脚本开头添加大写转换函数
to_upper_first() {
    local str="$1"
    local first_char=$(echo "${str:0:1}" | tr '[:lower:]' '[:upper:]')
    echo "$first_char${str:1}"
}

# 存储转换后的变量
ROUTER_NAME_PASCAL=$(to_upper_first "$ROUTER_NAME")

# 创建表单组件类型文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME/types.d.ts" << EOL
import type { ${ROUTER_NAME_PASCAL}Data } from '@/types/${ROUTER_NAME}'

export interface FormProps {
  data?: ${ROUTER_NAME_PASCAL}Data | null
}

export interface FormEmits {
  (e: 'submit', data: ${ROUTER_NAME_PASCAL}Data): void
  (e: 'cancel'): void
}
EOL

# 创建表单组件状态管理文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME/useStore.ts" << EOL
import { defineStore } from '@baota/pinia'
import { ref } from 'vue'
import type { ${ROUTER_NAME_PASCAL}Data } from '@/types/${ROUTER_NAME}'

// 定义 store
const store = defineStore('${ROUTER_NAME}-form-store', () => {
  const loading = ref(false)
  const formData = ref<${ROUTER_NAME_PASCAL}Data>({
    id: '',
    name: '',
    code: '',
    description: '',
    permissions: [],
    createdAt: '',
    updatedAt: ''
  })

  return {
    loading,
    formData
  }
})

export const useStore = () => store()
EOL

# 创建表单组件控制器文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME/useController.ts" << EOL
import { onMounted } from 'vue'
import { storeToRefs } from '@baota/pinia'
import { useStore } from './useStore'
import type { ${ROUTER_NAME_PASCAL}Data } from '@/types/${ROUTER_NAME}'

export const useController = (initialData?: ${ROUTER_NAME_PASCAL}Data | null) => {
  const store = useStore()
  const storeRef = storeToRefs(store)

  onMounted(() => {
    if (initialData) {
      store.formData = { ...initialData }
    }
  })

  return {
    ...storeRef
  }
}
EOL

# 创建表单组件样式文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME/index.module.css" << EOL
.form {
  max-width: 600px;
}

.formTitle {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 24px;
}

.formItem {
  margin-bottom: 16px;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.3s;
}

.input:hover {
  border-color: #40a9ff;
}

.input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.textarea {
  composes: input;
  min-height: 100px;
  resize: vertical;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  transition: all 0.3s;
}

.button:hover {
  background: #f5f5f5;
}

.primaryButton {
  composes: button;
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.primaryButton:hover {
  background: #40a9ff;
}
EOL

# 创建表单组件入口文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME/index.tsx" << EOL
import { defineComponent } from 'vue'
import { useController } from './useController'
import type { FormProps, FormEmits } from './types'
import styles from './index.module.css'

export default defineComponent({
  name: 'RoleForm',

  props: {
    data: {
      type: Object as PropType<FormProps['data']>,
      default: null
    }
  },

  emits: ['submit', 'cancel'],
  
  setup(props, { emit }) {
    const { formData } = useController(props.data)

    const handleSubmit = (e: Event) => {
      e.preventDefault()
      emit('submit', formData.value)
    }

    return () => (
      <form class={styles.form} onSubmit={handleSubmit}>
        <h3 class={styles.formTitle}>
          {props.data ? '编辑角色' : '创建角色'}
        </h3>

        <div class={styles.formItem}>
          <label class={styles.label}>角色名称</label>
          <input
            class={styles.input}
            type="text"
            v-model={formData.value.name}
            placeholder="请输入角色名称"
            required
          />
        </div>

        <div class={styles.formItem}>
          <label class={styles.label}>角色代码</label>
          <input
            class={styles.input}
            type="text"
            v-model={formData.value.code}
            placeholder="请输入角色代码"
            required
          />
        </div>

        <div class={styles.formItem}>
          <label class={styles.label}>描述</label>
          <textarea
            class={styles.textarea}
            v-model={formData.value.description}
            placeholder="请输入角色描述"
          />
        </div>

        <div class={styles.actions}>
          <button
            type="button"
            class={styles.button}
            onClick={() => emit('cancel')}
          >
            取消
          </button>
          <button type="submit" class={styles.primaryButton}>
            确定
          </button>
        </div>
      </form>
    )
  }
})
EOL

# 创建子路由类型文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME/types.d.ts" << EOL
import type { ${ROUTER_NAME_PASCAL}Data } from '@/types/${ROUTER_NAME}'

export interface Permission {
  code: string
  name: string
  description?: string
}

export interface PermissionState {
  loading: boolean
  data: ${ROUTER_NAME_PASCAL}Data | null
  permissions: Permission[]
  selectedPermissions: string[]
}
EOL

# 创建子路由状态管理文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME/useStore.ts" << EOL
import { defineStore } from '@baota/pinia'
import { ref } from 'vue'
import type { ${ROUTER_NAME_PASCAL}Data } from '@/types/${ROUTER_NAME}'
import type { Permission } from './types'

// 定义 store
const store = defineStore('${ROUTER_NAME}-permissions-store', () => {
  const loading = ref(false)
  const data = ref<${ROUTER_NAME_PASCAL}Data | null>(null)
  const permissions = ref<Permission[]>([])
  const selectedPermissions = ref<string[]>([])

  return {
    loading,
    data,
    permissions,
    selectedPermissions
  }
})

// 导出 store
export const useStore = () => store()
EOL

# 创建子路由控制器文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME/useController.ts" << EOL
import { onMounted } from 'vue'
import { storeToRefs } from '@baota/pinia'
import { useStore } from './useStore'
import { get${ROUTER_NAME_PASCAL}Data } from '@/api/${ROUTER_NAME}'

export const useController = (roleId: string) => {
  const store = useStore()
  const storeRef = storeToRefs(store)

  const fetchData = async () => {
    try {
      store.loading = true
      const data = await get${ROUTER_NAME_PASCAL}Data(roleId)
      store.data = data
      store.selectedPermissions = data.permissions
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      store.loading = false
    }
  }

  const handleSave = async () => {
    try {
      store.loading = true
      // 调用保存API
      store.loading = false
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  onMounted(() => {
    fetchData()
  })

  return {
    ...storeRef,
    handleSave
  }
}
EOL

# 创建子路由样式文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME/index.module.css" << EOL
.container {
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 24px;
}

.permissionList {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.permissionItem {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  transition: all 0.3s;
}

.button:hover {
  background: #f5f5f5;
}

.primaryButton {
  composes: button;
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.primaryButton:hover {
  background: #40a9ff;
}
EOL

# 创建子路由入口文件
cat > "$PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME/index.tsx" << EOL
import { defineComponent } from 'vue'
import { useRoute, useRouter } from '@baota/router'
import { useController } from './useController'
import styles from './index.module.css'

export default defineComponent({
  name: 'RolePermissions',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const roleId = route.params.id as string
    
    const {
      loading,
      data,
      permissions,
      selectedPermissions,
      handleSave
    } = useController(roleId)

    const handleCancel = () => {
      router.push('/${ROUTER_NAME}')
    }

    return () => (
      <div class={styles.container}>
        <div class={styles.header}>
          <h1 class={styles.title}>权限设置</h1>
        </div>

        <div class={styles.content}>
          {loading.value ? (
            <div class={styles.loading}>加载中...</div>
          ) : (
            <>
              <h2>{data.value?.name} - 权限配置</h2>

              <div class={styles.permissionList}>
                {permissions.value.map(permission => (
                  <label
                    key={permission.code}
                    class={styles.permissionItem}
                  >
                    <input
                      type="checkbox"
                      value={permission.code}
                      v-model={selectedPermissions.value}
                    />
                    <span>{permission.name}</span>
                  </label>
                ))}
              </div>

              <div class={styles.actions}>
                <button
                  class={styles.button}
                  onClick={handleCancel}
                >
                  取消
                </button>
                <button
                  class={styles.primaryButton}
                  onClick={handleSave}
                >
                  保存
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
})
EOL

echo "✨ 文件结构生成成功！"
echo "📁 主路由: $PROJECT_ROOT/src/views/$ROUTER_NAME"
echo "📁 子路由: $PROJECT_ROOT/src/views/$ROUTER_NAME/children/$CHILD_ROUTER_NAME"
echo "📁 组件: $PROJECT_ROOT/src/views/$ROUTER_NAME/components/$COMPONENT_NAME"
echo "📄 API文件: $PROJECT_ROOT/src/api/${ROUTER_NAME}.ts"
echo "📄 类型文件: $PROJECT_ROOT/src/types/${ROUTER_NAME}.d.ts"
echo
echo "目录结构:"
echo "├── src/views/$ROUTER_NAME"
echo "│   ├── index.tsx"
echo "│   ├── useController.ts"
echo "│   ├── useStore.ts"
echo "│   ├── index.module.css"
echo "│   ├── types.d.ts"
echo "│   ├── children"
echo "│   │   └── $CHILD_ROUTER_NAME"
echo "│   │       ├── index.tsx"
echo "│   │       ├── index.module.css"
echo "│   │       ├── useController.ts"
echo "│   │       ├── useStore.ts"
echo "│   │       └── types.d.ts"
echo "│   └── components"
echo "│       └── $COMPONENT_NAME"
echo "│           ├── index.tsx"
echo "│           ├── index.module.css"
echo "│           ├── useController.ts"
echo "│           ├── useStore.ts"
echo "│           └── types.d.ts"
echo "├── src/api"
echo "│   └── ${ROUTER_NAME}.ts"
echo "└── src/types"
echo "    └── ${ROUTER_NAME}.d.ts" 