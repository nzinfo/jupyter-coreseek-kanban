import { Signal } from '@lumino/signaling';

export interface ITask {
  id: string;           // task_id, format: {task_prefix}-{number}
  title: string;        // task title
  description: string;  // task description
  stage: string;        // current stage name
  category: string;     // current category name
  tags: string[];       // task tags
  subtasks?: ITask[];   // optional subtasks
  completed: boolean;   // task completion status
  created: Date;
  updated: Date;
}

export interface IStage {
  name: string;
  nameI18n?: string;
  categories: Map<string, ICategory>;
}

export interface ICategory {
  name: string;
  nameI18n?: string;
  tasks: Map<string, ITask>;
}

export interface IFeature {
  title: string;
  taskPrefix: string;
  description: string;
  stages: Map<string, IStage>;
  uncategorizedTasks: Map<string, ITask>;
}

export class KanbanModel {
  constructor() {
    this._feature = {
      title: '',
      taskPrefix: '',
      description: '',
      stages: new Map(),
      uncategorizedTasks: new Map()
    };
    this._taskChanged = new Signal<this, ITask>(this);
    this._stageChanged = new Signal<this, IStage>(this);
    this._categoryChanged = new Signal<this, ICategory>(this);
  }

  // Feature management
  createFeatureFile(title: string, taskPrefix: string, description: string): boolean {
    if (this._feature.title) {
      return false; // Feature already exists
    }
    
    this._feature = {
      title,
      taskPrefix,
      description,
      stages: new Map(),
      uncategorizedTasks: new Map()
    };

    // Add default stages
    this.addTaskStage('Backlog');
    this.addTaskStage('In Progress');
    this.addTaskStage('Review');
    this.addTaskStage('Done');

    // Add default categories to each stage
    for (const stage of this._feature.stages.values()) {
      this.addTaskCategory(stage.name, 'Todo');
      this.addTaskCategory(stage.name, 'In Progress');
      this.addTaskCategory(stage.name, 'Done');
    }

    return true;
  }

  // Stage management
  addTaskStage(name: string, nameI18n?: string): boolean {
    if (this._feature.stages.has(name)) {
      return false;
    }

    const stage: IStage = {
      name,
      nameI18n,
      categories: new Map()
    };

    this._feature.stages.set(name, stage);
    this._stageChanged.emit(stage);
    return true;
  }

  // Category management
  addTaskCategory(stageName: string, name: string, nameI18n?: string): boolean {
    const stage = this._feature.stages.get(stageName);
    if (!stage || stage.categories.has(name)) {
      return false;
    }

    const category: ICategory = {
      name,
      nameI18n,
      tasks: new Map()
    };

    stage.categories.set(name, category);
    this._categoryChanged.emit(category);
    return true;
  }

  // Task management
  addTask(title: string, description: string): string {
    const id = this._generateTaskId();
    const task: ITask = {
      id,
      title,
      description,
      stage: 'Backlog',
      category: 'Todo',
      tags: [],
      completed: false,
      created: new Date(),
      updated: new Date()
    };

    // Add to Backlog stage, Todo category
    const stage = this._feature.stages.get('Backlog');
    if (stage) {
      const category = stage.categories.get('Todo');
      if (category) {
        category.tasks.set(id, task);
        this._taskChanged.emit(task);
      }
    }

    return id;
  }

  moveTask(taskId: string, toStageName: string, toCategoryName: string): boolean {
    // Find task in current location
    let task: ITask | undefined;
    let fromStage: IStage | undefined;
    let fromCategory: ICategory | undefined;

    // Search in stages
    for (const stage of this._feature.stages.values()) {
      for (const category of stage.categories.values()) {
        if (category.tasks.has(taskId)) {
          task = category.tasks.get(taskId);
          fromStage = stage;
          fromCategory = category;
          break;
        }
      }
      if (task) break;
    }

    // Search in uncategorized tasks if not found
    if (!task) {
      task = this._feature.uncategorizedTasks.get(taskId);
    }

    if (!task) {
      return false;
    }

    // Find target location
    const toStage = this._feature.stages.get(toStageName);
    if (!toStage) {
      return false;
    }

    const toCategory = toStage.categories.get(toCategoryName);
    if (!toCategory) {
      return false;
    }

    // Remove from old location
    if (fromStage && fromCategory) {
      fromCategory.tasks.delete(taskId);
    } else {
      this._feature.uncategorizedTasks.delete(taskId);
    }

    // Update task
    task.stage = toStageName;
    task.category = toCategoryName;
    task.updated = new Date();

    // Add to new location
    toCategory.tasks.set(taskId, task);
    this._taskChanged.emit(task);

    return true;
  }

