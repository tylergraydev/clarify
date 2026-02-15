/** Detected editor on the user's system */
export interface DetectedEditor {
  available: boolean;
  /** Resolved path to the CLI binary */
  cliPath?: string;
  displayName: string;
  id: EditorId;
}

/** Static metadata for a known editor */
export interface EditorDefinition {
  /** CLI command name (e.g., 'code', 'cursor') */
  cliCommand: string;
  displayName: string;
  id: EditorId;
  /** Format string for line number arg. Use {file} and {line} placeholders */
  lineNumberFormat?: string;
  /** macOS .app bundle name (e.g., 'Visual Studio Code.app') */
  macAppName?: string;
  /** Platforms where this editor is available */
  platforms: Array<'darwin' | 'linux' | 'win32'>;
  /** Whether the CLI supports opening at a specific line */
  supportsLineNumber: boolean;
}

/** Supported editor identifiers */
export type EditorId = 'android-studio' | 'cursor' | 'custom' | 'intellij' | 'sublime' | 'vscode' | 'xcode' | 'zed';

/** User's editor preference (stored in electron-store) */
export interface EditorPreference {
  /** Only used when editorId is 'custom' */
  customCommand?: string;
  editorId: EditorId;
}

/** Input for opening a file in an editor */
export interface OpenInEditorInput {
  filePath: string;
  lineNumber?: number;
  /** If provided, prepended to filePath for relative paths */
  repoPath?: string;
}

/** Result of opening a file */
export interface OpenInEditorResult {
  error?: string;
  success: boolean;
}
