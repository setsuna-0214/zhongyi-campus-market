import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './user.mock';
import * as real from './user.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const getCurrentUser = impl.getCurrentUser;
export const updateCurrentUser = impl.updateCurrentUser;
export const getUserCollections = impl.getUserCollections;
export const uploadAvatar = impl.uploadAvatar;
export const getMyPublished = impl.getMyPublished;
export const getMyPurchases = impl.getMyPurchases;
export const requestEmailChange = impl.requestEmailChange;
export const confirmEmailChange = impl.confirmEmailChange;
export const changePassword = impl.changePassword;
export const getUser = impl.getUser;
export const getUserPublished = impl.getUserPublished;

// 关注功能
export const getFollows = impl.getFollows;
export const checkIsFollowing = impl.checkIsFollowing;
export const followUser = impl.followUser;
export const unfollowUser = impl.unfollowUser;

export const searchUsers = impl.searchUsers;
