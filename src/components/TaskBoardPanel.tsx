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
  caretRightIcon,
  editIcon
} from '@jupyterlab/ui-components';
import { TaskColumn } from './TaskColumn';
import { Panel } from '@lumino/widgets';
import { KanbanLayout } from './KanbanLayout';
import { TaskBoardHeaderEditor } from './TaskBoardHeaderEditor';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { YFile } from '@jupyter/ydoc';
import { KanbanModel, KanbanSection } from '../model';
import { DocumentRegistry } from '@jupyterlab/docregistry';

/**
 * Task board header component
 */
class TaskBoardHeader extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskBoard-header');
    this._tasklistVisible = true;
    this._editState = null;
    this._inputRef = React.createRef<HTMLInputElement>();
    this._title = this.trans.__('Task Board');
  }

  setTitle(title: string) {
    this._title = title;
    this.update();
  }

  componentDidUpdate() {
    if (this._editState && this._inputRef.current) {
      if (this._inputRef.current.value !== this._editState.value) {
        this._inputRef.current.value = this._editState.value;
      }
    }
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
        {this._editState ? (
          <div className="jp-TaskBoard-title-edit">
            <input
              ref={this._inputRef}
              type="text"
              className="jp-KanbanOptions-edit-input"
              defaultValue={this._editState.value}
              onChange={this._handleEditChange}
              onKeyDown={this._handleEditKeyDown}
              onBlur={this._commitEdit}
              autoFocus
            />
          </div>
        ) : (
          <div className="jp-TaskBoard-title">
            <h2 onClick={this._onClick}>{this._title}</h2>

          </div>
        )}
        <div className="jp-TaskBoard-headerButtons">
          <ToolbarButtonComponent
              icon={editIcon}
              onClick={() => this._onHeaderClick?.()}
              tooltip={this.trans.__('Edit in full editor')}
              className="jp-TaskBoard-editButton"
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
 
  private _startEdit = () => {
    this._editState = {
      value: this._title
    };
    this.update();
  };

  private _handleEditChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (this._editState && this._inputRef.current) {
      this._editState = {
        ...this._editState,
        value: this._inputRef.current.value
      };
      this.update();
    }
  };

  private _handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      this._commitEdit();
    } else if (event.key === 'Escape') {
      this._editState = null;
      this.update();
    }
  };

  private _commitEdit = (): void => {
    if (!this._editState || !this._inputRef.current || !this._inputRef.current.value.trim()) {
      this._editState = null;
      this.update();
      return;
    }

    // TODO: Implement actual title change logic here
    console.log('New title:', this._inputRef.current.value.trim());
    
    this._editState = null;
    this.update();
  };

  private _onClick = (event: React.MouseEvent) => {
    if (event.ctrlKey && this._onHeaderClick) {
      // Ctrl+单击打开编辑器
      this._onHeaderClick();
    } else {
      // 普通单击启动改名
      this._startEdit();
    }
  };

  setTasklistToggleCallback(callback: (visible: boolean) => void): void {
    this._onTasklistToggle = callback;
  }

  setHeaderClickCallback(callback: () => void): void {
    this._onHeaderClick = callback;
  }

  private _tasklistVisible: boolean;
  private _onTasklistToggle: ((visible: boolean) => void) | null = null;
  private _onHeaderClick: (() => void) | null = null;
  private _editState: { value: string } | null;
  private _inputRef: React.RefObject<HTMLInputElement>;
  private _title: string;
}

/**
 * Task board content component
 */
class TaskBoardContent extends Panel {
  constructor(options: TaskBoardContent.IOptions) {
    super();
    this.addClass('jp-TaskBoard-content');
    this._trans = options.trans;
    this._section = options.section || {
      title: 'main',
      columns: []
    };
    this._createColumns();
  }

  /**
   * Set section data
   */
  setSection(section: KanbanSection) {
    this._section = section;
    this._createColumns();
  }

  /**
   * Create the columns
   */
  private _createColumns(): void {
    // Clear existing content
    this.node.textContent = '';

    // Create columns container
    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'jp-TaskBoard-columns';

    this._section.columns.forEach(column => {
      // Create column container
      const columnContainer = document.createElement('div');
      columnContainer.className = 'jp-TaskBoard-column';

      // Create column header
      const header = document.createElement('div');
      header.className = 'jp-TaskBoard-columnHeader';
      const title = document.createElement('h3');
      title.textContent = this._trans.__(column.title);
      header.appendChild(title);
      columnContainer.appendChild(header);

      // Create TaskColumn
      const columnWidget = new TaskColumn(this._trans, column);
      columnContainer.appendChild(columnWidget.node);

      // Add column to container
      columnsContainer.appendChild(columnContainer);
    });

    this.node.appendChild(columnsContainer);
  }

