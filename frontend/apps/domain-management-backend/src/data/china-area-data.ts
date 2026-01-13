/**
 * 中国省市区级联数据
 * 包含省级、市级和区县级三级数据
 */
import { CascaderOption } from "naive-ui";
import chinaAreaDataJson from "./china-area-data.json";

/**
 * 获取中国省市区级联数据
 * @returns 中国省市区级联数据
 */
export function getChinaAreaData(): CascaderOption[] {
  return chinaAreaDataJson as CascaderOption[];
}

/**
 * 根据城市ID获取对应的城市名称字符串
 * @param cityId 城市ID，例如 "110101"
 * @param options 配置选项
 * @param options.separator 地址分隔符，默认为空格
 * @param options.fullAddress 是否返回完整地址（包含省市区），默认为false
 * @param options.removeDuplicates 是否去除重复的地址部分，默认为false
 * @returns 城市名称字符串，例如 "东城区" 或 "北京市 北京市 东城区"
 */
export function getCityNamesByCityId(
  cityId: string,
  options?: {
    separator?: string;
    fullAddress?: boolean;
    removeDuplicates?: boolean;
  },
): string {
  if (!cityId) return "";

  const {
    separator = " ",
    fullAddress = false,
    removeDuplicates = false,
  } = options || {};

  const areaData = getChinaAreaData();
  const currentLevel = areaData;
  let currentItem: CascaderOption | undefined;

  // 如果不需要完整地址，直接查找并返回匹配的城市名称
  if (!fullAddress) {
    // 查找匹配的城市ID
    currentItem = currentLevel.find((item) => item.value === cityId);

    if (currentItem) {
      return currentItem.label as string;
    }

    // 如果在第一级没找到，尝试在第二级查找
    for (const province of areaData) {
      if (province.children) {
        currentItem = (province.children as CascaderOption[]).find(
          (item) => item.value === cityId,
        );
        if (currentItem) {
          return currentItem.label as string;
        }

        // 如果在第二级没找到，尝试在第三级查找
        for (const city of province.children as CascaderOption[]) {
          if (city.children) {
            currentItem = (city.children as CascaderOption[]).find(
              (item) => item.value === cityId,
            );
            if (currentItem) {
              return currentItem.label as string;
            }
          }
        }
      }
    }

    return "";
  }

  // 需要完整地址，查找城市ID所在的完整路径
  const path: CascaderOption[] = [];

  // 在第三级查找
  for (const province of areaData) {
    if (province.children) {
      for (const city of province.children as CascaderOption[]) {
        if (city.children) {
          currentItem = (city.children as CascaderOption[]).find(
            (item) => item.value === cityId,
          );
          if (currentItem) {
            path.push(province, city, currentItem);
            break;
          }
        }
      }
      if (path.length > 0) break;

      // 在第二级查找
      currentItem = (province.children as CascaderOption[]).find(
        (item) => item.value === cityId,
      );
      if (currentItem) {
        path.push(province, currentItem);
        break;
      }
    }
  }

  // 在第一级查找
  if (path.length === 0) {
    currentItem = areaData.find((item) => item.value === cityId);
    if (currentItem) {
      path.push(currentItem);
    }
  }

  // 如果找不到匹配的城市ID，返回空字符串
  if (path.length === 0) return "";

  // 提取地址名称
  let names = path.map((item) => item.label as string);

  // 去除重复的地址部分
  if (removeDuplicates) {
    names = names.filter(
      (name, index, array) => index === 0 || name !== array[index - 1],
    );
  }

  return names.join(separator);
}

/**
 * 根据城市ID数组获取对应的城市名称字符串
 * @param cityIds 城市ID数组，例如 ["11", "1101", "110101"]
 * @param options 配置选项
 * @param options.separator 地址分隔符，默认为空格
 * @param options.removeDuplicates 是否去除重复的地址部分，默认为false
 * @returns 城市名称字符串，例如 "北京市 北京市 东城区"
 */
export function getCityNamesByCityIds(
  cityIds: string[],
  options?: {
    separator?: string;
    removeDuplicates?: boolean;
  },
): string {
  if (!cityIds || cityIds.length === 0) return "";

  const { separator = " ", removeDuplicates = false } = options || {};

  const areaData = getChinaAreaData();
  const names: string[] = [];

  let currentLevel = areaData;
  let currentItem: CascaderOption | undefined;

  // 遍历每一级ID
  for (let i = 0; i < cityIds.length; i++) {
    const id = cityIds[i];
    currentItem = currentLevel.find((item) => item.value === id);

    if (currentItem) {
      names.push(currentItem.label as string);
      if (currentItem.children && i < cityIds.length - 1) {
        currentLevel = currentItem.children as CascaderOption[];
      }
    }
  }

  // 去除重复的地址部分
  let result = names;
  if (removeDuplicates) {
    result = names.filter(
      (name, index, array) => index === 0 || name !== array[index - 1],
    );
  }

  return result.join(separator);
}
