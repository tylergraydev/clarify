'use client';

import { useMemo } from 'react';

import type { ElectronAPI } from '@/types/electron';

import { throwIfNoApi, useElectron } from '../use-electron-base';

export function useElectronChat() {
  const { api } = useElectron();

  const chat = useMemo(
    () => ({
      compactConversation: async (request: Parameters<NonNullable<ElectronAPI>['chat']['compactConversation']>[0]) => {
        const electronApi = throwIfNoApi(api, 'chat.compactConversation');
        return electronApi.chat.compactConversation(request);
      },
      copyMessages: async (fromConversationId: number, toConversationId: number, upToMessageId?: number) => {
        const electronApi = throwIfNoApi(api, 'chat.copyMessages');
        return electronApi.chat.copyMessages(fromConversationId, toConversationId, upToMessageId);
      },
      createConversation: async (data: Parameters<NonNullable<ElectronAPI>['chat']['createConversation']>[0]) => {
        const electronApi = throwIfNoApi(api, 'chat.createConversation');
        return electronApi.chat.createConversation(data);
      },
      createMessage: async (data: Parameters<NonNullable<ElectronAPI>['chat']['createMessage']>[0]) => {
        const electronApi = throwIfNoApi(api, 'chat.createMessage');
        return electronApi.chat.createMessage(data);
      },
      deleteConversation: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'chat.deleteConversation');
        return electronApi.chat.deleteConversation(id);
      },
      exportToNewChat: async (request: Parameters<NonNullable<ElectronAPI>['chat']['exportToNewChat']>[0]) => {
        const electronApi = throwIfNoApi(api, 'chat.exportToNewChat');
        return electronApi.chat.exportToNewChat(request);
      },
      forkConversation: async (request: Parameters<NonNullable<ElectronAPI>['chat']['forkConversation']>[0]) => {
        const electronApi = throwIfNoApi(api, 'chat.forkConversation');
        return electronApi.chat.forkConversation(request);
      },
      generateTitle: async (conversationId: number) => {
        const electronApi = throwIfNoApi(api, 'chat.generateTitle');
        return electronApi.chat.generateTitle(conversationId);
      },
      getConversation: async (id: number) => {
        if (!api) return undefined;
        return api.chat.getConversation(id);
      },
      getTokenEstimate: async (conversationId: number) => {
        if (!api) return 0;
        return api.chat.getTokenEstimate(conversationId);
      },
      listActiveMessages: async (conversationId: number) => {
        if (!api) return [];
        return api.chat.listActiveMessages(conversationId);
      },
      listConversations: async (projectId: number) => {
        if (!api) return [];
        return api.chat.listConversations(projectId);
      },
      listMessages: async (conversationId: number) => {
        if (!api) return [];
        return api.chat.listMessages(conversationId);
      },
      restoreMessage: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'chat.restoreMessage');
        return electronApi.chat.restoreMessage(id);
      },
      revertToMessage: async (conversationId: number, messageId: number) => {
        const electronApi = throwIfNoApi(api, 'chat.revertToMessage');
        return electronApi.chat.revertToMessage(conversationId, messageId);
      },
      searchMessages: async (conversationId: number, query: string) => {
        if (!api) return [];
        return api.chat.searchMessages(conversationId, query);
      },
      softDeleteMessage: async (id: number) => {
        const electronApi = throwIfNoApi(api, 'chat.softDeleteMessage');
        return electronApi.chat.softDeleteMessage(id);
      },
      updateConversation: async (
        id: number,
        data: Parameters<NonNullable<ElectronAPI>['chat']['updateConversation']>[1]
      ) => {
        const electronApi = throwIfNoApi(api, 'chat.updateConversation');
        return electronApi.chat.updateConversation(id, data);
      },
    }),
    [api]
  );

  return { chat };
}
