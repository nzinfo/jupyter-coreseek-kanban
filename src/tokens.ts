import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { ITask, ICategory, IFeature } from './model';

/**
 * Kanban Manager interface for managing multiple kanban instances
 */
export interface IKanbanManager {
  /**
   * Get or create a kanban instance for a specific file
   */
  getKanban(filePath: string): IKanbanInstance;

  /**
   * Check if a kanban instance exists for a file
   */
  hasKanban(filePath: string): boolean;

  /**
   * Remove a kanban instance
   */
  removeKanban(filePath: string): void;

  /**
   * List all active kanban instances
   */
  listKanbans(): string[];

  /**
   * Signal emitted when a new kanban instance is created
   */
  kanbanCreated: ISignal<this, string>;

  /**
   * Signal emitted when a kanban instance is removed
   */
  kanbanRemoved: ISignal<this, string>;
}

/**
 * Individual Kanban instance interface
 */
export interface IKanbanInstance {
  /**
   * The file path this kanban instance is associated with
   */
  readonly filePath: string;

  /**
   * Save current feature to file
   */
  saveFeatureFile(): Promise<boolean>;

  /**
   * Get the current feature
   */
  getFeature(): IFeature;

  /**
   * Stage Management
   */
  addStage(name: string, nameI18n?: string): boolean;
  deleteStage(name: string): boolean;
  listStages(): string[];

  /**
   * Category Management
   */
  addCategory(stageName: string, name: string, nameI18n?: string): boolean;
  deleteCategory(name: string, takeOverCategory?: string): boolean;
  listCategories(stageName: string): string[];

  /**
   * Task Management
   */
  addTask(title: string, description: string): string;
  moveTask(taskId: string, toStageName: string, toCategoryName: string): boolean;
  updateTaskTags(taskId: string, tags: string[]): boolean;
  getTaskTags(taskId: string): string[];
  deleteTask(taskId: string): boolean;
  listTasks(stageName?: string, categoryName?: string): ITask[];
  listUncategorizedTasks(): ITask[];

  /**
   * Task Details Management
   */
  updateTaskDetails(taskId: string, details: string): Promise<boolean>;
  getTaskDetails(taskId: string, defaultDetails?: string): Promise<string>;

  /**
   * Signals
   */
  taskChanged: ISignal<this, ITask>;
  categoryChanged: ISignal<this, ICategory>;
  featureLoaded: ISignal<this, IFeature>;
  featureSaved: ISignal<this, string>;
}

/**
 * The kanban manager service token.
 */
export const IKanbanManager = new Token<IKanbanManager>('@coreseek/jupyter-kanban:IKanbanManager');
