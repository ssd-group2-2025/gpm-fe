import { User } from '../core-client-generated/model/models';

export interface ExtendedUser extends User {
  group?: number;
  is_staff?: boolean;
  is_superuser?: boolean;
  isStaff?: boolean;
  isSuperuser?: boolean;
}
