/**
 * Active Workflows page placeholder component.
 *
 * This is a basic placeholder to verify the shell navigation works correctly.
 * Actual active workflow content will be implemented in future steps.
 */
export default function ActiveWorkflowsPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>
          Active Workflows
        </h1>
        <p className={'text-muted-foreground'}>
          View and manage currently running workflows.
        </p>
      </div>

      {/* Placeholder content */}
      <div className={'rounded-lg border border-dashed p-8 text-center'}>
        <p className={'text-sm text-muted-foreground'}>
          Active workflow list and controls will be implemented here.
        </p>
      </div>
    </div>
  );
}
