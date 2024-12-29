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
  numberingIcon,
  caretLeftIcon,
  caretRightIcon
} from '@jupyterlab/ui-components';
import { TaskColumn } from './TaskListPanel';
import { Panel } from '@lumino/widgets';

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
            icon={numberingIcon}
            onClick={() => {
              console.log('More options clicked');
            }}
            tooltip={this.trans.__('More options')}
          />
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
    this._columns = new Map();
    
    // Enable drag and drop
    this.node.addEventListener('dragenter', this);
    this.node.addEventListener('dragleave', this);
    this.node.addEventListener('dragover', this);
    this.node.addEventListener('drop', this);

    // Create columns
    const columns = ['Todo', 'Doing', 'Review', 'Done'];
    columns.forEach(columnName => {
      const column = new TaskColumn(this.trans);
      column.addClass('jp-TaskBoard-column');
      this._columns.set(columnName, column);
      this.addWidget(column);
    });
  }

  /**
   * Handle the DOM events for the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dragenter':
        this.handleDragEnter(event as DragEvent);
        break;
      case 'dragleave':
        this.handleDragLeave(event as DragEvent);
        break;
      case 'dragover':
        this.handleDragOver(event as DragEvent);
        break;
      case 'drop':
        this.handleDrop(event as DragEvent);
        break;
    }
  }

  private handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.addClass('jp-mod-dropTarget');
  }

  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!this.node.contains(relatedTarget)) {
      this.removeClass('jp-mod-dropTarget');
    }
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('jp-mod-dropTarget');
  }

  dispose(): void {
    this._columns.forEach(column => {
      if (column.parent) {
        Panel.detach(column);
      }
      column.dispose();
    });
    this._columns.clear();
    super.dispose();
  }

  private _columns: Map<string, TaskColumn>;
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
      console.log('Tasklist visibility toggled:', visible);
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
      'newTask',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          console.log('Add new task clicked');
        },
        tooltip: this.trans.__('Add new task')
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
