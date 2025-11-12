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
