/**
 * Workflow History page placeholder component.
 *
 * This is a basic placeholder to verify the shell navigation works correctly.
 * Actual workflow history content will be implemented in future steps.
 */
export default function WorkflowHistoryPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>
          Workflow History
        </h1>
        <p className={'text-muted-foreground'}>
          Browse completed and archived workflow runs.
        </p>
      </div>

      {/* Placeholder content */}
      <div className={'rounded-lg border border-dashed p-8 text-center'}>
        <p className={'text-sm text-muted-foreground'}>
          Workflow history and logs will be implemented here.
        </p>
      </div>
    </div>
  );
}
