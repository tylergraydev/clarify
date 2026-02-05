/**
 * Discovery Files IPC Handlers
 *
 * Handles all file discovery operations including:
 * - Starting file discovery with agent execution
 * - Cancelling active discovery sessions
 * - Re-discovery with replace/additive modes
 * - Getting discovery session state
 * - Streaming events during discovery execution
 * - Listing discovered files by workflow step
 * - Batch updating discovered files
 * - Including/excluding files from discovery results
 * - Adding user files to discovery
 * - Updating file priorities
 * - Deleting discovered files
 * - Toggling file inclusion status
 *
 * Channels:
 * - discovery:start - Start a new discovery session
 * - discovery:cancel - Cancel an active discovery session
 * - discovery:getState - Get current session state
 * - discovery:rediscover - Re-run discovery with mode (replace/additive)
 * - discovery:stream - Streaming channel for discovery events (uses ipcMain.on)
 * - discovery:list - List discovered files for a workflow step
 * - discovery:update - Batch update discovered files
 * - discovery:include - Include a file in discovery results
 * - discovery:exclude - Exclude a file from discovery results
 * - discovery:add - Add a user file to discovery
 * - discovery:updatePriority - Update file priority
 * - discovery:delete - Delete a discovered file
 * - discovery:toggle - Toggle file inclusion status
 *
 * @see {@link ../services/file-discovery.service.ts FileDiscoveryStepService}
 */
