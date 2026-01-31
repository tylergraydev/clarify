'use client';

import { AlertTriangle, Info, X } from 'lucide-react';

import type { ParsedAgentMarkdown } from '@/lib/utils/agent-markdown';
import type { AgentImportValidationResult, AgentImportWarning } from '@/lib/validations/agent-import';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAgentColorHex } from '@/lib/colors/agent-colors';
import { capitalizeFirstLetter, cn, getBadgeVariantForType, truncateText } from '@/lib/utils';

interface ImportAgentDialogProps {
  /** Whether import is in progress */
  isLoading?: boolean;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when import is confirmed */
  onImport: (data: ParsedAgentMarkdown) => void;
  /** Callback when dialog open state changes */
  onOpenChange: (isOpen: boolean) => void;
  /** The parsed agent markdown data to preview */
  parsedData: null | ParsedAgentMarkdown;
  /** Validation result from agent import validation */
  validationResult: AgentImportValidationResult | null;
}

/**
 * Dialog for previewing and confirming agent import from markdown files.
 * Displays parsed agent configuration with validation errors and warnings,
 * and allows users to review before importing.
 *
 * @param props - Component props
 * @param props.isLoading - Whether import is in progress
 * @param props.isOpen - Whether the dialog is open
 * @param props.onImport - Callback when import is confirmed
 * @param props.onOpenChange - Callback when dialog open state changes
 * @param props.parsedData - The parsed agent markdown data to preview
 * @param props.validationResult - Validation result from agent import validation
 */
