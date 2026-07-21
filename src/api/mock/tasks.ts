import type { ListTaskParams, SaveTaskInput, TaskRecord } from '../models';
import { createId, wait } from './shared';

let taskSeed: TaskRecord[] = [
  {
    id: 'task-001',
    name: '审批流程引擎改造',
    owner: '陈舟',
    status: 'running',
    priority: 'P0',
    updatedAt: '2026-07-08 16:40',
  },
  {
    id: 'task-002',
    name: '指标看板升级',
    owner: '李青',
    status: 'pending',
    priority: 'P1',
    updatedAt: '2026-07-08 11:15',
  },
  {
    id: 'task-003',
    name: '资产同步任务',
    owner: '王宁',
    status: 'done',
    priority: 'P2',
    updatedAt: '2026-07-07 18:30',
  },
  {
    id: 'task-004',
    name: '租户权限梳理',
    owner: '赵敏',
    status: 'running',
    priority: 'P1',
    updatedAt: '2026-07-07 10:05',
  },
];

export const mockListTasks = async (
  params: ListTaskParams,
): Promise<{ items: TaskRecord[]; total: number }> => {
  await wait();

  const keyword = String(params.queryValues.keyword ?? '')
    .trim()
    .toLowerCase();
  const status = String(params.queryValues.status ?? '').trim();
  const owner = String(params.queryValues.owner ?? '')
    .trim()
    .toLowerCase();
  const priority = String(params.queryValues.priority ?? '').trim();

  const filtered = taskSeed.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.id.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.owner.toLowerCase().includes(keyword);
    const matchesStatus = !status || item.status === status;
    const matchesOwner = !owner || item.owner.toLowerCase().includes(owner);
    const matchesPriority = !priority || item.priority === priority;

    return matchesKeyword && matchesStatus && matchesOwner && matchesPriority;
  });

  const start = (params.current - 1) * params.pageSize;
  const end = start + params.pageSize;

  return {
    items: filtered.slice(start, end),
    total: filtered.length,
  };
};

export const mockSaveTask = async (input: SaveTaskInput): Promise<TaskRecord> => {
  await wait();

  const baseRecord: TaskRecord = {
    id: input.id ?? createId('task'),
    name: input.name,
    owner: input.owner,
    status: input.status,
    priority: input.priority,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };

  if (!input.id) {
    taskSeed = [baseRecord, ...taskSeed];
    return baseRecord;
  }

  taskSeed = taskSeed.map((item) => (item.id === input.id ? baseRecord : item));
  return baseRecord;
};
