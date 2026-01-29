import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Create a new project',
  title: 'New Project',
};

export default function NewProjectPage() {
  return (
    <div className={'space-y-6'}>
      <header>
        <h1 className={'text-2xl font-semibold'}>New Project</h1>
        <p className={'text-muted-foreground'}>Create a new project for workflow management</p>
      </header>
      <div className={'rounded-lg border border-card-border bg-card p-6'}>
        <p className={'text-muted-foreground'}>Project creation form coming soon.</p>
      </div>
    </div>
  );
}
