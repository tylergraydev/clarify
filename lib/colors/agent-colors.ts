import { agentColors } from "@/db/schema/agents.schema";

/** Agent color type derived from schema */
export type AgentColor = (typeof agentColors)[number];

/** Tailwind background classes for agent colors */
export const agentColorClassMap: Record<AgentColor, string> = {
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
} as const;

/** Hex values for agent colors (for inline styles) */
export const agentColorHexMap: Record<AgentColor, string> = {
  blue: "#3b82f6",
  cyan: "#06b6d4",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
} as const;

/** Display labels for agent colors */
export const agentColorLabelMap: Record<AgentColor, string> = {
  blue: "Blue",
  cyan: "Cyan",
  green: "Green",
  red: "Red",
  yellow: "Yellow",
} as const;

/** Default agent color */
export const DEFAULT_AGENT_COLOR: AgentColor = "blue";

/** Get Tailwind class for an agent color with fallback */
export function getAgentColorClass(color: null | string | undefined): string {
  if (!color || !isAgentColor(color)) {
    if (process.env.NODE_ENV === "development" && color) {
      console.warn(
        `[getAgentColorClass] Invalid color "${color}" - using default`
      );
    }
    return agentColorClassMap[DEFAULT_AGENT_COLOR];
  }
  return agentColorClassMap[color];
}

/** Get hex value for an agent color with fallback */
export function getAgentColorHex(color: null | string | undefined): string {
  if (!color || !isAgentColor(color)) {
    return agentColorHexMap[DEFAULT_AGENT_COLOR];
  }
  return agentColorHexMap[color];
}

/**
 * Type guard to check if a string is a valid AgentColor
 */
function isAgentColor(color: string): color is AgentColor {
  return color in agentColorClassMap;
}
