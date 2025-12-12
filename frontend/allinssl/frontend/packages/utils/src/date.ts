/**
 * 文件定义：日期处理
 */

import * as R from "ramda";

/* -------------- 1、日期处理 -------------- */
/**
 * 格式化时间格式
 * @param {string | number | Date} date - 日期字符串、时间戳、Date 对象
 * @param {string} format - 格式化字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (
  date: string | number | Date | null | undefined,
  format: string = "yyyy-MM-dd HH:mm:ss"
): string => {
  if (!date) return "--";
  // 处理秒级时间戳
  const timestamp =
    !!Number(date) && date.toString().length === 10
      ? new Date(Number(date) * 1000)
      : new Date(date);

  // 使用Ramda创建日期映射
  const dateMap = R.zipObj(
    ["yyyy", "MM", "dd", "HH", "mm", "ss"],
    [
      timestamp.getFullYear(),
      timestamp.getMonth() + 1,
      timestamp.getDate(),
      timestamp.getHours(),
      timestamp.getMinutes(),
      timestamp.getSeconds(),
    ]
  );

  // 使用Ramda的reduce函数替换格式字符串中的占位符
  return R.reduce(
    (result: string, key: string) => {
      const value = dateMap[key as keyof typeof dateMap];
      // 将单位数的月、日、时、分、秒前面补0
      const formattedValue =
        key !== "yyyy" && value < 10 ? `0${value}` : `${value}`;
      // 使用正则表达式全局替换所有匹配项
      return result.replace(new RegExp(key, "g"), formattedValue);
    },
    format,
    R.keys(dateMap)
  );
};

/**
 * 获取两个日期之间的天数差
 * @param {string | number | Date} startDate - 开始日期
 * @param {string | number | Date} endDate - 结束日期
 * @returns {number} 天数差
 */
export const getDaysDiff = (
  startDate: string | number | Date,
  endDate: string | number | Date
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = endDay.getTime() - startDay.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * 柯里化版本的getDaysDiff
 * @param {string | number | Date} startDate - 开始日期
 * @param {string | number | Date} endDate - 结束日期
 * @returns {number} 天数差
 */
export const getDaysDiffCurried: {
  (startDate: string | number | Date, endDate: string | number | Date): number;
  (startDate: string | number | Date): (
    endDate: string | number | Date
  ) => number;
} = R.curry(getDaysDiff);

/**
 * 判断日期是否在指定范围内
 * @param {string | number | Date} date - 要判断的日期
 * @param {string | number | Date} startDate - 开始日期
 * @param {string | number | Date} endDate - 结束日期
 * @returns {boolean} 是否在范围内
 */
export const isDateInRange = (
  date: string | number | Date,
  startDate: string | number | Date,
  endDate: string | number | Date
): boolean => {
  const targetTime = new Date(date).getTime();
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  return targetTime >= startTime && targetTime <= endTime;
};

/**
 * 柯里化版本的isDateInRange
 * @param {string | number | Date} date - 要判断的日期
 * @param {string | number | Date} startDate - 开始日期
 * @param {string | number | Date} endDate - 结束日期
 * @returns {boolean} 是否在范围内
 */
export const isDateInRangeCurried: {
  (
    date: string | number | Date,
    startDate: string | number | Date,
    endDate: string | number | Date
  ): boolean;
  (date: string | number | Date): {
    (
      startDate: string | number | Date,
      endDate: string | number | Date
    ): boolean;
    (startDate: string | number | Date): (
      endDate: string | number | Date
    ) => boolean;
  };
  (date: string | number | Date, startDate: string | number | Date): (
    endDate: string | number | Date
  ) => boolean;
} = R.curry(isDateInRange);

/**
 * 获取指定日期的开始时间（00:00:00）
 * @param {string | number | Date} date - 日期
 * @returns {Date} 日期的开始时间
 */
export const getStartOfDay = (date: string | number | Date): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * 获取指定日期的结束时间（23:59:59）
 * @param {string | number | Date} date - 日期
 * @returns {Date} 日期的结束时间
 */
export const getEndOfDay = (date: string | number | Date): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};

/**
 * 添加天数到指定日期
 * @param {number} days - 要添加的天数
 * @param {string | number | Date} date - 日期
 * @returns {Date} 新日期
 */
export const addDays = (days: number, date: string | number | Date): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// 柯里化版本的addDays
export const addDaysCurried: {
  (days: number, date: string | number | Date): Date;
  (days: number): (date: string | number | Date) => Date;
} = R.curry(addDays);

/**
 * 格式化相对时间（如：刚刚、x分钟前、x小时前、x天前）
 * @param {string | number | Date} date - 日期
 * @returns {string} 格式化后的相对时间
 */
export const formatRelativeTime = (
  date: string | number | Date | null | undefined,
  format: string = "YYYY-MM-DD"
): string => {
  if (!date) return "--";
  const timestamp =
    !!Number(date) && date.toString().length === 10
      ? new Date(Number(date) * 1000)
      : new Date(date);
  const now = new Date().getTime();
  const target = new Date(timestamp).getTime();
  const diff = now - target;

  if (diff < 1000 * 60) {
    return "刚刚";
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`;
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`;
  } else if (diff < 1000 * 60 * 60 * 24 * 30) {
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}天前`;
  } else {
    return formatDate(date, format);
  }
};

/**
 * 获取指定日期是星期几
 * @param {string | number | Date} date - 日期
 * @returns {string} 星期几
 */
export const getDayOfWeek = (date: string | number | Date): string => {
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `星期${days[new Date(date).getDay()]}`;
};

/**
 * 获取指定距离到期时间
 * @param {string | number | Date} date - 日期
 * @param {string | number | Date} expirationDate - 到期日期, 默认当前时间
 * @returns {string} 距离到期时间
 */
export const getDaysUntilExpiration = (
  date: string | number | Date,
  expirationDate: string | number | Date = new Date()
): string => {
  const target = new Date(date);
  const expiration = new Date(expirationDate);
  const diff = expiration.getTime() - target.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days}天` : "已过期";
};
