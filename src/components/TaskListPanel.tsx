// import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  // ReactWidget,
  // refreshIcon,
  SidePanel,
  // ToolbarButton
} from '@jupyterlab/ui-components';
import { Panel } from '@lumino/widgets';
import { TaskCard } from './TaskCard';

/**
 * Task list component showing all tasks
 */
export class TaskList extends Panel {
  constructor(trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskList');

    // 示例数据
    const tasks = [
      {
        title: '实现看板功能',
        summary: '在 Jupyter 中实现类似 Trello 的看板功能',
        tags: [
          { name: '开发中', color: '#61BD4F' },
          { name: '前端', color: '#FF78CB' }
        ],
        assignee: {
          name: '张',
          avatarUrl: 'path/to/avatar.png'
        }
      }
      // ... 更多任务
    ];

    // 添加任务卡片
    tasks.forEach(task => {
      const taskCard = new TaskCard(task);
      this.addWidget(taskCard);
    });
  }
}

/**
 * The main panel for displaying tasks
 */
export class TaskListPanel extends SidePanel {
  constructor(options: TaskListPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    // this._searchInputRef = React.createRef<HTMLInputElement>();
    this.addClass('jp-TaskList-panel');

    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add Backlog panel
    const backlogPanel = new PanelWithToolbar();
    backlogPanel.addClass('jp-TaskList-section');
    backlogPanel.title.label = this.trans.__('Backlog');
    backlogPanel.addWidget(new TaskList(this.trans));
    this.addWidget(backlogPanel);

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = this.trans.__('Done');
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

    /* 不要删除，保留参考
    // Add refresh button to toolbar
    taskListPanel.toolbar.addItem(
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        onClick: () => {
          // TODO: Implement refresh functionality
          console.log('Refreshing task list...');
        },
        tooltip: this.trans.__('Refresh task list')
      })
    );
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
