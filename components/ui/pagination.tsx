'use client';

import type { ComponentPropsWithRef } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const Pagination = ({
  className,
  currentPage,
  onPageChange,
  pageSize,
  ref,
  totalItems,
  totalPages,
  ...props
}: PaginationProps) => {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const handlePreviousClick = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label={'Pagination'}
      className={cn('flex items-center justify-between gap-4', className)}
      ref={ref}
      {...props}
    >
      {/* Item Count */}
      <p className={'text-sm text-muted-foreground'}>
        {totalItems === 0 ? (
          'No items'
        ) : (
          <Fragment>
            Showing <span className={'font-medium text-foreground'}>{startItem}</span>
            {' - '}
            <span className={'font-medium text-foreground'}>{endItem}</span>
            {' of '}
            <span className={'font-medium text-foreground'}>{totalItems}</span>
          </Fragment>
        )}
      </p>

      {/* Navigation Controls */}
      <div className={'flex items-center gap-2'}>
        <Button
          aria-label={'Go to previous page'}
          disabled={isFirstPage}
          onClick={handlePreviousClick}
          size={'sm'}
          variant={'outline'}
        >
          <ChevronLeft className={'size-4'} />
          <span>Previous</span>
        </Button>

        {/* Page Indicator */}
        <span className={'text-sm text-muted-foreground'}>
          Page <span className={'font-medium text-foreground'}>{currentPage}</span>
          {' of '}
          <span className={'font-medium text-foreground'}>{totalPages}</span>
        </span>

        <Button
          aria-label={'Go to next page'}
          disabled={isLastPage}
          onClick={handleNextClick}
          size={'sm'}
          variant={'outline'}
        >
          <span>Next</span>
          <ChevronRight className={'size-4'} />
        </Button>
      </div>
    </nav>
  );
};
