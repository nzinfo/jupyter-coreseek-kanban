// import { ReactWidget } from '@jupyterlab/ui-components';
import { SplitPanel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
// import React from 'react';
import { TaskListPanel } from './TaskListPanel';
import { TaskBoardPanel } from './TaskBoardPanel';

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
    const tasklistWidget = new TaskListPanel({ translator: this._translator });
    tasklistWidget.addClass('jp-KanbanLayout-right');
    
    // Create right panel widget
    const boardWidget = new TaskBoardPanel({ translator: this._translator });
    boardWidget.addClass('jp-KanbanLayout-left');
    
    // Add widgets to the split panel
    this.addWidget(boardWidget);
    this.addWidget(tasklistWidget);
    
    // Set the relative sizes of the panels (30% left, 70% right)
    this.setRelativeSizes([0.8, 0.2]);
    
    this.id = 'jp-kanban-layout';
    this.addClass('jp-KanbanLayout');
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

  protected readonly _translator: ITranslator;
}

/**
 * A namespace for KanbanLayout statics.
 */
export namespace KanbanLayout {
  /**
   * The options used to create a KanbanLayout.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator?: ITranslator;
  }
}
