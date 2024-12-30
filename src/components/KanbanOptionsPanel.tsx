import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { addIcon, closeIcon, moveDownIcon, moveUpIcon, editIcon } from '@jupyterlab/ui-components';

interface IStage {
  id: string;
  name: string;
  categories: ICategory[];
}

interface ICategory {
  id: string;
  name: string;
}

interface IKanbanOptionsPanelProps {
  trans: TranslationBundle;
  onClose: () => void;
}

export class KanbanOptionsPanel extends ReactWidget {
  constructor(options: IKanbanOptionsPanelProps) {
    super();
    this._trans = options.trans;
    this._onClose = options.onClose;
    this.addClass('jp-KanbanOptions-panel');

    // Initialize with some default stages and categories
    this._stages = [
      {
        id: '1',
        name: 'Design',
        categories: [
          { id: '1', name: 'Todo' },
          { id: '2', name: 'Doing' },
          { id: '3', name: 'Done' }
        ]
      },
      {
        id: '2',
        name: 'Implementation',
        categories: [
          { id: '4', name: 'Todo' },
          { id: '5', name: 'In Progress' },
          { id: '6', name: 'Review' },
          { id: '7', name: 'Done' }
        ]
      }
    ];
  }

  render(): JSX.Element {
    return (
      <div className="jp-KanbanOptions-container">
        <div className="jp-KanbanOptions-header">
          <div className="jp-ToolbarButton jp-Toolbar-item">
            <button 
              className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
              onClick={this._onClose}
              title={this._trans.__('Close')}
            >
              <closeIcon.react tag="span" className="jp-Icon" />
            </button>
          </div>
        </div>
        <div className="jp-KanbanOptions-content">
          <div className="jp-KanbanOptions-stages">
            <div className="jp-KanbanOptions-section-header">
              <h3>{this._trans.__('Stages')}</h3>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={this._addStage}
                  title={this._trans.__('Add Stage')}
                >
                  <addIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
            </div>
            {this._stages.map((stage, index) => this._renderStage(stage, index))}
          </div>
        </div>
      </div>
    );
  }

  private _renderStage(stage: IStage, index: number): JSX.Element {
    return (
      <div key={stage.id} className="jp-KanbanOptions-stage">
        <div className="jp-KanbanOptions-stage-panel">
          <div className="jp-KanbanOptions-stage-header">
            <span>{stage.name}</span>
            <div className="jp-KanbanOptions-stage-actions">
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => this._moveStage(index, -1)}
                  title={this._trans.__('Move Up')}
                  disabled={index === 0}
                >
                  <moveUpIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => this._moveStage(index, 1)}
                  title={this._trans.__('Move Down')}
                  disabled={index === this._stages.length - 1}
                >
                  <moveDownIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => this._editStageName(stage)}
                  title={this._trans.__('Edit Name')}
                >
                  <editIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => this._deleteStage(stage)}
                  title={this._trans.__('Delete Stage')}
                >
                  <closeIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
              <div className="jp-ToolbarButton jp-Toolbar-item">
                <button 
                  className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                  onClick={() => this._addCategory(stage)}
                  title={this._trans.__('Add Category')}
                >
                  <addIcon.react tag="span" className="jp-Icon" />
                </button>
              </div>
            </div>
          </div>
          <div className="jp-KanbanOptions-categories">
            {stage.categories.map((category, catIndex) => (
              <div key={category.id} className="jp-KanbanOptions-category">
                <span>{category.name}</span>
                <div className="jp-KanbanOptions-category-actions">
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveCategory(stage, catIndex, -1)}
                      title={this._trans.__('Move Up')}
                      disabled={catIndex === 0}
                    >
                      <moveUpIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._moveCategory(stage, catIndex, 1)}
                      title={this._trans.__('Move Down')}
                      disabled={catIndex === stage.categories.length - 1}
                    >
                      <moveDownIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._editCategoryName(stage, category)}
                      title={this._trans.__('Edit Name')}
                    >
                      <editIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                  <div className="jp-ToolbarButton jp-Toolbar-item">
                    <button 
                      className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                      onClick={() => this._deleteCategory(stage, category)}
                      title={this._trans.__('Delete Category')}
                    >
                      <closeIcon.react tag="span" className="jp-Icon" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  private _addStage = (): void => {
    const name = prompt(this._trans.__('Enter stage name:'));
    if (name) {
      const newStage: IStage = {
        id: Date.now().toString(),
        name,
        categories: [
          { id: `${Date.now()}-1`, name: 'Todo' },
          { id: `${Date.now()}-2`, name: 'Done' }
        ]
      };
      this._stages = [...this._stages, newStage];
      this.update();
    }
  };

  private _editStageName = (stage: IStage): void => {
    const name = prompt(this._trans.__('Enter new stage name:'), stage.name);
    if (name) {
      this._stages = this._stages.map(s => 
        s.id === stage.id ? { ...s, name } : s
      );
      this.update();
    }
  };

  private _deleteStage = (stage: IStage): void => {
    if (confirm(this._trans.__('Are you sure you want to delete this stage? This action cannot be undone.'))) {
      this._stages = this._stages.filter(s => s.id !== stage.id);
      this.update();
    }
  };

  private _moveStage = (index: number, direction: number): void => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this._stages.length) {
      const stages = [...this._stages];
      const [removed] = stages.splice(index, 1);
      stages.splice(newIndex, 0, removed);
      this._stages = stages;
      this.update();
    }
  };

  private _addCategory = (stage: IStage): void => {
    const name = prompt(this._trans.__('Enter category name:'));
    if (name) {
      this._stages = this._stages.map(s => {
        if (s.id === stage.id) {
          return {
            ...s,
            categories: [...s.categories, { id: Date.now().toString(), name }]
          };
        }
        return s;
      });
      this.update();
    }
  };

  private _editCategoryName = (stage: IStage, category: ICategory): void => {
    const name = prompt(this._trans.__('Enter new category name:'), category.name);
    if (name) {
      this._stages = this._stages.map(s => {
        if (s.id === stage.id) {
          return {
            ...s,
            categories: s.categories.map(c =>
              c.id === category.id ? { ...c, name } : c
            )
          };
        }
        return s;
      });
      this.update();
    }
  };

  private _deleteCategory = (stage: IStage, category: ICategory): void => {
    if (confirm(this._trans.__('Are you sure you want to delete this category? This action cannot be undone.'))) {
      this._stages = this._stages.map(s => {
        if (s.id === stage.id) {
          return {
            ...s,
            categories: s.categories.filter(c => c.id !== category.id)
          };
        }
        return s;
      });
      this.update();
    }
  };

  private _moveCategory = (stage: IStage, index: number, direction: number): void => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < stage.categories.length) {
      this._stages = this._stages.map(s => {
        if (s.id === stage.id) {
          const categories = [...s.categories];
          const [removed] = categories.splice(index, 1);
          categories.splice(newIndex, 0, removed);
          return { ...s, categories };
        }
        return s;
      });
      this.update();
    }
  };

  private _stages: IStage[];
  private readonly _trans: TranslationBundle;
  private readonly _onClose: () => void;
}
