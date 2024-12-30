import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { addIcon, closeIcon, caretUpIcon, caretDownIcon, checkIcon } from '@jupyterlab/ui-components';

interface IStage {
  name: string;
  categories: ICategory[];
}

interface ICategory {
  name: string;
}

interface IKanbanOptionsPanelProps {
  trans: TranslationBundle;
}

interface IEditState {
  type: 'stage' | 'category';
  index: number;
  categoryIndex?: number;
  isNew?: boolean;
  value: string;
}

export class KanbanOptionsPanel extends ReactWidget {
  constructor(options: IKanbanOptionsPanelProps) {
    super();
    this._trans = options.trans;
    this.addClass('jp-KanbanOptions-panel');

    // Initialize with some default stages and categories
    this._stages = [
      {
        name: this._trans.__('Backlog'),
        categories: [
          { name: this._trans.__('Bug') },
          { name: this._trans.__('Feature') }
        ]
      },
      {
        name: this._trans.__('In Progress'),
        categories: []
      }
    ];

    this._editState = null;
  }

  protected render(): React.ReactElement<any> {
    return (
      <div className="jp-KanbanOptions-container">
        <div className="jp-KanbanOptions-content">
          <div className="jp-KanbanOptions-stages">
            {this._stages.map((stage, index) => this._renderStage(stage, index))}
          </div>
        </div>
      </div>
    );
  }

  private _renderStage(stage: IStage, index: number): JSX.Element {
    const isEditing = this._editState?.type === 'stage' && this._editState.index === index;
    const showActions = !this._editState && !isEditing;

    return (
      <div key={index} className="jp-KanbanOptions-stage">
        <div className="jp-KanbanOptions-stage-header">
          {isEditing ? (
            <>
              <input
                type="text"
                className="jp-KanbanOptions-edit-input"
                value={this._editState?.value || ''}
                onChange={this._handleEditChange}
                onKeyDown={this._handleEditKeyDown}
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
                        this._stages.splice(this._editState.index, 1);
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
              <span onDoubleClick={() => this._startEdit('stage', index, stage.name)}>
                {stage.name}
              </span>
              {showActions && (
                <div className="jp-KanbanOptions-stage-actions">
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._addCategory(stage, index)}
                      title={this._trans.__('Add Category')}
                    >
                      <addIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveStage(index, -1)}
                      title={this._trans.__('Move Up')}
                      disabled={index === 0}
                    >
                      <caretUpIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveStage(index, 1)}
                      title={this._trans.__('Move Down')}
                      disabled={index === this._stages.length - 1}
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
          {stage.categories.map((category, categoryIndex) => 
            this._renderCategory(category, index, categoryIndex)
          )}
        </div>
      </div>
    );
  }

  private _renderCategory(category: ICategory, stageIndex: number, categoryIndex: number): JSX.Element {
    const isEditing = this._editState?.type === 'category' && 
                     this._editState.index === stageIndex && 
                     this._editState.categoryIndex === categoryIndex;
    const showActions = !this._editState && !isEditing;

    return (
      <div key={categoryIndex} className="jp-KanbanOptions-category">
        {isEditing ? (
          <>
            <input
              type="text"
              className="jp-KanbanOptions-edit-input"
              value={this._editState?.value || ''}
              onChange={this._handleEditChange}
              onKeyDown={this._handleEditKeyDown}
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
                      this._stages[stageIndex].categories.splice(categoryIndex, 1);
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
            <span onDoubleClick={() => this._startEdit('category', stageIndex, category.name, categoryIndex)}>
              {category.name}
            </span>
            {showActions && (
              <div className="jp-KanbanOptions-category-actions">
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._moveCategory(stageIndex, categoryIndex, -1)}
                    title={this._trans.__('Move Up')}
                    disabled={categoryIndex === 0}
                  >
                    <caretUpIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._moveCategory(stageIndex, categoryIndex, 1)}
                    title={this._trans.__('Move Down')}
                    disabled={categoryIndex === this._stages[stageIndex].categories.length - 1}
                  >
                    <caretDownIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._confirmRemoveCategory(stageIndex, categoryIndex)}
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
    type: 'stage' | 'category',
    index: number,
    value: string,
    categoryIndex?: number,
    isNew: boolean = false
  ): void => {
    this._editState = {
      type,
      index,
      categoryIndex,
      value,
      isNew
    };
    this.update();
  };

  private _handleEditChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (this._editState) {
      this._editState = {
        ...this._editState,
        value: event.target.value
      };
      this.update();
    }
  };

  private _handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      this._commitEdit();
    } else if (event.key === 'Escape') {
      if (this._editState?.isNew) {
        if (this._editState.type === 'stage') {
          this._stages.splice(this._editState.index, 1);
        } else {
          this._stages[this._editState.index].categories.splice(this._editState.categoryIndex!, 1);
        }
      }
      this._editState = null;
      this.update();
    }
  };

  private _commitEdit = (): void => {
    if (!this._editState || !this._editState.value.trim()) {
      if (this._editState?.isNew) {
        if (this._editState.type === 'stage') {
          this._stages.splice(this._editState.index, 1);
        } else {
          this._stages[this._editState.index].categories.splice(this._editState.categoryIndex!, 1);
        }
      }
      this._editState = null;
      this.update();
      return;
    }

    const { type, index, categoryIndex, value } = this._editState;

    if (type === 'stage') {
      this._stages[index].name = value.trim();
    } else if (type === 'category') {
      this._stages[index].categories[categoryIndex!].name = value.trim();
    }

    this._editState = null;
    this.update();
  };

  private _addCategory = (stage: IStage, stageIndex: number): void => {
    const newCategory: ICategory = {
      name: ''
    };
    stage.categories.push(newCategory);
    this._startEdit('category', stageIndex, '', stage.categories.length - 1, true);
  };

  private _moveStage = (index: number, direction: number): void => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this._stages.length) {
      const stage = this._stages[index];
      this._stages.splice(index, 1);
      this._stages.splice(newIndex, 0, stage);
      this.update();
    }
  };

  private _moveCategory = (stageIndex: number, categoryIndex: number, direction: number): void => {
    const categories = this._stages[stageIndex].categories;
    const newIndex = categoryIndex + direction;
    if (newIndex >= 0 && newIndex < categories.length) {
      const category = categories[categoryIndex];
      categories.splice(categoryIndex, 1);
      categories.splice(newIndex, 0, category);
      this.update();
    }
  };

  private _confirmRemoveStage = (index: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this stage? This action cannot be undone.'))) {
      this._stages.splice(index, 1);
      this.update();
    }
  };

  private _confirmRemoveCategory = (stageIndex: number, categoryIndex: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this category? This action cannot be undone.'))) {
      this._stages[stageIndex].categories.splice(categoryIndex, 1);
      this.update();
    }
  };

  // Add a method to create a new stage
  addNewStage(): void {
    const newStage: IStage = {
      name: '',
      categories: []
    };
    this._stages.push(newStage);
    this._startEdit('stage', this._stages.length - 1, '', undefined, true);
  }

  private _stages: IStage[];
  private _editState: IEditState | null;
  private readonly _trans: TranslationBundle;
}
