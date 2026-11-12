#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const taskOutputDirectory = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'features',
  'tasks',
  'data-access',
);
const statisticsOutputDirectory = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'features',
  'statistics',
  'data-access',
);
const users = [
  { id: 'u1', name: 'Olivia Rhye', avatar: 'OR', email: 'olivia@acme.com' },
  { id: 'u2', name: 'Phoenix Baker', avatar: 'PB', email: 'phoenix@acme.com' },
  { id: 'u3', name: 'Lana Steiner', avatar: 'LS', email: 'lana@acme.com' },
  { id: 'u4', name: 'Demi Wilkinson', avatar: 'DW', email: 'demi@acme.com' },
  { id: 'u5', name: 'Candice Wu', avatar: 'CW', email: 'candice@acme.com' },
];

const taskDefinitions = [
  [
    't1',
    'Prepare Q3 campaign brief',
    'Pull together the messaging, goals and channel plan for the upcoming launch.',
    'todo',
    'high',
    -2,
    'u2',
    ['Marketing', 'Launch'],
    4,
  ],
  [
    't2',
    'Review homepage wireframes',
    'Share feedback on the latest homepage exploration with the product team.',
    'todo',
    'medium',
    3,
    'u3',
    ['Design'],
    3,
  ],
  [
    't3',
    'Set up analytics events',
    'Define and document the events we need to track across onboarding.',
    'todo',
    'low',
    6,
    'u1',
    ['Product'],
    2,
  ],
  [
    't4',
    'Draft customer interview guide',
    'Prepare a short discussion guide for next week’s customer calls.',
    'todo',
    'low',
    9,
    'u4',
    ['Research'],
    1,
  ],
  [
    't5',
    'Audit accessibility contrast',
    'Check the core application flows against WCAG contrast guidelines.',
    'todo',
    'high',
    0,
    'u5',
    ['Accessibility'],
    5,
  ],
  [
    't6',
    'Polish onboarding flow',
    'Tighten the copy and final details across the new user onboarding screens.',
    'in_progress',
    'high',
    -1,
    'u1',
    ['Product', 'Onboarding'],
    6,
  ],
  [
    't7',
    'Build the integrations page',
    'Create the first pass of the integrations directory and connection states.',
    'in_progress',
    'medium',
    2,
    'u2',
    ['Engineering'],
    5,
  ],
  [
    't8',
    'Organize customer feedback',
    'Group recent feedback into themes and add takeaways to the research doc.',
    'in_progress',
    'low',
    5,
    'u4',
    ['Research'],
    4,
  ],
  [
    't9',
    'Update the design system',
    'Document the latest button and form field component updates.',
    'in_progress',
    'medium',
    7,
    'u3',
    ['Design'],
    3,
  ],
  [
    't10',
    'Publish product release notes',
    'Write and publish release notes for this week’s product update.',
    'done',
    'high',
    -3,
    'u5',
    ['Product'],
    8,
  ],
  [
    't11',
    'Share sprint retrospective',
    'Collect the team’s notes and circulate the retrospective summary.',
    'done',
    'low',
    -1,
    'u1',
    ['Team'],
    7,
  ],
  [
    't12',
    'Finalize brand guidelines',
    'Package the approved visual identity and usage examples for the team.',
    'done',
    'medium',
    -5,
    'u3',
    ['Brand'],
    10,
  ],
];

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function generateTasks(now) {
  const tasks = taskDefinitions.map(
    ([id, title, description, status, priority, dueOffset, userId, tags, createdOffset]) => {
      const dueDate = dateOnly(addDays(now, dueOffset));
      const task = {
        id,
        title,
        description,
        status,
        priority,
        dueDate,
        isOverdue: status !== 'done' && dueDate < dateOnly(now),
        assignee: users.find((user) => user.id === userId),
        tags,
        createdAt: addDays(now, -createdOffset).toISOString(),
        updatedAt: addDays(now, -Math.max(0, createdOffset - 1)).toISOString(),
      };

      if (status === 'done') task.completedAt = task.updatedAt;
      return task;
    },
  );

  return { tasks, meta: { totalCount: tasks.length, lastUpdated: now.toISOString() } };
}

function generateStatistics(tasksResponse, now) {
  const tasks = tasksResponse.tasks;
  const counts = {
    total: tasks.length,
    done: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    overdue: tasks.filter((task) => task.isOverdue).length,
  };
  const definitions = [
    ['stat-001', 'Total Tasks', '▤', counts.total, '+2', 'this week', 'positive', '#1976D2'],
    ['stat-002', 'Completed', '✓', counts.done, '+1', 'today', 'positive', '#388E3C'],
    [
      'stat-003',
      'In Progress',
      '◷',
      counts.inProgress,
      '0',
      'Same as yesterday',
      'neutral',
      '#FF6F00',
    ],
    ['stat-004', 'Overdue', '!', counts.overdue, '+1', 'today', 'negative', '#D32F2F'],
  ];

  return {
    statistics: definitions.map(
      ([id, title, icon, value, change, changeLabel, changeType, color]) => ({
        id,
        title,
        icon,
        value,
        change,
        changeLabel,
        changeType,
        color,
      }),
    ),
    lastUpdated: now.toISOString(),
  };
}

function writeJsonFile(outputDirectory, fileName, data) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(outputDirectory, fileName),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );
  console.log(`Generated ${fileName}`);
}

function main() {
  const now = new Date();
  const tasks = generateTasks(now);
  writeJsonFile(taskOutputDirectory, 'tasks.json', tasks);
  writeJsonFile(statisticsOutputDirectory, 'statistics.json', generateStatistics(tasks, now));
}

main();
