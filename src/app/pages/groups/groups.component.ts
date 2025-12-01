import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { GroupsService } from '../../core-client-generated/api/groups.service';
import { GroupUsersService } from '../../core-client-generated/api/groupUsers.service';
import { TopicsService } from '../../core-client-generated/api/topics.service';
import { UsersService } from '../../core-client-generated/api/users.service';
import { Group, Topic, User, UserGroup } from '../../core-client-generated/model/models';
import { forkJoin } from 'rxjs';

interface GroupView {
  id?: number;
  name: string;
  linkDjango: string;
  linkTui: string;
  linkGui: string;
  topic: number;
  members: number[];
  topicTitle?: string;
  memberNames?: string[];
  isMyGroup?: boolean;
  canEdit?: boolean;
}

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [GroupUsersService],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private groupsService = inject(GroupsService);
  private groupUsersService = inject(GroupUsersService);
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
      users: this.usersService.usersList(),
      userGroups: this.groupUsersService.groupUsersList()
    }).subscribe({
      next: ({ groups, topics, users, userGroups }) => {
        this.topics.set(topics);
        this.users.set(users);

        const currentUserId = this.authService.currentUser()?.id;
        const currentUserIdNum = currentUserId ? Number(currentUserId) : undefined;

        const enriched: GroupView[] = groups.map(group => {
          const groupMembers = userGroups
            .filter(ug => ug.group === group.id)
            .map(ug => ug.user);

          const isMyGroup = currentUserIdNum ? groupMembers.includes(currentUserIdNum) : false;

          return {
            ...group,
            members: groupMembers,
            topicTitle: topics.find(t => t.id === group.topic)?.title,
            memberNames: groupMembers.map(memberId =>
              users.find(u => u.id === memberId)?.username || 'Unknown'
            ),
            isMyGroup,
            canEdit: this.authService.isAdmin() || (currentUserIdNum ? groupMembers.includes(currentUserIdNum) : false)
          };
        });

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
    const currentUserId = this.authService.currentUser()?.id;
    this.groupForm.reset({
      name: '',
      topic: '',
      linkDjango: '',
      linkTui: '',
      linkGui: '',
      members: this.authService.isAdmin() ? [] : [currentUserId]
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

    const groupData: Group = {
      name: formValue.name,
      topic: formValue.topic,
      linkDjango: formValue.linkDjango || '',
      linkTui: formValue.linkTui || '',
      linkGui: formValue.linkGui || '',
      members: []
    };

    const currentUserId = this.authService.currentUser()?.id;

    if (editing) {
      this.groupsService.groupsUpdate(groupData, editing.id!).subscribe({
        next: (updatedGroup) => {
          if (this.authService.isAdmin() && formValue.members) {
            this.updateGroupMembers(updatedGroup.id!, formValue.members).then(() => {
              this.saving.set(false);
              this.closeModal();
              this.loadData();
            });
          } else {
            this.saving.set(false);
            this.closeModal();
            this.loadData();
          }
        },
        error: (error) => {
          console.error('Error updating group:', error);
          this.saving.set(false);
        }
      });
    } else {
      this.groupsService.groupsCreate(groupData).subscribe({
        next: (newGroup) => {
          const membersToAdd = this.authService.isAdmin() && formValue.members?.length
            ? formValue.members
            : currentUserId ? [currentUserId] : [];

          if (membersToAdd.length > 0 && newGroup.id) {
            this.addGroupMembers(newGroup.id, membersToAdd).then(() => {
              this.saving.set(false);
              this.closeModal();
              this.loadData();
            });
          } else {
            this.saving.set(false);
            this.closeModal();
            this.loadData();
          }
        },
        error: (error) => {
          console.error('Error creating group:', error);
          this.saving.set(false);
        }
      });
    }
  }

  private async addGroupMembers(groupId: number, memberIds: number[]): Promise<void> {
    const promises = memberIds.map(userId => {
      const userGroup: UserGroup = {
        group: groupId,
        user: userId
      };
      return this.groupUsersService.groupUsersCreate(userGroup).toPromise();
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error adding members to group:', error);
    }
  }

  private async updateGroupMembers(groupId: number, newMemberIds: number[]): Promise<void> {
    try {
      const allUserGroups = await this.groupUsersService.groupUsersList().toPromise();
      const currentMembers = allUserGroups?.filter(ug => ug.group === groupId) || [];

      const toRemove = currentMembers.filter(ug => !newMemberIds.includes(ug.user));
      const currentMemberIds = currentMembers.map(ug => ug.user);
      const toAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));

      const removePromises = toRemove.map(ug =>
        this.groupUsersService.groupUsersDelete(ug.id!).toPromise()
      );

      const addPromises = toAdd.map(userId => {
        const userGroup: UserGroup = {
          group: groupId,
          user: userId
        };
        return this.groupUsersService.groupUsersCreate(userGroup).toPromise();
      });

      await Promise.all([...removePromises, ...addPromises]);
    } catch (error) {
      console.error('Error updating group members:', error);
    }
  }

  joinGroup(group: Group): void {
    if (!group.id) return;

    this.groupsService.groupsJoin(group, group.id).subscribe({
      next: () => {
        console.log('Join successful, reloading data...');
        // Ricarica i dati per aggiornare lo stato isMyGroup
        setTimeout(() => this.loadData(), 200);
      },
      error: (error) => console.error('Error joining group:', error)
    });
  }

  leaveGroup(group: Group): void {
    if (!group.id) return;

    Swal.fire({
      title: 'Leave Group?',
      text: 'Are you sure you want to leave this group?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, leave',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.groupsService.groupsLeave(group.id!).subscribe({
          next: () => {
            Swal.fire('Left!', 'You have left the group.', 'success');
            console.log('Leave successful, reloading data...');
            setTimeout(() => this.loadData(), 200);
          },
          error: (error) => {
            console.error('Error leaving group:', error);
            Swal.fire('Error', 'Failed to leave the group.', 'error');
          }
        });
      }
    });
  }

  deleteGroup(id: number): void {
    Swal.fire({
      title: 'Delete Group?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.groupsService.groupsDelete(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'The group has been deleted.', 'success');
            this.loadData();
          },
          error: (error) => {
            console.error('Error deleting group:', error);
            Swal.fire('Error', 'Failed to delete the group.', 'error');
          }
        });
      }
    });
  }
}
