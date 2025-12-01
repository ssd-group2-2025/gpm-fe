import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../core-client-generated/api/users.service';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { User, Group } from '../../core-client-generated/model/models';
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

  loading = signal(true);
  users = signal<User[]>([]);
  groups = signal<Group[]>([]);

  ngOnInit(): void {
    forkJoin({
      users: this.usersService.usersList(),
      groups: this.groupsService.groupsList()
    }).subscribe({
      next: ({ users, groups }) => {
        // Filtra via i superuser
        const filteredUsers = users.filter(user => !user.isSuperuser);
        this.users.set(filteredUsers);
        this.groups.set(groups);
        this.loading.set(false);
      }
    });
  }

  getGroupName(groupId?: number): string {
    if (!groupId) return 'No Group';
    return this.groups().find(g => g.id === groupId)?.name || 'Unknown';
  }

  getUserFullName(user: User): string {
    const firstName = user.firstName || (user as any).first_name || '';
    const lastName = user.lastName || (user as any).last_name || '';
    return `${firstName} ${lastName}`.trim();
  }
}
