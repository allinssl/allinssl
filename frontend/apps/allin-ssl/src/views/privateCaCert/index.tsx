import { defineComponent } from "vue";
import { NButton, NSelect } from "naive-ui";
import { useThemeCssVar } from "@baota/naive-ui/theme";

import { useController } from "./useController";
import BaseComponent from "@components/BaseLayout";
import EmptyState from "@components/TableEmptyState";
import { useStore } from "./useStore";

const batchActionOptions = [
	{ label: "删除", value: "delete" },
	{ label: "吊销", value: "revoke" },
];

export default defineComponent({
	name: "PrivateCaCert",
	setup() {
		const {
				TableComponent,
				PageComponent,
				SearchComponent,
				getRowClassName,
				openCreateLeafCertModal,
				handleCaIdChange,
				checkedRowKeysRef,
				handleCheck,
				batchActionRef,
				handleBatchAction,
			} = useController();
		const { intermediateCaList, getIntermediateCaList } = useStore();

		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover']);

		onMounted(async () => {
			await getIntermediateCaList();
		});
		return () => (
      <div class="h-full flex flex-col" style={cssVar.value}>
        <div class="mx-auto max-w-[1600px] w-full p-6">
          <BaseComponent
            v-slots={{
              headerLeft: () => (
                <NButton
                  type="primary"
                  size="large"
                  class="gradient-primary-btn px-5"
                  onClick={openCreateLeafCertModal}
                >
                  签发证书
                </NButton>
              ),
              headerRight: () => (
                <div class="flex items-center gap-2 flex-1">
                  <NSelect
                    options={[
                      { label: "全部", value: "" },
                      ...(intermediateCaList.value || []).map((item) => ({
                        label: item.name,
                        value: item.id,
                      })),
                    ]}
                    placeholder="请选择中间证书"
                    size="large"
                    style={{ width: "180px" }}
                    defaultValue={""}
                    onUpdateValue={handleCaIdChange}
                  />
                  <SearchComponent
				    class="header-search"
                    placeholder="请输入名称搜索"
                    style={{ width: "240px" }}
                  />
                </div>
              ),
              content: () => (
                <div class="rounded-lg">
                  <TableComponent
                    size="medium"
                    rowClassName={getRowClassName}
                    checkedRowKeys={checkedRowKeysRef.value}
                    onUpdateCheckedRowKeys={handleCheck}
                    rowKey={(row: any) => row.id.toString()}
                    v-slots={{
                      empty: () => (
                        <EmptyState
                          addButtonText="签发证书"
                          onAddClick={openCreateLeafCertModal}
                        />
                      ),
                    }}
                  />
                </div>
              ),
              footerRight: () => (
                <div class="mt-4 flex justify-end">
                  <PageComponent />
                </div>
              ),
              footerLeft: () => (
                <div class="mt-4 flex items-center gap-3">
                  <NSelect
                    v-model:value={batchActionRef.value}
                    options={batchActionOptions}
                    style={{ width: "120px" }}
                    disabled={checkedRowKeysRef.value.length === 0}
                    size="small"
                  />
                  <NButton
                    size="small"
                    type="primary"
                    disabled={checkedRowKeysRef.value.length === 0}
                    onClick={handleBatchAction}
                  >
                    批量操作
                  </NButton>
                  <span class="text-gray-500">
                    已选中 {checkedRowKeysRef.value.length} 项
                  </span>
                </div>
              ),
            }}
          ></BaseComponent>
        </div>
      </div>
    );
	},
});