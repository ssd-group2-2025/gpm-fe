import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../core-client-generated/api/users.service';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { GroupUsersService } from '../../core-client-generated/api/groupUsers.service';
import { Group, UserGroup } from '../../core-client-generated/model/models';
import { ExtendedUser } from '../../models/extended-user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  authService = inject(AuthService);
  private usersService = inject(UsersService);
  private groupsService = inject(GroupsService);
  private groupUsersService = inject(GroupUsersService);

  loading = signal(true);
  users = signal<ExtendedUser[]>([]);
  groups = signal<any[]>([]);
  userGroups = signal<UserGroup[]>([]);

  ngOnInit(): void {
    forkJoin({
      users: this.usersService.usersList(),
      groups: this.groupsService.groupsList(),
      userGroups: this.groupUsersService.groupUsersList()
    }).subscribe({
      next: ({ users, groups, userGroups }) => {
        const extendedUsers = users.map(u => u as ExtendedUser);
        const filteredUsers = extendedUsers.filter(user => !(user.isSuperuser || user.is_superuser));
        this.users.set(filteredUsers);
        this.groups.set(groups);
        this.userGroups.set(userGroups);
        this.loading.set(false);
      }
    });
  }

  getGroupName(userId: number): string {
    const userGroup = this.userGroups().find(ug => ug.user === userId);
    if (!userGroup) return 'No Group';
    return this.groups().find(g => g.id === userGroup.group)?.name || 'Unknown';
  }

  getUserFullName(user: ExtendedUser): string {
    const firstName = user.firstName || (user as any).first_name || '';
    const lastName = user.lastName || (user as any).last_name || '';
    return `${firstName} ${lastName}`.trim();
  }
}
