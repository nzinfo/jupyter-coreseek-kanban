import { Signal } from '@lumino/signaling';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { YFile, DocumentChange, FileChange } from '@jupyter/ydoc'; //  ISharedFile
import { DocumentModel, DocumentRegistry, TextModelFactory } from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';

/**
 * Interface for Kanban model options
 */
export namespace Kanban {
  export interface IModelOptions extends DocumentRegistry.IModelOptions<YFile> {
    docManager: IDocumentManager;
  }

  /**
   * Interface for Kanban model
   */
  export interface IModel extends DocumentRegistry.ICodeModel {
    /**
     * The shared model for collaborative editing
     */
    // readonly sharedModel: ISharedFile;

    /**
     * Signal for tracking changes in the model
     */
    readonly changed: Signal<IModel, IChangedArgs<string>>;

    /**
     * Signal emitted when the model's read-only state changes.
     */
    readonly readOnlyChanged: Signal<this, IChangedArgs<boolean>>;

    /**
     * Dispose the model
     */
    dispose(): void;

    /**
     * Check if the model is disposed
     */
    readonly isDisposed: boolean;

    /**
     * Signal emitted when a task's status changes through API calls
     */
    readonly taskStatusChanged: Signal<this, ITaskStatusChangeArgs>;

    /**
     * Signal emitted when a task's content changes
     */
    readonly taskChanged: Signal<this, ITaskChangeArgs>;

    /**
     * Move a task to a specific category in the list view
     */
    moveTaskToList(task: KanbanTask, toCategory: string, insertAfterTask?: KanbanTask): void;

    /**
     * Move a task to a specific column in the board view
     */
    moveTaskToColumn(task: KanbanTask, toColumn: KanbanColumn, insertAfterTask?: KanbanTask): void;

    /**
     * Create a new task
     * @param title Optional title for the new task
     * @param toColumn Optional column to add the task to
     * @param insertAfterTask Optional task to insert after
     * @returns The newly created task
     */
    newTask(title?: string, toColumn?: KanbanColumn, insertAfterTask?: KanbanTask): KanbanTask;
  }
}

/**
 * Interface for Kanban structure
 */
export interface KanbanHeading {
  level: number;
  text: string;
  lineStart: number;
}

export interface KanbanColumn {
  title: string;
  lineNo: number;
  tasks: KanbanTask[];
}

export interface KanbanSection {
  title: string;
  lineNo: number;
  columns: KanbanColumn[];
}

export interface KanbanStructure {
  title: string;
  lineNo: number;
  sections: KanbanSection[];
  task_id_prefix: string;
  tasks: KanbanTask[];
  task_status: Map<string, string>;   // value in BACKLOG | DONE
}

/**
 * Task interface
 */
export interface KanbanTask {
  
  id: string;
  
  /**
   * Task title (from first line, starting with ### or ####)
   */
  title: string;

  /**
   * Task description (first 50 chars from remaining text, excluding links)
   */
  description: string;

  /**
   * Optional detail file name
   */
  detailFile?: string;

  /**
   * Task tags
   */
  tags: string[];

  /**
   * Assigned user
   */
  assignee: {
    name: string;
    profile?: string;
  }[];
}

/**
 * Task status change event type
 */
export interface ITaskStatusChangeArgs {
  task: KanbanTask;
  fromColumn?: KanbanColumn;
  toColumn?: KanbanColumn;
  insertAfterTask?: KanbanTask;
}

/**
 * Task change event type
 */
export interface ITaskChangeArgs {
  task: KanbanTask;
  changes: {
    title?: string;
    description?: string;
    status?: string;
    [key: string]: any;
  };
}

/**
 * Generate a simple hash from string
 */
