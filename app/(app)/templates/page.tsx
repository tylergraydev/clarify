'use client';

import { useCallback } from 'react';

import type { TemplateCategory } from '@/db/schema/templates.schema';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';
import { TemplateTable } from '@/components/templates/template-table';
import { TemplateTableToolbar } from '@/components/templates/template-table-toolbar';
import { useTemplates } from '@/hooks/queries/use-templates';
import { useFilteredTemplates } from '@/hooks/templates/use-filtered-templates';
import { useTemplateActions } from '@/hooks/templates/use-template-actions';
import { useTemplateDialogs } from '@/hooks/templates/use-template-dialogs';
import { useTemplateFilters } from '@/hooks/templates/use-template-filters';

import { TemplatesDialogs } from '../../../components/templates/templates-dialogs';
import { TemplatesPageHeader } from '../../../components/templates/templates-page-header';
import { TemplatesPageSkeleton } from '../../../components/templates/templates-page-skeleton';

// ============================================================================
// Component
// ============================================================================

/**
 * Templates page - Unified view for managing all templates.
 *
 * Features:
 * - Single unified DataTable displaying all templates (built-in and custom)
 * - Faceted filters for category and status
 * - Toggle switches for showing built-in and deactivated templates
 * - Full CRUD operations: create, edit, duplicate, delete
 * - Activate/deactivate templates
 */
const TemplatesPage = () => {
  // Filter state management
  const {
    categoryFilter,
    isShowingBuiltIn,
    isShowingDeactivated,
    onResetFilters,
    searchFilter,
    setCategoryFilter,
    setIsShowingBuiltIn,
    setIsShowingDeactivated,
    setSearchFilter,
    setStatusFilter,
    statusFilter,
  } = useTemplateFilters();

  // Dialog state management
  const { dialogState, dispatchDialog, onDeleteDialogOpenChange, onOpenDeleteDialog } = useTemplateDialogs();

  // Data fetching - include deactivated based on filter setting
  const { data: allTemplates, isLoading } = useTemplates({
    includeDeactivated: isShowingDeactivated,
  });

  // Client-side filtering
  const { filteredCount, filteredTemplates, isFiltered, totalCount } = useFilteredTemplates({
    categoryFilter,
    isShowingBuiltIn,
    isShowingDeactivated,
    searchFilter,
    statusFilter,
    templates: allTemplates,
  });

  // Action handlers
  const { loadingState, onDeleteClick, onDeleteConfirm, onDuplicate, onToggleActive } = useTemplateActions({
    onCloseDeleteDialog: () => dispatchDialog({ type: 'CLOSE_DELETE_DIALOG' }),
    onOpenDeleteDialog,
    templates: allTemplates,
  });

  // Wrap delete confirm to pass the template from dialog state
  const handleDeleteConfirm = useCallback(() => {
    onDeleteConfirm(dialogState.delete.template);
  }, [dialogState.delete.template, onDeleteConfirm]);

  // Handle category filter change with proper typing
  const handleCategoryFilterChange = useCallback(
    (value: null | TemplateCategory) => {
      setCategoryFilter(value);
    },
    [setCategoryFilter]
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (value: 'active' | 'all' | 'inactive' | null) => {
      setStatusFilter(value);
    },
    [setStatusFilter]
  );

  // Loading state
  if (isLoading) {
    return <TemplatesPageSkeleton />;
  }

  return (
    <QueryErrorBoundary>
      <main aria-label={'Template management'} className={'space-y-6'}>
        {/* Page Header */}
        <TemplatesPageHeader filteredCount={filteredCount} isFiltered={isFiltered} totalCount={totalCount} />

        {/* Template Table with Toolbar */}
        <section aria-label={'Templates list'} aria-live={'polite'} id={'template-content'}>
          <TemplateTable
            isDeleting={loadingState.isDeleting}
            isDuplicating={loadingState.isDuplicating}
            isToggling={loadingState.isToggling}
            onDelete={onDeleteClick}
            onDuplicate={onDuplicate}
            onGlobalFilterChange={setSearchFilter}
            onToggleActive={onToggleActive}
            templates={filteredTemplates}
            toolbarContent={
              <TemplateTableToolbar
                categoryFilter={categoryFilter as null | TemplateCategory}
                isShowingBuiltIn={isShowingBuiltIn}
                isShowingDeactivated={isShowingDeactivated}
                onCategoryFilterChange={handleCategoryFilterChange}
                onIsShowingBuiltInChange={setIsShowingBuiltIn}
                onIsShowingDeactivatedChange={setIsShowingDeactivated}
                onResetFilters={onResetFilters}
                onStatusFilterChange={handleStatusFilterChange}
                statusFilter={statusFilter as 'active' | 'all' | 'inactive' | null}
              />
            }
          />
        </section>

        {/* Dialogs */}
        <TemplatesDialogs
          deleteDialog={dialogState.delete}
          isDeleting={loadingState.isDeleting}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteDialogOpenChange={onDeleteDialogOpenChange}
        />
      </main>
    </QueryErrorBoundary>
  );
};

export default TemplatesPage;
