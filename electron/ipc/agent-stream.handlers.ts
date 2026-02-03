/**
 * Agent Stream IPC Handlers
 *
 * Handles IPC communication for agent streaming sessions.
 * Uses MessagePorts for efficient bidirectional streaming.
 *
 * @see {@link ../services/agent-stream.service.ts AgentStreamService}
 * @see {@link ../../types/agent-stream.d.ts Agent Stream Types}
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent, type MessagePortMain } from 'electron';

import type { AgentStreamOptions, AgentStreamSession } from '../../types/agent-stream';

import { agentStreamService } from '../services/agent-stream.service';
import { IpcChannels } from './channels';

/**
 * Register agent stream IPC handlers.
 *
 * Sets up handlers for starting, cancelling, and querying agent streaming
 * sessions. Uses MessagePorts for efficient bidirectional communication.
 *
 * @param getMainWindow - Function to get the main BrowserWindow instance
 */
export function registerAgentStreamHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Start a new agent stream session
  ipcMain.handle(
    IpcChannels.agentStream.start,
    (_event: IpcMainInvokeEvent, options: AgentStreamOptions): { sessionId: string } => {
      try {
        const mainWindow = getMainWindow();
        if (!mainWindow) {
          throw new Error('Main window not available');
        }

        // Create the session and get the port to transfer
        const { port, sessionId } = agentStreamService.createSession(options);

        // Transfer the port to the renderer via postMessage
        // The renderer will receive this on the 'agent-stream-port' channel
        mainWindow.webContents.postMessage(IpcChannels.agentStream.port, { sessionId }, [
          port as unknown as MessagePortMain,
        ]);

        return { sessionId };
      } catch (error) {
        console.error('[IPC Error] agentStream:start:', error);
        throw error;
      }
    }
  );

  // Cancel an active stream session
  ipcMain.handle(IpcChannels.agentStream.cancel, (_event: IpcMainInvokeEvent, sessionId: unknown): boolean => {
    try {
      if (!isValidSessionId(sessionId)) {
        throw new Error(`Invalid session ID: ${String(sessionId)}`);
      }

      if (!agentStreamService.isSessionActive(sessionId)) {
        throw new Error(`Session not active: ${sessionId}`);
      }

      agentStreamService.cancelSession(sessionId);
      return true;
    } catch (error) {
      console.error('[IPC Error] agentStream:cancel:', error);
      throw error;
    }
  });

  // Get session state (for debugging/status checks)
  ipcMain.handle(
    IpcChannels.agentStream.getSession,
    (_event: IpcMainInvokeEvent, sessionId: unknown): AgentStreamSession | undefined => {
      try {
        if (!isValidSessionId(sessionId)) {
          throw new Error(`Invalid session ID: ${String(sessionId)}`);
        }

        return agentStreamService.getSession(sessionId);
      } catch (error) {
        console.error('[IPC Error] agentStream:getSession:', error);
        throw error;
      }
    }
  );
}

/**
 * Validates that a session ID is a valid non-empty string.
 *
 * @param sessionId - The session ID to validate
 * @returns True if valid, false otherwise
 */
function isValidSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === 'string' && sessionId.length > 0;
}
