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
      ...this._editing_columns_in_section === section ? this._editing_columns : []
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
                      onClick={() => this._addColumn(section, index)}
                      title={this._trans.__('Add Column')}
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
                      onClick={() => this._confirmRemoveSection(index)}
                      title={this._trans.__('Remove Section')}
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
                    onClick={() => this._moveColumn(stageIndex, columnIndex, -1)}
                    title={this._trans.__('Move Up')}
                    disabled={columnIndex === 0}
                  >
                    <caretUpIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._moveColumn(stageIndex, columnIndex, 1)}
                    title={this._trans.__('Move Down')}
                    disabled={columnIndex === section.columns.length - 1}
                  >
                    <caretDownIcon.react tag="span" className="jp-Icon" />
                  </button>
                </div>
                <div className="jp-ToolbarButton jp-Toolbar-item">
                  <button 
                    className="jp-ToolbarButtonComponent jp-mod-minimal jp-Button"
                    onClick={() => this._confirmRemoveColumn(stageIndex, columnIndex)}
                    title={this._trans.__('Remove Column')}
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
          this._editing_sections = [];  // 放弃修改
          // this._stages.splice(this._editState.index, 1);
        } else {
          this._editing_columns = [];  // 放弃修改
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
          this._editing_sections = [];  // 放弃修改
          // this._stages.splice(this._editState.index, 1);
        } else {
          this._editing_columns = [];  
          // this._stages[this._editState.index].columns.splice(this._editState.columnIndex!, 1);
        }
      }
      this._editState = null;
      this.update();
      return;
    }

    const { index, columnIndex } = this._editState;
    const value = this._inputRef.current.value.trim();

    if (this._editState?.isNew) {
      // 处理新增
      if (this._editState.type === 'section') {
        const source = this._model.sharedModel.getSource();
        this._model.sharedModel.updateSource(source.length, source.length, 
          `\n\n# ${value}\n\n`);
        this._editing_sections = [];  
      } else {
        const sections = this._model.structure?.sections || [];
        // 如果是最后一个 section
        if (index == sections.length - 1) {
          const source = this._model.sharedModel.getSource();
          this._model.sharedModel.updateSource(source.length, source.length, 
            `\n## ${value}\n\n`);
        } else {
          // 下一个 section 之前插入
          const nextSection = sections[index + 1];
          const range = this._model.getTextRanges([nextSection.lineNo]);
          this._model.sharedModel.updateSource(range[0].start, range[0].start, 
            `## ${value}\n\n`);  // 不必增加 \n， range[0].start 已经是行首
        }
        this._editing_columns = [];  
      }
    } else {
      // 处理修改
      if (this._editState.type === 'section') {
        const section = this._model.structure?.sections?.[index] || null;
        if (section) {
          const range = this._model.getTextRanges([section.lineNo]);
          this._model.sharedModel.updateSource(range[0].start, range[0].end, 
            `# ${value}`);
          // section.title = value;
        }
      } else if (this._editState.type === 'column') {
        // this._stages[index].columns[columnIndex!].name = value;
        const section = this._model.structure?.sections?.[index] || null;
        if (section) {
          const column = section.columns[columnIndex!];
          const range = this._model.getTextRanges([column.lineNo]);
          this._model.sharedModel.updateSource(range[0].start, range[0].end, 
            `## ${value}`);
        }
      }
    }

    this._editState = null;
    this.update();
  };

  private _addColumn = (section: KanbanSection, stageIndex: number): void => {
    const newColumn: KanbanColumn = {
      title: '',
      lineNo: -1,
      tasks: []
    };

    this._editing_columns.push(newColumn);
    this._editing_columns_in_section = section;
    this._startEdit('column', stageIndex, '', section.columns.length, true);
  };

  private _moveSection = (index: number, direction: number): void => {
    const sections = this._model.structure?.sections || [];
    const source = this._model.sharedModel.getSource();

    // 我们实际上只处理一种情况，移动到文档上方的某个位置
    if (direction == 1) {
      // TODO: report error if direction not  1, -1
      return this._moveSection(index + direction, -1);
    }

    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < sections.length) {
      const section = sections[index];
      const targetSection = sections[newIndex];
      const ranges = this._model.getTextRanges([section.lineNo, targetSection.lineNo]);
      // 尝试获取 section 的 范围 借助 find 方法
      let sectionEnd = source.indexOf("\n# ", ranges[0].start);
      if (sectionEnd == -1) {
        sectionEnd = source.length;
      }

      const sectionText = source.slice(ranges[0].start, sectionEnd);
      // 删除 section , ranges[0].start ~ sectionEnd
      this._model.sharedModel.updateSource(
        ranges[0].start, 
        sectionEnd, 
        ''
      );
      // TODO: 添加 section 到新位置 
      this._model.sharedModel.updateSource(
        ranges[1].start, 
        ranges[1].start, 
        sectionText
      );

      this.update();
    }
  };

  private _moveColumn = (sectionIndex: number, columnIndex: number, direction: number): void => {
    const sections = this._model.structure?.sections || [];
    const source = this._model.sharedModel.getSource();

    // 我们实际上只处理一种情况，移动到文档上方的某个位置
    if (direction == 1) {
      // TODO: report error if direction not  1, -1
      return this._moveColumn(sectionIndex, columnIndex + direction, -1);
    }

    const newIndex = columnIndex + direction;
    if (newIndex >= 0 && newIndex < sections[sectionIndex].columns.length) {
      const column = sections[sectionIndex].columns[columnIndex];
      const targetColumn = sections[sectionIndex].columns[newIndex];
      const ranges = this._model.getTextRanges([column.lineNo, targetColumn.lineNo]);
      // 尝试获取 section 的 范围 借助 find 方法
      let sectionEnd = source.indexOf("\n# ", ranges[0].start);
      if (sectionEnd == -1) {
        sectionEnd = source.length-1;
      }

      // 尝试获取 column 的 范围 借助 find 方法
      let columnEnd = source.indexOf("\n## ", ranges[0].start);
      if (columnEnd == -1) {
        columnEnd = source.length-1;
      }

      if (columnEnd > sectionEnd) {
        // 以 section 为边界
        columnEnd = sectionEnd;
      }

      columnEnd += 1; // 包括换行

      const columnText = source.slice(ranges[0].start, columnEnd);
      // 删除 section , ranges[0].start ~ sectionEnd
      this._model.sharedModel.updateSource(
        ranges[0].start, 
        columnEnd, 
        ''
      );
      // TODO: 添加 section 到新位置 
      this._model.sharedModel.updateSource(
        ranges[1].start, 
        ranges[1].start, 
        columnText
      );

      this.update();
    }
  };

  private _confirmRemoveSection = (index: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this section? This action cannot be recovered.'))) {
      // 1. 获得要删除的 section
      const sections = this._model.structure?.sections || [];
      const sectionToRemove = sections[index];
      
      if (!sectionToRemove) return;

      if (index == sections.length - 1) {
        // 删除最后一个 section
        const source = this._model.sharedModel.getSource();
        const ranges = this._model.getTextRanges([sectionToRemove.lineNo]);
        this._model.sharedModel.updateSource(
          ranges[0].start, 
          source.length, 
          ''
        );
      } else {
        // 删除中间的 section
        const nextSectionLineNo = sections[index + 1].lineNo;
        const ranges = this._model.getTextRanges([sectionToRemove.lineNo, nextSectionLineNo - 1]);
        this._model.sharedModel.updateSource(
          ranges[0].start, 
          ranges[1].end, 
          ''
        );
      }

      this.update();
    }
  };

  private _confirmRemoveColumn = (sectionIndex: number, columnIndex: number): void => {
    if (confirm(this._trans.__('Are you sure you want to remove this column? This action cannot be recovered.'))) {
      // this._stages[stageIndex].columns.splice(categoryIndex, 1);
      const sections = this._model.structure?.sections || [];
      const section = sections[sectionIndex] || null;
      if (section) {
        if (columnIndex == section.columns.length - 1) {
          // 是最后一个 column
          if (sectionIndex == sections.length - 1) {
            // 如果同时是最后一个 section
            const column = section.columns[columnIndex];
            const source = this._model.sharedModel.getSource();
            const ranges = this._model.getTextRanges([column.lineNo]);
            this._model.sharedModel.updateSource(
              ranges[0].start, 
              source.length, 
              ''
            );
          } else {
            // 如果不是最后一个 section
            const nextSection = sections[sectionIndex + 1];
            const column = section.columns[columnIndex];

            const ranges = this._model.getTextRanges([column.lineNo, nextSection.lineNo - 1]);
            this._model.sharedModel.updateSource(
              ranges[0].start, 
              ranges[1].end, 
              ''
            );
          }
        } else {
          // 删除中间的 column
          const nextColumnLineNo = section.columns[columnIndex + 1].lineNo;
          const ranges = this._model.getTextRanges([section.columns[columnIndex].lineNo, nextColumnLineNo - 1]);
          this._model.sharedModel.updateSource(
            ranges[0].start, 
            ranges[1].end, 
            ''
          );
        }
      }
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

    this._startEdit('section', 
      this._model.structure?.sections.length || 0, '', undefined, true);
  }

  private _updateFromModel(): void {
    const structure = this._model.structure;
    if (structure) {
      this.update();
    }
  }

  private _editing_sections: KanbanSection[] = [];
  private _editing_columns: KanbanColumn[] = [];
  private _editing_columns_in_section: KanbanSection | null = null;

  // private _stages: IStage[];
  private _editState: IEditState | null;
  private _inputRef: React.RefObject<HTMLInputElement>;
  private readonly _trans: TranslationBundle;
  private _model: KanbanModel;
  private _sharedModel: YFile;
}
