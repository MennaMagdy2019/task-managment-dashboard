# TaskFlow

A responsive task-management dashboard built with standalone Angular components. It targets Angular 21 and TypeScript 5.9; use a Node.js release allowed by `package.json`'s `engines` field. Node 22 is the recommended development runtime.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Create, edit, delete, search, filter, assign, and drag tasks between status columns. The mock API is in memory, so changes reset when the page is reloaded.

## Implementation

- Code is organized by feature and responsibility: `features/dashboard`, `features/tasks`, and `features/statistics` each own their feature code; `shared` contains cross-feature UI and task models; and `core/interceptors` contains HTTP cross-cutting policies. Each existing source/spec pair has a dedicated folder within its owning feature or responsibility. For paired components, templates and styles are in the sibling `assets` folder so the pair folder contains only TypeScript and its spec.
- The root `AppComponent` is an application shell with only a router outlet. The dashboard page is lazy-loaded from the root route; its header, navigation, summary cards, task board, insights, task cards, editor, and Chart.js analytics are focused standalone components with explicit input/output boundaries. Reusable task filtering, summary, ordering, status-label, and activity-time logic lives in tested pure helpers.
- `TaskService` in `features/tasks/data-access` reads tasks through Angular `httpResource`, exposing reactive loading and error state, and uses `HttpClient` for mutations. A refresh signal reloads the resource after successful writes.
- `taskApiInterceptor` handles task API caching, retry, and invalidation. It wraps downstream handlers: GET responses are cached for 60 seconds and retried up to twice on transient failures, while successful writes invalidate cached reads. The downstream `mockApiInterceptor` adapts supported requests to the in-memory API; unsupported requests continue to the normal HTTP backend. Writes are not retried.
- `InMemoryTaskApiService` seeds its in-memory collection from the generated task JSON, validates create/update payloads, returns detached task copies, and derives overdue status from the current date. `InMemoryStatisticsApiService` owns statistics metadata and derives values from the current task collection. Changes reset when the page is reloaded.
- Regenerate the task and statistics JSON with `npm run generate:data`. The task feature owns the generated `{ tasks, meta }` bundle; the statistics feature owns its generated statistics response.
- The task editor uses typed reactive controls, whitespace and length validation, and an accessible focus-trapped dialog. Delete actions require confirmation.
- Sidebar navigation includes Dashboard, Tasks, and Analytics; the Team submenu filters the task board by assignee. The board supports search, status and priority filters, and the task editor groups task details, planning, and optional labels with inline validation and character counts.
- Angular CDK drag-and-drop supports both status changes and within-column reordering. Analytics is loaded as its own routed view.
- The UI uses Angular Material components and the prebuilt Azure Blue theme, with a small amount of CSS for the Figma-inspired board layout, responsive behavior, and task priority accents. Material controls supply interaction feedback, dialogs, and progress indicators.

## Quality checks

```bash
npm run generate:data
npm run build
npm run lint
npm run format:check
npm run test:coverage
```

`npm run test:coverage` runs the full unit suite and enforces 80% global statement, branch,
function, and line coverage. Run `npm run format` to apply Prettier. Husky installs a pre-commit
hook during `npm install`; it runs ESLint and Prettier on staged source files.
