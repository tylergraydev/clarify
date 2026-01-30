"use client";

import { Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";

import type { AgentTool } from "@/types/electron";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  useAgentTools,
  useAllowAgentTool,
  useCreateAgentTool,
  useDeleteAgentTool,
  useDisallowAgentTool,
} from "@/hooks/queries/use-agent-tools";
import { cn } from "@/lib/utils";

interface AgentToolsManagerProps {
  agentId: number;
  disabled?: boolean;
}

export const AgentToolsManager = ({
  agentId,
  disabled = false,
}: AgentToolsManagerProps) => {
  const [newToolName, setNewToolName] = useState("");
  const [newToolPattern, setNewToolPattern] = useState("*");
  const [isAdding, setIsAdding] = useState(false);

  const { data: tools = [], isLoading } = useAgentTools(agentId);
  const createMutation = useCreateAgentTool();
  const deleteMutation = useDeleteAgentTool();
  const allowMutation = useAllowAgentTool();
  const disallowMutation = useDisallowAgentTool();

  const handleAddTool = async () => {
    if (!newToolName.trim()) return;

    try {
      await createMutation.mutateAsync({
        agentId,
        toolName: newToolName.trim(),
        toolPattern: newToolPattern.trim() || "*",
      });
      setNewToolName("");
      setNewToolPattern("*");
      setIsAdding(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteTool = async (tool: AgentTool) => {
    try {
      await deleteMutation.mutateAsync({ agentId, id: tool.id });
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleTool = async (tool: AgentTool) => {
    try {
      if (tool.disallowedAt) {
        await allowMutation.mutateAsync(tool.id);
      } else {
        await disallowMutation.mutateAsync(tool.id);
      }
    } catch {
      // Error handled by mutation
    }
  };

  const isAllowed = (tool: AgentTool) => tool.disallowedAt === null;

  if (isLoading) {
    return (
      <div className={"py-4 text-center text-sm text-muted-foreground"}>
        {"Loading tools..."}
      </div>
    );
  }

  return (
    <div className={"flex flex-col gap-3"}>
      {/* Tools List */}
      {tools.length > 0 ? (
        <div className={"flex flex-col gap-2"}>
          {tools.map((tool) => (
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2",
                !isAllowed(tool) && "opacity-60"
              )}
              key={tool.id}
            >
              <div className={"min-w-0 flex-1"}>
                <div className={"flex items-center gap-2"}>
                  <span className={"font-mono text-sm font-medium"}>
                    {tool.toolName}
                  </span>
                  {tool.toolPattern !== "*" && (
                    <span className={"text-xs text-muted-foreground"}>
                      {"("}
                      {tool.toolPattern}
                      {")"}
                    </span>
                  )}
                </div>
                {!isAllowed(tool) && (
                  <span className={"text-xs text-muted-foreground"}>
                    {"Disallowed"}
                  </span>
                )}
              </div>
              <div className={"flex items-center gap-1"}>
                <IconButton
                  aria-label={isAllowed(tool) ? "Disallow tool" : "Allow tool"}
                  className={"size-7"}
                  disabled={disabled}
                  onClick={() => handleToggleTool(tool)}
                  title={isAllowed(tool) ? "Disallow" : "Allow"}
                >
                  {isAllowed(tool) ? (
                    <ToggleRight className={"size-4 text-green-500"} />
                  ) : (
                    <ToggleLeft className={"size-4 text-muted-foreground"} />
                  )}
                </IconButton>
                <IconButton
                  aria-label={"Delete tool"}
                  className={"size-7"}
                  disabled={disabled}
                  onClick={() => handleDeleteTool(tool)}
                  title={"Delete"}
                >
                  <Trash2 className={"size-4 text-destructive"} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={"py-4 text-center text-sm text-muted-foreground"}>
          {"No tools configured"}
        </div>
      )}

      {/* Add Tool Form */}
      {isAdding ? (
        <div
          className={"flex flex-col gap-2 rounded-md border border-border p-3"}
        >
          <div className={"flex gap-2"}>
            <Input
              autoFocus
              className={"flex-1"}
              disabled={disabled || createMutation.isPending}
              onChange={(e) => setNewToolName(e.target.value)}
              placeholder={"Tool name (e.g., Read, Write, Bash)"}
              value={newToolName}
            />
            <Input
              className={"w-32"}
              disabled={disabled || createMutation.isPending}
              onChange={(e) => setNewToolPattern(e.target.value)}
              placeholder={"Pattern"}
              value={newToolPattern}
            />
          </div>
          <div className={"flex justify-end gap-2"}>
            <Button
              disabled={createMutation.isPending}
              onClick={() => setIsAdding(false)}
              size={"sm"}
              variant={"ghost"}
            >
              {"Cancel"}
            </Button>
            <Button
              disabled={
                disabled || !newToolName.trim() || createMutation.isPending
              }
              onClick={handleAddTool}
              size={"sm"}
            >
              {createMutation.isPending ? "Adding..." : "Add Tool"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className={"w-full"}
          disabled={disabled}
          onClick={() => setIsAdding(true)}
          size={"sm"}
          variant={"outline"}
        >
          <Plus className={"mr-2 size-4"} />
          {"Add Tool"}
        </Button>
      )}
    </div>
  );
};
