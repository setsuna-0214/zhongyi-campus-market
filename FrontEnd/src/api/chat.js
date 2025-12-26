import { isMockEnabled, ensureMockState } from './mockData';
import * as mock from './chat.mock';
import * as real from './chat.real';

const useMock = isMockEnabled();
if (useMock) { ensureMockState(); }
const impl = useMock ? mock : real;

export const listConversations = impl.listConversations;
export const listMessages = impl.listMessages;
export const sendMessage = impl.sendMessage;
export const createConversation = impl.createConversation;
export const deleteConversation = impl.deleteConversation;
export const uploadChatImage = impl.uploadChatImage;
export const markConversationAsRead = impl.markConversationAsRead;
export const clearConversationsCache = impl.clearConversationsCache;
