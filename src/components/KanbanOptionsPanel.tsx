import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { TranslationBundle } from '@jupyterlab/translation';
import { addIcon, closeIcon, caretUpIcon, caretDownIcon, checkIcon } from '@jupyterlab/ui-components';
import { YFile } from '@jupyter/ydoc';
import { KanbanModel, KanbanSection, KanbanColumn } from '../model';

// KanbanStructure,

interface IKanbanOptionsPanelProps {
  trans: TranslationBundle;
  model: KanbanModel;
}

interface IEditState {
  type: 'section' | 'column';
  index: number;
  columnIndex?: number;
  isNew?: boolean;
  value: string;
}

export class KanbanOptionsPanel extends ReactWidget {
  constructor(options: IKanbanOptionsPanelProps) {
    super();
    this._trans = options.trans;
    this.addClass('jp-KanbanOptions-panel');

    // Store the model
    this._model = options.model;
    this._sharedModel = (this._model.sharedModel as YFile);
    
    // Set up shared model change handling
    this._model.changed.connect(() => {
      this._updateFromModel();
    });

    this._sharedModel.changed.connect(() => {
      this._updateFromModel();
    });

    this._editState = null;
    this._inputRef = React.createRef<HTMLInputElement>();

    // Initial update from model
    this._updateFromModel();
  }

  componentDidUpdate() {
    if (this._editState && this._inputRef.current) {
      if (this._inputRef.current.value !== this._editState.value) {
        this._inputRef.current.value = this._editState.value;
      }
    }
  }

  protected render(): React.ReactElement<any> {
    const sections = [
      ...this._model.structure?.sections || [],
      ...this._editing_sections
    ];
    
    return (
      <div className="jp-KanbanOptions-container">
        <div className="jp-KanbanOptions-content">
          <div className="jp-KanbanOptions-sections">
            {sections.map((section, index) => this._renderSection(section, index))}
          </div>
        </div>
      </div>
    );
  }

