import { IKanbanManager, IKanban } from './tokens';
import { ITask, ICategory, IFeature } from './model';
import { Signal, ISignal } from '@lumino/signaling';

export class KanbanInstance implements IKanban {
  constructor(filePath: string) {
    this._filePath = filePath;
    this._taskChanged = new Signal<this, ITask>(this);
    this._categoryChanged = new Signal<this, ICategory>(this);
    this._featureLoaded = new Signal<this, IFeature>(this);
    this._featureSaved = new Signal<this, string>(this);
    this._feature = {
      title: '',
      taskPrefix: '',
      description: '',
      stages: new Map(),
      uncategorizedTasks: new Map()
    };
  }

  get filePath(): string {
    return this._filePath;
  }

  get taskChanged(): ISignal<this, ITask> {
    return this._taskChanged;
  }

  get categoryChanged(): ISignal<this, ICategory> {
    return this._categoryChanged;
  }

  get featureLoaded(): ISignal<this, IFeature> {
    return this._featureLoaded;
  }

  get featureSaved(): ISignal<this, string> {
    return this._featureSaved;
  }

  async saveFeatureFile(): Promise<boolean> {
    // TODO: Implement file saving logic
    this._featureSaved.emit(this._filePath);
    return true;
  }

  getFeature(): IFeature {
    return this._feature;
  }

  addStage(name: string, nameI18n?: string): boolean {
    if (this._feature.stages.has(name)) {
      return false;
    }
    this._feature.stages.set(name, { name, nameI18n: nameI18n || name, categories: new Map() });
    return true;
  }

  deleteStage(name: string): boolean {
    return this._feature.stages.delete(name);
  }

  listStages(): string[] {
    return Array.from(this._feature.stages.keys());
  }

  addCategory(stageName: string, name: string, nameI18n?: string): boolean {
    const stage = this._feature.stages.get(stageName);
    if (!stage) {
      return false;
    }
    if (stage.categories.has(name)) {
      return false;
    }
    const category = { name, nameI18n: nameI18n || name, tasks: new Map() };
    stage.categories.set(name, category);
    this._categoryChanged.emit(category);
    return true;
  }

  deleteCategory(name: string, takeOverCategory?: string): boolean {
    // TODO: Implement category deletion with task migration
    return true;
  }

  listCategories(stageName: string): string[] {
    const stage = this._feature.stages.get(stageName);
    if (!stage) {
      return [];
    }
    return Array.from(stage.categories.keys());
  }

  addTask(title: string, description: string): string {
    const taskId = `task-${Date.now()}`;
    const task: ITask = {
      id: taskId,
      title,
      description,
      stage: '',        // 未分类任务没有阶段
      category: '',     // 未分类任务没有分类
      tags: [],
      completed: false, // 新任务默认未完成
      created: new Date(),
      updated: new Date()
    };
    this._feature.uncategorizedTasks.set(taskId, task);
    this._taskChanged.emit(task);
    return taskId;
  }

  moveTask(taskId: string, toStageName: string, toCategoryName: string): boolean {
    // TODO: Implement task movement logic
    return true;
  }

  updateTaskTags(taskId: string, tags: string[]): boolean {
    const task = this._feature.uncategorizedTasks.get(taskId);
    if (task) {
      task.tags = tags;
      task.updated = new Date();
      this._taskChanged.emit(task);
      return true;
    }
    return false;
  }

  getTaskTags(taskId: string): string[] {
    const task = this._feature.uncategorizedTasks.get(taskId);
    return task?.tags || [];
  }

  deleteTask(taskId: string): boolean {
    return this._feature.uncategorizedTasks.delete(taskId);
  }

  listTasks(stageName?: string, categoryName?: string): ITask[] {
    if (!stageName) {
      return Array.from(this._feature.uncategorizedTasks.values());
    }
    const stage = this._feature.stages.get(stageName);
    if (!stage) {
      return [];
    }
    if (!categoryName) {
      return Array.from(stage.categories.values())
        .flatMap(category => Array.from(category.tasks.values()));
    }
    const category = stage.categories.get(categoryName);
    return category ? Array.from(category.tasks.values()) : [];
  }

  listUncategorizedTasks(): ITask[] {
    return Array.from(this._feature.uncategorizedTasks.values());
  }

  async updateTaskDetails(taskId: string, details: string): Promise<boolean> {
    // TODO: Implement task details update logic
    return true;
  }

  async getTaskDetails(taskId: string, defaultDetails?: string): Promise<string> {
    // TODO: Implement task details retrieval logic
    return defaultDetails || '';
  }

  private _filePath: string;
  private _feature: IFeature;
  private _taskChanged: Signal<this, ITask>;
  private _categoryChanged: Signal<this, ICategory>;
  private _featureLoaded: Signal<this, IFeature>;
  private _featureSaved: Signal<this, string>;
}

export class KanbanManager implements IKanbanManager {
  constructor() {
    this._kanbans = new Map<string, KanbanInstance>();
    this._kanbanCreated = new Signal<this, string>(this);
    this._kanbanRemoved = new Signal<this, string>(this);
    this._activeKanban = null;
  }

  get kanbanCreated(): ISignal<this, string> {
    return this._kanbanCreated;
  }

  get kanbanRemoved(): ISignal<this, string> {
    return this._kanbanRemoved;
  }

  set activeKanban(widget: any) {
    this._activeKanban = widget;
  }

  get activeKanban(): any {
    return this._activeKanban;
  }

  getKanban(filePath: string): IKanban {
    let kanban = this._kanbans.get(filePath);
    if (!kanban) {
      kanban = new KanbanInstance(filePath);
      this._kanbans.set(filePath, kanban);
      this._kanbanCreated.emit(filePath);
    }
    return kanban;
  }

  hasKanban(filePath: string): boolean {
    return this._kanbans.has(filePath);
  }

  removeKanban(filePath: string): void {
    if (this._kanbans.delete(filePath)) {
      this._kanbanRemoved.emit(filePath);
    }
  }

  listKanbans(): string[] {
    return Array.from(this._kanbans.keys());
  }

  private _kanbans: Map<string, KanbanInstance>;
  private _kanbanCreated: Signal<this, string>;
  private _kanbanRemoved: Signal<this, string>;
  private _activeKanban: any;
}
