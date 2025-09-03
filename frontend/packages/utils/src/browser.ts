/**
 * 文件定义：浏览器相关操作
 */

import * as R from "ramda";

/* -------------- 1、浏览器相关操作 -------------- */

/**
 * 获取当前页面 URL
 */
export const isHttps = (): boolean => window.location.protocol === "https:";

/**
 * 判断是否为开发环境
 */
export const isDev = (): boolean => process.env.NODE_ENV === "development";

/**
 * 获取浏览器及操作系统信息
 * @returns {{ browser: string; os: string }} 浏览器和操作系统信息
 */
export const getBrowserOSInfo = (): { browser: string; os: string } => {
  const ua = navigator.userAgent;

  type Rule = [(str: string) => boolean, () => string];

  // 浏览器识别规则
  const browserRules: Rule[] = [
    [
      R.allPass([R.test(/Chrome/), R.complement(R.test(/Edg/))]),
      R.always("Chrome"),
    ],
    [R.test(/Firefox/), R.always("Firefox")],
    [
      R.allPass([R.test(/Safari/), R.complement(R.test(/Chrome/))]),
      R.always("Safari"),
    ],
    [R.test(/Edg/), R.always("Edge")],
    [R.T, R.always("Unknown")],
  ];

  // 操作系统识别规则
  const osRules: Rule[] = [
    [R.test(/iPhone|iPad|iPod/), R.always("iOS")],
    [R.test(/Android/), R.always("Android")],
    [R.test(/Win/), R.always("Windows")],
    [
      R.allPass([R.test(/Mac/), R.complement(R.test(/iPhone|iPad|iPod/))]),
      R.always("macOS"),
    ],
    [R.test(/Linux/), R.always("Linux")],
    [R.T, R.always("Unknown")],
  ];

  return {
    browser: R.cond(browserRules)(ua),
    os: R.cond(osRules)(ua),
  };
};

/**
 * 获取屏幕信息，分辨率、缩放比例
 */
export const getScreenInfo = (): {
  resolution: string;
  scale: number;
} => {
  const resolution = `${window.screen.width}x${window.screen.height}`;
  const scale = window.devicePixelRatio;
  return { resolution, scale };
};

/**
 * 判断是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export const isMobile = (): boolean => {
  const ua = navigator.userAgent;
  // 移动设备识别规则
  const mobileRules = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Mobile/i,
    /Tablet/i,
  ];
  return mobileRules.some((rule) => rule.test(ua));
};

/**
 * 判断设备类型
 * @returns {'mobile' | 'desktop'} 设备类型
 */
export const getDeviceType = (): "mobile" | "desktop" => {
  return isMobile() ? "mobile" : "desktop";
};

/**
 * 柯里化版本的设备类型判断
 */
export const isMobileCurried = R.always(isMobile());
export const getDeviceTypeCurried = R.always(getDeviceType());

/* -------------- 2、浏览器缓存相关操作 -------------- */

/**
 * 强制刷新页面并清理所有缓存
 * 清除 Cache API、localStorage 和 sessionStorage 后刷新
 */
export const forceRefresh = () => {
  clearBrowserCache();
  // window.location.reload()
};

/**
 * 获取 URL 参数
 * @param name 参数名
 */
export const getUrlParam = (name: string): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
};

/**
 * 柯里化版本的getUrlParam
 */
export const getUrlParamCurried: {
  (name: string): string | null;
} = R.curry(getUrlParam);

/**
 * Cookie 操作辅助函数：根据 HTTPS 协议增加前缀
 * @param key cookie 键名
 */
export const cookiePrefixKey = (key: string): string =>
  R.ifElse(R.always(isHttps()), (k: string) => `https_${k}`, R.identity)(key);

/**
 * 设置 Cookie
 * @param {string} key 键名
 * @param {string} value 值
 * @param {number} days 过期天数（可选）
 */
