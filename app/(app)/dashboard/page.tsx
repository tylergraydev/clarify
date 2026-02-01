import type { Metadata } from 'next';

import { ActiveWorkflowsWidget } from '@/components/dashboard/active-workflows-widget';
import { FavoritesWidget } from '@/components/dashboard/favorites-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { RecentWorkflowsWidget } from '@/components/dashboard/recent-workflows-widget';
import { StatisticsWidget } from '@/components/dashboard/statistics-widget';

export const metadata: Metadata = {
  description:
    'Monitor your active workflows, view recent activity, and access quick actions from your Clarify dashboard.',
  title: 'Dashboard',
};

/**
 * Dashboard page component.
 *
 * Displays a comprehensive overview of the user's Clarify workspace including:
 * - Quick Actions for starting new workflows or projects
 * - Favorite Projects for quick access to starred projects
 * - Active Workflows showing currently running or paused workflows
 * - Recent Workflows displaying completed, failed, or cancelled workflows
 * - Statistics Overview with key metrics and performance indicators
 *
 * Layout is responsive:
 * - Mobile: Single column, stacked widgets
 * - Tablet (md): Two-column grid for workflows
 * - Desktop (lg): Optimized spacing and proportions
 */
export default function DashboardPage() {
  return (
    <div className={'space-y-6'}>
      {/* Page Heading */}
      <header className={'space-y-1'}>
        <h1 className={'text-2xl font-semibold tracking-tight'}>Dashboard</h1>
        <p className={'text-muted-foreground'}>
          Welcome to your Clarify workspace. Monitor workflows, track progress, and take action.
        </p>
      </header>

      {/* Quick Actions Section - Prominent at top */}
      <section aria-labelledby={'quick-actions-heading'}>
        <h2 className={'sr-only'} id={'quick-actions-heading'}>
          Quick Actions
        </h2>
        <QuickActionsWidget />
      </section>

      {/* Favorites Section - Quick access to starred projects */}
      <section aria-labelledby={'favorites-heading'}>
        <h2 className={'sr-only'} id={'favorites-heading'}>
          Favorite Projects
        </h2>
        <FavoritesWidget />
      </section>

      {/* Workflows Section - Two-column layout on desktop */}
      <section aria-labelledby={'workflows-heading'}>
        <h2 className={'sr-only'} id={'workflows-heading'}>
          Workflows
        </h2>
        <div className={'grid gap-6 md:grid-cols-2'}>
          {/* Active Workflows - Left column */}
          <ActiveWorkflowsWidget />

          {/* Recent Workflows - Right column */}
          <RecentWorkflowsWidget />
        </div>
      </section>

      {/* Statistics Section - Full width */}
      <section aria-labelledby={'statistics-heading'}>
        <h2 className={'sr-only'} id={'statistics-heading'}>
          Statistics Overview
        </h2>
        <StatisticsWidget />
      </section>
    </div>
  );
}
