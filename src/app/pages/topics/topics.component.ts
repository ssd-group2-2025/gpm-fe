import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TopicsService } from '../../core-client-generated/api/topics.service';
import { Topic } from '../../core-client-generated/model/models';

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.css']
})
export class TopicsComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private topicsService = inject(TopicsService);

  loading = signal(true);
  saving = signal(false);
  topics = signal<Topic[]>([]);
  showModal = signal(false);
  editingTopic = signal<Topic | null>(null);

  topicForm: FormGroup = this.fb.group({
    title: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.topicsService.topicsList().subscribe({
      next: (topics) => {
        this.topics.set(topics);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.loading.set(false);
      }
    });
  }

  showCreateModal(): void {
    this.editingTopic.set(null);
    this.topicForm.reset();
    this.showModal.set(true);
  }

  editTopic(topic: Topic): void {
    this.editingTopic.set(topic);
    this.topicForm.patchValue(topic);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.topicForm.reset();
  }

  submitForm(): void {
    if (this.topicForm.invalid) return;

    this.saving.set(true);
    const editing = this.editingTopic();

    if (editing) {
      this.topicsService.topicsUpdate(this.topicForm.value, editing.id!).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadTopics();
        },
        error: (error) => {
          console.error('Error updating topic:', error);
          this.saving.set(false);
        }
      });
    } else {
      this.topicsService.topicsCreate(this.topicForm.value).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadTopics();
        },
        error: (error) => {
          console.error('Error creating topic:', error);
          this.saving.set(false);
        }
      });
    }
  }

  deleteTopic(id: number): void {
    if (confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      this.topicsService.topicsDelete(id).subscribe({
        next: () => this.loadTopics(),
        error: (error) => console.error('Error deleting topic:', error)
      });
    }
  }
}