import { type BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { DiscoveredFilesRepository, WorkflowStepsRepository } from '../../db/repositories';
import type { DiscoveredFile, NewDiscoveredFile } from '../../db/schema';
import type {
  FileDiscoveryOutcome,
  FileDiscoveryOutcomeWithPause,
  FileDiscoveryServiceState,
  FileDiscoveryStreamMessage,
} from '../services/file-discovery.service';

import { fileDiscoveryStepService } from '../services/file-discovery.service';
import { IpcChannels } from './channels';

/**
 * Input for batch update operation
 */
interface BatchUpdateInput {
  data: Partial<NewDiscoveredFile>;
  id: number;
}

/**
 * Input for re-discovery operation.
 */
interface FileDiscoveryRediscoverInput extends FileDiscoveryStartInput {
  /** Mode for re-discovery: 'replace' clears existing, 'additive' merges */
  mode: 'additive' | 'replace';
}

/**
 * Input for starting a file discovery session.
 */
interface FileDiscoveryStartInput {
  /** The selected agent to use for file discovery */
  agentId: number;
  /** The refined feature request text to analyze */
  refinedFeatureRequest: string;
  /** The path to the repository being analyzed */
  repositoryPath: string;
  /** The ID of the current workflow step */
  stepId: number;
  /** Optional timeout in seconds for agent operations */
  timeoutSeconds?: number;
  /** The ID of the workflow this discovery belongs to */
  workflowId: number;
}

/**
 * Register all discovery file-related IPC handlers.
 *
 * @param discoveredFilesRepository - The discovered files repository for database operations
 * @param _workflowStepsRepository
 * @param getMainWindow - Function to get the main BrowserWindow for streaming events
 */
export function registerDiscoveryHandlers(
  discoveredFilesRepository: DiscoveredFilesRepository,
  _workflowStepsRepository?: WorkflowStepsRepository,
  getMainWindow?: () => BrowserWindow | null
): void {
  // ============================================
  // Discovery Execution Handlers
  // ============================================

  // Start a new file discovery session
  ipcMain.handle(
    IpcChannels.discovery.start,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<FileDiscoveryOutcomeWithPause> => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as FileDiscoveryStartInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const agentId = validateNumberId(typedInput.agentId, 'agentId');
        const refinedFeatureRequest = validateString(typedInput.refinedFeatureRequest, 'refinedFeatureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        console.log('[IPC] discovery:start', {
          agentId,
          refinedFeatureRequestLength: refinedFeatureRequest.length,
          repositoryPath,
          stepId,
          workflowId,
        });

        // Create stream message handler to forward events to renderer
        const handleStreamMessage = (message: FileDiscoveryStreamMessage): void => {
          const mainWindow = getMainWindow?.();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.discovery.stream, message);
          }
        };

        // Call the service with options and stream callback
        return await fileDiscoveryStepService.startDiscovery(
          {
            agentId,
            refinedFeatureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );
      } catch (error) {
        console.error('[IPC Error] discovery:start:', error);
        throw error;
      }
    }
  );

  // Cancel an active discovery session
  ipcMain.handle(
    IpcChannels.discovery.cancel,
    async (_event: IpcMainInvokeEvent, workflowId: unknown): Promise<FileDiscoveryOutcome> => {
      try {
        const validWorkflowId = validateNumberId(workflowId, 'workflowId');

        console.log('[IPC] discovery:cancel', { workflowId: validWorkflowId });

        return await fileDiscoveryStepService.cancelDiscovery(validWorkflowId);
      } catch (error) {
        console.error('[IPC Error] discovery:cancel:', error);
        throw error;
      }
    }
  );

  // Get current discovery session state
  ipcMain.handle(
    IpcChannels.discovery.getState,
    (_event: IpcMainInvokeEvent, workflowId: unknown): FileDiscoveryServiceState | null => {
      try {
        const validWorkflowId = validateNumberId(workflowId, 'workflowId');

        console.log('[IPC] discovery:getState', { workflowId: validWorkflowId });

        return fileDiscoveryStepService.getState(validWorkflowId);
      } catch (error) {
        console.error('[IPC Error] discovery:getState:', error);
        throw error;
      }
    }
  );

  // Re-discover files with mode parameter (replace or additive)
  ipcMain.handle(
    IpcChannels.discovery.rediscover,
    async (_event: IpcMainInvokeEvent, input: unknown): Promise<FileDiscoveryOutcomeWithPause> => {
      try {
        // Validate input structure
        if (!input || typeof input !== 'object') {
          throw new Error('Invalid input: expected object');
        }

        const typedInput = input as FileDiscoveryRediscoverInput;

        // Validate required parameters
        const workflowId = validateNumberId(typedInput.workflowId, 'workflowId');
        const stepId = validateNumberId(typedInput.stepId, 'stepId');
        const agentId = validateNumberId(typedInput.agentId, 'agentId');
        const refinedFeatureRequest = validateString(typedInput.refinedFeatureRequest, 'refinedFeatureRequest');
        const repositoryPath = validateString(typedInput.repositoryPath, 'repositoryPath');

        // Validate mode parameter
        const mode = typedInput.mode;
        if (mode !== 'replace' && mode !== 'additive') {
          throw new Error(`Invalid mode: expected 'replace' or 'additive', got '${String(mode)}'`);
        }

        console.log('[IPC] discovery:rediscover', {
          agentId,
          mode,
          repositoryPath,
          stepId,
          workflowId,
        });

        // Create stream message handler to forward events to renderer
        const handleStreamMessage = (message: FileDiscoveryStreamMessage): void => {
          const mainWindow = getMainWindow?.();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.discovery.stream, message);
          }
        };

        // Call the service with rediscovery mode
        return await fileDiscoveryStepService.startDiscovery(
          {
            agentId,
            rediscoveryMode: mode,
            refinedFeatureRequest,
            repositoryPath,
            stepId,
            timeoutSeconds: typedInput.timeoutSeconds,
            workflowId,
          },
          handleStreamMessage
        );
      } catch (error) {
        console.error('[IPC Error] discovery:rediscover:', error);
        throw error;
      }
    }
  );

  // ============================================
  // Discovery File Management Handlers
  // ============================================

  // List discovered files by workflow step
  ipcMain.handle(
    IpcChannels.discovery.list,
    (_event: IpcMainInvokeEvent, workflowStepId: number, options?: { priority?: string }): Array<DiscoveredFile> => {
      try {
        return discoveredFilesRepository.findAll({
          priority: options?.priority,
          workflowStepId,
        });
      } catch (error) {
        console.error('[IPC Error] discovery:list:', error);
        throw error;
      }
    }
  );

  // Batch update discovered files for a workflow step
  ipcMain.handle(
    IpcChannels.discovery.update,
    (_event: IpcMainInvokeEvent, updates: Array<BatchUpdateInput>): Array<DiscoveredFile | undefined> => {
      try {
        return updates.map((update) => discoveredFilesRepository.update(update.id, update.data));
      } catch (error) {
        console.error('[IPC Error] discovery:update:', error);
        throw error;
      }
    }
  );

  // Include a file in the discovery results
  ipcMain.handle(
    IpcChannels.discovery.include,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.include(id);
      } catch (error) {
        console.error('[IPC Error] discovery:include:', error);
        throw error;
      }
    }
  );

  // Exclude a file from discovery results
  ipcMain.handle(
    IpcChannels.discovery.exclude,
    (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.exclude(id);
      } catch (error) {
        console.error('[IPC Error] discovery:exclude:', error);
        throw error;
      }
    }
  );

  // Add a user file to discovery
  ipcMain.handle(IpcChannels.discovery.add, (_event: IpcMainInvokeEvent, data: NewDiscoveredFile): DiscoveredFile => {
    try {
      return discoveredFilesRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] discovery:add:', error);
      throw error;
    }
  });

  // Update file priority
  ipcMain.handle(
    IpcChannels.discovery.updatePriority,
    (_event: IpcMainInvokeEvent, id: number, priority: string): DiscoveredFile | undefined => {
      try {
        return discoveredFilesRepository.updatePriority(id, priority);
      } catch (error) {
        console.error('[IPC Error] discovery:updatePriority:', error);
        throw error;
      }
    }
  );

  // Delete a discovered file
  ipcMain.handle(IpcChannels.discovery.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return discoveredFilesRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] discovery:delete:', error);
      throw error;
    }
  });

  // Toggle file inclusion status
  ipcMain.handle(IpcChannels.discovery.toggle, (_event: IpcMainInvokeEvent, id: number): DiscoveredFile | undefined => {
    try {
      const file = discoveredFilesRepository.findById(id);
      if (!file) {
        return undefined;
      }

      // Toggle based on current includedAt state
      if (file.includedAt) {
        return discoveredFilesRepository.exclude(id);
      } else {
        return discoveredFilesRepository.include(id);
      }
    } catch (error) {
      console.error('[IPC Error] discovery:toggle:', error);
      throw error;
    }
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that a value is a valid number ID.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated number
 * @throws Error if the value is not a valid number
 */
function validateNumberId(value: unknown, name: string): number {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${name}: expected positive number, got ${String(value)}`);
  }
  return value;
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param value - The value to validate
 * @param name - The name of the parameter for error messages
 * @returns The validated string
 * @throws Error if the value is not a non-empty string
 */
function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${name}: expected non-empty string`);
  }
  return value;
}