export const ImportAgentDialog = ({
  isLoading = false,
  isOpen,
  onImport,
  onOpenChange,
  parsedData,
  validationResult,
}: ImportAgentDialogProps) => {
  const hasErrors = validationResult ? !validationResult.success || validationResult.errors.length > 0 : false;
  const hasWarnings = validationResult ? validationResult.warnings.length > 0 : false;
  const isImportDisabled = isLoading || hasErrors || !parsedData;

  const handleImportClick = () => {
    if (parsedData && !hasErrors) {
      onImport(parsedData);
    }
  };

  const frontmatter = parsedData?.frontmatter;
  const toolsCount = frontmatter?.tools?.length ?? 0;
  const skillsCount = frontmatter?.skills?.length ?? 0;
  const disallowedToolsCount = frontmatter?.disallowedTools?.length ?? 0;

  // Calculate hook counts by event type
  const preToolUseHooksCount = frontmatter?.hooks?.PreToolUse?.length ?? 0;
  const postToolUseHooksCount = frontmatter?.hooks?.PostToolUse?.length ?? 0;
  const stopHooksCount = frontmatter?.hooks?.Stop?.length ?? 0;
  const totalHooksCount = preToolUseHooksCount + postToolUseHooksCount + stopHooksCount;

  return (
    <DialogRoot onOpenChange={onOpenChange} open={isOpen}>
      {/* Portal */}
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-modal={'true'} role={'dialog'} scrollable={true} size={'lg'}>
          {/* Header */}
          <DialogHeader>
            <DialogTitle id={'import-agent-title'}>{'Import Agent Preview'}</DialogTitle>
            <DialogDescription id={'import-agent-description'}>
              {'Review the agent configuration before importing.'}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <DialogBody className={'pr-4'}>
            {/* Validation Errors */}
            {hasErrors && validationResult && (
              <Alert className={'mb-4'} variant={'destructive'}>
                <X aria-hidden={'true'} className={'size-4'} />
                <div>
                  <AlertTitle>{'Validation Errors'}</AlertTitle>
                  <AlertDescription>
                    <ul className={'mt-2 list-inside list-disc space-y-1'}>
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>
                          <span className={'font-medium'}>{error.field}:</span> {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Validation Warnings */}
            {hasWarnings && validationResult && (
              <Alert className={'mb-4'} variant={'warning'}>
                <AlertTriangle aria-hidden={'true'} className={'size-4'} />
                <div>
                  <AlertTitle>{'Warnings'}</AlertTitle>
                  <AlertDescription>
                    <ul className={'mt-2 list-inside list-disc space-y-1'}>
                      {validationResult.warnings.map((warning: AgentImportWarning, index: number) => (
                        <li key={index}>
                          <span className={'font-medium'}>{warning.field}:</span> {warning.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Agent Preview */}
            {frontmatter && (
              <div className={'space-y-4'}>
                {/* Agent Identity */}
                <section>
                  <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                    {'Agent Identity'}
                  </h3>
                  <div className={'rounded-md border border-border bg-muted/50 p-4'}>
                    {/* Name and Color */}
                    <div className={'flex items-center gap-3'}>
                      {frontmatter.color && (
                        <div
                          aria-label={`Agent color: ${frontmatter.color}`}
                          className={'size-4 shrink-0 rounded-full'}
                          style={{
                            backgroundColor: getAgentColorHex(frontmatter.color),
                          }}
                        />
                      )}
                      <div className={'min-w-0 flex-1'}>
                        <p className={'text-base font-semibold text-foreground'}>{frontmatter.displayName}</p>
                        <p className={'font-mono text-sm text-muted-foreground'}>{frontmatter.name}</p>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className={'mt-3 flex items-center gap-2'}>
                      <Badge variant={getBadgeVariantForType(frontmatter.type ?? 'specialist')}>
                        {capitalizeFirstLetter(frontmatter.type ?? 'specialist')}
                      </Badge>
                      {frontmatter.color && (
                        <Badge variant={'default'}>{capitalizeFirstLetter(frontmatter.color)}</Badge>
                      )}
                    </div>

                    {/* Model and Permission Mode */}
                    {(frontmatter.model || frontmatter.permissionMode) && (
                      <div className={'mt-3 flex flex-wrap gap-x-4 gap-y-1'}>
                        {frontmatter.model && (
                          <p className={'text-sm text-muted-foreground'}>
                            <span className={'font-medium text-foreground'}>{'Model:'}</span> {frontmatter.model}
                          </p>
                        )}
                        {frontmatter.permissionMode && (
                          <p className={'text-sm text-muted-foreground'}>
                            <span className={'font-medium text-foreground'}>{'Permission Mode:'}</span>{' '}
                            {frontmatter.permissionMode}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {frontmatter.description && (
                      <p className={'mt-3 text-sm text-muted-foreground'}>{frontmatter.description}</p>
                    )}
                  </div>
                </section>

                {/* Tools Section */}
                <section>
                  <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                    {`Tools (${toolsCount})`}
                  </h3>
                  <div className={'rounded-md border border-border bg-muted/50 p-4'}>
                    {toolsCount > 0 ? (
                      <div className={'flex flex-wrap gap-2'}>
                        {frontmatter.tools?.map((toolName, index) => (
                          <Badge key={index} variant={'default'}>
                            {toolName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className={'text-sm text-muted-foreground'}>
                        {'No tools configured. Agent will have no tool restrictions.'}
                      </p>
                    )}
                  </div>
                </section>

                {/* Skills Section */}
                <section>
                  <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                    {`Skills (${skillsCount})`}
                  </h3>
                  <div className={'rounded-md border border-border bg-muted/50 p-4'}>
                    {skillsCount > 0 ? (
                      <div className={'flex flex-wrap gap-2'}>
                        {frontmatter.skills?.map((skillName, index) => (
                          <Badge key={index} variant={'default'}>
                            {skillName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className={'text-sm text-muted-foreground'}>{'No skills configured.'}</p>
                    )}
                  </div>
                </section>

                {/* Disallowed Tools Section */}
                {disallowedToolsCount > 0 && (
                  <section>
                    <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                      {`Disallowed Tools (${disallowedToolsCount})`}
                    </h3>
                    <div className={'rounded-md border border-border bg-muted/50 p-4'}>
                      <div className={'flex flex-wrap gap-2'}>
                        {frontmatter.disallowedTools?.map((toolName, index) => (
                          <Badge key={index} variant={'failed'}>
                            {toolName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Hooks Section */}
                {totalHooksCount > 0 && (
                  <section>
                    <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                      {`Hooks (${totalHooksCount})`}
                    </h3>
                    <div className={'rounded-md border border-border bg-muted/50 p-4'}>
                      <div className={'space-y-2'}>
                        {preToolUseHooksCount > 0 && (
                          <div className={'flex items-center gap-2'}>
                            <Badge variant={'default'}>{'PreToolUse'}</Badge>
                            <span className={'text-sm text-muted-foreground'}>
                              {preToolUseHooksCount === 1 ? '1 hook' : `${preToolUseHooksCount} hooks`}
                            </span>
                          </div>
                        )}
                        {postToolUseHooksCount > 0 && (
                          <div className={'flex items-center gap-2'}>
                            <Badge variant={'default'}>{'PostToolUse'}</Badge>
                            <span className={'text-sm text-muted-foreground'}>
                              {postToolUseHooksCount === 1 ? '1 hook' : `${postToolUseHooksCount} hooks`}
                            </span>
                          </div>
                        )}
                        {stopHooksCount > 0 && (
                          <div className={'flex items-center gap-2'}>
                            <Badge variant={'default'}>{'Stop'}</Badge>
                            <span className={'text-sm text-muted-foreground'}>
                              {stopHooksCount === 1 ? '1 hook' : `${stopHooksCount} hooks`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* System Prompt Preview */}
                <section>
                  <h3 className={'mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase'}>
                    {'System Prompt Preview'}
                  </h3>
                  <div className={cn('rounded-md border border-border bg-muted/50 p-4', 'max-h-40 overflow-y-auto')}>
                    <pre className={'font-mono text-xs whitespace-pre-wrap text-foreground'}>
                      {parsedData?.systemPrompt
                        ? truncateText(parsedData.systemPrompt, 500)
                        : 'No system prompt provided.'}
                    </pre>
                  </div>
                </section>

                {/* Import Info */}
                <Alert variant={'info'}>
                  <Info aria-hidden={'true'} className={'size-4'} />
                  <AlertDescription>
                    {
                      'Importing will create a new custom agent with this configuration. You can edit the agent after import.'
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* No Data State */}
            {!frontmatter && !hasErrors && (
              <div className={'py-8 text-center text-muted-foreground'}>{'No agent data to preview.'}</div>
            )}
          </DialogBody>

          {/* Footer Actions */}
          <DialogFooter>
            <DialogClose>
              <Button variant={'outline'}>{'Cancel'}</Button>
            </DialogClose>
            <Button
              aria-describedby={'import-agent-description'}
              aria-label={
                hasErrors ? 'Cannot import - validation errors' : `Import agent ${frontmatter?.displayName ?? ''}`
              }
              disabled={isImportDisabled}
              onClick={handleImportClick}
            >
              {isLoading ? 'Importing...' : 'Import Agent'}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
};
