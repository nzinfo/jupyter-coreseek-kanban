import { Widget } from '@lumino/widgets';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { Message } from '@lumino/messaging';
import { KanbanModel, ITask, TaskStatus } from './model';
import { MarkdownSerializer } from './markdown';

export class KanbanWidget extends Widget {
  constructor() {
    super();
    this.addClass('jp-KanbanWidget');
    this._model = new KanbanModel();
    
    // Create the main container
    this.node.innerHTML = `
      <div class="jp-Kanban-board">
        <div class="jp-Kanban-column" data-status="backlog">
          <h2>Backlog</h2>
          <div class="jp-Kanban-tasks"></div>
        </div>
        <div class="jp-Kanban-column" data-status="todo">
          <h2>Todo</h2>
          <div class="jp-Kanban-tasks"></div>
        </div>
        <div class="jp-Kanban-column" data-status="doing">
          <h2>Doing</h2>
          <div class="jp-Kanban-tasks"></div>
        </div>
        <div class="jp-Kanban-column" data-status="review">
          <h2>Review</h2>
          <div class="jp-Kanban-tasks"></div>
        </div>
        <div class="jp-Kanban-column" data-status="done">
          <h2>Done</h2>
          <div class="jp-Kanban-tasks"></div>
        </div>
      </div>
    `;

    this._setupEventListeners();
  }

  get model(): KanbanModel {
    return this._model;
  }

  protected onAfterShow(msg: Message): void {
    this.update();
  }

  protected onUpdateRequest(msg: Message): void {
    this._renderTasks();
  }

  private _setupEventListeners(): void {
    // Listen for task changes
    this._model.taskChanged.connect((_, task) => {
      this.update();
    });

    // Setup drag and drop
    this.node.addEventListener('dragstart', this._handleDragStart.bind(this));
    this.node.addEventListener('dragover', this._handleDragOver.bind(this));
    this.node.addEventListener('drop', this._handleDrop.bind(this));
    this.node.addEventListener('dragend', this._handleDragEnd.bind(this));
  }

  private _renderTasks(): void {
    const columns = this.node.querySelectorAll('.jp-Kanban-column');
    columns.forEach(column => {
      const status = column.getAttribute('data-status') as TaskStatus;
      const tasksContainer = column.querySelector('.jp-Kanban-tasks');
      if (tasksContainer) {
        tasksContainer.innerHTML = '';
        
        const tasks = this._model.getTasksByStatus(status);
        tasks.forEach(task => {
          const taskElement = this._createTaskElement(task);
          tasksContainer.appendChild(taskElement);
        });
      }
    });
  }

  private _createTaskElement(task: ITask): HTMLElement {
    const element = document.createElement('div');
    element.className = 'jp-Kanban-task';
    element.setAttribute('data-task-id', task.id);
    element.draggable = true;

    element.innerHTML = `
      <div class="jp-Kanban-task-title">${task.title}</div>
      <div class="jp-Kanban-task-description">${task.description}</div>
    `;

    return element;
  }

  private _handleDragStart(event: DragEvent): void {
    const taskElement = (event.target as HTMLElement).closest('.jp-Kanban-task');
    if (taskElement) {
      taskElement.classList.add('is-dragging');
      event.dataTransfer?.setData('text/plain', taskElement.getAttribute('data-task-id') || '');
    }
  }

  private _handleDragOver(event: DragEvent): void {
    event.preventDefault();
    const column = (event.target as HTMLElement).closest('.jp-Kanban-column');
    if (column) {
      column.classList.add('drag-over');
    }
  }

  private _handleDrop(event: DragEvent): void {
    event.preventDefault();
    const column = (event.target as HTMLElement).closest('.jp-Kanban-column');
    if (column) {
      const taskId = event.dataTransfer?.getData('text/plain');
      const newStatus = column.getAttribute('data-status') as TaskStatus;
      
      if (taskId && newStatus) {
        this._model.setTaskStatus(taskId, newStatus);
      }
      
      column.classList.remove('drag-over');
    }
  }

  private _handleDragEnd(event: DragEvent): void {
    const taskElement = (event.target as HTMLElement).closest('.jp-Kanban-task');
    if (taskElement) {
      taskElement.classList.remove('is-dragging');
    }
    
    this.node.querySelectorAll('.jp-Kanban-column').forEach(column => {
      column.classList.remove('drag-over');
    });
  }

  private _model: KanbanModel;
}

export class KanbanDocWidget extends DocumentWidget<KanbanWidget, DocumentRegistry.IModel> {
  constructor(options: DocumentWidget.IOptions<KanbanWidget, DocumentRegistry.IModel>) {
    super(options);

    // Listen for model changes
    this.content.model.taskChanged.connect(() => {
      this._saveToFile();
    });

    // Load initial content
    this._loadFromFile();
  }

  private async _loadFromFile(): Promise<void> {
    await this.context.ready;
    const text = this.context.model.toString();
    const tasks = MarkdownSerializer.deserialize(text);
    
    tasks.forEach(task => {
      this.content.model.addTask(task);
    });
  }

  private _saveToFile(): void {
    const tasks = this.content.model.tasks;
    const markdown = MarkdownSerializer.serialize(tasks);
    this.context.model.setValue(markdown);
  }
}
