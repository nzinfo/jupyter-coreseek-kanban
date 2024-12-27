import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  FilterBox,
  PanelWithToolbar,
  ReactWidget,
  refreshIcon,
  SidePanel,
  ToolbarButton
} from '@jupyterlab/ui-components';

/**
 * Search header component for the task list
 */
class TaskListHeader extends ReactWidget {
  constructor(
    protected trans: TranslationBundle,
    protected searchInputRef: React.RefObject<HTMLInputElement>
  ) {
    super();
    this.addClass('jp-TaskList-header');
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskList-header">
        <FilterBox
          placeholder={this.trans.__('Search tasks...')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (this.searchInputRef.current) {
              this.searchInputRef.current.value = e.target.value;
            }
          }}
          disabled={false}
        />
      </div>
    );
  }
}

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
    
    this._searchInputRef = React.createRef<HTMLInputElement>();
    this.addClass('jp-TaskList-panel');

    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add header with search
    this.header.addWidget(new TaskListHeader(this.trans, this._searchInputRef));

    // Add task list panel with toolbar
    const taskListPanel = new PanelWithToolbar();
    taskListPanel.addClass('jp-TaskList-section');
    taskListPanel.title.label = this.trans.__('Tasks');

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

    // Add task list widget
    taskListPanel.addWidget(new TaskList(this.trans));

    this.addWidget(taskListPanel);
  }

  private readonly _searchInputRef: React.RefObject<HTMLInputElement>;
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
