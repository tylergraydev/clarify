'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Monitor, Moon, Sun } from 'lucide-react';

import type { Theme } from '@/lib/theme/constants';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

const themeOptions: Array<{
  icon: typeof Monitor;
  label: string;
  value: Theme;
}> = [
  { icon: Monitor, label: 'System', value: 'system' },
  { icon: Sun, label: 'Light', value: 'light' },
  { icon: Moon, label: 'Dark', value: 'dark' },
];

const toggleButtonClassName = cn(
  'flex items-center justify-center gap-2 rounded-md px-3 py-1.5',
  'text-sm text-muted-foreground',
  'transition-colors select-none',
  'hover:bg-muted hover:text-foreground',
  `
    focus-visible:outline-2 focus-visible:-outline-offset-1
    focus-visible:outline-accent
  `,
  'data-pressed:bg-accent data-pressed:text-accent-foreground'
);

export function ThemeSelector() {
  const { setTheme, theme } = useTheme();

  return (
    <div className={'space-y-2'}>
      <label className={'text-sm font-medium'}>Theme</label>
      <ToggleGroup
        className={cn(`
          flex gap-1 rounded-lg border border-border bg-muted/50 p-1
        `)}
        onValueChange={(newValue) => {
          // ToggleGroup returns an array, but with multiple={false} it will have at most one element
          const selectedTheme = newValue[0] as Theme | undefined;
          if (selectedTheme) {
            setTheme(selectedTheme);
          }
        }}
        value={[theme]}
      >
        {themeOptions.map(({ icon: Icon, label, value }) => (
          <Toggle aria-label={`${label} theme`} className={toggleButtonClassName} key={value} value={value}>
            <Icon className={'size-4'} />
            <span>{label}</span>
          </Toggle>
        ))}
      </ToggleGroup>
      <p className={'text-xs text-muted-foreground'}>
        Select your preferred theme. System will follow your OS settings.
      </p>
    </div>
  );
}
