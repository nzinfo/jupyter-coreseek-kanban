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
import { TaskCard, ITaskData, MIME_TYPE } from './TaskCard';
import { Panel } from '@lumino/widgets';
import { Drag } from '@lumino/dragdrop';

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
class TaskBoardContent extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this._setupDropZone = this._setupDropZone.bind(this);
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskBoard-content">
        <div className="jp-TaskBoard-columns">
          <div className="jp-TaskBoard-column" data-status="todo" ref={this._setupDropZone}>
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Todo')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Todo tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column" data-status="doing" ref={this._setupDropZone}>
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Doing')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Doing tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column" data-status="review" ref={this._setupDropZone}>
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Review')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Review tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column" data-status="done" ref={this._setupDropZone}>
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Done')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Done tasks will go here */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private _setupDropZone(element: HTMLElement | null): void {
    if (!element) return;

    const columnContent = element.querySelector('.jp-TaskBoard-columnContent') as HTMLElement;
    if (!columnContent) return;

    // Handle Lumino drag events
    element.addEventListener('p-dragover', (event: Event) => {
      const dragEvent = event as Drag.Event;
      if (!dragEvent.mimeData.hasData(MIME_TYPE)) {
        return;
      }
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
      dragEvent.dropAction = dragEvent.proposedAction;
      columnContent.classList.add('jp-TaskBoard-dropTarget');
    });

    element.addEventListener('p-dragleave', () => {
      columnContent.classList.remove('jp-TaskBoard-dropTarget');
    });

    element.addEventListener('p-drop', (event: Event) => {
      const dragEvent = event as Drag.Event;
      if (!dragEvent.mimeData.hasData(MIME_TYPE)) {
        return;
      }
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
      columnContent.classList.remove('jp-TaskBoard-dropTarget');

      try {
        const data = dragEvent.mimeData.getData(MIME_TYPE) as string;
        const taskData = JSON.parse(data) as ITaskData;
        taskData.status = element.dataset.status as ITaskData['status'];
        
        // Create new task card
        const taskCard = new TaskCard(taskData);
        const panel = new Panel();
        panel.addWidget(taskCard);
        
        // Clear existing content and add the new task
        columnContent.innerHTML = '';
        columnContent.appendChild(panel.node);
      } catch (error) {
        console.error('Error handling task drop:', error);
      }
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
