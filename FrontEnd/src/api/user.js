/**
 * 用户 API 入口
 * 根据环境自动切换 Mock/真实后端，导出用户信息、关注、账号管理等 API 方法
 */

import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './user.mock';
import * as real from './user.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

// 用户信息
export const getCurrentUser = impl.getCurrentUser;
export const updateCurrentUser = impl.updateCurrentUser;
export const getUserCollections = impl.getUserCollections;
export const uploadAvatar = impl.uploadAvatar;
export const getMyPublished = impl.getMyPublished;
export const getMyPurchases = impl.getMyPurchases;
export const getUser = impl.getUser;
export const getUserPublished = impl.getUserPublished;
export const searchUsers = impl.searchUsers;

// 邮箱与密码
export const requestEmailChange = impl.requestEmailChange;
export const confirmEmailChange = impl.confirmEmailChange;
export const changePassword = impl.changePassword;

// 关注功能
export const getFollows = impl.getFollows;
export const getFollowers = impl.getFollowers;
export const checkIsFollowing = impl.checkIsFollowing;
export const followUser = impl.followUser;
export const unfollowUser = impl.unfollowUser;

// 账号注销
export const deleteAccount = impl.deleteAccount;
