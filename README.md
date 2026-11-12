# TaskFlow

TaskFlow is a responsive task-management dashboard built with Angular 21 and TypeScript 5.9. This
README documents the features, structure, and verification results implemented in this repository.

## Live demo

[Open the TaskFlow dashboard](https://mennamagdy2019.github.io/task-managment-dashboard/dashboard).

## Implemented features

- Create, edit, and delete tasks, with confirmation before deletion.
- Set task title, description, priority, status, due date, assignee, and optional labels.
- Search task titles and descriptions; filter by status, priority, and assignee; use the Dashboard,
  My Tasks, and Analytics views.
- Drag tasks between status columns and reorder them within a column.
- Show task totals, completion, in-progress, and overdue summary counts.
- Visualize task counts by priority and status with Chart.js, alongside a recent activity feed.
- Assign tasks using sample team-member data.
- Switch between English and German; the selected language is persisted in browser local storage.
- Provide responsive layouts, visible keyboard focus, accessible control labels, and reduced-motion
  styling.

## Architecture

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
      utils/                    Pure filtering, ordering, statistics, and view helpers
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

### UI and state

The root component is an application shell. Dashboard, tasks, analytics, and team-member routes
load the standalone dashboard page lazily. The page coordinates routing, filters, responsive
navigation, and task state; child components receive signal inputs and emit outputs.
`DashboardPageActionsService` coordinates dialogs, task mutations, activity updates, and feedback.

`TaskService` reads tasks with Angular `httpResource`, exposing reactive task, loading, and error
state. Mutations use `HttpClient` and refresh the resource after success. Signals hold local page
state, while pure filtering, ordering, summary-statistic, and activity-time logic is kept in
tested helpers.

### API and form behavior

The app uses an in-memory mock API; it requires no external server or environment variables.
`taskApiInterceptor` caches task GET responses for 60 seconds, retries transient read errors up to
two times, and invalidates cached reads after successful writes. Mutations are not retried.
`mockApiInterceptor` handles supported task and statistics endpoints, adds a short response delay,
and converts expected validation and not-found failures to HTTP-style errors. Unsupported requests
continue to the normal HTTP backend.

The task editor uses typed reactive controls, a custom whitespace-only title validator, field
length limits, required due-date and assignee controls, and a bounded dynamic label list. Read
errors have a retry action; task operations report success or failure through snack-bar messages.

Task records are seeded from `src/app/features/tasks/data-access/tasks.json`. Statistics metadata
is seeded from `src/app/features/statistics/data-access/statistics.json`, and team members come
from `src/app/shared/data/team-members.json`. The dashboard summary is calculated from the current
task list. Task and activity changes exist only in memory and reset on page reload.

## Additional work: i18n, accessibility, and performance

These improvements extend the core task-management features.

### Internationalization

The interface supports English and German. The language switch updates translated content,
formats dates using the active locale, persists the selection in local storage, and updates the
document language, title, and description.

### Accessibility

The UI includes semantic landmarks, accessible names for controls, visible keyboard-focus styles,
dialog focus management, and reduced-motion-aware transitions. Charts have accessible labels and
visible text summaries; loading, error, and empty states expose status, alert, or descriptive labels
where appropriate. These are implemented
accessibility practices, not a claim of formal WCAG 2.1 AA compliance; no formal audit has been
performed.

### Performance

- The dashboard page is lazy-loaded; the task editor and delete confirmation are dynamically
  imported, and board and analytics content use Angular deferred loading.
- Components use `OnPush` change detection and signals; template collections use tracking.
- Chart.js registers only the chart elements used by this dashboard and initializes charts only in
  the browser.
- Task GET responses are cached for 60 seconds, and successful writes invalidate cached responses.
- Production build budgets are configured for the initial bundle and component styles.

### Responsive interface

Angular Material and CDK provide interface components, dialogs, and drag-and-drop. Tailwind CSS 4
and SCSS style the desktop, tablet, and mobile layouts.

### Technology

- Angular 21, TypeScript 5.9, and RxJS
- Standalone components, signals, dependency injection, and `httpResource`
- Chart.js for priority and status analytics
- ESLint, Prettier, Husky, and lint-staged for code quality

## Run locally

Use Node.js supported by `package.json`: `^20.19.0`, `^22.13.0`, or `^24.0.0`. The `.nvmrc` file
selects the Node 22 release line; use version 22.13 or newer. Chrome is required for Karma tests.

```bash
npm ci
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Commands

| Command                 | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm start`             | Start the Angular development server.                                    |
| `npm run build`         | Create a production build.                                               |
| `npm run watch`         | Rebuild using the development configuration.                             |
| `npm test`              | Run unit tests in watch mode.                                            |
| `npm run test:coverage` | Run unit tests once and enforce configured coverage thresholds.          |
| `npm run lint`          | Run Angular ESLint checks for TypeScript and templates.                  |
| `npm run format:check`  | Check Prettier formatting.                                               |
| `npm run format`        | Format source files and root-level JavaScript, JSON, and Markdown files. |
| `npm run generate:data` | Regenerate task and statistics seed JSON with fresh dates.               |

Husky runs lint-staged before commits. Staged TypeScript and HTML files are linted and formatted;
staged JavaScript, CommonJS, JSON, Markdown, and SCSS files are formatted.

## Verification results

Checks were run using Node.js 22.13.0.

| Check                                    | Result                                |
| ---------------------------------------- | ------------------------------------- |
| `npm run lint`                           | Passed.                               |
| `npm run test:coverage`                  | Passed: 80 tests.                     |
| Statement coverage                       | 94.63% (688/727).                     |
| Branch coverage                          | 87.24% (301/345).                     |
| Function coverage                        | 93.57% (204/218).                     |
| Line coverage                            | 95.64% (593/620).                     |
| `npm run build`                          | Passed; initial bundle 389.36 kB raw. |
| `npx tsc --noEmit -p tsconfig.spec.json` | Passed.                               |
| `npm run format:check`                   | Passed.                               |

Coverage exceeds the configured 80% minimum for statements, branches, functions, and lines. The
HTML report is generated under `coverage/task-managment-dashboard/`.
