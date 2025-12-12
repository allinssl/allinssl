import axios from "axios";
import {
  requestMiddleware,
  responseMiddleware,
  errorMiddleware,
} from "./other";

import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * 中间件类型定义
 * @property request - 请求拦截器，用于处理请求配置
 * @property response - 响应拦截器，用于处理响应数据
 * @property error - 错误处理器，用于处理请求过程中的错误
 */
export type Middleware = {
  request?: (
    config: AxiosRequestConfig
  ) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
  response?: (
    response: AxiosResponse
  ) => AxiosResponse | Promise<AxiosResponse>;
  error?: (error: AxiosError) => AxiosError | Promise<AxiosError>;
};

/**
 * HTTP客户端配置接口
 */
export interface HttpClientConfig extends AxiosRequestConfig {
  /** 全局中间件 */
  middlewares?: Middleware[];
}

/**
 * HTTP客户端类
 * 封装axios实例，提供中间件机制和常用的HTTP方法
 */
class HttpClient {
  // axios实例
  private instance: AxiosInstance;
  // 全局中间件数组
  private middlewares: Middleware[] = [];

  /**
   * 构造函数
   * @param config - HTTP客户端配置
   */
  constructor(config: HttpClientConfig = {}) {
    const { middlewares = [], ...axiosConfig } = config;

    // 创建axios实例
    this.instance = axios.create(axiosConfig);

    // 初始化全局中间件
    this.middlewares = [...middlewares];

    // 设置拦截器
    this.setupInterceptors();
  }

  /**
   * 执行中间件链
   * @param handler - 处理函数名称
   * @param context - 上下文数据
   * @returns 处理后的上下文数据
   */
  private async executeMiddlewareChain<T>(
    handler: keyof Middleware,
    context: T
  ): Promise<T> {
    const currentContext = { ...context };
    let Context = currentContext as T;
    // 执行中间件链
    for (const middleware of this.middlewares) {
      const handlerFn = middleware[handler];
      if (handlerFn) Context = (await handlerFn(Context as any)) as T;
    }
    return Context;
  }

  /**
   * 设置请求和响应拦截器
   * 用于执行中间件链
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config) => {
        // 复制配置对象，避免直接修改原始配置
        let currentConfig = { ...config } as AxiosRequestConfig;
        // 执行请求中间件链
        currentConfig = await this.executeMiddlewareChain(
          "request",
          currentConfig
        );
        return currentConfig as InternalAxiosRequestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(async (response) => {
      // 复制响应对象，避免直接修改原始响应
      let currentResponse = { ...response };
      // 执行响应中间件链
      currentResponse = await this.executeMiddlewareChain(
        "response",
        currentResponse
      );
      return currentResponse;
    });
  }

  /**
   * 添加全局中间件
   * @param middleware - 中间件对象
   * @returns this - 返回实例本身，支持链式调用
   */
  public use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 获取axios实例
   * @returns AxiosInstance - 返回当前的axios实例
   */
  public getAxiosInstance() {
    return this.instance;
  }

  /**
   * 发送请求
   * @param config - 请求配置
   * @returns Promise<AxiosResponse<T>> - 返回请求响应
   */
  public async request<T = unknown>(
    config: HttpClientConfig
  ): Promise<AxiosResponse<T> | void> {
    try {
      const processedConfig = await this.executeMiddlewareChain(
        "request",
        config
      ); // 执行请求中间件链
      console.log("processedConfig", processedConfig, config);
      const response = await this.instance.request(processedConfig); // 发送请求
      return this.executeMiddlewareChain("response", response); // 执行响应中间件链
    } catch (error) {
      // 执行错误处理中间件链
      const middleError = await this.executeMiddlewareChain("error", error); // 执行错误处理中间件链，返回错误信息
      return Promise.reject(middleError);
    }
  }

  /**
   * 发送GET请求
   * @param url - 请求地址
   * @param config - 请求配置
   * @returns Promise<AxiosResponse<T>> - 返回请求响应
   */
  public async get<T = unknown>(url: string, config: AxiosRequestConfig = {}) {
    return this.request<T>({ ...config, url, method: "get" }) as Promise<
      AxiosResponse<T>
    >;
  }

  /**
   * 发送POST请求
   * @param url - 请求地址
   * @param data - 请求数据
   * @param config - 请求配置
   * @returns Promise<AxiosResponse<T>> - 返回请求响应
   */
  public async post<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config: AxiosRequestConfig = {}
  ) {
    console.log(config);
    return this.request<T>({ ...config, url, data, method: "post" }) as Promise<
      AxiosResponse<T>
    >;
  }

  /**
   * 发送PUT请求
   * @param url - 请求地址
   * @param data - 请求数据
   * @param config - 请求配置
   * @returns Promise<AxiosResponse<T>> - 返回请求响应
   */
  public async put<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config: AxiosRequestConfig = {}
  ) {
    return this.request<T>({ ...config, url, data, method: "put" }) as Promise<
      AxiosResponse<T>
    >;
  }

  /**
   * 发送DELETE请求
   * @param url - 请求地址
   * @param config - 请求配置
   * @returns Promise<AxiosResponse<T>> - 返回请求响应
   */
  public async delete<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {}
  ) {
    return this.request<T>({ ...config, url, method: "delete" }) as Promise<
      AxiosResponse<T>
    >;
  }
}

export {
  HttpClient,
  requestMiddleware, // 请求中间件
  responseMiddleware, // 响应中间件
  errorMiddleware, // 错误中间件
};
