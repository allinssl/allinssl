import { defineComponent, ref, computed, watch } from 'vue';
import { NForm, NFormItem, NInput, NSelect, NSpace, NButton, FormRules, useMessage } from 'naive-ui';
import { useStore } from '../useStore';
import { useAddCaController } from '../useController';
import { useModalClose } from '@baota/naive-ui/hooks';

/**
 * 添加CA模态框组件
 */
export default defineComponent({
	emits: ['success'],
	setup(props, { emit }) {
		const { addForm, resetAddForm, createType, rootCaList } = useStore();
		const message = useMessage();
		const closeModal = useModalClose();
		
		// 表单引用
		const formRef = ref();
		
		// 有效期单位选择
		const validityUnit = ref<'day' | 'year'>('day');
		
		// 使用表单控制器
		const { handleSubmit } = useAddCaController();
		
		// 表单验证规则
		const rules = computed((): FormRules => {
			const baseRules: any = {
				name: [
					{ required: true, message: '请输入CA名称', trigger: 'blur' }
				],
				cn: [
					{ required: true, message: '请输入通用名称', trigger: 'blur' }
				],
				o: [
					{ required: true, message: '请输入组织名称', trigger: 'blur' }
				],
				c: [
					{ required: true, message: '请选择国家', trigger: 'change' }
				],
				ou: [
					{ required: true, message: '请输入组织单位', trigger: 'blur' }
				],
				province: [
					{ required: true, message: '请输入省份', trigger: 'blur' }
				],
				locality: [
					{ required: true, message: '请输入城市', trigger: 'blur' }
				],
				key_length: [
					{ required: true, message: '请选择密钥长度', trigger: 'change' }
				],
				valid_days: [
					{ required: true, message: '请选择有效期', trigger: 'change' }
				]
			};

			if (createType.value === 'root') {
				baseRules.algorithm = [
					{ required: true, message: '请选择加密算法', trigger: 'change' }
				];
			}

			if (createType.value === 'intermediate') {
				baseRules.root_id = [
					{ required: true, message: '请选择父级CA', trigger: 'change' }
				];
			}

			return baseRules;
		});

		// 算法选项
		const algorithmOptions = [
			{ label: "ECDSA", value: "ecdsa" },
			{ label: "RSA", value: "rsa" },
			{ label: "SM2", value: "sm2" },
		];

		const keyLengthOptions = computed(() => {
			switch (addForm.value.algorithm) {
				case 'ecdsa':
					return [
						{ label: "P-256 (256 bit)", value: "256" },
						{ label: "P-384 (384 bit)", value: "384" },
						{ label: "P-521 (521 bit)", value: "521" },
					];
				case 'rsa':
					return [
						{ label: "2048 bit", value: "2048" },
						{ label: "3072 bit", value: "3072" },
						{ label: "4096 bit", value: "4096" },
					];
				case 'sm2':
					return [
						{ label: "SM2 (256 bit)", value: "256" },
					];
				default:
					return [];
			}
		});

		// 国家选项
		const countryOptions = [
			{ label: "中国", value: "CN" },
			{ label: "美国", value: "US" },
			{ label: "日本", value: "JP" },
			{ label: "德国", value: "DE" },
			{ label: "英国", value: "GB" },
		];

		// 监听算法变化，重置密钥长度选择
		watch(() => addForm.value.algorithm, (newAlgorithm) => {
			addForm.value.key_length = '';
			if (newAlgorithm === 'ecdsa') {
				addForm.value.key_length = '256';
			} else if (newAlgorithm === 'sm2') {
				addForm.value.key_length = '256';
			} else if (newAlgorithm === 'rsa') {
				addForm.value.key_length = '2048';
			}
		});

		// 监听父级CA选择，自动填充算法值
		watch(() => addForm.value.root_id, (newRootId) => {
			if (createType.value === 'intermediate' && newRootId) {
				const selectedRootCa = rootCaList.value.find(ca => ca.id.toString() === newRootId);
				if (selectedRootCa) {
					addForm.value.algorithm = selectedRootCa.algorithm;
					if (selectedRootCa.algorithm === 'ecdsa') {
						addForm.value.key_length = '256';
					} else if (selectedRootCa.algorithm === 'sm2') {
						addForm.value.key_length = '256';
					} else if (selectedRootCa.algorithm === 'rsa') {
						addForm.value.key_length = '2048';
					}
				}
			}
		});

		// 处理表单提交
		const handleFormSubmit = async () => {
			try {
				// 先验证表单
				await formRef.value?.validate();
				const formData = { ...addForm.value };
				if (validityUnit.value === 'year' && formData.valid_days) {
					const years = parseInt(formData.valid_days);
					if (!isNaN(years)) {
						formData.valid_days = (years * 365).toString();
					}
				}
				const success = await handleSubmit(formData);
				if (success) {
					resetAddForm();
					closeModal();
					return true;
				}
			} catch (error) {
				console.error('表单验证失败:', error);
			}
			return false;
		};
		
		// 处理取消操作
		const handleCancel = () => {
			resetAddForm();
			closeModal();
		};

		return () => (
      <NForm
        ref={formRef}
        model={addForm.value}
        rules={rules.value}
        labelPlacement="left"
        labelWidth="auto"
        requireMarkPlacement="right-hanging"
      >
        <NFormItem label="CA名称" path="name" required>
          <NInput
            v-model:value={addForm.value.name}
            placeholder="请输入CA名称"
          />
        </NFormItem>

        <NFormItem label="通用名称(CN)" path="cn" required>
          <NInput
            v-model:value={addForm.value.cn}
            placeholder="请输入通用名称"
          />
        </NFormItem>

        <NFormItem label="组织(O)" path="o" required>
          <NInput
            v-model:value={addForm.value.o}
            placeholder="请输入组织名称"
          />
        </NFormItem>

        <NFormItem label="国家(C)" path="c" required>
          <NSelect
            v-model:value={addForm.value.c}
            options={countryOptions}
            placeholder="请选择国家"
          />
        </NFormItem>

        <NFormItem label="组织单位(OU)" path="ou" required>
          <NInput
            v-model:value={addForm.value.ou}
            placeholder="请输入组织单位"
          />
        </NFormItem>

        <NFormItem label="省份" path="province" required>
          <NInput
            v-model:value={addForm.value.province}
            placeholder="请输入省份"
          />
        </NFormItem>

        <NFormItem label="城市" path="locality" required>
          <NInput
            v-model:value={addForm.value.locality}
            placeholder="请输入城市"
          />
        </NFormItem>

        {createType.value === "intermediate" && (
          <NFormItem label="父级CA" path="root_id" required>
            <NSelect
              v-model:value={addForm.value.root_id}
              options={rootCaList.value.map((ca) => ({
                label: ca.name,
                value: ca.id.toString(),
                algorithm: ca.algorithm,
                key_length: ca.key_length,
                not_after: ca.not_after,
              }))}
              placeholder="请选择父级CA"
            />
          </NFormItem>
        )}

        <NFormItem label="加密算法" path="algorithm" required>
          <NSelect
            v-model:value={addForm.value.algorithm}
            options={algorithmOptions}
            placeholder="请选择加密算法"
            disabled={createType.value === "intermediate"}
          />
        </NFormItem>

        <NFormItem label="密钥长度" path="key_length" required>
          <NSelect
            v-model:value={addForm.value.key_length}
            options={keyLengthOptions.value}
            placeholder="请选择密钥长度"
            disabled={createType.value === "root" && !addForm.value.algorithm}
          />
        </NFormItem>

        <NFormItem label="有效期" path="valid_days" required>
          <NSpace align="center">
            <NInput
              v-model:value={addForm.value.valid_days}
              placeholder="请输入数值"
            />
            <NSelect
              v-model:value={validityUnit.value}
              options={[
                { label: '天', value: 'day' },
                { label: '年', value: 'year' }
              ]}
              style={{ width: '80px' }}
            />
          </NSpace>
        </NFormItem>

        <div class="flex justify-end gap-3 mt-6">
          <NButton onClick={handleCancel}>取消</NButton>
          <NButton type="primary" onClick={handleFormSubmit}>
            确定
          </NButton>
        </div>
      </NForm>
    );
	},
});
