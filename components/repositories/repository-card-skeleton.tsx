import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

/**
 * Skeleton loading placeholder for a repository card.
 */
export const RepositoryCardSkeleton = () => {
  return (
    <Card className={'animate-pulse'}>
      {/* Header */}
      <CardHeader>
        <div className={'flex items-start justify-between gap-2'}>
          <div className={'flex items-center gap-2'}>
            <div className={'size-4 rounded-sm bg-muted'} />
            <div className={'h-5 w-32 rounded-sm bg-muted'} />
          </div>
          <div className={'h-5 w-16 rounded-full bg-muted'} />
        </div>
        {/* Path placeholder */}
        <div className={'h-4 w-48 rounded-sm bg-muted'} />
      </CardHeader>

      {/* Content */}
      <CardContent className={'flex flex-col gap-2'}>
        {/* Branch info */}
        <div className={'flex items-center gap-2'}>
          <div className={'h-4 w-24 rounded-sm bg-muted'} />
          <div className={'h-5 w-12 rounded-sm bg-muted'} />
        </div>
        {/* Created date */}
        <div className={'h-3 w-28 rounded-sm bg-muted'} />
      </CardContent>

      {/* Actions */}
      <CardFooter className={'gap-2'}>
        <div className={'h-8 w-24 rounded-md bg-muted'} />
        <div className={'h-8 w-14 rounded-md bg-muted'} />
        <div className={'h-8 w-18 rounded-md bg-muted'} />
      </CardFooter>
    </Card>
  );
};
