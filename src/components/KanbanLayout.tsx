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
    const leftWidget = new TaskListPanel({ translator: this._translator });
    leftWidget.addClass('jp-KanbanLayout-left');
    
    // Create right panel widget
    const rightWidget = new TaskBoardPanel({ translator: this._translator });
    rightWidget.addClass('jp-KanbanLayout-right');
    
    // Add widgets to the split panel
    this.addWidget(leftWidget);
    this.addWidget(rightWidget);
    
    // Set the relative sizes of the panels (30% left, 70% right)
    this.setRelativeSizes([0.3, 0.7]);
    
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
