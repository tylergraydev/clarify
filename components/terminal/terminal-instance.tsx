'use client';

import type { FitAddon } from '@xterm/addon-fit';
import type { Terminal as XTerm } from '@xterm/xterm';

import { useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

interface TerminalInstanceProps {
  className?: string;
  terminalId: string;
}

/**
 * Reads CSS variable colors from the document and builds an xterm.js theme.
 */
function getXtermTheme(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const bg = style.getPropertyValue('--background').trim();
  const fg = style.getPropertyValue('--foreground').trim();
  const accent = style.getPropertyValue('--accent').trim();
  const muted = style.getPropertyValue('--muted-foreground').trim();

  return {
    background: bg || '#0b0f14',
    cursor: accent || '#ff7a2f',
    cursorAccent: bg || '#0b0f14',
    foreground: fg || '#f2f5f9',
    selectionBackground: muted ? `${muted}40` : '#9fb0c140',
  };
}

/**
 * Wraps a single xterm.js Terminal instance connected to a PTY via IPC.
 *
 * Handles:
 * - Terminal creation with FitAddon and WebLinksAddon
 * - PTY data I/O via electronAPI.terminal
 * - Resize via ResizeObserver + FitAddon
 * - Theme synchronization via MutationObserver on <html> class
 * - Full cleanup on unmount
 */
export const TerminalInstance = ({ className, terminalId }: TerminalInstanceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<null | XTerm>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);

  const setupTerminal = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !window.electronAPI?.terminal) return;

    // Dynamically import xterm.js modules (they use DOM APIs)
    const [{ Terminal }, { FitAddon: FitAddonClass }, { WebLinksAddon }] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links'),
    ]);

    const fitAddon = new FitAddonClass();
    const webLinksAddon = new WebLinksAddon();

    const terminal = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: 'var(--font-geist-mono), "Cascadia Code", Menlo, Monaco, monospace',
      fontSize: 13,
      scrollback: 1000,
      theme: getXtermTheme(),
    });

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(container);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Initial fit
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // Send user keystrokes to PTY
    const onDataDisposable = terminal.onData((data) => {
      window.electronAPI?.terminal.input(terminalId, data);
    });
    cleanupRef.current.push(() => onDataDisposable.dispose());

    // Receive PTY output
    const unsubData = window.electronAPI.terminal.onData(terminalId, (data) => {
      terminal.write(data);
    });
    cleanupRef.current.push(unsubData);

    // Handle PTY exit
    const unsubExit = window.electronAPI.terminal.onExit(terminalId, () => {
      terminal.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n');
    });
    cleanupRef.current.push(unsubExit);

    // Resize observer — fit terminal on container resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalRef.current) {
          fitAddonRef.current.fit();
        }
      });
    });
    resizeObserver.observe(container);
    cleanupRef.current.push(() => resizeObserver.disconnect());

    // Forward resize events to PTY
    const onResizeDisposable = terminal.onResize(({ cols, rows }) => {
      window.electronAPI?.terminal.resize(terminalId, cols, rows);
    });
    cleanupRef.current.push(() => onResizeDisposable.dispose());

    // Theme sync — observe <html> class changes for dark/light mode
    const htmlEl = document.documentElement;
    const mutationObserver = new MutationObserver(() => {
      if (terminalRef.current) {
        terminalRef.current.options.theme = getXtermTheme();
      }
    });
    mutationObserver.observe(htmlEl, { attributeFilter: ['class'], attributes: true });
    cleanupRef.current.push(() => mutationObserver.disconnect());

    // Focus terminal
    terminal.focus();
  }, [terminalId]);

  useEffect(() => {
    setupTerminal();

    return () => {
      // Run all cleanup functions
      for (const cleanup of cleanupRef.current) {
        cleanup();
      }
      cleanupRef.current = [];

      // Dispose terminal
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [setupTerminal]);

  // Re-fit when the component becomes visible
  const handleFit = useCallback(() => {
    requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
    });
  }, []);

  // Expose fit for parent to call on panel resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use a custom event for the parent panel to trigger fit
    const handleFitEvent = () => handleFit();
    container.addEventListener('terminal:fit', handleFitEvent);
    return () => container.removeEventListener('terminal:fit', handleFitEvent);
  }, [handleFit]);

  return (
    <div
      className={cn('size-full', className)}
      ref={containerRef}
    />
  );
};
