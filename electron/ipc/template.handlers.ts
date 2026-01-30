/**
 * Template IPC Handlers
 *
 * Handles all template management operations including:
 * - Listing templates with optional category filtering
 * - CRUD operations for templates
 * - Usage tracking for templates
 * - Template placeholder management
 */
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { TemplatePlaceholdersRepository, TemplatesRepository } from '../../db/repositories';
import type {
  NewTemplate,
  NewTemplatePlaceholder,
  Template,
  TemplateCategory,
  TemplatePlaceholder,
} from '../../db/schema';

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
 * @param placeholdersRepository - The template placeholders repository for placeholder operations
 */
export function registerTemplateHandlers(
  templatesRepository: TemplatesRepository,
  placeholdersRepository: TemplatePlaceholdersRepository
): void {
  // Activate a template
  ipcMain.handle(IpcChannels.template.activate, (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
    try {
      return templatesRepository.activate(id);
    } catch (error) {
      console.error('[IPC Error] template:activate:', error);
      throw error;
    }
  });

  // List templates with optional category filter
  ipcMain.handle(
    IpcChannels.template.list,
    (_event: IpcMainInvokeEvent, filters?: TemplateListFilters): Array<Template> => {
      try {
        return templatesRepository.findAll(filters);
      } catch (error) {
        console.error('[IPC Error] template:list:', error);
        throw error;
      }
    }
  );

  // Get a template by ID
  ipcMain.handle(IpcChannels.template.get, (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
    try {
      return templatesRepository.findById(id);
    } catch (error) {
      console.error('[IPC Error] template:get:', error);
      throw error;
    }
  });

  // Create a new template
  ipcMain.handle(IpcChannels.template.create, (_event: IpcMainInvokeEvent, data: NewTemplate): Template => {
    try {
      return templatesRepository.create(data);
    } catch (error) {
      console.error('[IPC Error] template:create:', error);
      throw error;
    }
  });

  // Update an existing template
  ipcMain.handle(
    IpcChannels.template.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewTemplate>): Template | undefined => {
      try {
        return templatesRepository.update(id, data);
      } catch (error) {
        console.error('[IPC Error] template:update:', error);
        throw error;
      }
    }
  );

  // Delete a template
  ipcMain.handle(IpcChannels.template.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    try {
      return templatesRepository.delete(id);
    } catch (error) {
      console.error('[IPC Error] template:delete:', error);
      throw error;
    }
  });

  // Increment usage count for a template
  ipcMain.handle(
    IpcChannels.template.incrementUsage,
    (_event: IpcMainInvokeEvent, id: number): Template | undefined => {
      try {
        return templatesRepository.incrementUsageCount(id);
      } catch (error) {
        console.error('[IPC Error] template:incrementUsage:', error);
        throw error;
      }
    }
  );

  // Get placeholders for a template
  ipcMain.handle(
    IpcChannels.template.getPlaceholders,
    (_event: IpcMainInvokeEvent, templateId: number): Array<TemplatePlaceholder> => {
      try {
        return placeholdersRepository.findByTemplateId(templateId);
      } catch (error) {
        console.error('[IPC Error] template:getPlaceholders:', error);
        throw error;
      }
    }
  );

  // Update (replace) placeholders for a template
  ipcMain.handle(
    IpcChannels.template.updatePlaceholders,
    (
      _event: IpcMainInvokeEvent,
      templateId: number,
      placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>
    ): Array<TemplatePlaceholder> => {
      try {
        return placeholdersRepository.replaceForTemplate(templateId, placeholders);
      } catch (error) {
        console.error('[IPC Error] template:updatePlaceholders:', error);
        throw error;
      }
    }
  );
}