  private _trans: TranslationBundle;
  private _section: KanbanSection;
}

/**
 * A namespace for TaskBoardContent statics.
 */
namespace TaskBoardContent {
  /**
   * The options used to create a TaskBoardContent.
   */
  export interface IOptions {
    /**
     * The translation bundle.
     */
    trans: TranslationBundle;

    /**
     * The section data
     */
    section?: KanbanSection;
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
    this._model = model as KanbanModel;
    this._sharedModel = (model.sharedModel as YFile);
    
    // Set up shared model change handling
    this._model.changed.connect(() => {
      this._updateFromModel();
    });

    this._sharedModel.changed.connect((sender: YFile) => {
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

    // Set up collaboration awareness
    if (this._sharedModel.awareness) {
      this._sharedModel.awareness.on('change', () => {
        const states = Array.from(this._sharedModel.awareness!.getStates().values());
        console.log('Active users:', states);
      });
    }

    // Add header
    this._task_header = new TaskBoardHeader(this.trans);
    this._task_header.setTasklistToggleCallback((visible) => {
      const parent = this.parent;
      if (parent && parent instanceof KanbanLayout) {
        parent.toggleTaskList(visible);
      }
    });
    this._task_header.setHeaderClickCallback(() => {
      const currentContent = this._sharedModel.getSource();
      console.log('Current model content:', currentContent);

      this.addWidget(this._headerEditor);
      this._headerEditor.setContent(currentContent);
      this._headerEditor.show();
    });
    this.header.addWidget(this._task_header);

    // Initial update from model
    this._updateFromModel();

    // Set up save and revert handlers
    this._headerEditor.setOnSave(() => {
      const content = this._headerEditor.getContent();
      console.log('Saving content to model:', content);
      this._sharedModel.setSource(content);
      this._headerEditor.hide();
      this._headerEditor.parent = null;
    });
  }

  private _updateFromModel(): void {
    const structure = this._model.structure;
    if (!structure) {
      return;
    }

    // Update title
    this._task_header.setTitle(structure.title || this.trans.__('Task Board'));

    // Remove all content panels
    const widgets = [...this.widgets];
    widgets.forEach(widget => {
      if (widget instanceof PanelWithToolbar 
          && !(widget instanceof TaskBoardHeaderEditor)) {
        widget.dispose();
      }
    });
    this._sectionPanels = [];

    // Create sections
    structure.sections.forEach(section => {
      const contentPanel = new PanelWithToolbar();
      contentPanel.addClass('jp-TaskBoard-section');
      contentPanel.title.label = section.title;

      // Add new task button to toolbar
      contentPanel.toolbar.addItem(
        'newTask',
        new ToolbarButton({
          icon: addIcon,
          onClick: () => {
            const currentContent = this._sharedModel.getSource();
            this._sharedModel.setSource(currentContent + '\n- New task');
            console.log('Added new task to the model');
          },
          tooltip: this.trans.__('Add new task')
        })
      );

      // Add task board content with section from model
      const content = new TaskBoardContent({
        trans: this.trans,
        section: section
      });
      contentPanel.addWidget(content);
      this.addWidget(contentPanel);
      
      // Store panel reference
      this._sectionPanels.push(contentPanel);
    });

    // If no sections, create a default one
    /*  // 如果 no sections, 暂时不显示任何。
    if (this._sectionPanels.length === 0) {
      const defaultPanel = new PanelWithToolbar();
      defaultPanel.addClass('jp-TaskBoard-section');
      defaultPanel.title.label = 'main';

      // Add new task button to toolbar
      defaultPanel.toolbar.addItem(
        'newTask',
        new ToolbarButton({
          icon: addIcon,
          onClick: () => {
            const currentContent = this._sharedModel.getSource();
            this._sharedModel.setSource(currentContent + '\n- New task');
            console.log('Added new task to the model');
          },
          tooltip: this.trans.__('Add new task')
        })
      );

      // Add task board content with default section
      const content = new TaskBoardContent({
        trans: this.trans
      });
      defaultPanel.addWidget(content);
      this.addWidget(defaultPanel);
      
      // Store panel reference
      this._sectionPanels.push(defaultPanel);
    }
    */
  }

  protected trans: TranslationBundle;
  private _headerEditor: TaskBoardHeaderEditor;
  private _sharedModel: YFile;
  private _model: KanbanModel;
  private _task_header: TaskBoardHeader;
  private _sectionPanels: PanelWithToolbar[] = [];
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
