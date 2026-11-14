# Task Management Dashboard

A responsive task-management dashboard built with Angular 21 and TypeScript 5.9.

## Live demo

[Open the Task Management Dashboard](https://mennamagdy2019.github.io/task-managment-dashboard/dashboard).

## Features

### Task management

- Create, edit, and delete tasks, with confirmation before deletion.
- Set a task's title, description, priority, status, due date, assignee, and optional labels.
- Drag tasks between status columns and reorder tasks within a column.
- Search task titles and descriptions; filter by status, priority, and assignee.

### Dashboard and analytics

- Use the Dashboard, My Tasks, and Analytics views.
- See total, completed, in-progress, and overdue task counts.
- View task counts by priority and status, with a recent activity feed.
- Assign tasks using sample team-member data.

### User experience

- Switch between English and German; the selected language persists in browser local storage.
- Use responsive layouts, visible keyboard focus, accessible control labels, and reduced-motion styling.

## Project structure

```text
src/app/
  app.component.*              Application shell and router outlet
  app.config.ts                Router and HTTP providers/interceptors
  app.routes.ts                Lazy-loaded dashboard routes
  core/interceptors/           Task API caching/retry and mock API adapter
  features/
    dashboard/
      components/              Header, sidebar, summary, board, analytics, activity
      pages/                    Dashboard page and page-scoped action service
      models/                   Dashboard and board types
      utils/                    Filtering, ordering, statistics, and view helpers
    tasks/
      components/              Task card and reactive task editor
      data-access/              Task resource, in-memory API, and task seed data
      models/                   Task editor and generated API types
    statistics/
      data-access/              In-memory statistics API and generated metadata
      models/                   Statistics response types
  shared/
    components/                Reusable confirmation dialog
    constants/                 Routes, API paths, task values, and chart colors
    data/                       Sample team members
    i18n/                       English/German dictionaries, service, and pipe
    models/                     Shared task and API error types
```

## How it works

### Routing and UI state

- The root component hosts the application shell; dashboard routes lazy-load the standalone page.
- The dashboard page coordinates routing, filters, responsive navigation, and task state.
- `DashboardPageActionsService` handles dialogs, task mutations, activity updates, and feedback.
- `TaskService` reads tasks with Angular `httpResource`; signals expose task, loading, and error state.
- Pure helpers handle filtering, ordering, summary statistics, and activity-time formatting.

### API and data

- An in-memory mock API handles supported task and statistics endpoints; no external server or
  environment variables are required.
- `taskApiInterceptor` caches task GET responses for 60 seconds, retries transient read errors up
  to two times, and invalidates cached reads after successful writes. Mutations are not retried.
- `mockApiInterceptor` adds a short response delay and returns HTTP-style validation and not-found
  errors. Unsupported requests continue to the normal HTTP backend.
- Seed data is stored in:
  - Tasks: `src/app/features/tasks/data-access/tasks.json`
  - Statistics: `src/app/features/statistics/data-access/statistics.json`
  - Team members: `src/app/shared/data/team-members.json`
- The dashboard summary is calculated from the current task list. Task and activity changes are
  in-memory and reset on page reload.

### Task form

- Typed reactive controls validate required fields, whitespace-only titles, field length limits,
  due dates, assignees, and a bounded dynamic label list.
- Read errors offer a retry action; task operations report success or failure through snack-bar
  messages.

## User experience and quality

### Internationalization

- The interface supports English and German.
- Language changes update translated content, locale-aware dates, the document language, title, and
  description; the selected language persists in local storage.

### Accessibility

- Semantic landmarks, accessible control names, visible keyboard focus, and dialog focus management.
- Reduced-motion-aware transitions.
- Charts include accessible labels and visible text summaries.
- Loading, error, and empty states expose appropriate status, alert, or descriptive labels.

### Performance and responsive design

- The dashboard page is lazy-loaded; the task editor and delete confirmation are dynamically
  imported, and board and analytics content use Angular deferred loading.
- Components use `OnPush` change detection and signals; template collections use tracking.
- Chart.js registers only the elements used by the dashboard and initializes charts only in the
  browser.
- Task GET responses are cached for 60 seconds; successful writes invalidate cached responses.
- Production build budgets are configured for the initial bundle and component styles.
- Angular Material and CDK provide interface components, dialogs, and drag-and-drop. Tailwind CSS 4
  and SCSS style desktop, tablet, and mobile layouts.

### Technology

- Angular 21, TypeScript 5.9, and RxJS
- Standalone components, signals, dependency injection, and `httpResource`
- Chart.js for priority and status analytics
- ESLint, Prettier, Husky, and lint-staged for code quality

## Run locally

### Requirements

- Node.js `^20.19.0`, `^22.13.0`, or `^24.0.0` (see `package.json`).
- The `.nvmrc` file selects the Node 22 release line; use version 22.13 or newer.
- Chrome is required to run Karma tests.

### Start the app

```bash
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Commands

| Command                 | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `npm start`             | Start the Angular development server.                      |
| `npm run build`         | Create a production build.                                 |
| `npm run watch`         | Rebuild using the development configuration.               |
| `npm test`              | Run unit tests in watch mode.                              |
| `npm run test:coverage` | Run unit tests once and enforce coverage limits.           |
| `npm run lint`          | Lint TypeScript and Angular templates.                     |
| `npm run format:check`  | Check Prettier formatting.                                 |
| `npm run format`        | Format source and root-level JS, JSON, and Markdown files. |
| `npm run generate:data` | Regenerate task and statistics seed JSON with fresh dates. |

Husky runs lint-staged before commits. Staged TypeScript and HTML files are linted and formatted;
staged JavaScript, CommonJS, JSON, Markdown, and SCSS files are formatted.

## Testing and verification

Unit and component tests use Jasmine and Karma in Chrome. The suite covers dashboard routing and
interactions, form validation, task and statistics services, HTTP interceptors, and filtering,
ordering, and statistics helpers. `npm run test:coverage` enforces an 80% minimum global threshold
for statements, branches, functions, and lines.

Latest checks were run using Node.js 24.10.0:

| Check                                    | Result                                |
| ---------------------------------------- | ------------------------------------- |
| `npm run lint`                           | Passed.                               |
| `npm run test:coverage`                  | Passed: 81 tests.                     |
| Statement coverage                       | 94.49% (687/727).                     |
| Branch coverage                          | 86.66% (299/345).                     |
| Function coverage                        | 93.57% (204/218).                     |
| Line coverage                            | 95.64% (593/620).                     |
| `npm run build`                          | Passed; initial bundle 389.52 kB raw. |
| `npx tsc --noEmit -p tsconfig.spec.json` | Passed.                               |
| `npm run format:check`                   | Passed.                               |

Coverage exceeds the configured 80% minimum in all categories. The HTML report is generated under
`coverage/task-managment-dashboard/`.
