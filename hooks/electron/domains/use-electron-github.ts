'use client';

import { useMemo } from 'react';

import type { CreatePrCommentInput, CreatePrInput, MergeStrategy, PrListFilters, UpdatePrInput } from '@/types/github';

import { useElectron } from '../use-electron-base';

export function useElectronGitHub() {
  const { api } = useElectron();

  const github = useMemo(
    () => ({
      checkAuth: async () => {
        if (!api) return { account: '', host: '', isAuthenticated: false, protocol: '' };
        return api.github.checkAuth();
      },
      closePr: async (repoPath: string, prNumber: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.closePr(repoPath, prNumber);
      },
      convertToReady: async (repoPath: string, prNumber: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.convertToReady(repoPath, prNumber);
      },
      createPr: async (repoPath: string, input: CreatePrInput) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.createPr(repoPath, input);
      },
      createPrComment: async (repoPath: string, prNumber: number, input: CreatePrCommentInput) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.createPrComment(repoPath, prNumber, input);
      },
      detectPrTemplate: async (repoPath: string) => {
        if (!api) return null;
        return api.github.detectPrTemplate(repoPath);
      },
      getDeployments: async (repoPath: string, prNumber: number) => {
        if (!api) return [];
        return api.github.getDeployments(repoPath, prNumber);
      },
      getPr: async (repoPath: string, prNumber: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.getPr(repoPath, prNumber);
      },
      getPrDiff: async (repoPath: string, prNumber: number) => {
        if (!api) return '';
        return api.github.getPrDiff(repoPath, prNumber);
      },
      getPrDiffParsed: async (repoPath: string, prNumber: number) => {
        if (!api) return { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
        return api.github.getPrDiffParsed(repoPath, prNumber);
      },
      getRepoInfo: async (repoPath: string) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.getRepoInfo(repoPath);
      },
      listChecks: async (repoPath: string, ref: string) => {
        if (!api) return [];
        return api.github.listChecks(repoPath, ref);
      },
      listPrComments: async (repoPath: string, prNumber: number) => {
        if (!api) return [];
        return api.github.listPrComments(repoPath, prNumber);
      },
      listPrs: async (repoPath: string, filters?: PrListFilters) => {
        if (!api) return [];
        return api.github.listPrs(repoPath, filters);
      },
      mergePr: async (repoPath: string, prNumber: number, strategy: MergeStrategy) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.mergePr(repoPath, prNumber, strategy);
      },
      pushComment: async (repoPath: string, prNumber: number, localCommentId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.pushComment(repoPath, prNumber, localCommentId);
      },
      replyToPrComment: async (repoPath: string, prNumber: number, commentId: number, body: string) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.replyToPrComment(repoPath, prNumber, commentId, body);
      },
      rerunCheck: async (repoPath: string, runId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.rerunCheck(repoPath, runId);
      },
      rerunFailedChecks: async (repoPath: string, runId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.rerunFailedChecks(repoPath, runId);
      },
      syncComments: async (repoPath: string, prNumber: number, workflowId: number) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.syncComments(repoPath, prNumber, workflowId);
      },
      updatePr: async (repoPath: string, prNumber: number, input: UpdatePrInput) => {
        if (!api) throw new Error('Electron API not available');
        return api.github.updatePr(repoPath, prNumber, input);
      },
    }),
    [api]
  );

  return { github };
}
