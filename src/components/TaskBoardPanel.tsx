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
  caretLeftIcon,
  caretRightIcon
} from '@jupyterlab/ui-components';
import { TaskColumn } from './TaskListPanel';
import { Panel } from '@lumino/widgets';
import { KanbanLayout } from './KanbanLayout';
import { TaskBoardHeaderEditor } from './TaskBoardHeaderEditor';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { YFile } from '@jupyter/ydoc';
import { KanbanModel } from '../model';
import { DocumentRegistry } from '@jupyterlab/docregistry';

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
        <h2 onClick={this._onClick}>{this.trans.__('Task Board')}</h2>
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

  /**
   * Set the callback for header click
   */
  setHeaderClickCallback(callback: () => void): void {
    this._onHeaderClick = callback;
  }

  private _onClick = () => {
    if (this._onHeaderClick) {
      this._onHeaderClick();
    }
  };

  private _tasklistVisible: boolean;
  private _onTasklistToggle: ((visible: boolean) => void) | null = null;
  private _onHeaderClick: (() => void) | null = null;
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
    const { translator, editorServices, model } = options;
    super({ translator });
    
    this.addClass('jp-TaskBoard-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Store the model
    this._model = model;
    this._sharedModel = (model.sharedModel as YFile);
    
    // Set up shared model change handling
    this._sharedModel.changed.connect((sender: YFile) => {
      console.log('Shared model changed in TaskBoardPanel:', {
        content: sender.getSource().slice(0, 50)
      });
      // 如果编辑器是打开的，更新其内容
      if (this._headerEditor.isVisible) {
        const currentContent = this._headerEditor.getContent();
        const modelContent = sender.getSource();
        if (currentContent !== modelContent) {
          this._headerEditor.setContent(modelContent);
        }
      }
    });

    // Add header editor panel with the shared model
    this._headerEditor = new TaskBoardHeaderEditor({ 
      trans: this.trans,
      editorServices: editorServices,
      sharedModel: this._sharedModel
    });

    // Initialize shared model with default content if empty
    //if (this._sharedModel.getSource().trim() === '') {
    //  this._sharedModel.setSource('# Task Board\n\nThis is the task board description.');
    //}

    // Set up collaboration awareness
    if (this._sharedModel.awareness) {
      this._sharedModel.awareness.setLocalStateField('user', {
        name: 'User ' + Math.floor(Math.random() * 1000),
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      });

      // Listen to awareness changes
      this._sharedModel.awareness.on('change', () => {
        const states = Array.from(this._sharedModel.awareness!.getStates().values());
        console.log('Active users:', states);
      });
    }

    // Add header
    const header = new TaskBoardHeader(this.trans);
    header.setTasklistToggleCallback((visible) => {
      const parent = this.parent;
      if (parent && parent instanceof KanbanLayout) {
        parent.toggleTaskList(visible);
      }
    });
    header.setHeaderClickCallback(() => {
      // 获取当前 model 的内容
      const currentContent = this._sharedModel.getSource();
      console.log('Current model content:', currentContent);

      this.addWidget(this._headerEditor);
      this._headerEditor.setContent(currentContent);
      this._headerEditor.show();
    });
    this.header.addWidget(header);

    // Add main content panel with toolbar
    const contentPanel = new PanelWithToolbar();
    contentPanel.addClass('jp-TaskBoard-section');
    contentPanel.title.label = 'main';

    // Add new task buttons to toolbar
    contentPanel.toolbar.addItem(
      'newTask',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          if (this._model instanceof KanbanModel) {
            this._model.appendText('hello');
            console.log('Added hello to the model using appendText');
          } else {
            console.warn('Model is not a KanbanModel instance');
          }
        },
        tooltip: this.trans.__('Add new task')
      })
    );

    // Add task board content
    contentPanel.addWidget(new TaskBoardContent(this.trans));
    this.addWidget(contentPanel);

    // Set up save and revert handlers
    this._headerEditor.setOnSave(() => {
      const content = this._headerEditor.getContent();
      console.log('Saving content to model:', content);
      this._sharedModel.setSource(content);
      this._headerEditor.hide();
      this._headerEditor.parent = null;
    });

    this._headerEditor.setOnRevert(() => {
      const currentContent = this._sharedModel.getSource();
      console.log('Reverting content from model:', currentContent);
      this._headerEditor.setContent(currentContent);
      this._headerEditor.hide();
      this._headerEditor.parent = null;
    });
  }

  protected trans: TranslationBundle;
  private _headerEditor: TaskBoardHeaderEditor;
  private _sharedModel: YFile;
  private _model: DocumentRegistry.IModel;
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

    /**
     * The editor services for creating the editor.
     */
    editorServices: IEditorServices;

    /**
     * The document context model
     */
    model: DocumentRegistry.IModel;
  }
}
