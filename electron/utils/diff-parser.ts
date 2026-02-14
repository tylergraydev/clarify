/**
 * Git Diff Parser
 *
 * Wraps the `parse-git-diff` library to produce structured diff data
 * matching the application's `FileDiff` type definitions.
 */
import parseGitDiff from 'parse-git-diff';

import type { DiffHunk, DiffLine, FileDiff, GitDiffResult } from '../../types/diff';

type ParsedFile = ReturnType<typeof parseGitDiff>['files'][number];

/**
 * Parse a raw unified diff string into structured diff data.
 */
export function parseDiff(rawDiff: string): GitDiffResult {
  if (!rawDiff.trim()) {
    return { files: [], stats: { deletions: 0, fileCount: 0, insertions: 0 } };
  }

  const parsed = parseGitDiff(rawDiff);
  let totalInsertions = 0;
  let totalDeletions = 0;

  const files: Array<FileDiff> = parsed.files.map((file) => {
    const filePath = getFilePath(file);
    const oldPath = getOldPath(file);
    const status = getFileStatus(file);
    const binary = hasBinaryChunks(file);

    let additions = 0;
    let deletions = 0;
    const hunks: Array<DiffHunk> = [];

    for (const chunk of file.chunks) {
      const lines: Array<DiffLine> = [];

      if (chunk.type === 'Chunk') {
        for (const change of chunk.changes) {
          if (change.type === 'AddedLine') {
            additions++;
            lines.push({
              content: change.content,
              newLineNumber: change.lineAfter,
              oldLineNumber: null,
              type: 'add',
            });
          } else if (change.type === 'DeletedLine') {
            deletions++;
            lines.push({
              content: change.content,
              newLineNumber: null,
              oldLineNumber: change.lineBefore,
              type: 'delete',
            });
          } else if (change.type === 'UnchangedLine') {
            lines.push({
              content: change.content,
              newLineNumber: change.lineAfter,
              oldLineNumber: change.lineBefore,
              type: 'context',
            });
          }
        }

        hunks.push({
          header: chunk.context ?? `@@ -${chunk.fromFileRange.start},${chunk.fromFileRange.lines} +${chunk.toFileRange.start},${chunk.toFileRange.lines} @@`,
          lines,
          newLines: chunk.toFileRange.lines,
          newStart: chunk.toFileRange.start,
          oldLines: chunk.fromFileRange.lines,
          oldStart: chunk.fromFileRange.start,
        });
      }
    }

    totalInsertions += additions;
    totalDeletions += deletions;

    return {
      binary,
      hunks,
      ...(oldPath && oldPath !== filePath ? { oldPath } : {}),
      path: filePath,
      stats: { additions, deletions },
      status,
    };
  });

  return {
    files,
    stats: {
      deletions: totalDeletions,
      fileCount: files.length,
      insertions: totalInsertions,
    },
  };
}

function getFilePath(file: ParsedFile): string {
  if (file.type === 'RenamedFile') {
    return file.pathAfter;
  }
  return file.path;
}

function getFileStatus(file: ParsedFile): FileDiff['status'] {
  switch (file.type) {
    case 'AddedFile':
      return 'added';
    case 'ChangedFile':
      return 'modified';
    case 'DeletedFile':
      return 'deleted';
    case 'RenamedFile':
      return 'renamed';
    default:
      return 'modified';
  }
}

function getOldPath(file: ParsedFile): string | undefined {
  if (file.type === 'RenamedFile') {
    return file.pathBefore;
  }
  return undefined;
}

function hasBinaryChunks(file: ParsedFile): boolean {
  return file.chunks.some((chunk) => chunk.type === 'BinaryFilesChunk');
}
