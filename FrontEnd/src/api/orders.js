/**
 * 订单 API 入口
 * 根据环境自动切换 Mock/真实后端，导出订单相关的所有 API 方法
 */

import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './orders.mock';
import * as real from './orders.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const listOrders = impl.listOrders;
export const getOrderStats = impl.getOrderStats;
export const confirmReceived = impl.confirmReceived;
export const cancelOrder = impl.cancelOrder;
export const submitReview = impl.submitReview;
export const createOrder = impl.createOrder;
export const getOrderDetail = impl.getOrderDetail;
export const updateOrderStatus = impl.updateOrderStatus;
export const uploadOrderImages = impl.uploadOrderImages;
export const deleteOrder = impl.deleteOrder;
