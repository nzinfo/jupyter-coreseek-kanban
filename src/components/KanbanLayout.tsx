// import { ReactWidget } from '@jupyterlab/ui-components';
import { SplitPanel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { IEditorServices } from '@jupyterlab/codeeditor';
// import React from 'react';
import { TaskListPanel, TaskCategory } from './TaskListPanel';
import { TaskBoardPanel } from './TaskBoardPanel';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { KanbanTask, KanbanColumn } from '../model';

/**
 * The main layout for the Kanban board.
 */
export class KanbanLayout extends SplitPanel {
  constructor(options: KanbanLayout.IOptions) {
    super({
      orientation: 'horizontal',
      renderer: SplitPanel.defaultRenderer,
      spacing: 1
    });

    this._translator = options.translator || nullTranslator;
    
    // Create left panel widget
    this._tasklistWidget = new TaskListPanel({ 
      context: options.context,
      translator: this._translator,
    });
    this._tasklistWidget.addClass('jp-KanbanLayout-right');
    
    // Register task moved callback for list view
    this._tasklistWidget.setTaskMovedCallback((task, toCategory, insertAfterTask) => {
      this.handleTaskMovedInList(task, toCategory, insertAfterTask);
    });
    
    // Create right panel widget
    this._boardWidget = new TaskBoardPanel({ 
      context: options.context,
      translator: this._translator,
      editorServices: options.editorServices,
      // model: options.model
    });
    this._boardWidget.addClass('jp-KanbanLayout-left');
    
    // Register task moved callback for board view
    this._boardWidget.setTaskMovedCallback((task, toColumn, insertAfterTask) => {
      this.handleTaskMovedInBoard(task, toColumn, insertAfterTask);
    });
    
    // Add widgets to the split panel
    this.addWidget(this._boardWidget);
    this.addWidget(this._tasklistWidget);
    
    // Set the relative sizes of the panels (30% left, 70% right)
    this.setRelativeSizes([0.9, 0.1]);
    
    this.id = 'jp-kanban-layout';
    this.addClass('jp-KanbanLayout');
  }

  /**
   * Toggle the visibility of the task list panel
   */
  toggleTaskList(visible?: boolean): void {
    if (visible === undefined) {
      visible = !this._tasklistWidget.isVisible;
    }
    
    this._tasklistWidget.setHidden(!visible);
    
    // Adjust the relative sizes
    if (visible) {
      this.setRelativeSizes([0.9, 0.1]);
    } else {
      this.setRelativeSizes([1, 0]);
    }
  }

  /**
   * Get the task board panel
   */
  get boardWidget(): TaskBoardPanel {
    return this._boardWidget;
  }

  /**
   * Handle `'after-attach'` messages.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  /**
   * Handle `'update-request'` messages.
   */
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
  }

  /**
   * Handle task moved in list view
   */
  handleTaskMovedInList(task: KanbanTask, toCategory: TaskCategory, insertAfterTask?: KanbanTask): void {
    // 在列表视图中移动任务
    if (this._tasklistWidget) {
      // TODO: 实现列表视图的任务移动逻辑
      console.log('Task moved in list view:', task, toCategory, insertAfterTask);
    }
  }

  /**
   * Handle task moved in board view
   */
  handleTaskMovedInBoard(task: KanbanTask, toColumn?: KanbanColumn, insertAfterTask?: KanbanTask): void {
    // 在看板视图中移动任务
    if (this._boardWidget) {
      // TODO: 实现看板视图的任务移动逻辑
      console.log('Task moved in board view:', task, toColumn, insertAfterTask);
    }
  }

  protected readonly _translator: ITranslator;
  private _tasklistWidget: TaskListPanel;
  private _boardWidget: TaskBoardPanel;
}

/**
 * A namespace for KanbanLayout statics.
 */
export namespace KanbanLayout {
  /**
   * The options used to create a KanbanLayout.
   */
  export interface IOptions {
    context: DocumentRegistry.Context;
    /**
     * The application language translator.
     */
    translator?: ITranslator;

    /**
     * The editor services.
     */
    editorServices: IEditorServices;

    /**
     * The document model.
     */
    //model: DocumentRegistry.IModel;
  }
}
