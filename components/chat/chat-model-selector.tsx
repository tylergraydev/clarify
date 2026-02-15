'use client';

import { ChevronDownIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import type { ModelDefinition, Provider } from '@/lib/constants/providers';

import { Button } from '@/components/ui/button';
import {
  PopoverContent,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getModelsForProvider, MODEL_REGISTRY } from '@/lib/constants/providers';
import { useChatStore } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';

const PROVIDER_GROUPS: Array<{ label: string; provider: Provider }> = [
  { label: 'Claude', provider: 'claude' },
  { label: 'OpenAI', provider: 'openai' },
];

function ModelItem({
  isSelected,
  model,
  onSelect,
}: {
  isSelected: boolean;
  model: ModelDefinition;
  onSelect: (model: ModelDefinition) => void;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm',
        'hover:bg-muted',
        isSelected && 'bg-muted font-medium'
      )}
      onClick={() => onSelect(model)}
      type={'button'}
    >
      <span>{model.displayName}</span>
      <span className={'flex items-center gap-1.5'}>
        {model.supportsReasoning && (
          <span className={'rounded-sm bg-blue-500/10 px-1 py-0.5 text-[10px] text-blue-500'}>{'reasoning'}</span>
        )}
        {!model.supportsTools && (
          <span className={'rounded-sm bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-500'}>{'text only'}</span>
        )}
      </span>
    </button>
  );
}

export const ChatModelSelector = memo(() => {
  const { selectedModel, selectedProvider, setSelectedModel } = useChatStore();

  const currentModel = MODEL_REGISTRY[selectedModel];
  const displayName = currentModel?.displayName ?? selectedModel;

  const handleSelect = useCallback(
    (model: ModelDefinition) => {
      setSelectedModel(model.id, model.provider);
    },
    [setSelectedModel]
  );

  return (
    <PopoverRoot>
      <PopoverTrigger>
        <Button className={'gap-1 px-2 text-xs'} size={'sm'} type={'button'} variant={'ghost'}>
          <span>{displayName}</span>
          <ChevronDownIcon className={'size-3 opacity-50'} />
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner>
          <PopoverPopup className={'w-56'}>
            <PopoverContent className={'p-1'}>
              {PROVIDER_GROUPS.map((group) => {
                const models = getModelsForProvider(group.provider);
                if (models.length === 0) return null;
                return (
                  <div key={group.provider}>
                    <div className={'px-2 py-1.5 text-xs font-semibold text-muted-foreground'}>{group.label}</div>
                    {models.map((model) => (
                      <ModelItem
                        isSelected={selectedModel === model.id && selectedProvider === model.provider}
                        key={model.id}
                        model={model}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                );
              })}
            </PopoverContent>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>
  );
});

ChatModelSelector.displayName = 'ChatModelSelector';