  updateTaskTags(taskId: string, tags: string[]): boolean {
    const task = this.findTask(taskId);
    if (!task) {
      return false;
    }

    task.tags = [...tags];
    task.updated = new Date();
    this._taskChanged.emit(task);
    return true;
  }

  getTaskTags(taskId: string): string[] {
    const task = this.findTask(taskId);
    return task ? [...task.tags] : [];
  }

  deleteTask(taskId: string): boolean {
    // Find and remove task from its current location
    for (const stage of this._feature.stages.values()) {
      for (const category of stage.categories.values()) {
        if (category.tasks.delete(taskId)) {
          return true;
        }
      }
    }

    return this._feature.uncategorizedTasks.delete(taskId);
  }

  deleteTaskCategory(categoryName: string, takeOverCategory?: string): boolean {
    for (const stage of this._feature.stages.values()) {
      const category = stage.categories.get(categoryName);
      if (category) {
        if (takeOverCategory) {
          const targetCategory = stage.categories.get(takeOverCategory);
          if (targetCategory) {
            // Move tasks to target category
            for (const [id, task] of category.tasks) {
              task.category = takeOverCategory;
              task.updated = new Date();
              targetCategory.tasks.set(id, task);
              this._taskChanged.emit(task);
            }
          }
        }
        stage.categories.delete(categoryName);
        return true;
      }
    }
    return false;
  }

  deleteTaskStage(stageName: string): boolean {
    const stage = this._feature.stages.get(stageName);
    if (!stage) {
      return false;
    }

    // Move all tasks to uncategorized or Backlog
    for (const category of stage.categories.values()) {
      for (const [id, task] of category.tasks) {
        const backlog = this._feature.stages.get('Backlog');
        if (backlog) {
          const todoCategory = backlog.categories.get('Todo');
          if (todoCategory) {
            task.stage = 'Backlog';
            task.category = 'Todo';
            task.updated = new Date();
            todoCategory.tasks.set(id, task);
            this._taskChanged.emit(task);
          }
        } else {
          this._feature.uncategorizedTasks.set(id, task);
        }
      }
    }

    this._feature.stages.delete(stageName);
    return true;
  }

  listTasks(stageName?: string, categoryName?: string): ITask[] {
    if (!stageName) {
      // Return all tasks
      const tasks: ITask[] = [];
      for (const stage of this._feature.stages.values()) {
        for (const category of stage.categories.values()) {
          tasks.push(...category.tasks.values());
        }
      }
      tasks.push(...this._feature.uncategorizedTasks.values());
      return tasks;
    }

    const stage = this._feature.stages.get(stageName);
    if (!stage) {
      return [];
    }

    if (!categoryName) {
      // Return all tasks in stage
      const tasks: ITask[] = [];
      for (const category of stage.categories.values()) {
        tasks.push(...category.tasks.values());
      }
      return tasks;
    }

    const category = stage.categories.get(categoryName);
    return category ? Array.from(category.tasks.values()) : [];
  }

  listStages(): string[] {
    return Array.from(this._feature.stages.keys());
  }

  listCategories(stageName: string): string[] {
    const stage = this._feature.stages.get(stageName);
    return stage ? Array.from(stage.categories.keys()) : [];
  }

  listUncategorizedTasks(): ITask[] {
    return Array.from(this._feature.uncategorizedTasks.values());
  }

  // Signal getters
  get taskChanged(): Signal<this, ITask> {
    return this._taskChanged;
  }

  get stageChanged(): Signal<this, IStage> {
    return this._stageChanged;
  }

  get categoryChanged(): Signal<this, ICategory> {
    return this._categoryChanged;
  }

  // Private helpers
  private findTask(taskId: string): ITask | undefined {
    // Search in stages
    for (const stage of this._feature.stages.values()) {
      for (const category of stage.categories.values()) {
        const task = category.tasks.get(taskId);
        if (task) return task;
      }
    }
    // Search in uncategorized tasks
    return this._feature.uncategorizedTasks.get(taskId);
  }

  private _generateTaskId(): string {
    const prefix = this._feature.taskPrefix || 'TASK';
    const tasks = this.listTasks();
    const maxId = tasks.reduce((max, task) => {
      const num = parseInt(task.id.split('-')[1]);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `${prefix}-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  private _feature: IFeature;
  private _taskChanged: Signal<this, ITask>;
  private _stageChanged: Signal<this, IStage>;
  private _categoryChanged: Signal<this, ICategory>;
}
