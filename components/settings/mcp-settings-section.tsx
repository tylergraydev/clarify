'use client';

import type { ReactElement } from 'react';

import { Loader2, Pencil, Plus, Server, Trash2, X } from 'lucide-react';
import { Fragment, useCallback, useState } from 'react';

import type { McpServerConfig, McpServerTransport } from '@/types/mcp-server';

import {
  useDeleteMcpServer,
  useMcpServers,
  useSaveMcpServer,
  useToggleMcpServer,
} from '@/hooks/queries/use-mcp-servers';
import { useToast } from '@/hooks/use-toast';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { SettingsSection } from './settings-section';

// ============================================================================
// Constants
// ============================================================================

const TRANSPORT_OPTIONS = [
  { label: 'stdio', value: 'stdio' },
  { label: 'SSE', value: 'sse' },
  { label: 'HTTP', value: 'http' },
] as const;

const TRANSPORT_ITEMS: Record<string, string> = {
  http: 'HTTP',
  sse: 'SSE',
  stdio: 'stdio',
};

// ============================================================================
// Helpers
// ============================================================================

interface McpServerFormState {
  args: string;
  command: string;
  env: string;
  headers: string;
  name: string;
  transport: McpServerTransport;
  url: string;
}

function envToString(env?: Record<string, string>): string {
  if (!env) return '';
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function headersToString(headers?: Record<string, string>): string {
  if (!headers) return '';
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

function parseEnvString(env: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes('=')) continue;
    const eqIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

// ============================================================================
// Form State
// ============================================================================

function parseHeadersString(headers: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of headers.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(':')) continue;
    const colonIndex = trimmed.indexOf(':');
    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

const EMPTY_FORM: McpServerFormState = {
  args: '',
  command: '',
  env: '',
  headers: '',
  name: '',
  transport: 'stdio',
  url: '',
};

interface McpServerRowProps {
  server: McpServerConfig;
}

function configToFormState(config: McpServerConfig): McpServerFormState {
  return {
    args: config.args?.join(' ') ?? '',
    command: config.command ?? '',
    env: envToString(config.env),
    headers: headersToString(config.headers),
    name: config.name,
    transport: config.transport,
    url: config.url ?? '',
  };
}

// ============================================================================
// McpServerRow
// ============================================================================

function formStateToConfig(form: McpServerFormState, enabled: boolean): McpServerConfig {
  const base: McpServerConfig = {
    enabled,
    name: form.name.trim(),
    transport: form.transport,
  };

  if (form.transport === 'stdio') {
    base.command = form.command.trim();
    if (form.args.trim()) {
      base.args = form.args.trim().split(/\s+/).filter(Boolean);
    }
    const env = parseEnvString(form.env);
    if (Object.keys(env).length > 0) {
      base.env = env;
    }
  } else {
    base.url = form.url.trim();
    const headers = parseHeadersString(form.headers);
    if (Object.keys(headers).length > 0) {
      base.headers = headers;
    }
  }

  return base;
}

const McpServerRow = ({ server }: McpServerRowProps): ReactElement => {
  const toast = useToast();
  const deleteMutation = useDeleteMcpServer();
  const toggleMutation = useToggleMcpServer();
  const saveMutation = useSaveMcpServer();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<McpServerFormState>(() => configToFormState(server));

  const handleToggle = useCallback(
    async (checked: boolean) => {
      try {
        await toggleMutation.mutateAsync({ enabled: checked, name: server.name });
      } catch {
        toast.error({ description: `Failed to toggle ${server.name}.`, title: 'Error' });
      }
    },
    [server.name, toast, toggleMutation]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(server.name);
      toast.success({ description: `${server.name} removed.`, title: 'Server Removed' });
    } catch {
      toast.error({ description: `Failed to remove ${server.name}.`, title: 'Error' });
    }
  }, [deleteMutation, server.name, toast]);

  const handleSaveEdit = useCallback(async () => {
    if (!form.name.trim()) return;
    if (form.transport === 'stdio' && !form.command.trim()) return;
    if (form.transport !== 'stdio' && !form.url.trim()) return;

    try {
      const config = formStateToConfig(form, server.enabled);
      await saveMutation.mutateAsync(config);
      setIsEditing(false);
      toast.success({ description: `${config.name} updated.`, title: 'Server Updated' });
    } catch {
      toast.error({ description: 'Failed to update server.', title: 'Error' });
    }
  }, [form, saveMutation, server.enabled, toast]);

  const handleCancelEdit = useCallback(() => {
    setForm(configToFormState(server));
    setIsEditing(false);
  }, [server]);

  if (isEditing) {
    return (
      <McpServerForm
        form={form}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
        saving={saveMutation.isPending}
        setForm={setForm}
      />
    );
  }

  const _hasArgs = server.args && server.args.length > 0;

  return (
    <div className={'flex flex-col gap-2'}>
      <div className={'flex items-center justify-between'}>
        <div className={'flex items-center gap-2'}>
          <Server className={'size-3.5 text-muted-foreground'} />
          <span className={'text-sm font-medium'}>{server.name}</span>
          <Badge size={'sm'} variant={server.enabled ? 'completed' : 'default'}>
            {server.transport}
          </Badge>
        </div>

        <div className={'flex items-center gap-2'}>
          <Switch checked={server.enabled} onCheckedChange={handleToggle} size={'sm'} />
          <Button onClick={() => setIsEditing(true)} size={'sm'} variant={'ghost'}>
            <Pencil className={'size-3.5'} />
          </Button>
          <Button disabled={deleteMutation.isPending} onClick={handleDelete} size={'sm'} variant={'ghost'}>
            <Trash2 className={'size-3.5'} />
          </Button>
        </div>
      </div>

      <div className={'text-xs text-muted-foreground'}>
        {server.transport === 'stdio' ? (
          <span>
            {server.command}
            {_hasArgs ? ` ${server.args?.join(' ')}` : ''}
          </span>
        ) : (
          <span>{server.url}</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// McpServerForm (shared between Add & Edit)
// ============================================================================

interface McpServerFormProps {
  form: McpServerFormState;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  setForm: (fn: ((prev: McpServerFormState) => McpServerFormState) | McpServerFormState) => void;
}

const McpServerForm = ({ form, onCancel, onSave, saving, setForm }: McpServerFormProps): ReactElement => {
  const updateField = useCallback(
    <K extends keyof McpServerFormState>(field: K, value: McpServerFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  const isValid =
    form.name.trim().length > 0 &&
    (form.transport === 'stdio' ? form.command.trim().length > 0 : form.url.trim().length > 0);

  return (
    <div className={'flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-4'}>
      <div className={'flex items-center gap-3'}>
        <div className={'flex-1'}>
          <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>Name</label>
          <Input
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={'my-mcp-server'}
            size={'sm'}
            value={form.name}
          />
        </div>
        <div className={'w-32'}>
          <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>Transport</label>
          <SelectRoot
            items={TRANSPORT_ITEMS}
            onValueChange={(value) => {
              if (value) updateField('transport', value as McpServerTransport);
            }}
            value={form.transport}
          >
            <SelectTrigger size={'sm'}>
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup size={'sm'}>
                  <SelectList>
                    {TRANSPORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} size={'sm'} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>

      {form.transport === 'stdio' ? (
        <Fragment>
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>Command</label>
            <Input
              onChange={(e) => updateField('command', e.target.value)}
              placeholder={'npx -y @modelcontextprotocol/server-github'}
              size={'sm'}
              value={form.command}
            />
          </div>
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>
              Arguments <span className={'font-normal text-muted-foreground/70'}>(space-separated)</span>
            </label>
            <Input
              onChange={(e) => updateField('args', e.target.value)}
              placeholder={'--flag value'}
              size={'sm'}
              value={form.args}
            />
          </div>
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>
              Environment Variables <span className={'font-normal text-muted-foreground/70'}>(KEY=VALUE per line)</span>
            </label>
            <Textarea
              className={'font-mono text-xs'}
              onChange={(e) => updateField('env', e.target.value)}
              placeholder={'GITHUB_TOKEN=ghp_xxx'}
              rows={3}
              value={form.env}
            />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>URL</label>
            <Input
              onChange={(e) => updateField('url', e.target.value)}
              placeholder={'https://mcp-server.example.com/sse'}
              size={'sm'}
              value={form.url}
            />
          </div>
          <div>
            <label className={'mb-1 block text-xs font-medium text-muted-foreground'}>
              Headers <span className={'font-normal text-muted-foreground/70'}>(Key: Value per line)</span>
            </label>
            <Textarea
              className={'font-mono text-xs'}
              onChange={(e) => updateField('headers', e.target.value)}
              placeholder={'Authorization: Bearer xxx'}
              rows={3}
              value={form.headers}
            />
          </div>
        </Fragment>
      )}

      <div className={'flex items-center justify-end gap-2'}>
        <Button onClick={onCancel} size={'sm'} variant={'ghost'}>
          <X className={'size-3.5'} />
          Cancel
        </Button>
        <Button disabled={!isValid || saving} onClick={onSave} size={'sm'} variant={'default'}>
          {saving ? <Loader2 className={'size-3.5 animate-spin'} /> : null}
          Save
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// McpSettingsSection
// ============================================================================

export const McpSettingsSection = (): ReactElement => {
  const toast = useToast();
  const { data: servers, isLoading } = useMcpServers();
  const saveMutation = useSaveMcpServer();

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<McpServerFormState>(EMPTY_FORM);

  const handleSaveNew = useCallback(async () => {
    if (!addForm.name.trim()) return;

    try {
      const config = formStateToConfig(addForm, true);
      await saveMutation.mutateAsync(config);
      setAddForm(EMPTY_FORM);
      setIsAdding(false);
      toast.success({ description: `${config.name} added.`, title: 'Server Added' });
    } catch {
      toast.error({ description: 'Failed to add MCP server.', title: 'Error' });
    }
  }, [addForm, saveMutation, toast]);

  const handleCancelAdd = useCallback(() => {
    setAddForm(EMPTY_FORM);
    setIsAdding(false);
  }, []);

  const _hasServers = servers && servers.length > 0;

  return (
    <SettingsSection title={'MCP Servers'}>
      <p className={'text-xs text-muted-foreground'}>
        Configure Model Context Protocol (MCP) servers to extend AI agent capabilities with external tools and data
        sources. Enabled servers are automatically available to all agents.
      </p>

      {isLoading ? (
        <div className={'flex items-center justify-center py-4'}>
          <Loader2 className={'size-5 animate-spin text-muted-foreground'} />
        </div>
      ) : (
        <div className={'flex flex-col gap-4'}>
          {_hasServers && (
            <div className={'flex flex-col gap-4'}>
              {servers?.map((server, index) => (
                <div key={server.name}>
                  <McpServerRow server={server} />
                  {index < servers.length - 1 && <Separator className={'mt-4'} />}
                </div>
              ))}
            </div>
          )}

          {isAdding ? (
            <McpServerForm
              form={addForm}
              onCancel={handleCancelAdd}
              onSave={handleSaveNew}
              saving={saveMutation.isPending}
              setForm={setAddForm}
            />
          ) : (
            <Button className={'w-fit'} onClick={() => setIsAdding(true)} size={'sm'} variant={'outline'}>
              <Plus className={'size-3.5'} />
              Add Server
            </Button>
          )}
        </div>
      )}
    </SettingsSection>
  );
};
