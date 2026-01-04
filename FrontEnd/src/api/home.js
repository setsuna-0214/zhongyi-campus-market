/**
 * 首页 API 入口
 * 根据环境自动切换 Mock/真实后端，导出首页数据相关的 API 方法
 */

import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './home.mock';
import * as real from './home.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const getHotProducts = impl.getHotProducts;
export const getLatestProducts = impl.getLatestProducts;
