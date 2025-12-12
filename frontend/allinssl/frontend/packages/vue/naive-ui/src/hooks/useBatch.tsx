import { ref, computed, type Ref } from 'vue'
import { NButton, NSelect, NCheckbox } from 'naive-ui'
import { translation, TranslationLocale, TranslationModule } from '../locals/translation'

interface BatchOptions {
	label: string
	value: string
	callback?: (rows: Ref<any[]>, rowKeys: Ref<(string | number)[]>) => void
}

/**
 * 批量操作表格 Hook
 * @param options 表格配置选项
 * @returns 表格实例，包含批量操作相关功能
 */
export default function useBatchTable<T = any>(tableOptions: any, batchOptions: BatchOptions[]) {
	// 获取当前语言
	const currentLocale = localStorage.getItem('locale-active') || 'zhCN'
	// 获取翻译文本
	const hookT = (key: string, params?: string) => {
		const locale = currentLocale.replace('-', '_').replace(/"/g, '') as TranslationLocale
		const translationFn =
			(translation[locale as TranslationLocale] as TranslationModule).useForm[
				key as keyof TranslationModule['useForm']
			] || translation.zhCN.useForm[key as keyof typeof translation.zhCN.useForm]
		return typeof translationFn === 'function' ? translationFn(params || '') : translationFn
	}

	// 表格组件
	const { TableComponent, tableRef, ...tableAttrs } = useTable(tableOptions)
	const batchTableRef = ref<any>(null)
	// 选中项状态
	const selectedRows = ref<T[]>([])
	const selectedRowKeys = ref<(string | number)[]>([])
	const totalData = computed(() => batchTableRef.value?.data || [])

	// 计算全选状态
	const isAllSelected = computed(() => {
		return totalData.value.length > 0 && selectedRowKeys.value.length === totalData.value.length
	})

	// 计算半选状态
	const isIndeterminate = computed(() => {
		return selectedRowKeys.value.length > 0 && selectedRowKeys.value.length < totalData.value.length
	})

	/**
	 * 处理选择变化
	 * @param rowKeys 选中的行键值
	 * @param rows 选中的行数据
	 */
	const handleSelectionChange: any = (rowKeys: (string | number)[], rows: T[]) => {
		selectedRowKeys.value = rowKeys
		selectedRows.value = rows
	}

	/**
	 * 处理全选变化
	 */
	const handleCheckAll = (checked: boolean) => {
		if (checked) {
			selectedRows.value = [...totalData.value]
			selectedRowKeys.value = totalData.value.map((item: T) => batchTableRef.value.rowKey(item))
		} else {
			clearSelection()
		}
	}

	/**
	 * 获取表格组件
	 */
	const BatchTableComponent = (props: any, context: any) => {
		return TableComponent(
			{
				ref: batchTableRef,
				rowKey: (row: T) => (row as any).id,
				checkedRowKeys: selectedRowKeys.value,
				onUpdateCheckedRowKeys: handleSelectionChange,
				...props,
			},
			context,
		)
	}

	/**
	 * 批量操作组件
	 */
	const selectedAction = ref<string | null>(null)

	const BatchOperationComponent = () => {
		const setValue = (value: string) => {
			selectedAction.value = value
		}

		const startBatch = async () => {
			const option = batchOptions.find((item) => item.value === selectedAction.value)
			if (option) {
				const batchStatus = await option.callback?.(selectedRows, selectedRowKeys)
				if (batchStatus) {
					// 重置选择
					selectedAction.value = null
					clearSelection()
				}
			}
		}

		return (
			<div class="batch-operation" style="display: flex; align-items: center; gap: 16px;">
				<NCheckbox
					checked={isAllSelected.value}
					indeterminate={isIndeterminate.value}
					onUpdateChecked={handleCheckAll}
				></NCheckbox>

				<NSelect
					options={batchOptions}
					value={selectedAction.value}
					onUpdateValue={setValue}
					placeholder={hookT('placeholder')}
					style="width: 120px"
					disabled={selectedRows.value.length === 0}
				/>
				<NButton type="primary" disabled={selectedRows.value.length === 0} onClick={startBatch}>
					{hookT('startBatch')}
				</NButton>
				<span>{hookT('selectedItems')(selectedRows.value.length)}</span>
			</div>
		)
	}

	/**
	 * 清空选择
	 */
	const clearSelection = () => {
		selectedRowKeys.value = []
		selectedRows.value = []
	}

	return {
		selectedRows,
		clearSelection,
		BatchTableComponent,
		BatchOperationComponent,
		...tableAttrs,
		tableRef: batchTableRef,
	}
}
