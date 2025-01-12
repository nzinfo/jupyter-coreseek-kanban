import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  SidePanel,
  ToolbarButton,
  addIcon,
  tocIcon
} from '@jupyterlab/ui-components';
import { TaskColumn } from './TaskColumn';
import { KanbanOptionsPanel } from './KanbanOptionsPanel';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { KanbanModel, KanbanTask } from '../model';

/**
 * Task category enum for list view
 */
export enum TaskCategory {
  BACKLOG = 'BACKLOG',
  DONE = 'DONE'
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

    // 保存模型引用
    this._model = options.context.model as KanbanModel;

    // Create the options panel with toolbar
    const optionsPanel = new PanelWithToolbar();
    optionsPanel.addClass('jp-TaskList-section');
    optionsPanel.title.label = this.trans.__('Kanban Settings');
    // Add new task button to toolbar
    optionsPanel.toolbar.addItem(
      'newSection',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          this._optionsWidget.addNewSection();
        },
        tooltip: this.trans.__('Add new section')
      })
    );
    this._optionsWidget = new KanbanOptionsPanel({
      trans: this.trans,
      model: options.context.model as KanbanModel
    });
    optionsPanel.addWidget(this._optionsWidget);
    this._optionsPanel = optionsPanel;

    // Add Backlog panel with example tasks
    const backlogPanel = new PanelWithToolbar();
    backlogPanel.addClass('jp-TaskList-section');
    backlogPanel.title.label = this.trans.__('Backlog');
    
    // Create more options button with toggle state
    const moreOptionsButton = new ToolbarButton({
      icon: tocIcon,
      onClick: () => {
        this._toggleOptionsPanel();
      },
      tooltip: this.trans.__('More Options'),
      pressed: false
    });
    this._moreOptionsButton = moreOptionsButton;
    
    backlogPanel.toolbar.addItem('moreOptions', moreOptionsButton);

    // Add new task button to toolbar
    backlogPanel.toolbar.addItem(
      'newTask',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          console.log('Add new task clicked');
        },
        tooltip: this.trans.__('Add new task')
      })
    );
    
    // Create backlog column
    this._backlogColumn = new TaskColumn(this.trans, {
      title: 'Backlog',
      lineNo: 0,
      tasks: []
    });
    this._backlogColumn.setTaskMovedCallback((task, targetColumn, insertTask) => {
      if (this._onTaskMoved) {
        this._onTaskMoved(task, TaskCategory.BACKLOG, insertTask);
      }
    });

    backlogPanel.addWidget(this._backlogColumn);
    this._backlogPanel = backlogPanel;

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = this.trans.__('Done');
    
    this._doneColumn = new TaskColumn(this.trans, {
      title: 'Done',
      lineNo: 0,
      tasks: []
    });
    this._doneColumn.setTaskMovedCallback((task, targetColumn, insertTask) => {
      if (this._onTaskMoved) {
        this._onTaskMoved(task, TaskCategory.DONE, insertTask);
      }
    });

    donePanel.addWidget(this._doneColumn);
    this._donePanel = donePanel;

    // Add panels to the widget
    this.addWidget(backlogPanel);
    this.addWidget(donePanel);

    // 监听模型变化
    this._model.changed.connect(() => {
      this._updateTaskLists();
    });

    // 初始化任务列表
    this._updateTaskLists();
  }

  /**
   * Update task lists based on model structure
   */
  private _updateTaskLists(): void {
    if (!this._model.structure) {
      return;
    }

    const backlogTasks: KanbanTask[] = [];
    const doneTasks: KanbanTask[] = [];

    // 根据任务状态分配到不同列表
    this._model.structure.tasks.forEach(task => {
      const status = this._model.structure?.task_status.get(task.id);
      if (status === 'DONE') {
        doneTasks.push(task);
      } else {
        backlogTasks.push(task);
      }
    });

    // 更新列的任务
    this._backlogColumn.setColumn({
      title: 'Backlog',
      lineNo: -1,
      tasks: backlogTasks
    });

    this._doneColumn.setColumn({
      title: 'Done',
      lineNo: -1,
      tasks: doneTasks
    });
  }

  private _toggleOptionsPanel(): void {
    if (!this._optionsPanel.isAttached) {
      // Store panels' collapsed state
      this._backlogPanelExpanded = !this._backlogPanel.hasClass('jp-mod-collapsed');
      this._donePanelExpanded = !this._donePanel.hasClass('jp-mod-collapsed');

      // Collapse panels
      this._backlogPanel.addClass('jp-mod-collapsed');
      this._donePanel.addClass('jp-mod-collapsed');
      this._backlogPanel.node.setAttribute('aria-expanded', 'false');
      this._donePanel.node.setAttribute('aria-expanded', 'false');
      this._backlogPanel.hide();
      this._donePanel.hide();

      // Disable panels
      this._backlogPanel.addClass('jp-mod-disabled');
      this._donePanel.addClass('jp-mod-disabled');

      // Show options panel
      this.addWidget(this._optionsPanel);
      this._moreOptionsButton.pressed = true;
    } else {
      this._hideOptionsPanel();
    }
  }

  private _hideOptionsPanel(): void {
    if (this._optionsPanel.isAttached) {
      // Remove options panel
      this._optionsPanel.parent = null;
      this._moreOptionsButton.pressed = false;

      // Enable panels
      this._backlogPanel.removeClass('jp-mod-disabled');
      this._donePanel.removeClass('jp-mod-disabled');

      // Restore panels' previous state
      if (this._backlogPanelExpanded) {
        this._backlogPanel.removeClass('jp-mod-collapsed');
        this._backlogPanel.node.setAttribute('aria-expanded', 'true');
        this._backlogPanel.show();
      }
      if (this._donePanelExpanded) {
        this._donePanel.removeClass('jp-mod-collapsed');
        this._donePanel.node.setAttribute('aria-expanded', 'true');
        this._donePanel.show();
      }
    }
  }

  /**
   * Set callback for task moved event
   */
  setTaskMovedCallback(callback: (task: KanbanTask, toCategory: TaskCategory, insertAfterTask?: KanbanTask) => void): void {
    this._onTaskMoved = callback;
  }

  protected trans: TranslationBundle;
  private _backlogColumn: TaskColumn;
  private _doneColumn: TaskColumn;
  private _optionsWidget: KanbanOptionsPanel;
  private _optionsPanel: PanelWithToolbar;
  private _backlogPanel: PanelWithToolbar;
  private _donePanel: PanelWithToolbar;
  private _moreOptionsButton: ToolbarButton;
  private _backlogPanelExpanded: boolean = true;
  private _donePanelExpanded: boolean = true;
  private _onTaskMoved: ((task: KanbanTask, toCategory: TaskCategory, insertAfterTask?: KanbanTask) => void) | null = null;
  private _model: KanbanModel;
}

/**
 * A namespace for TaskListPanel statics.
 */
export namespace TaskListPanel {
  /**
   * The options used to create a TaskListPanel.
   */
  export interface IOptions {
    context: DocumentRegistry.Context;
    translator: ITranslator;
  }
}