export const setCookie = (key: string, value: string, days?: number): void => {
  const prefixedKey = cookiePrefixKey(key);
  // 获取过期时间
  const getExpires = (days?: number): string => {
    if (!days) return "";
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    return `; expires=${date.toUTCString()}`;
  };
  const expires = getExpires(days);
  document.cookie = `${prefixedKey}=${encodeURIComponent(
    value
  )}${expires}; path=/`;
};

/**
 * 柯里化版本的setCookie
 */
export const setCookieCurried: {
  (key: string, value: string, days?: number): void;
  (key: string): (value: string, days?: number) => void;
  (key: string, value: string): (days?: number) => void;
} = R.curry(setCookie);

/**
 * 获取 Cookie
 * @param key 键名
 */
export const getCookie = (
  key: string,
  isPrefixKey: boolean = true
): string | null => {
  const prefixedKey = isPrefixKey ? cookiePrefixKey(key) : key;
  const nameEQ = `${prefixedKey}=`;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(nameEQ));
  if (cookie) {
    return decodeURIComponent(cookie.substring(nameEQ.length));
  }
  return null;
};

/**
 * 柯里化版本的getCookie
 */
export const getCookieCurried: {
  (key: string): string | null;
} = R.curry(getCookie);

/**
 * 删除 Cookie
 * @param key 键名
 */
export const deleteCookie = (key: string): void => {
  // 设置过期时间为负值，即删除 Cookie
  setCookie(key, "", -1);
  console.log(document.cookie);
};

/**
 * 清空 Cookie
 */
