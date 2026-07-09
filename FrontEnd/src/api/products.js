/**
 * 商品 API 入口
 * 根据环境自动切换 Mock/真实后端，导出商品相关的所有 API 方法
 */

import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './products.mock';
import * as real from './products.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const searchProducts = impl.searchProducts;
export const getProduct = impl.getProduct;
export const getRelatedProducts = impl.getRelatedProducts;
export const getRelatedWants = impl.getRelatedWants;
export const createProduct = impl.createProduct;
export const updateProduct = impl.updateProduct;
export const updateProductStatus = impl.updateProductStatus;
