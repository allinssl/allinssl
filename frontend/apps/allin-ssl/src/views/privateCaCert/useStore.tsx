import { ref } from 'vue';
import { getCaList, getLeafCertList } from '@/api/ca';
import type { GetLeafCertListParams } from '@/types/ca';
import { useError } from "@baota/hooks/error";
import type { 
	CertItem, 
	IntermediateCa, 
	LeafCertTableResponse,
	FetchLeafCertListFunction 
} from './types';
import type { TableResponse } from '@baota/naive-ui/types/table';

const { handleError } = useError();

// 状态管理
export const useStore = () => {
	// 中间证书列表
	const intermediateCaList = ref<IntermediateCa[]>([]);
	
	/**
	 * 获取叶子证书列表
	 * @description 根据分页参数获取叶子证书列表数据
	 * @param {GetLeafCertListParams} params - 查询参数
	 * @returns {Promise<TableResponse<CertItem>>} 返回列表数据和总数
	 */
	const fetchLeafCertList = async (params: GetLeafCertListParams): Promise<TableResponse<CertItem>> => {
		try {
      const { data, count } = await getLeafCertList(params).fetch();
      return {
        list: (data || []) as unknown as CertItem[],
        total: count,
      };
    } catch (error) {
      handleError(error);
      return { list: [] as CertItem[], total: 0 };
    }
	};

	const getIntermediateCaList = async () => {
		try {
			const { fetch, data } = getCaList({
        p: "-1",
        limit: "-1",
        level: "intermediate",
			});
			await fetch();
			if (data.value?.status === true) {
				intermediateCaList.value = data.value.data;
				return data.value.data;
			}
		} catch (error) {
			console.error('获取中间证书列表失败:', error);
		}
	};

	return {
		intermediateCaList,
		fetchLeafCertList,
		getIntermediateCaList
	};
};
