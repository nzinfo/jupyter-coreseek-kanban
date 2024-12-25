import { Signal } from '@lumino/signaling';

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category?: string;
  created: Date;
  updated: Date;
}

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'done';

export class KanbanModel {
  constructor() {
    this._tasks = new Map<string, ITask>();
    this._taskChanged = new Signal<this, ITask>(this);
    this._categoryChanged = new Signal<this, string>(this);
  }

  get tasks(): ITask[] {
    return Array.from(this._tasks.values());
  }

  get taskChanged(): Signal<this, ITask> {
    return this._taskChanged;
  }

  get categoryChanged(): Signal<this, string> {
    return this._categoryChanged;
  }

  addTask(task: Omit<ITask, 'id' | 'created' | 'updated'>): ITask {
    const id = this._generateId();
    const now = new Date();
    const newTask: ITask = {
      ...task,
      id,
      created: now,
      updated: now
    };

    this._tasks.set(id, newTask);
    this._taskChanged.emit(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<ITask, 'id' | 'created'>>): ITask {
    const task = this._tasks.get(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: ITask = {
      ...task,
      ...updates,
      updated: new Date()
    };

    this._tasks.set(id, updatedTask);
    this._taskChanged.emit(updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): void {
    const task = this._tasks.get(id);
    if (task) {
      this._tasks.delete(id);
      this._taskChanged.emit({ ...task, status: 'deleted' as TaskStatus });
    }
  }

  getTasksByStatus(status: TaskStatus): ITask[] {
    return this.tasks.filter(task => task.status === status);
  }

  setTaskStatus(id: string, status: TaskStatus): ITask {
    return this.updateTask(id, { status });
  }

  private _generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private _tasks: Map<string, ITask>;
  private _taskChanged: Signal<this, ITask>;
  private _categoryChanged: Signal<this, string>;
}
