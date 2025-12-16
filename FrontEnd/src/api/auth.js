import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './auth.mock';
import * as real from './auth.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const login = impl.login;
export const register = impl.register;
export const sendCode = impl.sendCode;
export const forgotPassword = impl.forgotPassword;
export const checkUsernameExists = impl.checkUsernameExists;
export const checkEmailExists = impl.checkEmailExists;