function _stringHash(str: string): string {
  // FIXME: 使用更好的 hash 算法
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Parse task title with optional ID
 * @returns [id, title] tuple, where id might be undefined
 */
function _parseTaskTitle(text: string): [string | undefined, string] {
  const match = text.match(/^[\[［](.*?)[\]］](.*)/);
  if (match) {
    return [match[1], match[2].trim()];
  }
  return [undefined, text];
}

function _generateTaskId(taskTitle: string, task_id_prefix:string, id?: string): string {
  if (id) {
    // return `${this._structure?.task_id_prefix || 'task-'}${id}`;
    return id;   // title 已经给出 id 了，不需要额外加 prefix
  }

  // 如果没有指定 ID，使用字符串哈希
  return `${task_id_prefix}${_stringHash(taskTitle)}`;
}

/**
 * Parse task text to task object
 */
export function parseTaskText(text: string, task_id_prefix: string): KanbanTask {
  
  const task: KanbanTask = {
    id: '',
    title: text,
    description: '',
    tags: [],
    assignee: []
  };
  /*
  任务示例：
  [=](detail.md)
  [#tag1](tag1.md)
  [#tag2](tag2.md)
  [@user1](user1.md)
   */
  // Find all markdown links: [text](url)
  const linkPattern = /\[(.*?)\]\((.*?)\)/g;
  const links = Array.from(text.matchAll(linkPattern));

  links.forEach(link => {
    const [fullMatch, text, url] = link;
    
    // Process based on link text
    if (text === '=') {
      // Detail file
      task.detailFile = url;
    } else if (text.startsWith('#')) {
      // Tag
      task.tags.push(text.substring(1));
    } else if (text.startsWith('@')) {
      // Assignee
      task.assignee.push({  
        name: text.substring(1),
        profile: url
      });
    }

    // Remove the link from title
    task.title = task.title.replace(fullMatch, '').trim();
  });

  // Split remaining text into title and description
  const lines = task.title.split('\n');
  if (lines[0].startsWith('### ') || lines[0].startsWith('#### ')) {
    task.title = lines[0].replace(/^#{3,4}\s+/, '').trim();
    task.description = lines.slice(1).join('\n').trim();
    if (task.description.length > 50) {
      task.description = task.description.substring(0, 50) + '...';
    }
  }

  const [id, title] = _parseTaskTitle(task.title);
  task.id = _generateTaskId(title, task_id_prefix, id);
  return task;
}

/**
 * Implementation of Kanban.IModel
 */
export class KanbanModel extends DocumentModel implements Kanban.IModel {
  private _docManager: IDocumentManager;
  private _sharedModel: YFile;
  private _changed = new Signal<this, IChangedArgs<string>>(this);
  private _readOnlyChanged = new Signal<this, IChangedArgs<boolean>>(this);
  private _structure: KanbanStructure | null = null;
  private _taskStatusChanged = new Signal<this, ITaskStatusChangeArgs>(this);
  private _taskChanged = new Signal<this, ITaskChangeArgs>(this);
  readonly model_name = 'kanban';

  constructor(options: Kanban.IModelOptions) {
    // Pass all options to parent constructor, including collaborative flag
    super(options);

    this._docManager = options.docManager;
    
    // TODO: 不应该 有 new File 的情况。
    this._sharedModel = options.sharedModel ?? new YFile();
    // Connect to the shared model's changed event
    this._sharedModel.changed.connect(this._onSharedModelChanged, this);
    // 初始化时解析结构
    this._parseStructure();
  }
  
  get docManager(): IDocumentManager {
    return this._docManager;
  }

  get changed(): Signal<this, IChangedArgs<string>> {
    return this._changed;
  }

  get readOnlyChanged(): Signal<this, IChangedArgs<boolean>> {
    return this._readOnlyChanged;
  }

  get structure(): KanbanStructure | null {
    return this._structure;
  }

  get taskStatusChanged(): Signal<this, ITaskStatusChangeArgs> {
    return this._taskStatusChanged;
  }

  get taskChanged(): Signal<this, ITaskChangeArgs> {
    return this._taskChanged;
  }

  override dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // Disconnect the event handler
    this._sharedModel.changed.disconnect(this._onSharedModelChanged, this);
    
    Signal.clearData(this);
    super.dispose();
  }

  /**
   * Get text ranges for specified line numbers
   * @param line_numbers Array of line numbers to get text ranges for
   * @returns Array of text ranges with start and end positions
   */
  public getTextRanges(line_numbers: number[]): { start: number; end: number }[] {
    const content = this._sharedModel.getSource();

    // Create a global regular expression to match the entire line
    const lineRegex = /^(.*)$/gm;
    const matches = [...content.matchAll(lineRegex)];
    
    return line_numbers.map(lineNo => {
      // Ensure line number is valid
      if (lineNo < 0 || lineNo >= matches.length) {
        throw new Error(`Invalid line number: ${lineNo}`);
      }
      
      // Find the match for the specific line number
      const match = matches[lineNo];
      const start = match.index || 0;
      const end = (matches[lineNo + 1]?.index || content.length + 1) - 1;
      
      // Return start and end positions
      return { start, end};
    });
  }

  /**
   * Move a task to a specific category in the list view
   */
  moveTaskToList(task: KanbanTask, toCategory: string, insertAfterTask?: KanbanTask): void {
    const fromColumn = this.findTaskColumn(task);
    if (!fromColumn) {
      console.warn('Task not found in any column:', task);
      return;
    }

    // TODO: Implement the actual text modification logic
    // 1. Remove task from its current location
    // 2. Insert task at the new location
    // 3. Update the model's source

    // Emit the status change signal
    this._taskStatusChanged.emit({
      task,
      fromColumn,
      toColumn: undefined,
      insertAfterTask
    });
  }

  /**
   * Move a task to a specific column in the board view
   */
  moveTaskToColumn(task: KanbanTask, toColumn: KanbanColumn, insertAfterTask?: KanbanTask): void {
    const fromColumn = this.findTaskColumn(task);
    if (!fromColumn) {
      console.warn('Task not found in any column:', task);
      return;
    }

    // TODO: Implement the actual text modification logic
    // 1. Remove task from its current location
    // 2. Insert task at the new location
    // 3. Update the model's source

    // Emit the status change signal
    this._taskStatusChanged.emit({
      task,
      fromColumn,
      toColumn,
      insertAfterTask
    });
  }

  /**
   * Create a new task
   * @param title Optional title for the new task
   * @param toColumn Optional column to add the task to
   * @param insertAfterTask Optional task to insert after
   * @returns The newly created task
   */
  newTask(title?: string, toColumn?: KanbanColumn, insertAfterTask?: KanbanTask): KanbanTask {
    const source = this._sharedModel.getSource();
    this.structure?.lineNo;
    // TODO: 从 this.structure?.lineNo 开始，定位 '\n#' 的位置作为结束，其区域为 TaskList
    // 遍历所有行，找到最后一个非空行
    // 添加 TaskList Item 和 Task 的标题行
    
    const task: KanbanTask = {
      id: 'uuidv4()',
      title: title || 'New Task',
      description: '',
      tags: [],
      assignee: []
    };

    // 如果没有指定目标列，添加到第一个列
    if (!toColumn && this.structure) {
      toColumn = this.structure.sections[0]?.columns[0];
    }

    if (toColumn) {
      // TODO: Implement the actual text modification logic
      // 1. Find the insertion point
      // 2. Insert the task text
      // 3. Update the model's source

      // Emit the status change signal
      this._taskStatusChanged.emit({
        task,
        fromColumn: undefined,
        toColumn,
        insertAfterTask
      });
    }

    return task;
  }

  /**
   * Get next available task ID
   */
  nextTaskId(): string {
    if (!this._structure) {
      return 'task-1';
    }

    const prefix = this._structure.task_id_prefix;
    let maxNum = 0;

    // 遍历所有任务 ID
    this._structure.task_status.forEach((_, id) => {
      // 只处理以指定前缀开头的 ID
      if (id.startsWith(prefix)) {
        const numStr = id.substring(prefix.length);
        // 尝试将后缀转换为数字
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    // 返回下一个可用的 ID
    return `${prefix}${maxNum + 1}`;
  }

  /**
   * Find the column that contains the given task
   */
  private findTaskColumn(task: KanbanTask): KanbanColumn | undefined {
    if (!this.structure) {
      return undefined;
    }

    for (const section of this.structure.sections) {
      for (const column of section.columns) {
        if (column.tasks.some(t => t.id === task.id)) {
          return column;
        }
      }
    }
    return undefined;
  }

  /**
   * 解析文档中的标题结构
   */
  private _parseStructure(): void {
    const content = this._sharedModel.getSource();
    const lines = content.split('\n');
    const headings: KanbanHeading[] = [];
    
    // 解析所有标题
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          lineStart: index
        });
      }
    });

    if (headings.length === 0) {
      this._structure = null;
      return;
    }

    // 构建看板结构
    const structure: KanbanStructure = {
      title: '',
      lineNo: 0,
      sections: [],
      task_id_prefix: 'task-',
      tasks: [],
      task_status: new Map()
    };

    // 第一个一级标题作为看板标题
    const firstH1 = headings.find(h => h.level === 1);
    if (firstH1) {
      structure.title = firstH1.text;
      structure.lineNo = firstH1.lineStart;
      // 解析 title，如果形如 [xxx]some title 或 ［xxx］some title, 则 task_id_prefix 为 xxx
      // 需要支持 全角的 [xxx]
      const match = firstH1.text.match(/^[\[［](.*?)[\]］](.*)/);
      if (match) {
        structure.task_id_prefix = match[1]+'-';
        structure.title = match[2].trim();
      } else {
        structure.task_id_prefix = 'task-';
      }
    }

    // 处理其他一级标题作为分组，其下的二级标题作为列
    let currentSection: KanbanSection | null = null;
    let currentColumn: KanbanColumn | null = null;

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      
      // 跳过第一个一级标题（已作为看板标题）
      if (heading === firstH1) {
        continue;
      }

      if (heading.level === 1) {
        if (currentSection) {
          structure.sections.push(currentSection);
        }
        currentSection = {
          title: heading.text,
          lineNo: heading.lineStart,
          columns: []
        };
        currentColumn = null;
      } else if (heading.level === 2 && currentSection) {
        currentColumn = {
          title: heading.text,
          lineNo: heading.lineStart,
          tasks: []
        };
        currentSection.columns.push(currentColumn);
      } else if (heading.level === 3 || heading.level === 4) {
        // 计算任务文本的范围
        const taskEndLine = headings[i + 1] ? headings[i + 1].lineStart : lines.length;
        const taskText = lines.slice(heading.lineStart, taskEndLine).join('\n');
        
        // 解析任务
        const task = parseTaskText(taskText, structure.task_id_prefix);
        if(currentSection && currentColumn) {
          currentColumn.tasks.push(task);
        } else {
          // 对于已经有 Section 但是还没有 Column 的情况， 也会被追加到 structure.tasks
          // 这个行为不完全符合预期，但是不影响使用。日常结构化编辑器不会出现此情况。
          structure.tasks.push(task);
        }
      }
    }

    // 添加最后一个分组
    if (currentSection) {
      structure.sections.push(currentSection);
    }

    // 处理任务列表，位置在 firstH1 ... sections[0]
    // 构成方式为：
    // - TaskList, 
    //  如果 - [ ] 表示是在 Backlog
    //  如果 - [x] 表示是在 Done
    // ## Tasks
    if (firstH1) {
      // 找到第一个一级标题在数组中的位置
      const firstH1Index = headings.indexOf(firstH1);
      if (firstH1Index >= 0) {
        // 获取下一个标题的起始行，如果没有下一个标题则使用文档末尾
        const nextHeadingStart = firstH1Index < headings.length - 1 
          ? headings[firstH1Index + 1].lineStart 
          : lines.length;
        
        const taskListText = lines.slice(firstH1.lineStart + 1, nextHeadingStart).join('\n');
        // 解析任务列表
        const taskListLines = taskListText.split('\n');
        for (const line of taskListLines) {
          // 匹配任务列表项，支持以下格式
          // - [ ]xxx  - [x]xxx  - []xxx  - [X]xxx  - [　]xxx  - [ｘ]xxx  - [Ｘ]xxx
          const match = line.match(/^-\s*\[([　 ]|[xXｘＸ]|)\]\s*(.+)$/);
          if (match) {
            const isBacklog = !match[1] || match[1] === ' ' || match[1] === '　';
            const taskTitle = match[2].trim();
            
            // 创建任务对象
            const task = this.createTaskObject(taskTitle);
            
            // 设置任务状态，任务状态是所有 Task 的状态，因此 entry 数量会超过该 structure.tasks 的长度
            structure.task_status.set(task.id, isBacklog ? 'BACKLOG' : 'DONE');
            // 添加到任务列表
            // structure.tasks.push(task);
          }  // 如果因为种种原因，match 失败，则状态会默认为 BACKLOG
        }
      }
    }

    this._structure = structure;
  }

  /**
   * Create task object from title
   */
  private createTaskObject(taskTitle: string): KanbanTask {
    const [id, title] = _parseTaskTitle(taskTitle);
    
    return {
      id: _generateTaskId(taskTitle, this._structure?.task_id_prefix || 'task-', id),
      title: title,
      description: '',
      tags: [],
      assignee: []
    };
  }

  /**
   * Handler for shared model changes
   */
  private _onSharedModelChanged(sender: YFile, changes: DocumentChange): void {
    if ((changes as FileChange).sourceChange) {
      // 重新解析结构
      this._parseStructure();
      // 发出变更信号
      this._changed.emit({
        name: 'source',
        oldValue: sender.source,
        newValue: sender.source
      });
      this.dirty = true;
    }
    if (changes.stateChange) {
      changes.stateChange.forEach(value => {
        if (value.name === 'readOnly') {
          this.readOnly = value.newValue;
          this._readOnlyChanged.emit({
            name: 'readOnly',
            oldValue: !value.newValue,
            newValue: value.newValue
          });
        }
      });
    }
  }

  /**
   * Append text to the shared model
   * @param text Text to append
   */
  appendText(text: string): void {
    if (this.readOnly) {
      return;
    }
    const currentSource = this._sharedModel.source;
    const newSource = currentSource + '\n' + text;
    this._sharedModel.setSource(newSource);
    
    // Emit a change signal
    this._changed.emit({
      name: 'source',
      oldValue: currentSource,
      newValue: newSource
    });
  }
}

/**
 * An implementation of a model factory for kanban files.
 */
export class KanbanModelFactory extends TextModelFactory {
  /**
   * The name of the model type.
   *
   * #### Notes
   * This is a read-only property.
   */
  constructor(docManager: IDocumentManager, collaborative?: boolean) {
    super(collaborative);
    this._docManager = docManager;
  }

  get name(): string {
    return 'kanban_model';
  }

  /**
   * The type of the file.
   *
   * #### Notes
   * This is a read-only property.
   */
  get contentType(): Contents.ContentType {
    return 'file';
  }

  /**
   * The format of the file.
   *
   * This is a read-only property.
   */
  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  /**
   * Create a new model.
   *
   * @param options - Model options.
   *
   * @returns A new document model.
   */
  createNew(options: DocumentRegistry.IModelOptions<YFile> = {}): DocumentRegistry.ICodeModel {
    return new KanbanModel({
      ...options,
      docManager: this._docManager
    });
  }

  private _docManager: IDocumentManager
}
