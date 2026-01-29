/**
 * Agents page placeholder component.
 *
 * This is a basic placeholder to verify the shell navigation works correctly.
 * Actual agent management content will be implemented in future steps.
 */
export default function AgentsPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>Agents</h1>
        <p className={'text-muted-foreground'}>
          Configure and monitor AI agents.
        </p>
      </div>

      {/* Placeholder content */}
      <div className={'rounded-lg border border-dashed p-8 text-center'}>
        <p className={'text-sm text-muted-foreground'}>
          Agent configuration and status will be implemented here.
        </p>
      </div>
    </div>
  );
}
