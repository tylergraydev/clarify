import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'View workflow details and progress',
  title: 'Workflow Details',
};

export default function WorkflowDetailPage() {
  return (
    <div className={'space-y-6'}>
      <header>
        <h1 className={'text-2xl font-semibold'}>Workflow Details</h1>
        <p className={'text-muted-foreground'}>View and manage workflow progress</p>
      </header>
      <div className={'rounded-lg border border-card-border bg-card p-6'}>
        <p className={'text-muted-foreground'}>Workflow detail view coming soon.</p>
      </div>
    </div>
  );
}
