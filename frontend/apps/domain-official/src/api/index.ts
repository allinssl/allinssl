/**
 * @module @api
 * jQuery Ajax 封装
 *
 * - 统一 baseURL、认证头（X-API-Key、X-UID）
 * - JSON 请求/响应，错误码语义化
 * - 请求/响应拦截（简单版）
 * - API 形态参考 apps/official/doc/api.md
 */

import type {
  ApiSuccess,
  ApiError,
  ApiResponse,
  RequestConfig,
  ApiClientOptions,
} from "../types/api";

const isDev = (): boolean => process.env.NODE_ENV === "development";

export class ApiClient {
  private baseURL: string;
  private apiKey: string | undefined;
  private uid: string | undefined;
  private timeout: number;
  private withCredentials: boolean;
  private onRequest?: ApiClientOptions["onRequest"];
  private onResponse?: ApiClientOptions["onResponse"];
  private onError?: ApiClientOptions["onError"];

  /**
   * 构造函数
   * @param options 客户端选项：`baseURL`/`apiKey`/`uid`/`timeout`/`withCredentials` 以及请求/响应钩子
   */
  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || isDev() ? "/proxy/api" : "/api";
    // this.baseURL = "/proxy/api"; //77150
    this.apiKey = options.apiKey;
    this.uid = options.uid || "1112";
    this.timeout = options.timeout ?? 15000;
    this.withCredentials = !!options.withCredentials;
    this.onRequest = options.onRequest;
    this.onResponse = options.onResponse;
    this.onError = options.onError;
  }

  /**
   * 设置鉴权信息
   */
  setAuth({ apiKey, uid }: { apiKey?: string; uid?: string }) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (uid !== undefined) this.uid = uid;
  }

  /**
   * 组装请求头，自动附加鉴权信息
   */
  /**
   * 组装请求头，自动附加鉴权信息
   */
  private buildHeaders(extra?: Record<string, string>) {
    const headers: Record<string, string> = {
      ...(extra || {}),
    };
    if (isDev() && this.uid) headers["X-UID"] = this.uid;

    return headers;
  }

  /**
   * 发起请求
   * - GET: 使用表单编码序列化查询参数
   * - POST: 使用 JSON 请求体
   * - 成功：status=true 且 code=0 才 resolve
   * - 失败：统一规范化为 ApiError 并 reject
   */
  private request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const cfg: RequestConfig = {
      method: "POST",
      timeout: this.timeout,
      ...config,
    };
    const finalCfg = this.onRequest ? this.onRequest({ ...cfg }) || cfg : cfg;
    // 允许通过请求头 X-API-BASE 动态覆盖基础路径，默认保持现有逻辑
    const requestedBase = finalCfg.headers?.["X-API-BASE"];
    const urlBase =
      typeof requestedBase === "string" && requestedBase.length > 0
        ? requestedBase
        : this.baseURL;
    const url = `${urlBase}${finalCfg.url.startsWith("/") ? "" : "/"}${finalCfg.url}`;
    const whileList = ["/v1/order/cart/list", "/v1/contact/get_user_detail"];
    // 白名单不进行登录状态判定
    const isSkip = whileList.includes(finalCfg.url);
    return new Promise((resolve, reject) => {
      const method = (finalCfg.method || "POST").toUpperCase();
      const isGet = method === "GET";
      const payload = isGet
        ? finalCfg.data
        : finalCfg.data
          ? JSON.stringify(finalCfg.data)
          : undefined;
      const contentType = isGet
        ? "application/x-www-form-urlencoded; charset=UTF-8"
        : "application/json";

      (window as any).$.ajax({
        url,
        method,
        data: payload,
        contentType,
        dataType: "json",
        headers: this.buildHeaders(finalCfg.headers),
        xhrFields: { withCredentials: this.withCredentials },
        timeout: finalCfg.timeout ?? this.timeout,
        success: (res: any) => {
          const processedRes = (
            this.onResponse ? this.onResponse(res, finalCfg) || res : res
          ) as ApiResponse<T>;
          const isLoginInvalid =
            (processedRes as any)?.code === 1002 &&
            (processedRes as any)?.msg === "身份失效";
          const ok =
            (processedRes as any)?.status === true &&
            ((processedRes as any)?.code === 0 ||
              (processedRes as any)?.code === 200);
          if (isLoginInvalid && !isSkip) {
            setTimeout(() => {
              location.href = "/login";
            }, 2000);
            return reject({
              status: false,
              code: 1002,
              message: "登录状态已失效，页面将在2秒后自动跳转至登录页面",
            });
          }
          if (ok) {
            resolve(processedRes as ApiSuccess<T>);
            return;
          }
          const apiError: ApiError = {
            status: false,
            code: (processedRes as any)?.code ?? -1,
            message:
              (processedRes as any)?.message ||
              (processedRes as any)?.msg ||
              "请求失败",
            data: (processedRes as any)?.data,
            timestamp: (processedRes as any)?.timestamp ?? Date.now(),
          };
          const handled = this.onError
            ? this.onError(apiError, finalCfg) || apiError
            : apiError;
          reject(handled);
        },
        error: (xhr: any, _textStatus: any, errorThrown: any) => {
          const resp = xhr?.responseJSON;

          const fallback: ApiError = {
            status: false,
            code: resp?.code ?? xhr?.status ?? -1,
            message: resp?.message || resp?.msg || errorThrown || "网络错误",
            data: resp?.data,
            timestamp: resp?.timestamp ?? Date.now(),
          };
          const processed = this.onError
            ? this.onError(fallback, finalCfg) || fallback
            : fallback;
          reject(processed);
        },
      } as any);
    });
  }

  /**
   * 发送 POST 请求
   * @param url 接口路径（相对 baseURL）
   * @param data 请求体
   * @param headers 额外请求头
   */
  post<T = any>(url: string, data?: any, headers?: Record<string, string>) {
    return this.request<T>({ url, method: "POST", data, headers });
  }
  /**
   * 发送 GET 请求
   * @param url 接口路径（相对 baseURL）
   * @param data 查询参数
   * @param headers 额外请求头
   */
  get<T = any>(url: string, data?: any, headers?: Record<string, string>) {
    return this.request<T>({ url, method: "GET", data, headers });
  }
}

// 默认导出单例（可按需）
const api = new ApiClient();

export default api;
