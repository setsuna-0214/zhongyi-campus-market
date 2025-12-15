import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './products.mock';
import * as real from './products.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const searchProducts = impl.searchProducts;
export const getProduct = impl.getProduct;
export const getRelatedProducts = impl.getRelatedProducts;
export const createProduct = impl.createProduct;
