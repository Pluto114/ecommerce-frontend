// 通用响应结构 [cite: 16]
export interface Result<T> {
    code: number;    // 200成功
    message: string;
    data: T;
}

// 用户角色枚举 [cite: 38]
export enum UserRole {
    ADMIN = 1,   // 超级管理员
    MANAGER = 2, // 商家
    USER = 3     // 普通用户
}

// 登录成功返回 [cite: 46]
export interface UserLoginVO {
    id: number;
    username: string;
    role: UserRole;
    token: string;
}

// 用户信息 [cite: 53]
export interface User {
    id: number;
    username: string;
    role: UserRole;
    status: number; // 1-启用, 0-禁用
    createTime: string;
}

// 商店信息 [cite: 61]
export interface Shop {
    id: number;
    adminId?: number;
    name: string;
    address: string;
    logoUrl?: string;
    status: number;
}

// 商品信息 [cite: 71]
// 注意：这里为了你的3D需求，我特意加了一个可选字段 modelUrl
export interface Product {
    id: number;
    shopId: number;
    name: string;
    description?: string;
    price: number;
    stock: number;
    mainImageUrl?: string;
    status: number; // 1-在售, 0-下架
    createTime: string;
    // --- 前端扩展字段 (Mock用) ---
    modelUrl?: string; // 3D模型地址 (.glb)
}

// 购物车项 [cite: 84]
export interface CartVO {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
    valid: boolean;
}

// 订单子项 [cite: 110]
export interface OrderItem {
    productId: number;
    productName: string;
    productImage: string;
    productPrice: number;
    quantity: number;
}

// 订单信息 [cite: 99]
export interface OrderVO {
    id: number;
    orderSn: string;
    totalAmount: number;
    status: number; // 0-待支付, 1-待发货...
    createTime: string;
    orderItems: OrderItem[];
}
// src/types/order.ts

export interface OrderItem {
  orderId?: number
  productId: number
  productName: string
  productImage: string
  productPrice: number
  quantity: number
}

export interface OrderVO {
  id: number
  orderSn: string

  userId?: number

  totalAmount: number
  payAmount?: number
  pointsUsed?: number

  status: number
  statusText?: string

  cancelReason?: string
  refundReason?: string
  refundAdminReason?: string

  createTime?: string
  payTime?: string
  shippingTime?: string
  receiveTime?: string
  commentTime?: string
  updateTime?: string

  receiverName?: string
  receiverPhone?: string
  address?: string
  receiverInfo?: string

  orderItems?: OrderItem[]
}

export interface OrderVOPage {
  records: OrderVO[]
  total: number
  size: number
  current: number
  pages: number
}
