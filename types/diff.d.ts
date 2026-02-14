/**
 * Type definitions for diff viewer and code review features.
 *
 * These types are used across the IPC boundary (main ↔ renderer)
 * and in React components for rendering diffs.
 */

// =============================================================================
// Git Diff Result Types
// =============================================================================

/**
 * Inline comment on a diff line.
 */
export interface DiffComment {
  content: string;
  createdAt: string;
  endLine: null | number;
  filePath: string;
  id: number;
  isResolved: boolean;
  lineNumber: number;
  lineType: 'new' | 'old';
  parentId: null | number;
  updatedAt: string;
  workflowId: number;
}

/**
 * A hunk of changes within a file diff.
 */
export interface DiffHunk {
  header: string;
  lines: Array<DiffLine>;
  newLines: number;
  newStart: number;
  oldLines: number;
  oldStart: number;
}

/**
 * A single line within a diff hunk.
 */
export interface DiffLine {
  content: string;
  newLineNumber: null | number;
  oldLineNumber: null | number;
  type: 'add' | 'context' | 'delete';
}

/**
 * Options for fetching a diff.
 */
export interface DiffOptions {
  base?: string;
  contextLines?: number;
  path?: string;
  target?: string;
}

// =============================================================================
// Git Status Types
// =============================================================================

/**
 * Diff for a single file, containing hunks of changes.
 */
export interface FileDiff {
  binary: boolean;
  hunks: Array<DiffHunk>;
  oldPath?: string;
  path: string;
  stats: { additions: number; deletions: number };
  status: 'added' | 'copied' | 'deleted' | 'modified' | 'renamed';
}

/**
 * Options for fetching a diff for a specific file.
 */
export interface FileDiffOptions {
  base?: string;
  contextLines?: number;
  filePath: string;
  target?: string;
}

// =============================================================================
// Git Log Types
// =============================================================================

/**
 * View state for a file in a diff (mark-as-viewed tracking).
 */
export interface FileViewState {
  filePath: string;
  id: number;
  viewedAt: string;
  workflowId: number;
}

// =============================================================================
// Diff Options
// =============================================================================

/**
 * Statistics for file view progress.
 */
export interface FileViewStats {
  totalFiles: number;
  viewedFiles: number;
}

/**
 * A git branch entry.
 */
export interface GitBranch {
  isCurrent: boolean;
  isRemote: boolean;
  name: string;
}

/**
 * Complete diff result from a git diff operation.
 */
export interface GitDiffResult {
  files: Array<FileDiff>;
  stats: { deletions: number; fileCount: number; insertions: number; };
}

// =============================================================================
// Diff Comment Types
// =============================================================================

/**
 * A single git log entry.
 */
export interface GitLogEntry {
  authorEmail: string;
  authorName: string;
  date: string;
  hash: string;
  message: string;
  shortHash: string;
}

/**
 * Options for fetching git log.
 */
export interface GitLogOptions {
  limit?: number;
  path?: string;
  ref?: string;
}

// =============================================================================
// File View State Types
// =============================================================================

/**
 * A single file entry from git status.
 */
export interface GitStatusFile {
  indexStatus: string;
  path: string;
  workingTreeStatus: string;
}

/**
 * Result of a git status operation.
 */
export interface GitStatusResult {
  files: Array<GitStatusFile>;
  summary: {
    deleted: number;
    modified: number;
    staged: number;
    untracked: number;
  };
}

// =============================================================================
// Branch Types
// =============================================================================

/**
 * Input for creating a new diff comment.
 */
export interface NewDiffComment {
  content: string;
  endLine?: null | number;
  filePath: string;
  lineNumber: number;
  lineType: 'new' | 'old';
  parentId?: null | number;
  workflowId: number;
}

export {};
