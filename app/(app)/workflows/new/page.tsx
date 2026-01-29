import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Start a new workflow',
  title: 'New Workflow',
};

export default function NewWorkflowPage() {
  return (
    <div className={'space-y-6'}>
      <header>
        <h1 className={'text-2xl font-semibold'}>New Workflow</h1>
        <p className={'text-muted-foreground'}>Start a new planning or implementation workflow</p>
      </header>
      <div className={'rounded-lg border border-card-border bg-card p-6'}>
        <p className={'text-muted-foreground'}>Workflow creation form coming soon.</p>
      </div>
    </div>
  );
}
