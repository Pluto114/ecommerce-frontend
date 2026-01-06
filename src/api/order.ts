// src/api/order.ts
import request from '@/utils/request'
import type { OrderVOPage } from '@/types'

// ================= 用户端 =================

// 我的订单列表
export const myOrderList = (params: { pageNum: number; pageSize: number; status?: number }) => {
  return request.get<any, OrderVOPage>('/order/my-list', { params })
}

// 模拟支付
export const payOrder = (orderSn: string) => {
  return request.post<any, string>(`/order/pay/${orderSn}`)
}

// 取消订单
export const cancelOrder = (orderSn: string) => {
  return request.post<any, string>(`/order/cancel/${orderSn}`)
}

// 确认收货
export const receiveOrder = (orderSn: string) => {
  return request.post<any, string>(`/order/receive/${orderSn}`)
}

// 评价完成（推进状态）
export const finishComment = (orderSn: string) => {
  return request.post<any, string>(`/order/comment/finish/${orderSn}`)
}

// 申请退单
export const applyRefund = (data: { orderSn: string; refundReason: string }) => {
  return request.post<any, string>('/order/refund/apply', data)
}

// ================= 商家端（如果你商家页面要用） =================

export const merchantOrderList = (params: {
  pageNum: number
  pageSize: number
  status?: number
  orderSn?: string
}) => {
  return request.get<any, OrderVOPage>('/merchant/order/list', { params })
}

export const shipOrder = (data: { orderSn: string }) => {
  return request.post<any, string>('/merchant/order/ship', data)
}

export const auditRefund = (data: { orderSn: string; approve: boolean; adminReason?: string }) => {
  return request.post<any, string>('/merchant/order/refund/audit', data)
}
