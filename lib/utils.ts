import { type ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

type WorkflowBadgeVariant = 'clarifying' | 'completed' | 'default' | 'draft' | 'failed' | 'planning' | 'stale';

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Merges class names using clsx and tailwind-merge.
 * Combines multiple class values and resolves Tailwind CSS conflicts.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a short date format (e.g., "Jan 15, 2025").
 * Returns '-' if the date is null, undefined, or invalid.
 */
export function formatDate(dateString: null | string | undefined): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return '-';
  }
}

/**
 * Formats a date string to a date-time format (e.g., "Jan 15, 2025 3:30 PM").
 * Returns '-' if the date is null, undefined, or invalid.
 */
export function formatDateTime(dateString: null | string | undefined): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return '-';
  }
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 * Examples: "2h 30m", "45m 12s", "3s", "-"
 */
export function formatDuration(durationMs: null | number | undefined): string {
  if (durationMs === null || durationMs === undefined) return '-';
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: Array<string> = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

/**
 * Gets the appropriate badge variant based on agent type.
 *
 * @param type - The agent type string
 * @returns The badge variant for the given agent type
 */
export function getBadgeVariantForType(type: string): 'default' | 'planning' | 'review' | 'specialist' {
  switch (type) {
    case 'planning':
      return 'planning';
    case 'review':
      return 'review';
    case 'specialist':
      return 'specialist';
    default:
      return 'default';
  }
}

/**
 * Maps workflow status to badge variant for consistent status styling across tables and widgets.
 */
const WORKFLOW_STATUS_VARIANT_MAP: Record<string, WorkflowBadgeVariant> = {
  cancelled: 'stale',
  completed: 'completed',
  created: 'default',
  editing: 'clarifying',
  failed: 'failed',
  paused: 'draft',
  running: 'planning',
};

export function getWorkflowStatusVariant(status: string): WorkflowBadgeVariant {
  return WORKFLOW_STATUS_VARIANT_MAP[status] ?? 'default';
}

/**
 * Converts an array of options with value/label pairs into a Record for Base UI Select items prop.
 * This enables SelectValue to display the label instead of the raw value.
 *
 * @param options - Array of options with value and label properties
 * @returns Record mapping values to labels
 */
export function optionsToItems<T extends { label: string; value: string }>(
  options: ReadonlyArray<T>
): Record<string, string> {
  return options.reduce<Record<string, string>>((acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  }, {});
}

/**
 * Truncates text with ellipsis if it exceeds the max length.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns The original text if within limit, or truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}
