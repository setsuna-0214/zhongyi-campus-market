import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './home.mock';
import * as real from './home.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const getHotProducts = impl.getHotProducts;
export const getLatestProducts = impl.getLatestProducts;
