/**
 * Templates page placeholder component.
 *
 * This is a basic placeholder to verify the shell navigation works correctly.
 * Actual template management content will be implemented in future steps.
 */
export default function TemplatesPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page heading */}
      <div className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>Templates</h1>
        <p className={'text-muted-foreground'}>
          Create and manage workflow templates.
        </p>
      </div>

      {/* Placeholder content */}
      <div className={'rounded-lg border border-dashed p-8 text-center'}>
        <p className={'text-sm text-muted-foreground'}>
          Template library and editor will be implemented here.
        </p>
      </div>
    </div>
  );
}
