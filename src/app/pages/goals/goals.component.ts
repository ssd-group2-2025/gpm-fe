import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GoalsService } from '../../core-client-generated/api/goals.service';
import { Goal } from '../../core-client-generated/model/models';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css']
})
export class GoalsComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private goalsService = inject(GoalsService);

  loading = signal(true);
  saving = signal(false);
  goals = signal<Goal[]>([]);
  showModal = signal(false);
  editingGoal = signal<Goal | null>(null);

  goalForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    points: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadGoals();
  }

  loadGoals(): void {
    this.goalsService.goalsList().subscribe({
      next: (goals) => {
        this.goals.set(goals);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        this.loading.set(false);
      }
    });
  }

  showCreateModal(): void {
    this.editingGoal.set(null);
    this.goalForm.reset({ points: 0 });
    this.showModal.set(true);
  }

  editGoal(goal: Goal): void {
    this.editingGoal.set(goal);
    this.goalForm.patchValue(goal);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.goalForm.reset();
  }

  submitForm(): void {
    if (this.goalForm.invalid) return;

    this.saving.set(true);
    const editing = this.editingGoal();

    if (editing) {
      this.goalsService.goalsUpdate(this.goalForm.value, editing.id!).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadGoals();
        },
        error: (error) => {
          console.error('Error updating goal:', error);
          this.saving.set(false);
        }
      });
    } else {
      this.goalsService.goalsCreate(this.goalForm.value).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadGoals();
        },
        error: (error) => {
          console.error('Error creating goal:', error);
          this.saving.set(false);
        }
      });
    }
  }

  deleteGoal(id: number): void {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      this.goalsService.goalsDelete(id).subscribe({
        next: () => this.loadGoals(),
        error: (error) => console.error('Error deleting goal:', error)
      });
    }
  }
}
