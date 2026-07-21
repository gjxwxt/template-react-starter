import { apiClient } from './client';
import type { ListTaskParams, SaveTaskInput, TaskRecord } from './models';

export const listTasks = (params: ListTaskParams) => {
  return apiClient.post<{ items: TaskRecord[]; total: number }, ListTaskParams>(
    '/tasks/query',
    params,
  );
};

export const saveTask = (input: SaveTaskInput) => {
  return apiClient.post<TaskRecord, SaveTaskInput>('/tasks', input);
};