export const clearCookie = (): void => {
  const cookies = document.cookie.split(";").map((c) => c.trim()); // 获取所有 Cookie
  cookies.forEach((c) => {
    const [key] = c.split("=");
    if (key) {
      // 通过设置过期时间为过去来删除cookie
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
};

/**
 * 设置存储增强（支持自动序列化）
 */
export const setStorageItem = (
  key: string,
  value: any,
  storage: Storage
): void => {
  const serializedValue = JSON.stringify(value);
  storage.setItem(key, serializedValue);
};

/**
 * 柯里化版本的setStorageItem
 */
export const setStorageItemCurried: {
  (key: string, value: any, storage: Storage): void;
  (key: string): (value: any, storage: Storage) => void;
  (key: string, value: any): (storage: Storage) => void;
} = R.curry(setStorageItem);

/**
 * 获取存储增强（支持自动反序列化）
 */
export const getStorageItem = (key: string, storage: Storage): any => {
  const value = storage.getItem(key);
  return value ? JSON.parse(value) : null;
};

/**
 * 柯里化版本的getStorageItem
 */
export const getStorageItemCurried: {
  (key: string, storage: Storage): any;
  (key: string): (storage: Storage) => any;
} = R.curry(getStorageItem);

/**
 * 删除存储
 * @param key 键名
 * @param storage 存储类型（可选）
 */
export const removeStorageItem = (
  key: string,
  storage: Storage = localStorage
): void => storage.removeItem(key);

/**
 * 设置 sessionStorage 数据
 * @param key 键名
 * @param value 值
 */
export const setSessionItem = (key: string, value: any): void =>
  setStorageItem(key, value, sessionStorage);

/**
 * 获取 sessionStorage 数据
 * @param key 键名
 */
export const getSessionItem = (key: string): any =>
  getStorageItem(key, sessionStorage);

/**
 * 删除 sessionStorage 数据
 * @param key 键名
 */
export const removeSessionItem = (key: string): void =>
  sessionStorage.removeItem(key);

/**
 * 清空 sessionStorage 中所有数据
 */
export const clearSession = (): void => sessionStorage.clear();

/**
 * 设置 localStorage 数据
 * @param key 键名
 * @param value 值
 */
export const setLocalItem = (key: string, value: any): void =>
  setStorageItem(key, value, localStorage);

/**
 * 获取 localStorage 数据
 * @param key 键名
 */
export const getLocalItem = (key: string): any =>
  getStorageItem(key, localStorage);

/**
 * 删除 localStorage 数据
 * @param key 键名
 */
export const removeLocalItem = (key: string): void =>
  localStorage.removeItem(key);

/**
 * 清空 localStorage 中所有数据
 */
export const clearLocal = (): void => localStorage.clear();

/**
 * 清空浏览器缓存
 */
export const clearBrowserCache = (): void => {
  clearSession();
  clearLocal();
  clearCookie();
};

/**
 * 创建过期时间的存储，支持sessionStorage和localStorage
 * @param key 键名
 * @param value 值
 * @param time 过期时间（可选），支持new Date()、时间戳、时间字符串
 * @param storage 存储类型（可选）
 */
export const setExpiredStorageItem = (
  key: string,
  value: any,
  time?: Date | number | string,
  storage: Storage = localStorage
): void => {
  // 如果没有设置过期时间,直接存储值
  if (!time) {
    setStorageItem(key, value, storage);
    return;
  }

  // 转换过期时间为时间戳
  let expires: number;
  if (time instanceof Date) {
    expires = time.getTime();
  } else if (typeof time === "number") {
    expires = time;
  } else {
    expires = new Date(time).getTime();
  }

  // 存储数据和过期时间
  const data = {
    value,
    expires,
  };

  setStorageItem(key, data, storage);
};

/**
 * 获取过期时间的存储
 * @param key 键名
 */
export const getExpiredStorageItem = (
  key: string,
  storage: Storage = localStorage
): any => {
  const data = getStorageItem(key, storage);
  if (!data) return null;
  // 检查是否过期
  if (data.expires && data.expires < Date.now()) {
    removeStorageItem(key, storage);
    return null;
  }
};

/* -------------- 3、IndexedDB 相关操作 -------------- */

/**
 * IndexedDB 相关类型定义
 * @interface IndexedDBConfig
 * @description 数据库配置接口，用于定义数据库的基本结构
 * @property {string} dbName - 数据库名称
 * @property {number} version - 数据库版本号，用于数据库升级
 * @property {Object} stores - 存储对象配置，key 为存储对象名称
 */
export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: {
    [key: string]: {
      /** 主键路径，用于唯一标识记录 */
      keyPath: string;
      /** 索引配置数组，用于优化查询性能 */
      indexes?: Array<{
        /** 索引名称 */
        name: string;
        /** 索引的键路径 */
        keyPath: string;
        /** 索引选项，如是否唯一等 */
        options?: IDBIndexParameters;
      }>;
    };
  };
}

/**
 * IndexedDB 管理类
 * @class IndexedDBManager
 * @description 提供 IndexedDB 数据库操作的统一接口，支持异步操作和类型安全
 */
export class IndexedDBManager {
  /** 数据库连接实例 */
  private db: IDBDatabase | null = null;
  /** 数据库配置信息 */
  private config: IndexedDBConfig;

  /**
   * 构造函数
   * @param config 数据库配置对象
   */
  constructor(config: IndexedDBConfig) {
    this.config = config;
  }

  /**
   * 统一的事件处理器
   * @description 处理 IDBRequest 的成功和错误事件
   * @template T 返回数据类型
   * @param request IDBRequest 实例
   * @returns Promise<T> 返回处理结果
   */
  private handleRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取事务和对象仓库
   * @description 创建事务并获取对象仓库
   * @param storeName 仓库名称
   * @param mode 事务模式
   * @returns 包含事务和对象仓库的对象
   */
  private async getTransactionAndStore(
    storeName: string,
    mode: IDBTransactionMode = "readonly"
  ): Promise<{
    transaction: IDBTransaction;
    store: IDBObjectStore;
  }> {
    await this.connect();
    const transaction = this.db!.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    return { transaction, store };
  }

  /**
   * 初始化数据库连接
   * @description 创建或打开数据库连接，如果数据库不存在则自动创建
   * @returns {Promise<IDBDatabase>} 返回数据库连接实例
   * @throws {Error} 连接失败时抛出错误
   */
  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        Object.entries(this.config.stores).forEach(
          ([storeName, storeConfig]) => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, {
                keyPath: storeConfig.keyPath,
              });

              storeConfig.indexes?.forEach((index) => {
                store.createIndex(index.name, index.keyPath, index.options);
              });
            }
          }
        );
      };
    });
  }

  /**
   * 添加数据
   * @description 向指定的对象仓库添加新数据
   * @template T 数据类型
   * @param {string} storeName 仓库名称
   * @param {T} data 要添加的数据
   * @returns {Promise<IDBValidKey>} 返回新添加数据的主键
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const { store } = await this.getTransactionAndStore(storeName, "readwrite");
    return this.handleRequest(store.add(data));
  }

  /**
   * 更新数据
   * @description 更新指定对象仓库中的数据，如果数据不存在则添加
   * @template T 数据类型
   * @param {string} storeName 仓库名称
   * @param {T} data 要更新的数据
   * @returns {Promise<IDBValidKey>} 返回更新数据的主键
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const { store } = await this.getTransactionAndStore(storeName, "readwrite");
    return this.handleRequest(store.put(data));
  }

  /**
   * 删除数据
   * @description 从指定对象仓库中删除数据
   * @param {string} storeName 仓库名称
   * @param {IDBValidKey} key 要删除数据的主键
   * @returns {Promise<void>} 删除成功时解析
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const { store } = await this.getTransactionAndStore(storeName, "readwrite");
    return this.handleRequest(store.delete(key));
  }

  /**
   * 通过主键获取数据
   * @description 从指定对象仓库中获取指定主键的数据
   * @template T 返回数据类型
   * @param {string} storeName 仓库名称
   * @param {IDBValidKey} key 主键值
   * @returns {Promise<T | undefined>} 返回查询到的数据
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const { store } = await this.getTransactionAndStore(storeName);
    return this.handleRequest(store.get(key));
  }

  /**
   * 通过索引查询数据
   * @description 使用索引从指定对象仓库中查询数据
   * @template T 返回数据类型
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名称
   * @param {IDBValidKey} key 索引值
   * @returns {Promise<T | undefined>} 返回查询到的数据
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    key: IDBValidKey
  ): Promise<T | undefined> {
    const { store } = await this.getTransactionAndStore(storeName);
    const index = store.index(indexName);
    return this.handleRequest(index.get(key));
  }

  /**
   * 获取所有数据
   * @description 获取指定对象仓库中的所有数据
   * @template T 返回数据类型
   * @param {string} storeName 仓库名称
   * @returns {Promise<T[]>} 返回所有数据的数组
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const { store } = await this.getTransactionAndStore(storeName);
    return this.handleRequest(store.getAll());
  }

  /**
   * 使用游标遍历数据
   * @description 使用游标遍历对象仓库中的数据
   * @template T 数据类型
   * @param {string} storeName 仓库名称
   * @param {(item: T) => void} callback 处理每条数据的回调函数
   * @returns {Promise<void>}
   */
  async forEach<T>(
    storeName: string,
    callback: (item: T) => void
  ): Promise<void> {
    const { store } = await this.getTransactionAndStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          callback(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * 批量添加数据
   * @description 向指定的对象仓库批量添加数据
   * @template T 数据类型
   * @param {string} storeName 仓库名称
   * @param {T[]} items 要添加的数据数组
   * @returns {Promise<void>}
   */
  async addBatch<T>(storeName: string, items: T[]): Promise<void> {
    const { store } = await this.getTransactionAndStore(storeName, "readwrite");

    return new Promise((resolve, reject) => {
      try {
        items.forEach((item) => store.add(item));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 清空对象仓库
   * @description 删除指定对象仓库中的所有数据
   * @param {string} storeName 仓库名称
   * @returns {Promise<void>}
   */
  async clear(storeName: string): Promise<void> {
    const { store } = await this.getTransactionAndStore(storeName, "readwrite");
    return this.handleRequest(store.clear());
  }

  /**
   * 关闭数据库连接
   * @description 安全地关闭数据库连接，释放资源
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
