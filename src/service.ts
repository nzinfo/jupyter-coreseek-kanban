import { IKanban } from './tokens';
import { ITask, TaskStatus } from './model';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

export class KanbanService implements IKanban {
  constructor() {
    this._taskChanged = new Signal<this, ITask>(this);
    this._categoryChanged = new Signal<this, string>(this);
    this._tasksLoaded = new Signal<this, ITask[]>(this);
    this._activeKanban = null;
  }

  get taskChanged() {
    return this._taskChanged;
  }

  get categoryChanged() {
    return this._categoryChanged;
  }

  get tasksLoaded() {
    return this._tasksLoaded;
  }

  get activeKanban(): Widget | null {
    return this._activeKanban;
  }

  set activeKanban(widget: Widget | null) {
    this._activeKanban = widget;
  }

  getTasks(): ITask[] {
    if (this._activeKanban) {
      return this._getActiveModel()?.tasks || [];
    }
    return [];
  }

  getTasksByStatus(status: TaskStatus): ITask[] {
    if (this._activeKanban) {
      return this._getActiveModel()?.getTasksByStatus(status) || [];
    }
    return [];
  }

  addTask(task: Omit<ITask, 'id' | 'created' | 'updated'>): ITask {
    const model = this._getActiveModel();
    if (!model) {
      throw new Error('No active kanban board');
    }
    const newTask = model.addTask(task);
    this._taskChanged.emit(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Omit<ITask, 'id' | 'created'>>): ITask {
    const model = this._getActiveModel();
    if (!model) {
      throw new Error('No active kanban board');
    }
    const updatedTask = model.updateTask(id, updates);
    this._taskChanged.emit(updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): void {
    const model = this._getActiveModel();
    if (!model) {
      throw new Error('No active kanban board');
    }
    model.deleteTask(id);
  }

  setTaskStatus(id: string, status: TaskStatus): ITask {
    const model = this._getActiveModel();
    if (!model) {
      throw new Error('No active kanban board');
    }
    const updatedTask = model.setTaskStatus(id, status);
    this._taskChanged.emit(updatedTask);
    return updatedTask;
  }

  private _getActiveModel() {
    if (this._activeKanban && 'model' in this._activeKanban) {
      return (this._activeKanban as any).model;
    }
    return null;
  }

  private _taskChanged: Signal<this, ITask>;
  private _categoryChanged: Signal<this, string>;
  private _tasksLoaded: Signal<this, ITask[]>;
  private _activeKanban: Widget | null;
}
