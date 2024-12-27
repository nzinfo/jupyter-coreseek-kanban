import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  ReactWidget,
  // refreshIcon,
  SidePanel,
  // ToolbarButton
} from '@jupyterlab/ui-components';

/**
 * Task list component showing all tasks
 */
class TaskList extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskList-content">
        <ul className="jp-TaskList-list">
          {/* This will be populated with actual tasks */}
          <li className="jp-TaskList-item">Sample Task 1</li>
          <li className="jp-TaskList-item">Sample Task 2</li>
        </ul>
      </div>
    );
  }
}

/**
 * The main panel for displaying tasks
 */
export class TaskListPanel extends SidePanel {
  constructor(options: TaskListPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    // this._searchInputRef = React.createRef<HTMLInputElement>();
    this.addClass('jp-TaskList-panel');

    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add Backlog panel
    const backlogPanel = new PanelWithToolbar();
    backlogPanel.addClass('jp-TaskList-section');
    backlogPanel.title.label = this.trans.__('Backlog');
    backlogPanel.addWidget(new TaskList(this.trans));
    this.addWidget(backlogPanel);

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = this.trans.__('Done');
    donePanel.addWidget(new TaskList(this.trans));
    this.addWidget(donePanel);

    // Add Recycle panel
    /* // 暂不删除，单独的回收站 还是直接在 item 中删除， 待考虑
    const recyclePanel = new PanelWithToolbar();
    recyclePanel.addClass('jp-TaskList-section');
    recyclePanel.title.label = this.trans.__('Recycle');
    recyclePanel.addWidget(new TaskList(this.trans));
    this.addWidget(recyclePanel);
    */

    /* 不要删除，保留参考
    // Add refresh button to toolbar
    taskListPanel.toolbar.addItem(
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        onClick: () => {
          // TODO: Implement refresh functionality
          console.log('Refreshing task list...');
        },
        tooltip: this.trans.__('Refresh task list')
      })
    );
    */
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
