/**
 * Workflows page placeholder component.
 *
 * This is a basic placeholder to verify the shell navigation works correctly.
 * Actual workflow management content will be implemented in future steps.
 */
export default function WorkflowsPage() {
  return (
    <div className={"space-y-6"}>
      {/* Page heading */}
      <div className={"space-y-1"}>
        <h1 className={"text-2xl font-semibold tracking-tight"}>Workflows</h1>
        <p className={"text-muted-foreground"}>
          Manage and monitor your automated workflows.
        </p>
      </div>

      {/* Placeholder content */}
      <div className={"rounded-lg border border-dashed p-8 text-center"}>
        <p className={"text-sm text-muted-foreground"}>
          Workflow management interface will be implemented here.
        </p>
      </div>
    </div>
  );
}
