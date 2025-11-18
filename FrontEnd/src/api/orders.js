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
