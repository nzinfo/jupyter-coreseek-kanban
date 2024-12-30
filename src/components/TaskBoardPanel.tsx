import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  FilterBox,
  PanelWithToolbar,
  ReactWidget,
  addIcon,
  SidePanel,
  ToolbarButton,
  ToolbarButtonComponent,
  caretUpEmptyThinIcon,
  caretDownEmptyThinIcon,
  caretLeftIcon,
  caretRightIcon
} from '@jupyterlab/ui-components';
import { TaskColumn } from './TaskListPanel';
import { Panel } from '@lumino/widgets';
import { KanbanLayout } from './KanbanLayout';

/**
 * Task board header component
 */
class TaskBoardHeader extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskBoard-header');
    this._tasklistVisible = true;
  }

  render(): JSX.Element {
    return (
      <>
        <FilterBox
          placeholder={this.trans.__('Search tasks...')}
          updateFilter={() => {}}
          useFuzzyFilter={false}
          caseSensitive={false}
          disabled={false}
        />
        <h2>{this.trans.__('Task Board')}</h2>
        <div className="jp-TaskBoard-headerButtons">
          <ToolbarButtonComponent
            icon={this._tasklistVisible ? caretRightIcon : caretLeftIcon}
            onClick={() => {
              this._tasklistVisible = !this._tasklistVisible;
              if (this._onTasklistToggle) {
                this._onTasklistToggle(this._tasklistVisible);
              }
              this.update();
            }}
            tooltip={this._tasklistVisible ? this.trans.__('Hide task list') : this.trans.__('Show task list')}
          />
        </div>
      </>
    );
  }

  /**
   * Set the callback for tasklist visibility toggle
   */
  setTasklistToggleCallback(callback: (visible: boolean) => void): void {
    this._onTasklistToggle = callback;
  }

  private _tasklistVisible: boolean;
  private _onTasklistToggle: ((visible: boolean) => void) | null = null;
}

/**
 * Task board content component
 */
class TaskBoardContent extends Panel {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskBoard-content');
    
    // Create columns container
    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'jp-TaskBoard-columns';
    this.node.appendChild(columnsContainer);

    // Create columns
    const columns = ['Todo', 'Doing', 'Review', 'Done'];
    columns.forEach(columnName => {
      // Create column container
      const columnContainer = document.createElement('div');
      columnContainer.className = 'jp-TaskBoard-column';

      // Create column header
      const header = document.createElement('div');
      header.className = 'jp-TaskBoard-columnHeader';
      const title = document.createElement('h3');
      title.textContent = this.trans.__(columnName);
      header.appendChild(title);
      columnContainer.appendChild(header);

      // Create TaskColumn
      const column = new TaskColumn(this.trans);
      columnContainer.appendChild(column.node);

      // Add column to container
      columnsContainer.appendChild(columnContainer);
    });
  }
}

/**
 * The main panel for displaying the task board
 */
export class TaskBoardPanel extends SidePanel {
  constructor(options: TaskBoardPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    this.addClass('jp-TaskBoard-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add header
    const header = new TaskBoardHeader(this.trans);
    header.setTasklistToggleCallback((visible) => {
      const parent = this.parent;
      if (parent && parent instanceof KanbanLayout) {
        parent.toggleTaskList(visible);
      }
    });
    this.header.addWidget(header);

    // Add main content panel with toolbar
    const contentPanel = new PanelWithToolbar();
    contentPanel.addClass('jp-TaskBoard-section');
    contentPanel.title.label = 'main';

    // Add move up/down and new task buttons to toolbar
    contentPanel.toolbar.addItem(
      'moveUp',
      new ToolbarButton({
        icon: caretUpEmptyThinIcon,
        onClick: () => {
          console.log('Move up clicked');
        },
        tooltip: this.trans.__('Move up')
      })
    );

    contentPanel.toolbar.addItem(
      'moveDown',
      new ToolbarButton({
        icon: caretDownEmptyThinIcon,
        onClick: () => {
          console.log('Move down clicked');
        },
        tooltip: this.trans.__('Move down')
      })
    );

    contentPanel.toolbar.addItem(
      'newStage',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          console.log('Add new stage clicked');
        },
        tooltip: this.trans.__('Add new stage')
      })
    );

    // Add task board content
    contentPanel.addWidget(new TaskBoardContent(this.trans));
    this.addWidget(contentPanel);
  }

  protected trans: TranslationBundle;
}

/**
 * A namespace for TaskBoardPanel statics.
 */
export namespace TaskBoardPanel {
  /**
   * The options used to create a TaskBoardPanel.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator: ITranslator;
  }
}
