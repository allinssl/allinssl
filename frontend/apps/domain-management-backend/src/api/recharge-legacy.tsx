import { post, API_BASE } from "@api/index";
import type {
  GetCreditChangeLogsRequest,
  GetCreditChangeLogsResponse,
  GetCreditAddRecordsRequest,
  GetCreditAddRecordsResponse,
  CreateCreditRechargeRequest,
  CreateCreditRechargeResponse,
  GetPayStatusRequest,
  GetPayStatusResponse,
} from "@/types/recharge.d";

export const getCreditChangeLogs = (params: GetCreditChangeLogsRequest) =>
  post<GetCreditChangeLogsResponse, GetCreditChangeLogsRequest>(
    "/credit_sys/credit/get_credit_change_logs",
    params,
    { baseURL: API_BASE.legacy },
  );

export const getCreditAddRecords = (params: GetCreditAddRecordsRequest) =>
  post<GetCreditAddRecordsResponse, GetCreditAddRecordsRequest>(
    "/credit_sys/credit/get_credit_add_records",
    params,
    { baseURL: API_BASE.legacy },
  );

export const createCreditRecharge = (data: CreateCreditRechargeRequest) =>
  post<CreateCreditRechargeResponse, CreateCreditRechargeRequest>(
    "/credit_sys/credit/add",
    data,
    { baseURL: API_BASE.legacy },
  );

export const getPayStatus = (data: GetPayStatusRequest) =>
  post<GetPayStatusResponse, GetPayStatusRequest>(
    "/credit_sys/credit/get_pay_status",
    data,
    { baseURL: API_BASE.legacy },
  ); 