/**
 * Template IPC Handlers
 *
 * Handles all template management operations including:
 * - Listing templates with optional category filtering
 * - CRUD operations for templates
 * - Usage tracking for templates
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { TemplatesRepository } from '../../db/repositories';
import type { NewTemplate, Template, TemplateCategory } from '../../db/schema';

import { IpcChannels } from './channels';

/**
 * Filter options for listing templates
 */
interface TemplateListFilters {
  category?: TemplateCategory;
  includeDeactivated?: boolean;
}

/**
 * Register all template-related IPC handlers.
 *
 * @param templatesRepository - The templates repository for database operations
 */
export function registerTemplateHandlers(templatesRepository: TemplatesRepository): void {
  // List templates with optional category filter
  ipcMain.handle(
    IpcChannels.template.list,
    (_event: IpcMainInvokeEvent, filters?: TemplateListFilters): Array<Template> => {
      return templatesRepository.findAll(filters);
    }
  );

  // Get a template by ID
  ipcMain.handle(
    IpcChannels.template.get,
    (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
      return templatesRepository.findById(id);
    }
  );

  // Create a new template
  ipcMain.handle(
    IpcChannels.template.create,
    (_event: IpcMainInvokeEvent, data: NewTemplate): Template => {
      return templatesRepository.create(data);
    }
  );

  // Update an existing template
  ipcMain.handle(
    IpcChannels.template.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewTemplate>): Template | undefined => {
      return templatesRepository.update(id, data);
    }
  );

  // Delete (deactivate) a template
  ipcMain.handle(
    IpcChannels.template.delete,
    (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
      return templatesRepository.deactivate(id);
    }
  );

  // Increment usage count for a template
  ipcMain.handle(
    IpcChannels.template.incrementUsage,
    (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
      return templatesRepository.incrementUsageCount(id);
    }
  );
}
