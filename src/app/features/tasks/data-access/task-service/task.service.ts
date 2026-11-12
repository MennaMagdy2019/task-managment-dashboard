import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import type { Task, TaskDraft, TaskPatch } from '../../../../shared/models/task.model';
import { API_ENDPOINTS } from '../../../../shared/constants/api.constants';

/**
 * Provides the task read resource and task mutation operations.
 *
 * Task reads use `httpResource` so Angular owns the request lifecycle and
 * exposes reactive value, loading, and error state. Mutations use `HttpClient`
 * and increment the resource request key after success to refresh that data.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly refreshKey = signal(0);

  /** Reactive task collection, including its initial loading and error state. */
  readonly resource = httpResource<Task[]>(
    () => {
      this.refreshKey();
      return API_ENDPOINTS.tasks;
    },
    { defaultValue: [] },
  );

  /** Current task collection. */
  readonly tasks = this.resource.value;
  /** Whether the task resource is currently loading or refreshing. */
  readonly isLoading = this.resource.isLoading;
  /** Most recent task-read error, if any. */
  readonly error = this.resource.error;

  /**
   * Creates a task and refreshes the task resource after a successful response.
   * @param draft The draft task data to create.
   * @returns An observable of the created task.
   */
  createTask(draft: TaskDraft): Observable<Task> {
    return this.http
      .post<Task>(API_ENDPOINTS.tasks, draft)
      .pipe(tap(() => this.refreshKey.update((value) => value + 1)));
  }

  /**
   * Updates a task and refreshes the task resource after a successful response.
   * @param id The ID of the task to update.
   * @param changes The partial task data to apply as updates.
   * @returns An observable of the updated task.
   */
  updateTask(id: string, changes: TaskPatch): Observable<Task> {
    return this.http
      .patch<Task>(`${API_ENDPOINTS.tasks}/${encodeURIComponent(id)}`, changes)
      .pipe(tap(() => this.refreshKey.update((value) => value + 1)));
  }

  /**
   * Deletes a task and refreshes the task resource after a successful response.
   * @param id The ID of the task to delete.
   * @returns An observable of the deleted task.
   */
  deleteTask(id: string): Observable<Task> {
    return this.http
      .delete<Task>(`${API_ENDPOINTS.tasks}/${encodeURIComponent(id)}`)
      .pipe(tap(() => this.refreshKey.update((value) => value + 1)));
  }
}
