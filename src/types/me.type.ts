import type { User } from './teams.type';

export interface LoggedInUserData {
  planPermission: any;
  user: User | null;
}
