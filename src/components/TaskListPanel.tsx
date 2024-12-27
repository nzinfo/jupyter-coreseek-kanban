import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  ReactWidget,
  SidePanel
} from '@jupyterlab/ui-components';
import { TaskCard, ITaskData } from './TaskCard';
import { Panel } from '@lumino/widgets';

/**
 * Task list component showing all tasks
 */
class TaskList extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this._setupDropZone = this._setupDropZone.bind(this);
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskList-content" ref={this._setupDropZone}>
        <div className="jp-TaskList-section">
          {/* Sample task */}
          <div className="jp-TaskList-item">Sample Task 1</div>
        </div>
      </div>
    );
  }

  private _setupDropZone(element: HTMLElement | null): void {
    if (!element) return;

    element.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer!.dropEffect = 'move';
      element.classList.add('jp-TaskList-dropTarget');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('jp-TaskList-dropTarget');
    });

    element.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      element.classList.remove('jp-TaskList-dropTarget');

      const data = event.dataTransfer!.getData('application/x-task');
      if (!data) return;

      try {
        const taskData = JSON.parse(data) as ITaskData;
        const taskCard = new TaskCard(taskData);
        const panel = new Panel();
        panel.addWidget(taskCard);
        
        // Add the new task to the list
        element.appendChild(panel.node);
      } catch (error) {
        console.error('Error handling task drop:', error);
      }
    });

    // Create a sample draggable task
    const sampleTask: ITaskData = {
      id: '1',
      title: 'Sample Task 1',
      status: 'todo'
    };
    const taskCard = new TaskCard(sampleTask);
    const panel = new Panel();
    panel.addWidget(taskCard);
    element.appendChild(panel.node);
  }
}

/**
 * The main panel for displaying the task list
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
    backlogPanel.title.label = 'Backlog';

    // Add task list content
    backlogPanel.addWidget(new TaskList(this.trans));
    this.addWidget(backlogPanel);

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = 'Done';
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
