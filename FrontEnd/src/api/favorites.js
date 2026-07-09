/**
 * 收藏 API 入口
 * 根据环境自动切换 Mock/真实后端，导出收藏相关的 API 方法
 */

import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './favorites.mock';
import * as real from './favorites.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const getFavorites = impl.getFavorites;
export const addToFavorites = impl.addToFavorites;
export const removeFromFavorites = impl.removeFromFavorites;
export const removeFavoriteByProductId = impl.removeFavoriteByProductId;
