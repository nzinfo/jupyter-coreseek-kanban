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
  editIcon,
  saveIcon
} from '@jupyterlab/ui-components';
// import { PathExt } from '@jupyterlab/coreutils';
import { TaskColumn } from './TaskColumn';
import { Panel, Widget } from '@lumino/widgets';
import { KanbanLayout } from './KanbanLayout';
// import { TaskBoardHeaderEditor } from './TaskBoardHeaderEditor';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { YFile } from '@jupyter/ydoc';
import { KanbanModel, KanbanSection } from '../model';
import { DocumentRegistry, ABCWidgetFactory } from '@jupyterlab/docregistry';
import { CollaborativeEditorWidget } from '../editor';

/**
 * A widget factory for collaborative editors.
 */
class PanelEditorFactory extends ABCWidgetFactory<
  CollaborativeEditorWidget,
  DocumentRegistry.IModel
> {
  private editorServices: IEditorServices;
  private sharedWidget: CollaborativeEditorWidget | null = null;

  constructor(options: DocumentRegistry.IWidgetFactoryOptions<CollaborativeEditorWidget>, editorServices: IEditorServices) {
    super(options);
    this.editorServices = editorServices;
  }

  protected createNewWidget(context: DocumentRegistry.Context): CollaborativeEditorWidget {
    if (!this.sharedWidget) {
      this.sharedWidget = new CollaborativeEditorWidget(context, this.editorServices);
    }
    return this.sharedWidget;
  }
}

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
    this._isEditMode = false;
    this._onTitleChange = null;
    this._onTasklistToggle = null;
    this._onHeaderClick = null;
  }

  setTitle(title: string) {
    this._title = title;
    this.update();
  }

  setTitleChangeCallback(callback: (newTitle: string) => void): void {
    this._onTitleChange = callback;
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
              icon={this._isEditMode ? saveIcon : editIcon}
              onClick={() => this._onHeaderClick?.()}
              tooltip={this.trans.__(this._isEditMode ? 'Save description' : 'Edit in full editor')}
              className={`jp-TaskBoard-editButton ${this._isEditMode ? 'jp-mod-editMode' : ''}`}
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

    const newTitle = this._inputRef.current.value.trim();

    // Call the title change callback if it exists
    if (this._onTitleChange) {
      this._onTitleChange(newTitle);
    }
    
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

  setEditMode(editMode: boolean): void {
    this._isEditMode = editMode;
    this.update();
  }

  private _tasklistVisible: boolean;
  private _onTasklistToggle: ((visible: boolean) => void) | null = null;
  private _onHeaderClick: (() => void) | null = null;
  private _onTitleChange: ((newTitle: string) => void) | null = null;
  private _editState: { value: string } | null;
  private _inputRef: React.RefObject<HTMLInputElement>;
  private _title: string;
  private _isEditMode: boolean;
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
      lineNo: 0,
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
      
      // Add task moved callback
      columnWidget.setTaskMovedCallback((task, sourceColumn) => {
        // TODO: Implement task movement logic
        console.log('Task moved:', task, 'from', sourceColumn, 'to', column);
      });

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
    const { translator, editorServices, context } = options;
    super({ translator });
    
    this.addClass('jp-TaskBoard-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Store the model
    this._model = context.model as KanbanModel;
    this._sharedModel = (this._model.sharedModel as YFile);
    
    // Set up shared model change handling
    this._model.changed.connect(() => {
      this._updateFromModel();
    });

    this._sharedModel.changed.connect((sender: YFile) => {
      /*
      // 如果编辑器是打开的，更新其内容
      if (this._headerEditor.isVisible) {
        const currentContent = this._headerEditor.getContent();
        const modelContent = sender.getSource();
        if (currentContent !== modelContent) {
          this._headerEditor.setContent(modelContent);
        }
      }
      */
      // this._updateFromModel(); 
    });

    // Add header editor panel with the shared model
    this._headerEditor = null; /* new TaskBoardHeaderEditor({ 
      trans: this.trans,
      editorServices: editorServices,
      sharedModel: this._sharedModel
    }); */

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
    
    this._task_header.setTitleChangeCallback((newTitle) => {
      // this._model.structure.title = newTitle;
      // this._model.save();
      const title_line_no = this._model.structure?.lineNo || 0;
      const range = this._model.getTextRanges([title_line_no])[0];
      this._model.sharedModel.updateSource(range.start, range.end, 
        `# ${newTitle}`);
    });

    this._task_header.setHeaderClickCallback(() => {
      if (this._isDescriptionEditorOpen) {
        // Save and close editor
        if (this._headerEditor) {
          // Find the editor widget
          const editorWidget = this._headerEditor.widgets[0];
          if (editorWidget) {
            this._model.docManager.contextForWidget(editorWidget)?.save().then(() => {
              this._headerEditor?.hide();
              // this._headerEditor.parent = null;
              
              this._headerEditor?.dispose();
              // editorWidget.dispose();
              // Update button icon back to edit
              this._task_header.setEditMode(false);
              this._isDescriptionEditorOpen = false;
              this._headerEditor = null;

              // Restore section panels
              this._sectionPanels.forEach(panel => {
                const id = panel.id;
                const wasExpanded = this._sectionPanelsState.get(id);
                panel.setHidden(false);
                if (wasExpanded) {
                  panel.show();
                }
              });
              // Clear the stored states
              this._sectionPanelsState.clear();
              
            });
          }
        }
      } else {
        // Show header editor
        if (!this._headerEditor) {
          // try open the editor
          this._headerEditor = new PanelWithToolbar();
          this._headerEditor.addClass('jp-TaskBoard-headerEditor');
          this._headerEditor.title.label = this.trans.__('Description');

          // Register the editor factory
          const factory = new PanelEditorFactory({
            name: 'Board Description Editor',
            fileTypes: ['markdown'],
            defaultFor: ['markdown']
          }, editorServices);
          
          let disposable_factory = this._model.docManager.registry.addWidgetFactory(factory);
          
          // Create and open the editor
          // 根据 context 获取当前文件路径，拼接，构造 path + '.files/description.md'
          let path = context.path;
          if (path.endsWith('.kmd')) {
            // 应该一直为真
            path = path.slice(0, -4);
          }
        
          let dir_path = path + '.files';
          path += '.files/description.md';
          // 需要确保 path 存在
          let contents = this._model.docManager.services.contents;
          contents.get(path, { type: 'file', content: false }).then((model) => {
            // console.log('file exists:', path);
            const editorWidget = this._model.docManager.openOrReveal(path,
              'Board Description Editor');
            this._addEditor(editorWidget!);
            disposable_factory.dispose();
          }).catch((error) => {
            console.log('file not exists:', path);
            // 文件不存在，创建之。 需要注意，可能目录本身也不存在
            // 检查目录是否存在
            contents.get(dir_path, { type: 'directory', content: false }).then((model) => {
              // dir exists， 创建文件即可
              contents.newUntitled({ path: dir_path, type: 'file', ext: 'md' }).then((model) => {
                contents.rename(model.path, path).then(() => {
                  console.log('file created:', path);
                  const editorWidget = this._model.docManager.openOrReveal(path,
                    'Board Description Editor');
                  this._addEditor(editorWidget!);
                  disposable_factory.dispose();
                });
              });
            }).catch((error) => {
              // dir not exists
              console.log('dir not exists:', dir_path);
              let parent_path =  contents.normalize(dir_path+"/../");
              contents.newUntitled({ path: parent_path, type: 'directory' }).then((model) => {
                console.log('dir created:', dir_path);
                contents.rename(model.path, dir_path).then(() => {
                  // dir created， 再创建文件
                  contents.newUntitled({ path: dir_path, type: 'file', ext: 'md' }).then((model) => {
                    contents.rename(model.path, path).then(() => {
                      // console.log('file created:', path);
                      const editorWidget = this._model.docManager.openOrReveal(path,
                        'Board Description Editor');
                      this._addEditor(editorWidget!);
                      disposable_factory.dispose();
                    });
                  });
                }); // 目录创建结束
              });
            });
          });
        
        }
        // Store current section panels state and hide them
        this._sectionPanels.forEach(panel => {
          this._sectionPanelsState.set(panel.id, !panel.isHidden);
          panel.hide();
          panel.setHidden(true);
        });
        
        this._isDescriptionEditorOpen = true;
        // Update button icon to save
        this._task_header.setEditMode(true);
      }
    });

    this.header.addWidget(this._task_header);

    // Initial update from model
    this._updateFromModel();

    // Set up save and revert handlers
    /*
    this.trans = options.trans;
    this.addClass('jp-TaskBoard-headerEditor');
    this.title.label = this.trans.__('Description');

    this._headerEditor.setOnSave(() => {
      const content = this._headerEditor.getContent();
      console.log('Saving content to model:', content);
      this._sharedModel.setSource(content);
      this._headerEditor.hide();
      this._headerEditor.parent = null;
    });
    */
  }

  private _addEditor(editorWidget: Widget): void {
    if (this._headerEditor) {
      // Add the editor to the header editor panel
      this._headerEditor.addWidget(editorWidget);
      
      // 添加到主界面
      this.addWidget(this._headerEditor);
      // Ensure proper layout
      editorWidget.update();
      editorWidget.show();
      
      // Update the header editor
      this._headerEditor.update();
      this._headerEditor.show();
      
      // Force a layout update
      this.update();
    } 
  }

  private _updateFromModel(): void {
    const structure = this._model.structure;
    if (!structure) {
      return;
    }

    // Update title
    this._task_header.setTitle(structure.title || this.trans.__('Task Board'));

    // Remove all content panels
    // const widgets = [...this.widgets];
    this._sectionPanels.forEach(widget => {
      widget.dispose();
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
            // const currentContent = this._sharedModel.getSource();
            // this._sharedModel.setSource(currentContent + '\n- New task');
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
  private _headerEditor: PanelWithToolbar | null = null;
  private _sharedModel: YFile;
  private _model: KanbanModel;
  private _task_header: TaskBoardHeader;
  private _sectionPanels: PanelWithToolbar[] = [];
  private _sectionPanelsState: Map<string, boolean> = new Map(); // 记录面板展开状态
  private _isDescriptionEditorOpen: boolean = false;
}

/**
 * A namespace for TaskBoardPanel statics.
 */
export namespace TaskBoardPanel {
  /**
   * The options used to create a TaskBoardPanel.
   */
  export interface IOptions {
    context: DocumentRegistry.Context;
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
    // model: DocumentRegistry.IModel;
  }
}
