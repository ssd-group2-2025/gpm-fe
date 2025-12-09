import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { GroupGoalsService } from '../../core-client-generated/api/groupGoals.service';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { GoalsService } from '../../core-client-generated/api/goals.service';
import { GroupGoals, Group, Goal } from '../../core-client-generated/model/models';
import { forkJoin } from 'rxjs';

interface GroupGoalView extends GroupGoals {
  groupName?: string;
  goalTitle?: string;
  goalPoints?: number;
}

@Component({
  selector: 'app-group-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './group-goals.component.html',
  styleUrls: ['./group-goals.component.css']
})
export class GroupGoalsComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private groupGoalsService = inject(GroupGoalsService);
  private groupsService = inject(GroupsService);
  private goalsService = inject(GoalsService);

  loading = signal(true);
  saving = signal(false);
  groupGoalsView = signal<GroupGoalView[]>([]);
  groups = signal<any[]>([]);
  goals = signal<Goal[]>([]);
  showModal = signal(false);

  assignmentForm: FormGroup = this.fb.group({
    group: ['', Validators.required],
    goal: ['', Validators.required],
    complete: [false]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      groupGoals: this.groupGoalsService.groupGoalsList(),
      groups: this.groupsService.groupsList(),
      goals: this.goalsService.goalsList()
    }).subscribe({
      next: ({ groupGoals, groups, goals }) => {
        this.groups.set(groups);
        this.goals.set(goals);

        const enriched: GroupGoalView[] = groupGoals.map(gg => ({
          ...gg,
          groupName: groups.find(g => g.id === gg.group)?.name || 'Unknown',
          goalTitle: goals.find(g => g.id === gg.goal)?.title || 'Unknown',
          goalPoints: goals.find(g => g.id === gg.goal)?.points || 0
        }));

        this.groupGoalsView.set(enriched);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        ErrorHandlerService.handleValidationError(error, 'Failed to load assignments.');
        this.loading.set(false);
      }
    });
  }

  showCreateModal(): void {
    this.assignmentForm.reset({ complete: false });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.assignmentForm.reset();
  }

  submitForm(): void {
    if (this.assignmentForm.invalid) return;

    this.saving.set(true);
    this.groupGoalsService.groupGoalsCreate(this.assignmentForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
      },
      error: (error) => {
        console.error('Error creating assignment:', error);
        ErrorHandlerService.handleValidationError(error, 'Failed to create the assignment.');
        this.saving.set(false);
      }
    });
  }

  toggleComplete(gg: GroupGoalView): void {
    const updated = { ...gg, complete: !gg.complete };
    this.groupGoalsService.groupGoalsPartialUpdate(updated, gg.id!).subscribe({
      next: () => this.loadData(),
      error: (error) => {
        console.error('Error toggling completion:', error);
        ErrorHandlerService.handleValidationError(error, 'Failed to toggle completion status.');
      }
    });
  }

  deleteAssignment(id: number): void {
    Swal.fire({
      title: 'Delete Assignment?',
      text: 'Are you sure you want to delete this assignment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.groupGoalsService.groupGoalsDelete(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'The assignment has been deleted.', 'success');
            this.loadData();
          },
          error: (error) => {
            console.error('Error deleting assignment:', error);
            ErrorHandlerService.handleValidationError(error, 'Failed to delete the assignment.');
          }
        });
      }
    });
  }
}
