import Store from 'electron-store';
/**
 * Editor Integration Service
 *
 * Manages external editor detection and file opening.
 * Uses a separate electron-store file ('editor-preferences') for user preferences.
 * Detects installed editors by checking CLI availability on PATH.
 */
import { execFile } from 'node:child_process';
import { isAbsolute, join } from 'node:path';
import { platform } from 'node:process';
import { promisify } from 'node:util';

import type {
  DetectedEditor,
  EditorDefinition,
  EditorPreference,
  OpenInEditorInput,
  OpenInEditorResult,
} from '../../types/editor';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Editor Registry
// ---------------------------------------------------------------------------

const EDITOR_REGISTRY: Array<EditorDefinition> = [
  {
    cliCommand: 'code',
    displayName: 'VS Code',
    id: 'vscode',
    lineNumberFormat: '-g {file}:{line}',
    macAppName: 'Visual Studio Code.app',
    platforms: ['darwin', 'linux', 'win32'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'cursor',
    displayName: 'Cursor',
    id: 'cursor',
    lineNumberFormat: '-g {file}:{line}',
    macAppName: 'Cursor.app',
    platforms: ['darwin', 'linux', 'win32'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'zed',
    displayName: 'Zed',
    id: 'zed',
    lineNumberFormat: '{file}:{line}',
    macAppName: 'Zed.app',
    platforms: ['darwin', 'linux'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'idea',
    displayName: 'IntelliJ IDEA',
    id: 'intellij',
    lineNumberFormat: '--line {line} {file}',
    macAppName: 'IntelliJ IDEA.app',
    platforms: ['darwin', 'linux', 'win32'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'subl',
    displayName: 'Sublime Text',
    id: 'sublime',
    lineNumberFormat: '{file}:{line}',
    macAppName: 'Sublime Text.app',
    platforms: ['darwin', 'linux', 'win32'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'xed',
    displayName: 'Xcode',
    id: 'xcode',
    lineNumberFormat: '--line {line} {file}',
    macAppName: 'Xcode.app',
    platforms: ['darwin'],
    supportsLineNumber: true,
  },
  {
    cliCommand: 'studio',
    displayName: 'Android Studio',
    id: 'android-studio',
    macAppName: 'Android Studio.app',
    platforms: ['darwin', 'linux', 'win32'],
    supportsLineNumber: false,
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface EditorPreferenceStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

const store = new Store({ name: 'editor-preferences' }) as unknown as EditorPreferenceStore;

const PREFERENCE_KEY = 'preference';

// ---------------------------------------------------------------------------
// Cached detection results
// ---------------------------------------------------------------------------

let cachedDetection: Array<DetectedEditor> | undefined;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect which editors are installed on the system.
 * Results are cached; call with `force = true` to re-detect.
 */
export async function detectEditors(force = false): Promise<Array<DetectedEditor>> {
  if (cachedDetection && !force) return cachedDetection;

  const registry = getEditorRegistry();
  const results = await Promise.all(registry.map(detectSingleEditor));
  cachedDetection = results;
  return results;
}

/**
 * Get the editor registry filtered by the current platform.
 */
export function getEditorRegistry(): Array<EditorDefinition> {
  const currentPlatform = platform as 'darwin' | 'linux' | 'win32';
  return EDITOR_REGISTRY.filter((e) => e.platforms.includes(currentPlatform));
}

/**
 * Get the user's preferred editor.
 */
export function getPreference(): EditorPreference | undefined {
  const raw = store.get(PREFERENCE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as EditorPreference;
  } catch {
    return undefined;
  }
}

/**
 * Open a file in the user's preferred editor.
 */
export async function openInEditor(input: OpenInEditorInput): Promise<OpenInEditorResult> {
  const pref = getPreference();
  if (!pref) {
    return { error: 'No preferred editor configured. Set one in Settings.', success: false };
  }

  // Resolve absolute file path
  let absolutePath = input.filePath;
  if (!isAbsolute(absolutePath) && input.repoPath) {
    absolutePath = join(input.repoPath, absolutePath);
  }

  try {
    if (pref.editorId === 'custom') {
      if (!pref.customCommand) {
        return { error: 'Custom editor command is not configured.', success: false };
      }
      await execFileAsync(pref.customCommand, [absolutePath]);
      return { success: true };
    }

    const editorDef = EDITOR_REGISTRY.find((e) => e.id === pref.editorId);
    if (!editorDef) {
      return { error: `Unknown editor: ${pref.editorId}`, success: false };
    }

    const args = buildEditorArgs(editorDef, absolutePath, input.lineNumber);
    await execFileAsync(editorDef.cliCommand, args);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to open editor';
    return { error: message, success: false };
  }
}

/**
 * Set the user's preferred editor.
 */
export function setPreference(pref: EditorPreference): void {
  store.set(PREFERENCE_KEY, JSON.stringify(pref));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the CLI arguments for opening a file, with optional line number.
 */
function buildEditorArgs(editor: EditorDefinition, filePath: string, lineNumber?: number): Array<string> {
  if (lineNumber && editor.supportsLineNumber && editor.lineNumberFormat) {
    const format = editor.lineNumberFormat;

    // Formats like "-g {file}:{line}" or "--line {line} {file}" or "{file}:{line}"
    const parts = format.replace('{file}', filePath).replace('{line}', String(lineNumber)).split(' ');

    return parts;
  }

  return [filePath];
}

/**
 * Detect a single editor's availability by checking if its CLI command is on PATH.
 */
async function detectSingleEditor(editor: EditorDefinition): Promise<DetectedEditor> {
  const base: DetectedEditor = {
    available: false,
    displayName: editor.displayName,
    id: editor.id,
  };

  try {
    const whichCmd = platform === 'win32' ? 'where.exe' : 'which';
    const { stdout } = await execFileAsync(whichCmd, [editor.cliCommand]);
    const cliPath = stdout.trim().split('\n')[0]?.trim();

    if (cliPath) {
      return { ...base, available: true, cliPath };
    }
  } catch {
    // Command not found -- editor not available
  }

  return base;
}
