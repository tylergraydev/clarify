'use client';

import { useRouteParams } from 'next-typesafe-url/app';

import { QueryErrorBoundary } from '@/components/data/query-error-boundary';

import { Route } from './route-type';

const WorkflowDetailPage = () => {
  const routeParams = useRouteParams(Route.routeParams);
  console.log(routeParams);

  return (
    <QueryErrorBoundary>
      <main aria-label={'Workflow detail'} className={'flex h-full flex-col'}>
        Placeholder
      </main>
    </QueryErrorBoundary>
  );
};

export default WorkflowDetailPage;
