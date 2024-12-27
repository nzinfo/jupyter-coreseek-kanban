import React from 'react';
import { 
  ReactWidget,
  FilterBox,
  ToolbarButton,
  PanelWithToolbar
} from '@jupyterlab/ui-components';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import { refreshIcon, clearIcon } from '@jupyterlab/ui-components/lib/icon';
import { Message } from '@lumino/messaging';
import { BoxPanel } from '@lumino/widgets';

/**
 * Search header component for the task panel
 */
const TaskSearchHeader: React.FC<TaskSearchHeader.IProps> = ({ 
  onSearch, 
  searchInputRef,
  trans 
}) => {
  return (
    <div className="jp-TaskPanel-header">
      <FilterBox
        placeholder={trans.__('Search tasks...')}
        updateFilter={(filterFn, query) => {
          if (query !== undefined) {
            onSearch(query);
          }
        }}
        useFuzzyFilter={true}
        inputRef={searchInputRef}
      />
    </div>
  );
};

namespace TaskSearchHeader {
  export interface IProps {
    onSearch: (filter: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    trans: TranslationBundle;
  }
}

/**
 * Task list item component
 */
const TaskListItem: React.FC<TaskListItem.IProps> = ({ 
  task,
  onSelect 
}) => {
  return (
    <div 
      className="jp-TaskPanel-item"
      onClick={() => onSelect(task)}
    >
      <div className="jp-TaskPanel-itemTitle">{task.title}</div>
      <div className="jp-TaskPanel-itemStatus">{task.status}</div>
    </div>
  );
};

namespace TaskListItem {
  export interface IProps {
    task: {
      id: string;
      title: string;
      status: string;
    };
    onSelect: (task: any) => void;
  }
}

/**
 * Task list component
 */
const TaskList: React.FC<TaskList.IProps> = ({ 
  tasks,
  onTaskSelect
}) => {
  return (
    <div className="jp-TaskPanel-listContent">
      {tasks.map(task => (
        <TaskListItem 
          key={task.id} 
          task={task} 
          onSelect={onTaskSelect}
        />
      ))}
    </div>
  );
};

namespace TaskList {
  export interface IProps {
    tasks: Array<{
      id: string;
      title: string;
      status: string;
    }>;
    onTaskSelect: (task: any) => void;
  }
}

/**
 * The main task panel widget
 */
export class TaskPanel extends ReactWidget {
  constructor(options: TaskPanel.IOptions) {
    super();
    this._translator = options.translator;
    this._trans = this._translator.load('jupyter-coreseek-kanban');
    this._searchInputRef = React.createRef<HTMLInputElement>();
    this.addClass('jp-TaskPanel');
    this.id = 'kanban-task-panel';

    // Create panels
    this._backlogPanel = new PanelWithToolbar();
    this._backlogPanel.addClass('jp-TaskPanel-backlog');
    this._backlogPanel.title.label = this._trans.__('Backlog');
    this._backlogPanel.toolbar.addItem(
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        onClick: this._handleRefresh,
        tooltip: this._trans.__('Refresh task list')
      })
    );

    this._donePanel = new PanelWithToolbar();
    this._donePanel.addClass('jp-TaskPanel-done');
    this._donePanel.title.label = this._trans.__('Done');
    this._donePanel.toolbar.addItem(
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        onClick: this._handleRefresh,
        tooltip: this._trans.__('Refresh task list')
      })
    );

    this._recyclePanel = new PanelWithToolbar();
    this._recyclePanel.addClass('jp-TaskPanel-recycle');
    this._recyclePanel.title.label = this._trans.__('Recycle');
    this._recyclePanel.toolbar.addItem(
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        onClick: this._handleRefresh,
        tooltip: this._trans.__('Refresh task list')
      })
    );
    this._recyclePanel.toolbar.addItem(
      'clear',
      new ToolbarButton({
        icon: clearIcon,
        onClick: this._handleClearRecycle,
        tooltip: this._trans.__('Clear all tasks')
      })
    );

    // Create main panel
    this._mainPanel = new BoxPanel();
    this._mainPanel.addClass('jp-TaskPanel-sections');
    this._mainPanel.addWidget(this._backlogPanel);
    this._mainPanel.addWidget(this._donePanel);
    this._mainPanel.addWidget(this._recyclePanel);
  }

  render(): JSX.Element {
    // Mock tasks data - this should come from your task model
    const backlogTasks = [
      { id: '1', title: 'Task 1', status: 'backlog' },
      { id: '2', title: 'Task 2', status: 'backlog' }
    ];

    const doneTasks = [
      { id: '3', title: 'Task 3', status: 'done' }
    ];

    const recycleTasks = [
      { id: '4', title: 'Task 4', status: 'recycle' }
    ];

    return (
      <div className="jp-TaskPanel-container">
        <TaskSearchHeader
          onSearch={this._handleSearch}
          searchInputRef={this._searchInputRef}
          trans={this._trans}
        />
        <div ref={node => {
          if (node) {
            this._backlogPanel.node.querySelector('.jp-Toolbar-contents')!.after(
              ReactWidget.create(
                <TaskList
                  tasks={backlogTasks}
                  onTaskSelect={this._handleTaskSelect}
                />
              ).node
            );
            this._donePanel.node.querySelector('.jp-Toolbar-contents')!.after(
              ReactWidget.create(
                <TaskList
                  tasks={doneTasks}
                  onTaskSelect={this._handleTaskSelect}
                />
              ).node
            );
            this._recyclePanel.node.querySelector('.jp-Toolbar-contents')!.after(
              ReactWidget.create(
                <TaskList
                  tasks={recycleTasks}
                  onTaskSelect={this._handleTaskSelect}
                />
              ).node
            );
          }
        }} />
      </div>
    );
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    BoxPanel.attach(this._mainPanel, this.node);
  }

  private _handleSearch = (filter: string) => {
    // Implement search logic
    console.log('Search:', filter);
  };

  private _handleTaskSelect = (task: any) => {
    // Implement task selection logic
    console.log('Selected task:', task);
  };

  private _handleRefresh = () => {
    // Implement refresh logic
    console.log('Refreshing tasks');
  };

  private _handleClearRecycle = () => {
    // Implement clear recycle logic
    console.log('Clearing recycle bin');
  };

  private readonly _translator: ITranslator;
  private readonly _trans: TranslationBundle;
  private readonly _searchInputRef: React.RefObject<HTMLInputElement>;
  private readonly _mainPanel: BoxPanel;
  private readonly _backlogPanel: PanelWithToolbar;
  private readonly _donePanel: PanelWithToolbar;
  private readonly _recyclePanel: PanelWithToolbar;
}

/**
 * A namespace for TaskPanel statics.
 */
export namespace TaskPanel {
  /**
   * The options used to create a TaskPanel.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator: ITranslator;
  }
}
