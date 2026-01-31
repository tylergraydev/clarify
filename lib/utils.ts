import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
