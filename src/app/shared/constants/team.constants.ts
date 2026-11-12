import type { Assignee } from '../models/task.model';
import teamMemberData from '../data/team-members.json';

/** Team members shared by task creation, assignment, and validation. */
export const TEAM_MEMBERS: readonly Assignee[] = teamMemberData;

/** Default task owner and actor for locally generated activity entries. */
export const CURRENT_USER = TEAM_MEMBERS[0];
