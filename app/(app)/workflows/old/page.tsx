import { $path } from 'next-typesafe-url';
import { redirect } from 'next/navigation';

/**
 * Legacy workflows index page.
 *
 * Redirects to the workflow history page since there is no dedicated
 * listing for legacy workflows.
 */
export default function LegacyWorkflowsPage() {
  redirect($path({ route: '/workflows/history' }));
}
