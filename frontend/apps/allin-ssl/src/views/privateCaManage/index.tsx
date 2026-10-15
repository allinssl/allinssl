import { defineComponent, ref } from "vue";
import { NButton, NDropdown, NIcon, NSelect } from "naive-ui";
import { useThemeCssVar } from "@baota/naive-ui/theme";
import { $t } from "@locales/index";
import { AddOutline, ChevronDown } from "@vicons/ionicons5";

import { useController } from "./useController";
import { useStore } from "./useStore";
import BaseComponent from "@components/BaseLayout";
import EmptyState from "@components/TableEmptyState";
import styles from "./index.module.css";

/**
 * 私有CA管理组件
 * @description 提供私有CA的管理界面，包括列表展示、搜索、添加、编辑等功能
 */
export default defineComponent({
	name: "PrivateCa",
	setup() {
		const { 
			TableComponent, 
			PageComponent, 
			SearchComponent,
			checkedRowKeysRef,
			handleBatchDelete,
			openAddModal, 
			getRowClassName,
		} = useController();
		const { setCreateType } = useStore();
		const dropdownOptions = [
			{
				label: '创建根CA',
				key: 'root',
				onClick: () => {
					setCreateType('root');
					openAddModal();
				}
			},
			{
				label: '创建中间CA',
				key: 'intermediate',
				onClick: () => {
					setCreateType('intermediate');
					openAddModal();
				}
			}
		];

		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover']);

		return () => (
			<div class={`h-full flex flex-col ${styles.privateCa}`} style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NDropdown
									trigger="click"
									options={dropdownOptions}
									onSelect={(key) => {
										const option = dropdownOptions.find(opt => opt.key === key);
										option?.onClick();
									}}
									show-arrow={false}
									width={100}
								>
									<NButton type="primary" size="large" class="gradient-primary-btn px-5">	
										创建CA
										<NIcon size="20" class="ml-2">
											<ChevronDown />
										</NIcon>
									</NButton>
								</NDropdown>
							),
							headerRight: () => <SearchComponent class="header-search" placeholder="请输入名称搜索" />,
							content: () => (
								<div class="rounded-lg">
									<TableComponent
										checkedRowKeys={checkedRowKeysRef.value}
										onUpdateCheckedRowKeys={(keys) => { checkedRowKeysRef.value = keys as string[]; }}
										rowKey={(row) => row.id.toString()}
										size="medium"
										rowClassName={getRowClassName}
										v-slots={{
											empty: () => <EmptyState addButtonText="添加CA" onAddClick={openAddModal} />,
										}}
									/>
								</div>
							),
							footerLeft: () => (
								<div class="mt-4 flex items-center gap-3">
									<NSelect value="delete" options={[{ label: '删除', value: 'delete' }]} style={{ width: '120px' }} disabled={checkedRowKeysRef.value.length === 0} size="small" />
									<NButton size="small" type="primary" disabled={checkedRowKeysRef.value.length === 0} onClick={handleBatchDelete}>批量操作</NButton>
									<span class="text-gray-500">已选中 {checkedRowKeysRef.value.length} 项</span>
								</div>
							),
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<PageComponent />
								</div>
							),
						}}
					></BaseComponent>
				</div>
			</div>
		);
	},
});
