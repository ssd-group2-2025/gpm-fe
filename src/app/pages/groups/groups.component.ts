import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { TopicsService } from '../../core-client-generated/api/topics.service';
import { UsersService } from '../../core-client-generated/api/users.service';
import { Group, Topic, User } from '../../core-client-generated/model/models';
import { forkJoin } from 'rxjs';

interface GroupView extends Group {
  topicTitle?: string;
  memberNames?: string[];
  isMyGroup?: boolean;
  canEdit?: boolean;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private groupsService = inject(GroupsService);
  private topicsService = inject(TopicsService);
  private usersService = inject(UsersService);

  loading = signal(true);
  saving = signal(false);
  groupsView = signal<GroupView[]>([]);
  topics = signal<Topic[]>([]);
  users = signal<User[]>([]);
  showModal = signal(false);
  editingGroup = signal<Group | null>(null);

  groupForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    topic: ['', Validators.required],
    linkDjango: [''],
    linkTui: [''],
    linkGui: [''],
    members: [[]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      groups: this.groupsService.groupsList(),
      topics: this.topicsService.topicsList(),
      users: this.usersService.usersList()
    }).subscribe({
      next: ({ groups, topics, users }) => {
        this.topics.set(topics);
        this.users.set(users);

        const currentUserId = this.authService.currentUser?.id;

        const enriched: GroupView[] = groups.map(group => ({
          ...group,
          topicTitle: topics.find(t => t.id === group.topic)?.title,
          memberNames: group.members.map(memberId =>
            users.find(u => u.id === memberId)?.username || 'Unknown'
          ),
          isMyGroup: group.members.includes(currentUserId!),
          canEdit: this.authService.isAdmin || group.members.includes(currentUserId!)
        }));

        this.groupsView.set(enriched);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading.set(false);
      }
    });
  }

  showCreateModal(): void {
    this.editingGroup.set(null);
    const currentUserId = this.authService.currentUser?.id;
    this.groupForm.reset({
      name: '',
      topic: '',
      linkDjango: '',
      linkTui: '',
      linkGui: '',
      members: this.authService.isAdmin ? [] : [currentUserId]
    });
    this.showModal.set(true);
  }

  editGroup(group: Group): void {
    this.editingGroup.set(group);
    this.groupForm.patchValue(group);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.groupForm.reset();
  }

  submitForm(): void {
    if (this.groupForm.invalid) return;

    this.saving.set(true);
    const editing = this.editingGroup();
    const formValue = this.groupForm.value;

    const formData: any = {
      name: formValue.name,
      topic: formValue.topic,
      link_django: formValue.linkDjango || '',
      link_tui: formValue.linkTui || '',
      link_gui: formValue.linkGui || '',
      members: formValue.members
    };

    if (!this.authService.isAdmin) {
      const currentUserId = this.authService.currentUser?.id;
      if (editing) {
        if (!formData.members.includes(currentUserId)) {
          formData.members.push(currentUserId);
        }
      } else {
        formData.members = [currentUserId];
      }
    }

    if (editing) {
      this.groupsService.groupsUpdate(formData, editing.id!).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating group:', error);
          this.saving.set(false);
        }
      });
    } else {
      this.groupsService.groupsCreate(formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating group:', error);
          this.saving.set(false);
        }
      });
    }
  }

  joinGroup(group: Group): void {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) return;

    this.groupsService.groupsJoin({} as Group, group.id!).subscribe({
      next: () => this.loadData(),
      error: (error) => console.error('Error joining group:', error)
    });
  }

  leaveGroup(group: Group): void {
    const currentUserId = this.authService.currentUser?.id;
    if (!currentUserId) return;

    if (confirm('Are you sure you want to leave this group?')) {
      const updatedMembers = group.members.filter(id => id !== currentUserId);
      const updatedGroup = { ...group, members: updatedMembers };

      this.groupsService.groupsPartialUpdate(updatedGroup, group.id!).subscribe({
        next: () => this.loadData(),
        error: (error) => console.error('Error leaving group:', error)
      });
    }
  }

  deleteGroup(id: number): void {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      this.groupsService.groupsDelete(id).subscribe({
        next: () => this.loadData(),
        error: (error) => console.error('Error deleting group:', error)
      });
    }
  }
}
