/**
 * AI 相关 API
 * 用于商品描述自动生成等 AI 功能
 */

import { isMockEnabled } from './mockData';
import * as mockApi from './ai.mock';
import * as realApi from './ai.real';

const useMock = isMockEnabled();
const impl = useMock ? mockApi : realApi;

/**
 * AI 生成商品描述
 * @param {Object} data - 请求数据
 * @param {string} data.title - 商品标题
 * @param {string} data.category - 商品分类代码
 * @param {Array} data.images - 图片数组，包含 url/preview/isExisting
 * @returns {Promise<{description: string}>} - 生成的描述
 */
export const generateProductDescription = impl.generateProductDescription;
