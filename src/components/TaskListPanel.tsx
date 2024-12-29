import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  // ReactWidget,
  // refreshIcon,
  SidePanel,
  // ToolbarButton
} from '@jupyterlab/ui-components';
import { Panel } from '@lumino/widgets';
import { Drag } from '@lumino/dragdrop';
import { TaskCard } from './TaskCard';

/**
 * Task column component showing tasks in a specific status
 */
export class TaskColumn extends Panel {
  constructor(trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskColumn');

    // 启用拖放
    this.node.addEventListener('lm-dragenter', this);
    this.node.addEventListener('lm-dragleave', this);
    this.node.addEventListener('lm-dragover', this);
    this.node.addEventListener('lm-drop', this);

    // 示例数据
    const tasks = [
      {
        title: '实现看板功能',
        summary: '在 Jupyter 中实现类似 Trello 的看板功能',
        tags: [
          { name: '开发中', color: '#61BD4F' },
          { name: '前端', color: '#FF78CB' }
        ],
        assignee: {
          name: '张',
          avatarUrl: ''
        }
      }
    ];

    // 添加任务卡片
    tasks.forEach(task => {
      const taskCard = new TaskCard(task);
      this.addWidget(taskCard);
    });
  }

  /**
   * Handle the DOM events for the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'lm-dragenter':
        this.handleDragEnter(event as Drag.Event);
        break;
      case 'lm-dragleave':
        this.handleDragLeave(event as Drag.Event);
        break;
      case 'lm-dragover':
        this.handleDragOver(event as Drag.Event);
        break;
      case 'lm-drop':
        this.handleDrop(event as Drag.Event);
        break;
    }
  }

  private handleDragEnter(event: Drag.Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.addClass('jp-mod-dropTarget');
  }

  private handleDragLeave(event: Drag.Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('jp-mod-dropTarget');
  }

  private handleDragOver(event: Drag.Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = 'move';
  }

  private handleDrop(event: Drag.Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('jp-mod-dropTarget');

    if (event.source instanceof TaskCard) {
      const source = event.source;
      source.detach();
      this.addWidget(source);
    }
  }
}

/**
 * The main panel for displaying tasks
 */
export class TaskListPanel extends SidePanel {
  constructor(options: TaskListPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    this.addClass('jp-TaskList-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add Backlog panel
    const backlogPanel = new PanelWithToolbar();
    backlogPanel.addClass('jp-TaskList-section');
    backlogPanel.title.label = this.trans.__('Backlog');
    backlogPanel.addWidget(new TaskColumn(this.trans));
    this.addWidget(backlogPanel);

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = this.trans.__('Done');
    donePanel.addWidget(new TaskColumn(this.trans));
    this.addWidget(donePanel);
  }

  protected trans: TranslationBundle;
}

/**
 * A namespace for TaskListPanel statics.
 */
export namespace TaskListPanel {
  /**
   * The options used to create a TaskListPanel.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator: ITranslator;
  }
}
