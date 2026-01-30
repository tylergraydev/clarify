/**
 * Built-in Templates Seed Data
 *
 * Seeds 7 built-in templates as specified in the design document:
 * - CRUD Feature (data)
 * - Form Component (ui)
 * - API Integration (backend)
 * - Auth Flow (security)
 * - Dashboard Widget (ui)
 * - IPC Channel (electron)
 * - Settings Page (ui)
 */
import { isNotNull } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewTemplate, NewTemplatePlaceholder, TemplateCategory } from '../schema';

import { templatePlaceholders, templates } from '../schema';

/**
 * Template definition with embedded placeholders
 */
interface BuiltInTemplateDefinition {
  category: TemplateCategory;
  description: string;
  name: string;
  placeholders: Array<Omit<NewTemplatePlaceholder, 'templateId'>>;
  templateText: string;
}

/**
 * The 7 built-in templates as specified in the design document
 */
const BUILT_IN_TEMPLATES: Array<BuiltInTemplateDefinition> = [
  {
    category: 'data',
    description: 'Complete CRUD feature with database schema, repository, IPC handlers, query hooks, and UI components',
    name: 'CRUD Feature',
    placeholders: [
      {
        defaultValue: null,
        description: 'The name of the entity (e.g., Product, User, Order)',
        displayName: 'Entity Name',
        name: 'entityName',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[A-Z][a-zA-Z0-9]*$',
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of fields with types (e.g., name:string, price:number, isActive:boolean)',
        displayName: 'Entity Fields',
        name: 'entityFields',
        orderIndex: 1,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: 'id',
        description: 'The primary key field name',
        displayName: 'Primary Key',
        name: 'primaryKey',
        orderIndex: 2,
        requiredAt: null,
        validationPattern: null,
      },
    ],
    templateText: `Create a complete CRUD feature for {{entityName}} with the following:

## Database Layer
- Drizzle ORM schema definition in \`db/schema/{{entityName}}.schema.ts\`
- Fields: {{entityFields}}
- Include timestamps (createdAt, updatedAt)
- Add appropriate indexes

## Repository Layer
- Repository in \`db/repositories/{{entityName}}.repository.ts\`
- Methods: findAll, findById, create, update, delete
- Export from \`db/repositories/index.ts\`

## IPC Layer
- Channel definitions in \`electron/ipc/channels.ts\`
- Handlers in \`electron/ipc/{{entityName}}.handlers.ts\`
- Preload API exposure in \`electron/preload.ts\`
- Type definitions in \`types/electron.d.ts\`

## Query Layer
- Query key factory in \`lib/queries/{{entityName}}.ts\`
- TanStack Query hooks in \`hooks/queries/use-{{entityName}}.ts\`
- Include optimistic updates for mutations

## UI Layer
- List page at \`app/(app)/{{entityName}}/page.tsx\`
- Data table with sorting and filtering
- Create/Edit dialog with TanStack Form validation
- Delete confirmation dialog

Follow existing patterns in the codebase for consistency.`,
  },
  {
    category: 'ui',
    description: 'TanStack Form component with validation, field components, and error handling',
    name: 'Form Component',
    placeholders: [
      {
        defaultValue: null,
        description: 'The name of the form (e.g., UserProfile, ContactInfo)',
        displayName: 'Form Name',
        name: 'formName',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[A-Z][a-zA-Z0-9]*$',
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of form fields (e.g., email, password, confirmPassword)',
        displayName: 'Form Fields',
        name: 'formFields',
        orderIndex: 1,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: 'dialog',
        description: 'Where the form will be used (dialog, page, inline)',
        displayName: 'Form Context',
        name: 'formContext',
        orderIndex: 2,
        requiredAt: null,
        validationPattern: null,
      },
    ],
    templateText: `Create a {{formName}} form component with the following:

## Form Structure
- Use TanStack Form with Zod validation
- Form fields: {{formFields}}
- Context: {{formContext}}

## Components
- Create form component at \`components/forms/{{formName}}-form.tsx\`
- Use existing field components from \`components/ui/form/\`
- Include proper TypeScript types for form values

## Validation
- Create Zod schema in \`lib/validations/{{formName}}.ts\`
- Include appropriate validation rules for each field
- Handle async validation if needed (e.g., unique email check)

## Error Handling
- Display field-level errors inline
- Show form-level errors in alert component
- Handle submission errors gracefully

## Accessibility
- Proper label associations
- Error announcements for screen readers
- Focus management on errors

Follow the existing TanStack Form patterns in the codebase.`,
  },
  {
    category: 'backend',
    description: 'External API integration with TanStack Query hooks, error handling, and type definitions',
    name: 'API Integration',
    placeholders: [
      {
        defaultValue: null,
        description: 'The name of the API service (e.g., Stripe, GitHub, Weather)',
        displayName: 'API Name',
        name: 'apiName',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[A-Z][a-zA-Z0-9]*$',
      },
      {
        defaultValue: null,
        description: 'The base URL for the API',
        displayName: 'Base URL',
        name: 'baseUrl',
        orderIndex: 1,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of endpoints to implement (e.g., getUsers, createOrder)',
        displayName: 'Endpoints',
        name: 'endpoints',
        orderIndex: 2,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
    ],
    templateText: `Create an integration with the {{apiName}} API:

## Configuration
- Base URL: {{baseUrl}}
- Store API keys securely using electron-store
- Add settings UI for API configuration

## API Client
- Create client in \`lib/api/{{apiName}}.ts\`
- Implement endpoints: {{endpoints}}
- Include proper error handling and retries
- Add request/response type definitions

## IPC Integration
- Create IPC handlers for API calls (main process)
- Expose through preload API
- Handle authentication tokens securely

## Query Hooks
- Create TanStack Query hooks for each endpoint
- Include proper caching strategies
- Handle loading and error states
- Add optimistic updates where appropriate

## Error Handling
- Map API errors to user-friendly messages
- Handle rate limiting
- Implement retry logic for transient failures

## Types
- Define TypeScript interfaces for all request/response types
- Export types from \`types/{{apiName}}.d.ts\``,
  },
  {
    category: 'security',
    description: 'Authentication flow with login/logout, session management, and protected routes',
    name: 'Auth Flow',
    placeholders: [
      {
        defaultValue: 'jwt',
        description: 'The authentication method (jwt, session, oauth)',
        displayName: 'Auth Method',
        name: 'authMethod',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of OAuth providers (e.g., google, github)',
        displayName: 'OAuth Providers',
        name: 'oauthProviders',
        orderIndex: 1,
        requiredAt: null,
        validationPattern: null,
      },
      {
        defaultValue: 'true',
        description: 'Whether to include remember me functionality',
        displayName: 'Remember Me',
        name: 'rememberMe',
        orderIndex: 2,
        requiredAt: null,
        validationPattern: null,
      },
    ],
    templateText: `Implement authentication flow with {{authMethod}}:

## Authentication Method
- Method: {{authMethod}}
- OAuth Providers: {{oauthProviders}}
- Remember Me: {{rememberMe}}

## Components
- Login page/dialog with form validation
- Logout confirmation
- Password reset flow (if applicable)
- OAuth provider buttons (if applicable)

## State Management
- Auth context/store for user state
- Token storage (secure, using electron-store)
- Session persistence

## Security
- Secure token storage
- CSRF protection
- Rate limiting on login attempts
- Password strength validation

## Protected Routes
- Route guard component
- Redirect to login when unauthenticated
- Return to original route after login

## IPC Layer
- Secure IPC handlers for auth operations
- Token refresh mechanism
- Logout cleanup

Follow security best practices and existing patterns in the codebase.`,
  },
  {
    category: 'ui',
    description: 'Dashboard widget card with data display, loading states, and refresh functionality',
    name: 'Dashboard Widget',
    placeholders: [
      {
        defaultValue: null,
        description: 'The name of the widget (e.g., RecentOrders, SystemStatus)',
        displayName: 'Widget Name',
        name: 'widgetName',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[A-Z][a-zA-Z0-9]*$',
      },
      {
        defaultValue: 'card',
        description: 'The widget display type (card, chart, table, stat)',
        displayName: 'Display Type',
        name: 'displayType',
        orderIndex: 1,
        requiredAt: null,
        validationPattern: null,
      },
      {
        defaultValue: null,
        description: 'The data source for the widget (query hook name)',
        displayName: 'Data Source',
        name: 'dataSource',
        orderIndex: 2,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
    ],
    templateText: `Create a {{widgetName}} dashboard widget:

## Component
- Create widget at \`app/(app)/dashboard/_components/{{widgetName}}-widget.tsx\`
- Display type: {{displayType}}
- Data source: {{dataSource}}

## Features
- Loading skeleton while data fetches
- Error state with retry button
- Empty state when no data
- Refresh button for manual updates
- Auto-refresh interval (optional)

## Styling
- Use existing card component patterns
- Responsive design for different screen sizes
- Consistent with other dashboard widgets

## Data Fetching
- Use TanStack Query for data fetching
- Implement proper caching
- Handle stale data appropriately

## Interactivity
- Click actions (navigate to detail view)
- Hover states for additional info
- Tooltips where appropriate

Add to dashboard page layout following existing widget patterns.`,
  },
  {
    category: 'electron',
    description: 'Complete IPC channel with handlers, preload API, and React hooks',
    name: 'IPC Channel',
    placeholders: [
      {
        defaultValue: null,
        description: 'The purpose of the IPC channel (e.g., FileSystem, Clipboard)',
        displayName: 'Channel Purpose',
        name: 'channelPurpose',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: null,
        description: 'The handler file prefix (e.g., fs, clipboard)',
        displayName: 'Handler Name',
        name: 'handlerName',
        orderIndex: 1,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[a-z][a-z0-9-]*$',
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of operations (e.g., read, write, delete)',
        displayName: 'Operations',
        name: 'operations',
        orderIndex: 2,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
    ],
    templateText: `Create IPC channel for {{channelPurpose}}:

## Channel Definitions
- Add channels to \`electron/ipc/channels.ts\`
- Namespace: {{handlerName}}
- Operations: {{operations}}

## Handler Implementation
- Create \`electron/ipc/{{handlerName}}.handlers.ts\`
- Implement handler for each operation
- Include proper error handling
- Add JSDoc documentation

## Handler Registration
- Register in \`electron/ipc/index.ts\`
- Inject any required dependencies

## Preload API
- Expose methods in \`electron/preload.ts\`
- Add to ElectronAPI interface
- Ensure proper type safety

## Type Definitions
- Add types to \`types/electron.d.ts\`
- Include request/response types
- Export for renderer use

## React Hook (Optional)
- Create hook in \`hooks/\` if needed
- Wrap IPC calls with proper error handling
- Add loading states if async

Follow existing IPC patterns in the codebase.`,
  },
  {
    category: 'ui',
    description: 'Settings page with form controls, persistence, and reset functionality',
    name: 'Settings Page',
    placeholders: [
      {
        defaultValue: null,
        description: 'The settings category name (e.g., Appearance, Notifications)',
        displayName: 'Category Name',
        name: 'categoryName',
        orderIndex: 0,
        requiredAt: new Date().toISOString(),
        validationPattern: '^[A-Z][a-zA-Z0-9]*$',
      },
      {
        defaultValue: null,
        description: 'Comma-separated list of settings (e.g., theme:select, notifications:toggle)',
        displayName: 'Settings List',
        name: 'settingsList',
        orderIndex: 1,
        requiredAt: new Date().toISOString(),
        validationPattern: null,
      },
      {
        defaultValue: 'true',
        description: 'Whether settings should persist across sessions',
        displayName: 'Persist Settings',
        name: 'persistSettings',
        orderIndex: 2,
        requiredAt: null,
        validationPattern: null,
      },
    ],
    templateText: `Create {{categoryName}} settings section:

## Settings
- Category: {{categoryName}}
- Settings: {{settingsList}}
- Persist: {{persistSettings}}

## Component
- Create section at \`components/settings/{{categoryName}}-settings-section.tsx\`
- Add to settings page layout

## Form Controls
- Use appropriate field components (toggle, select, input)
- Group related settings logically
- Include descriptions for each setting

## Persistence
- Store in database settings table
- Use settings repository for CRUD
- Load defaults on first run

## Features
- Real-time updates (no save button needed)
- Reset to defaults button
- Visual feedback on save
- Validation where appropriate

## Accessibility
- Proper labels and descriptions
- Keyboard navigation
- Screen reader support

Follow existing settings page patterns in the codebase.`,
  },
];

/**
 * Seed built-in templates if they don't already exist.
 * This function is idempotent - it checks for existing built-in templates
 * before inserting.
 *
 * @param db - The Drizzle database instance
 */
export function seedBuiltInTemplates(db: DrizzleDatabase): void {
  // Check if built-in templates already exist
  const existingBuiltIn = db.select().from(templates).where(isNotNull(templates.builtInAt)).all();

  if (existingBuiltIn.length > 0) {
    // Built-in templates already seeded, skip
    return;
  }

  const now = new Date().toISOString();

  // Insert each built-in template with its placeholders
  for (const templateDef of BUILT_IN_TEMPLATES) {
    // Insert the template
    const insertedTemplate = db
      .insert(templates)
      .values({
        builtInAt: now,
        category: templateDef.category,
        description: templateDef.description,
        name: templateDef.name,
        templateText: templateDef.templateText,
      } satisfies NewTemplate)
      .returning()
      .get();

    // Insert placeholders for this template
    if (templateDef.placeholders.length > 0) {
      const placeholdersWithTemplateId = templateDef.placeholders.map((p) => ({
        ...p,
        templateId: insertedTemplate.id,
      }));

      db.insert(templatePlaceholders).values(placeholdersWithTemplateId).run();
    }
  }
}
