export interface DiffKeyboardShortcut {
  description: string;
  key: string;
  label: string;
}

export const DIFF_KEYBOARD_SHORTCUTS: Array<DiffKeyboardShortcut> = [
  { description: 'Navigate to next file', key: 'j', label: 'Next file' },
  { description: 'Navigate to previous file', key: 'k', label: 'Previous file' },
  { description: 'Navigate to next hunk', key: 'n', label: 'Next hunk' },
  { description: 'Navigate to previous hunk', key: 'p', label: 'Previous hunk' },
  { description: 'Toggle file as viewed', key: 'v', label: 'Toggle viewed' },
  { description: 'Add a comment on selected line', key: 'c', label: 'Comment' },
  { description: 'Switch to unified view', key: 'u', label: 'Unified view' },
  { description: 'Switch to split view', key: 's', label: 'Split view' },
  { description: 'Collapse or expand current file', key: 'x', label: 'Toggle collapse' },
  { description: 'Search across diff content', key: 'Ctrl+F', label: 'Search diff' },
  { description: 'Show keyboard shortcut help', key: '?', label: 'Show shortcuts' },
];
