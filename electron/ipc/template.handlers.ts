/**
 * Template IPC Handlers
 *
 * Handles all template management operations including:
 * - Listing templates with optional category filtering
 * - CRUD operations for templates
 * - Usage tracking for templates
 * - Template placeholder management
 */
import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type {
  TemplatePlaceholdersRepository,
  TemplatesRepository,
} from "../../db/repositories";
import type {
  NewTemplate,
  NewTemplatePlaceholder,
  Template,
  TemplateCategory,
  TemplatePlaceholder,
} from "../../db/schema";

import { IpcChannels } from "./channels";

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
  // List templates with optional category filter
  ipcMain.handle(
    IpcChannels.template.list,
    (
      _event: IpcMainInvokeEvent,
      filters?: TemplateListFilters
    ): Array<Template> => {
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
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewTemplate>
    ): Template | undefined => {
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

  // Get placeholders for a template
  ipcMain.handle(
    IpcChannels.template.getPlaceholders,
    (
      _event: IpcMainInvokeEvent,
      templateId: number
    ): Array<TemplatePlaceholder> => {
      return placeholdersRepository.findByTemplateId(templateId);
    }
  );

  // Update (replace) placeholders for a template
  ipcMain.handle(
    IpcChannels.template.updatePlaceholders,
    (
      _event: IpcMainInvokeEvent,
      templateId: number,
      placeholders: Array<Omit<NewTemplatePlaceholder, "templateId">>
    ): Array<TemplatePlaceholder> => {
      return placeholdersRepository.replaceForTemplate(
        templateId,
        placeholders
      );
    }
  );
}
