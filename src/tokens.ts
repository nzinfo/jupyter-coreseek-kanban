import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { ITask, TaskStatus } from './model';

/**
 * The kanban token interface.
 */
export interface IKanban {
  /**
   * Get all tasks
   */
  getTasks(): ITask[];

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): ITask[];

  /**
   * Add a new task
   */
  addTask(task: Omit<ITask, 'id' | 'created' | 'updated'>): ITask;

  /**
   * Update a task
   */
  updateTask(id: string, updates: Partial<Omit<ITask, 'id' | 'created'>>): ITask;

  /**
   * Delete a task
   */
  deleteTask(id: string): void;

  /**
   * Set task status
   */
  setTaskStatus(id: string, status: TaskStatus): ITask;

  /**
   * Signal emitted when a task changes
   */
  taskChanged: ISignal<this, ITask>;

  /**
   * Signal emitted when a category changes
   */
  categoryChanged: ISignal<this, string>;

  /**
   * Signal emitted when tasks are loaded from file
   */
  tasksLoaded: ISignal<this, ITask[]>;

  /**
   * The current active kanban widget, or null if none
   */
  activeKanban: Widget | null;
}

/**
 * The kanban token.
 */
export const IKanban = new Token<IKanban>('@coreseek/jupyter-kanban:IKanban');
