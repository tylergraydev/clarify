'use client';

import type { BundledLanguage, ShikiTransformer } from 'shiki';

import { CheckIcon, CopyIcon } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { codeToHtml } from 'shiki';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Range of lines to highlight in the code block */
export interface HighlightRange {
  endLine: number;
  startLine: number;
}

interface CodeBlockContextType {
  code: string;
}

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  /** Ranges of lines to visually highlight */
  highlightRanges?: Array<HighlightRange>;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

const lineNumberTransformer: ShikiTransformer = {
  line(node, line) {
    node.children.unshift({
      children: [{ type: 'text', value: String(line) }],
      properties: {
        className: ['inline-block', 'min-w-10', 'mr-4', 'text-right', 'select-none', 'text-muted-foreground'],
      },
      tagName: 'span',
      type: 'element',
    });
  },
  name: 'line-numbers',
};

/**
 * Creates a Shiki transformer that highlights specified line ranges
 */
const createHighlightTransformer = (ranges: Array<HighlightRange>): ShikiTransformer => ({
  line(node, line) {
    const isHighlighted = ranges.some((range) => line >= range.startLine && line <= range.endLine);
    if (isHighlighted) {
      const existingClasses = (node.properties.className as Array<string> | undefined) ?? [];
      node.properties.className = [...existingClasses, 'highlighted-line'];
    }
  },
  name: 'highlight-lines',
});

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  showLineNumbers = false,
  highlightRanges: Array<HighlightRange> = []
) {
  const transformers: Array<ShikiTransformer> = [];

  if (showLineNumbers) {
    transformers.push(lineNumberTransformer);
  }

  if (highlightRanges.length > 0) {
    transformers.push(createHighlightTransformer(highlightRanges));
  }

  return await Promise.all([
    codeToHtml(code, {
      lang: language,
      theme: 'one-light',
      transformers,
    }),
    codeToHtml(code, {
      lang: language,
      theme: 'one-dark-pro',
      transformers,
    }),
  ]);
}

export const CodeBlock = ({
  children,
  className,
  code,
  highlightRanges = [],
  language,
  showLineNumbers = false,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');
  const [darkHtml, setDarkHtml] = useState<string>('');
  const mounted = useRef(false);

  useEffect(() => {
    highlightCode(code, language, showLineNumbers, highlightRanges).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light);
        setDarkHtml(dark);
        mounted.current = true;
      }
    });

    return () => {
      mounted.current = false;
    };
  }, [code, language, showLineNumbers, highlightRanges]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-md border bg-background text-foreground',
          className
        )}
        {...props}
      >
        <div className={'relative'}>
          <div
            className={
              'overflow-auto dark:hidden [&_code]:font-mono [&_code]:text-sm [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground!'
            }
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className={
              'hidden overflow-auto dark:block [&_code]:font-mono [&_code]:text-sm [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-sm [&>pre]:text-foreground!'
            }
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
          {children && <div className={'absolute top-2 right-2 flex items-center gap-2'}>{children}</div>}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  children,
  className,
  onCopy,
  onError,
  timeout = 2000,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const handleCopyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      onError?.(new Error('Clipboard API not available'));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn('shrink-0', className)}
      onClick={handleCopyToClipboard}
      size={'icon'}
      variant={'ghost'}
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
