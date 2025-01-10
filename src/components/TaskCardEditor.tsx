import { PanelWithToolbar } from '@jupyterlab/ui-components';
import { Widget, Panel } from '@lumino/widgets';
import { KanbanTask } from '../model';
import { Signal } from '@lumino/signaling';
// import { IEditorServices } from '@jupyterlab/codeeditor';

interface ITaskCardEditorOptions {
  task: KanbanTask;
  editorServices?: any; // TODO: 添加正确的类型
}

/**
 * Task card editor component for editing task details
 */
export class TaskCardEditor extends Panel {
  constructor(options: ITaskCardEditorOptions) {
    super();
    this._task = options.task;
    // this._editorServices = options.editorServices;

    this.addClass('jp-TaskCardEditor-overlay');
    
    // 创建主容器
    this._container = new Panel();
    this._container.addClass('jp-TaskCardEditor-container');
    
    // 创建任务基本信息面板
    this._taskPanel = new PanelWithToolbar();
    this._taskPanel.title.label = 'Task';
    this._taskPanel.addClass('jp-TaskCardEditor-panel');
    
    const taskContent = new Panel();
    taskContent.addClass('jp-TaskCardEditor-content');
    
    // 任务名称输入
    const titleContainer = new Panel();
    titleContainer.addClass('jp-TaskCardEditor-field');
    const titleLabel = new Widget({ node: document.createElement('label') });
    titleLabel.node.textContent = 'Title';
    const titleInput = new Widget({ node: document.createElement('input') as HTMLInputElement });
    titleInput.node.className = 'jp-TaskCardEditor-input';
    (titleInput.node as HTMLInputElement).value = this._task.title;
    titleContainer.addWidget(titleLabel);
    titleContainer.addWidget(titleInput);
    
    // 任务摘要输入
    const summaryContainer = new Panel();
    summaryContainer.addClass('jp-TaskCardEditor-field');
    const summaryLabel = new Widget({ node: document.createElement('label') });
    summaryLabel.node.textContent = 'Summary';
    const summaryInput = new Widget({ node: document.createElement('textarea') as HTMLTextAreaElement });
    summaryInput.node.className = 'jp-TaskCardEditor-textarea';
    (summaryInput.node as HTMLTextAreaElement).value = this._task.description;
    summaryContainer.addWidget(summaryLabel);
    summaryContainer.addWidget(summaryInput);
    
    // 任务标签
    const tagsContainer = new Panel();
    tagsContainer.addClass('jp-TaskCardEditor-field');
    const tagsLabel = new Widget({ node: document.createElement('label') });
    tagsLabel.node.textContent = 'Tags';
    const tagsPanel = new Panel();
    tagsPanel.addClass('jp-CellTags');
    this._task.tags.forEach(tag => {
      const tagWidget = this._createTagWidget(tag);
      tagsPanel.addWidget(tagWidget);
    });
    // 添加新标签按钮
    const addTagButton = new Widget({ node: document.createElement('button') });
    addTagButton.addClass('jp-TaskCardEditor-addTag');
    addTagButton.node.textContent = '+ Add Tag';
    addTagButton.node.onclick = () => {
      // TODO: 实现添加标签的逻辑
    };
    tagsContainer.addWidget(tagsLabel);
    tagsContainer.addWidget(tagsPanel);
    tagsContainer.addWidget(addTagButton);
    
    // 任务分配
    const assigneeContainer = new Panel();
    assigneeContainer.addClass('jp-TaskCardEditor-field');
    const assigneeLabel = new Widget({ node: document.createElement('label') });
    assigneeLabel.node.textContent = 'Assignee';
    const assigneeWidget = this._createAssigneeWidget();
    assigneeContainer.addWidget(assigneeLabel);
    assigneeContainer.addWidget(assigneeWidget);
    
    // 添加所有字段到任务内容面板
    taskContent.addWidget(titleContainer);
    taskContent.addWidget(summaryContainer);
    taskContent.addWidget(tagsContainer);
    taskContent.addWidget(assigneeContainer);
    
    this._taskPanel.addWidget(taskContent);
    
    // 创建任务详情面板（默认收起）
    this._detailPanel = new PanelWithToolbar();
    this._detailPanel.title.label = 'Detail';
    this._detailPanel.addClass('jp-TaskCardEditor-panel');
    this._detailPanel.hide();
    
    // 添加面板到容器
    this._container.addWidget(this._taskPanel);
    this._container.addWidget(this._detailPanel);
    
    // 添加容器到主面板
    this.addWidget(this._container);
    
    // 添加点击事件处理
    this.node.addEventListener('click', (event: MouseEvent) => {
      if (event.target === this.node) {
        this.dispose();
      }
    });
  }

  private _createTagWidget(tag: string): Widget {
    const widget = new Widget({ node: document.createElement('div') });
    widget.addClass('jp-CellTag');
    const label = document.createElement('span');
    label.className = 'jp-CellTag-label';
    label.textContent = tag;
    widget.node.appendChild(label);
    return widget;
  }

  private _createAssigneeWidget(): Widget {
    const widget = new Widget({ node: document.createElement('div') });
    widget.addClass('jp-TaskCard-avatar');
    if (this._task.assignee && this._task.assignee.length > 0) {
      widget.node.textContent = this._task.assignee[0].name.charAt(0);
      widget.node.title = this._task.assignee[0].name;
    }
    return widget;
  }

  /**
   * Signal emitted when the task is updated
   */
  get taskChanged(): Signal<this, KanbanTask> {
    return this._taskChanged;
  }

  get container(): Panel {
    return this._container;
  }

  private _task: KanbanTask;
  // private _editorServices: IEditorServices;
  private _container: Panel;
  private _taskPanel: PanelWithToolbar;
  private _detailPanel: PanelWithToolbar;
  private _taskChanged = new Signal<this, KanbanTask>(this);
}
