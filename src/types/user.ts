import { TrackedActivity } from './tracked-activity';

export interface User {
  id: string;
  email: string;
  name?: string;
  trackedActivities?: TrackedActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData {
  email: string;
  name?: string;
  trackedActivities?: TrackedActivity[];
  createdAt?: Date;
  updatedAt?: Date;
}
