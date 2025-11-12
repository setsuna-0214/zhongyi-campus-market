import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './cart.mock';
import * as real from './cart.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const addToCart = impl.addToCart;
export const batchAddToCart = impl.batchAddToCart;