  private _renderSection(section: KanbanSection, index: number): JSX.Element {
    const isEditing = this._editState?.type === 'section' && this._editState.index === index;
    const showActions = !this._editState && !isEditing;
    const sections = this._model.structure?.sections || [];
    const columns = [
      ...section.columns,
      ...this._editing_columns
    ];

    return (
      <div key={index} className="jp-KanbanOptions-stage">
        <div className="jp-KanbanOptions-stage-header">
          {isEditing ? (
            <>
              <input
                ref={this._inputRef}
                type="text"
                className="jp-KanbanOptions-edit-input"
                defaultValue={this._editState?.value || ''}
                onChange={this._handleEditChange}
                onKeyDown={this._handleEditKeyDown}
                onBlur={this._commitEdit}
                autoFocus
              />
              <div className="jp-KanbanOptions-edit-actions">
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={this._commitEdit}
                    title={this._trans.__('Confirm')}
                  >
                    <checkIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => {
                      if (this._editState?.isNew) {
                        // this._stages.splice(this._editState.index, 1);
                      }
                      this._editState = null;
                      this.update();
                    }}
                    title={this._trans.__('Cancel')}
                  >
                    <closeIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <span onDoubleClick={() => this._startEdit('section', index, section.title)}>
                {section.title}
              </span>
              {showActions && (
                <div className="jp-KanbanOptions-stage-actions">
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._addSection(section, index)}
                      title={this._trans.__('Add Section')}
                    >
                      <addIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveSection(index, -1)}
                      title={this._trans.__('Move Up')}
                      disabled={index === 0}
                    >
                      <caretUpIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveSection(index, 1)}
                      title={this._trans.__('Move Down')}
                      disabled={index === sections.length - 1}
                    >
                      <caretDownIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._confirmRemoveStage(index)}
                      title={this._trans.__('Remove Stage')}
                    >
                      <closeIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="jp-KanbanOptions-categories">
          {columns.map((column, columnIndex) => 
            this._renderColumn(section, column, index, columnIndex)
          )}
        </div>
      </div>
    );
  }

  private _renderColumn(section: KanbanSection, column: KanbanColumn, stageIndex: number, columnIndex: number): JSX.Element {
    const isEditing = this._editState?.type === 'column' && 
                     this._editState.index === stageIndex && 
                     this._editState.columnIndex === columnIndex;
    const showActions = !this._editState && !isEditing;

    return (
      <div key={columnIndex} className="jp-KanbanOptions-category">
        {isEditing ? (
          <>
            <input
              ref={this._inputRef}
              type="text"
              className="jp-KanbanOptions-edit-input"
              defaultValue={this._editState?.value || ''}
              onChange={this._handleEditChange}
              onKeyDown={this._handleEditKeyDown}
              onBlur={this._commitEdit}
              autoFocus
            />
            <div className="jp-KanbanOptions-edit-actions">
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={this._commitEdit}
                  title={this._trans.__('Confirm')}
                >
                  <checkIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => {
                    if (this._editState?.isNew) {
                      // this._stages[stageIndex].columns.splice(categoryIndex, 1);
                    }
                    this._editState = null;
                    this.update();
                  }}
                  title={this._trans.__('Cancel')}
                >
                  <closeIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <span onDoubleClick={() => this._startEdit('column', stageIndex, column.title, columnIndex)}>
              {column.title}
            </span>
            {showActions && (
              <div className="jp-KanbanOptions-category-actions">
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._moveCategory(stageIndex, columnIndex, -1)}
                    title={this._trans.__('Move Up')}
                    disabled={columnIndex === 0}
                  >
                    <caretUpIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._moveCategory(stageIndex, columnIndex, 1)}
                    title={this._trans.__('Move Down')}
                    disabled={columnIndex === section.columns.length - 1}
                  >
                    <caretDownIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._confirmRemoveCategory(stageIndex, columnIndex)}
                    title={this._trans.__('Remove Category')}
                  >
                    <closeIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  private _startEdit = (
    type: 'section' | 'column',
    index: number,
    value: string,
    columnIndex?: number,
    isNew: boolean = false
  ): void => {
    this._editState = {
      type,
      index,
      columnIndex,
      value,
      isNew
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
      if (this._editState?.isNew) {
        if (this._editState.type === 'section') {
          // this._stages.splice(this._editState.index, 1);
        } else {
          // this._stages[this._editState.index].columns.splice(this._editState.columnIndex!, 1);
        }
      }
      this._editState = null;
      this.update();
    }
  };

  private _commitEdit = (): void => {
    if (!this._editState || !this._inputRef.current || !this._inputRef.current.value.trim()) {
      if (this._editState?.isNew) {
        if (this._editState.type === 'section') {
          // this._stages.splice(this._editState.index, 1);
        } else {
          // this._stages[this._editState.index].columns.splice(this._editState.columnIndex!, 1);
        }
      }
      this._editState = null;
      this.update();
      return;
    }

    const { type } = this._editState;
    // const { type, index, columnIndex } = this._editState;
    // const value = this._inputRef.current.value.trim();

    if (type === 'section') {
      // this._stages[index].name = value;
    } else if (type === 'column') {
      // this._stages[index].columns[columnIndex!].name = value;
    }

    this._editState = null;
    this.update();
  };

  private _addSection = (section: KanbanSection, stageIndex: number): void => {
    /*
    const newCategory: ICategory = {
      name: ''
    };
    stage.columns.push(newCategory);
    this._startEdit('column', stageIndex, '', stage.columns.length - 1, true);
    */
  };

  private _moveSection = (index: number, direction: number): void => {
    /*
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this._stages.length) {
      const stage = this._stages[index];
      this._stages.splice(index, 1);
      this._stages.splice(newIndex, 0, stage);
      this.update();
    }
    */
  };

  private _moveCategory = (stageIndex: number, categoryIndex: number, direction: number): void => {
    /*
    const categories = this._stages[stageIndex].columns;
    const newIndex = categoryIndex + direction;
    if (newIndex >= 0 && newIndex < categories.length) {
      const category = categories[categoryIndex];
      categories.splice(categoryIndex, 1);
      categories.splice(newIndex, 0, category);
      this.update();
    }
    */
  };

  private _confirmRemoveStage = (index: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this stage? This action cannot be undone.'))) {
      // this._stages.splice(index, 1);
      this.update();
    }
  };

  private _confirmRemoveCategory = (stageIndex: number, categoryIndex: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this category? This action cannot be undone.'))) {
      // this._stages[stageIndex].columns.splice(categoryIndex, 1);
      this.update();
    }
  };

  // Add a method to create a new stage
  addNewSection(): void {
    const newSection: KanbanSection = {
      title: '',
      lineNo: -1,
      columns: []
    };

    this._editing_sections.push(newSection);

    //this._model.addSection(newSection);
    /*
    const newStage: IStage = {
      name: '',
      columns: []
    };
    this._stages.push(newStage);
    */

    this._startEdit('section', 
      this._model.structure?.sections.length || 0, '', undefined, true);
  }

  private _updateFromModel(): void {
    const structure = this._model.structure;
    if (structure) {
      /*
      this._stages = structure.sections.map(section => ({
        name: section.title,
        columns: section.columns.map(column => ({ name: column.title }))
      }));
      */
      this.update();
    }
  }

  private _editing_sections: KanbanSection[] = [];
  private _editing_columns: KanbanColumn[] = [];

  // private _stages: IStage[];
  private _editState: IEditState | null;
  private _inputRef: React.RefObject<HTMLInputElement>;
  private readonly _trans: TranslationBundle;
  private _model: KanbanModel;
  private _sharedModel: YFile;
}
