import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { UsersService } from '../../core-client-generated/api/users.service';
import { GoalsService } from '../../core-client-generated/api/goals.service';
import { GroupGoalsService } from '../../core-client-generated/api/groupGoals.service';
import { Group, User, Goal, GroupGoals } from '../../core-client-generated/model/models';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalGroups: number;
  totalStudents: number;
  totalGoals: number;
  completedGoals: number;
}

interface GroupWithDetails extends Group {
  memberCount: number;
  completedGoals: number;
  totalGoals: number;
  progress: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private groupsService = inject(GroupsService);
  private usersService = inject(UsersService);
  private goalsService = inject(GoalsService);
  private groupGoalsService = inject(GroupGoalsService);

  loading = signal(true);
  stats = signal<DashboardStats>({
    totalGroups: 0,
    totalStudents: 0,
    totalGoals: 0,
    completedGoals: 0
  });
  groupsWithDetails = signal<GroupWithDetails[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    forkJoin({
      groups: this.groupsService.groupsList(),
      users: this.usersService.usersList(),
      goals: this.goalsService.goalsList(),
      groupGoals: this.groupGoalsService.groupGoalsList()
    }).subscribe({
      next: ({ groups, users, goals, groupGoals }) => {
        this.calculateStats(groups, users, goals, groupGoals);
        this.processGroupDetails(groups, users, groupGoals);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading.set(false);
      }
    });
  }

  private calculateStats(
    groups: Group[],
    users: User[],
    goals: Goal[],
    groupGoals: GroupGoals[]
  ): void {
    this.stats.set({
      totalGroups: groups.length,
      totalStudents: users.length,
      totalGoals: goals.length,
      completedGoals: groupGoals.filter(gg => gg.complete).length
    });
  }

  private processGroupDetails(
    groups: Group[],
    users: User[],
    groupGoals: GroupGoals[]
  ): void {
    const groupDetails: GroupWithDetails[] = groups.map(group => {
      const memberCount = users.filter(u => u.group === group.id).length;
      const groupGoalsList = groupGoals.filter(gg => gg.group === group.id);
      const completedGoals = groupGoalsList.filter(gg => gg.complete).length;
      const totalGoals = groupGoalsList.length;
      const progress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      return {
        ...group,
        memberCount,
        completedGoals,
        totalGoals,
        progress
      };
    });

    this.groupsWithDetails.set(groupDetails);
  }
}
