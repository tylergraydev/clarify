/**
 * Chat Utility Agent Service
 *
 * Lightweight agent calls using Claude Agent SDK for:
 * - Generating conversation titles
 * - Generating compaction summaries
 * - Generating fork context summaries
 *
 * Uses Haiku model with maxTurns: 1 and no tools for fast, cheap operations.
 */

import { getQueryFunction } from './agent-step/agent-sdk';

interface SummaryGenerationResult {
  summary: string;
}

interface TitleGenerationResult {
  title: string;
}

/**
 * Generate a comprehensive summary of messages for compaction.
 *
 * @param messages - Array of messages to summarize
 * @returns A detailed summary preserving key context
 */
export async function generateCompactionSummary(
  messages: Array<{ content: string; role: string }>
): Promise<SummaryGenerationResult> {
  const query = await getQueryFunction();

  const messagesText = messages
    .map((m) => `<message role="${m.role}">${m.content.slice(0, 2000)}</message>`)
    .join('\n');

  const prompt = `Summarize the following conversation, preserving all key decisions, technical details, code references, and action items. This summary will replace the original messages as context for future conversation.\n\n${messagesText}\n\nProvide a comprehensive summary:`;

  let resultText = '';
  for await (const message of query({
    options: {
      allowedTools: [],
      maxTurns: 1,
      model: 'haiku',
      permissionMode: 'bypassPermissions',
    },
    prompt,
  })) {
    if (message.type === 'result') {
      resultText = extractTextFromMessage(message);
    }
  }

  return { summary: resultText.trim() };
}

/**
 * Generate a concise title for a conversation based on its messages.
 *
 * @param messages - Array of {role, content} messages (first few are sufficient)
 * @returns A 5-8 word title string
 */
export async function generateConversationTitle(
  messages: Array<{ content: string; role: string }>
): Promise<TitleGenerationResult> {
  const query = await getQueryFunction();

  const messagesText = messages
    .slice(0, 6)
    .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
    .join('\n');

  const prompt = `Generate a concise title (5-8 words, no quotes) for this conversation:\n\n${messagesText}\n\nRespond with only the title, nothing else.`;

  let resultText = '';
  for await (const message of query({
    options: {
      allowedTools: [],
      maxTurns: 1,
      model: 'haiku',
      permissionMode: 'bypassPermissions',
    },
    prompt,
  })) {
    if (message.type === 'result') {
      resultText = extractTextFromMessage(message);
    }
  }

  return { title: resultText.trim().replace(/^["']|["']$/g, '') };
}

/**
 * Generate a summary of the conversation context at a fork point.
 *
 * @param messages - Messages up to the fork point
 * @param forkPointContent - The message content at the fork point
 * @returns A brief summary of the fork context
 */
export async function generateForkSummary(
  messages: Array<{ content: string; role: string }>,
  forkPointContent: string
): Promise<SummaryGenerationResult> {
  const query = await getQueryFunction();

  const messagesText = messages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
    .join('\n');

  const prompt = `Summarize the conversation context at this fork point in 1-2 sentences. The fork branches from: "${forkPointContent.slice(0, 500)}"\n\nConversation leading up to fork:\n${messagesText}\n\nFork context summary:`;

  let resultText = '';
  for await (const message of query({
    options: {
      allowedTools: [],
      maxTurns: 1,
      model: 'haiku',
      permissionMode: 'bypassPermissions',
    },
    prompt,
  })) {
    if (message.type === 'result') {
      resultText = extractTextFromMessage(message);
    }
  }

  return { summary: resultText.trim() };
}

/**
 * Extract text content from an SDK result message.
 */
function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== 'object') return '';

  // Try to extract resultText from the result message
  const m = message as { resultText?: string };
  if (m.resultText) return m.resultText;

  // Try messages array pattern
  const r = message as { messages?: Array<{ content?: Array<{ text?: string; type?: string }> }> };
  if (r.messages) {
    for (const msg of r.messages) {
      if (msg.content) {
        for (const block of msg.content) {
          if (block.type === 'text' && block.text) {
            return block.text;
          }
        }
      }
    }
  }

  return '';
}
