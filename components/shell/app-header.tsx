'use client';

import type { ComponentPropsWithRef, CSSProperties } from 'react';

import { Menu, Search } from 'lucide-react';

import { IconButton } from '@/components/ui/icon-button';
import { useIsMobile } from '@/hooks/use-media-query';
import { useCommandPaletteStore } from '@/lib/stores/command-palette-store';
import { useShellStore } from '@/lib/stores/shell-store';
import { cn } from '@/lib/utils';

/**
 * Electron drag region styles for window controls
 * Using inline styles to avoid ESLint unknown class errors
 */
const dragRegionStyle: CSSProperties = {
  // @ts-expect-error - WebkitAppRegion is a valid Electron-specific CSS property
  WebkitAppRegion: 'drag',
};

const noDragStyle: CSSProperties = {
  // @ts-expect-error - WebkitAppRegion is a valid Electron-specific CSS property
  WebkitAppRegion: 'no-drag',
};

type AppHeaderProps = ComponentPropsWithRef<'header'>;

export const AppHeader = ({ className, ref, ...props }: AppHeaderProps) => {
  const isMobile = useIsMobile();
  const { isSidebarCollapsed, setMobileDrawerOpen, toggleSidebar } = useShellStore();
  const { open: openCommandPalette } = useCommandPaletteStore();

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <header
      className={cn('fixed inset-x-0 top-0 z-50 h-12 border-b border-border bg-background', className)}
      ref={ref}
      style={dragRegionStyle}
      {...props}
    >
      <div className={'flex h-full items-center gap-2 px-2'}>
        {/* Hamburger Menu */}
        <IconButton
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={handleToggleSidebar}
          style={noDragStyle}
        >
          <Menu aria-hidden={'true'} className={'size-5'} />
        </IconButton>

        {/* App Logo/Title */}
        <div className={'flex items-center gap-2'} style={noDragStyle}>
          <span className={'text-sm font-semibold text-foreground'}>{'Clarify Orchestrator'}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          className={'flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'}
          onClick={openCommandPalette}
          style={noDragStyle}
          type={'button'}
        >
          <Search className={'size-3'} />
          <span>{'Search...'}</span>
          <kbd className={'ml-2 rounded-sm border border-border px-1 py-0.5 text-[10px]'}>{'⌘K'}</kbd>
        </button>

        {/* Spacer for centering */}
        <div className={'flex-1'} style={dragRegionStyle} />

        {/* Window Controls Placeholder */}
        <div aria-hidden={'true'} className={'w-32'} style={noDragStyle} />
      </div>
    </header>
  );
};
