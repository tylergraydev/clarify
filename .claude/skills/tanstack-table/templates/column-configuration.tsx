/**
 * Type-Safe Column Configuration Patterns
 *
 * Shows best practices for defining columns with TypeScript.
 * Use createColumnHelper for full type safety.
 */

import { ColumnDef, createColumnHelper } from '@tanstack/react-table'

interface User {
  age: number
  createdAt: Date
  email: string
  firstName: string
  id: string
  lastName: string
  status: 'active' | 'inactive'
}

// ============================================
// Method 1: Column Helper (RECOMMENDED for TypeScript)
// ============================================

const columnHelper = createColumnHelper<User>()

export const columnsWithHelper = [
  columnHelper.accessor('id', {
    header: 'ID',
    size: 80,
  }),
  columnHelper.accessor('firstName', {
    cell: info => info.getValue(), // Fully typed!
    header: 'First Name',
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
  }),
  // Computed column (combines multiple fields)
  columnHelper.accessor(
    row => `${row.firstName} ${row.lastName}`,
    {
      cell: info => <strong>{info.getValue()}</strong>,
      header: 'Full Name',
      id: 'fullName',
    }
  ),
  columnHelper.accessor('email', {
    cell: info => (
      <a className={"text-blue-600 underline"} href={`mailto:${info.getValue()}`}>
        {info.getValue()}
      </a>
    ),
    header: 'Email',
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    size: 80,
  }),
  columnHelper.accessor('status', {
    cell: info => (
      <span
        className={`rounded-sm px-2 py-1 text-xs ${
          info.getValue() === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {info.getValue()}
      </span>
    ),
    header: 'Status',
  }),
  columnHelper.accessor('createdAt', {
    cell: info => info.getValue().toLocaleDateString(),
    enableSorting: true,
    header: 'Created',
  }),
]

// ============================================
// Method 2: Manual ColumnDef (TypeScript)
// ============================================

export const columnsManual: Array<ColumnDef<User>> = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
]

// ============================================
// Advanced: Column with Custom Cell Rendering
// ============================================

export const advancedColumns = [
  columnHelper.accessor('id', {
    header: 'ID',
  }),
  columnHelper.display({
    cell: props => (
      <div className={"flex gap-2"}>
        <button
          className={"rounded-sm bg-blue-500 px-2 py-1 text-sm text-white"}
          onClick={() => console.log('Edit', props.row.original.id)}
        >
          Edit
        </button>
        <button
          className={"rounded-sm bg-red-500 px-2 py-1 text-sm text-white"}
          onClick={() => console.log('Delete', props.row.original.id)}
        >
          Delete
        </button>
      </div>
    ),
    header: 'Actions',
    id: 'actions',
  }),
]

// ============================================
// Advanced: Column with Sorting/Filtering
// ============================================

export const sortableFilterableColumns = [
  columnHelper.accessor('firstName', {
    enableColumnFilter: true,
    enableSorting: true,
    header: 'First Name',
  }),
  columnHelper.accessor('age', {
    enableColumnFilter: true,
    enableSorting: true,
    filterFn: 'inNumberRange', // Built-in filter function
    header: 'Age',
  }),
  columnHelper.accessor('status', {
    enableColumnFilter: true,
    filterFn: 'equals', // Exact match
    header: 'Status',
  }),
]

// ============================================
// Advanced: Column with Meta Data
// ============================================

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    className?: string
    headerClassName?: string
  }
}

export const columnsWithMeta = [
  columnHelper.accessor('id', {
    header: 'ID',
    meta: {
      className: 'text-gray-600',
      headerClassName: 'bg-gray-50',
    },
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    meta: {
      className: 'font-mono text-sm',
    },
  }),
]
