import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  PanelWithToolbar,
  // ReactWidget,
  // refreshIcon,
  SidePanel,
  ToolbarButton,
  addIcon,
  tocIcon
} from '@jupyterlab/ui-components';
import { Panel } from '@lumino/widgets';
// import { Drag } from '@lumino/dragdrop';
import { TaskCard } from './TaskCard';
import { DragDropManager } from './dragdrop';
import { KanbanOptionsPanel } from './KanbanOptionsPanel';

/**
 * Task column component showing tasks in a specific status
 */
export class TaskColumn extends Panel {
  constructor(trans: TranslationBundle, addExampleTasks: boolean = false) {
    super();
    this.addClass('jp-TaskColumn');

    // 启用拖放
    this.node.addEventListener('dragenter', this);
    this.node.addEventListener('dragleave', this);
    this.node.addEventListener('dragover', this);
    this.node.addEventListener('drop', this);

    // 创建放置指示器
    this._dropIndicator = document.createElement('div');
    this._dropIndicator.className = 'jp-TaskColumn-dropIndicator';
    this._dropIndicator.style.display = 'none';
    this.node.appendChild(this._dropIndicator);

    // 根据参数决定是否添加示例任务卡片
    if (addExampleTasks) {
      this._addExampleTasks();
    }
  }

  private _addExampleTasks(): void {
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
          avatarUrl: ''
        }
      }
    ];

    // 添加任务卡片
    tasks.forEach(task => {
      const taskCard = new TaskCard(task);
      this.addWidget(taskCard);
    });
  }

  /**
   * Handle the DOM events for the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dragenter':
        this.handleDragEnter(event as DragEvent);
        break;
      case 'dragleave':
        this.handleDragLeave(event as DragEvent);
        break;
      case 'dragover':
        this.handleDragOver(event as DragEvent);
        break;
      case 'drop':
        this.handleDrop(event as DragEvent);
        break;
    }
  }

  private handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.addClass('jp-mod-dropTarget');
  }

  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const relatedTarget = event.relatedTarget as HTMLElement;
    // 只有当真正离开 TaskColumn 时才移除样式和指示器
    if (!this.node.contains(relatedTarget)) {
      this.removeClass('jp-mod-dropTarget');
      this._dropIndicator.style.display = 'none';
    }
  }

  private handleDragOver(event: DragEvent): void {
    const dragData = event.dataTransfer?.getData('application/x-taskcard');
    if (dragData) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer!.dropEffect = 'move';

      // 更新放置指示器位置
      this._updateDropIndicator(event.clientY);
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass('jp-mod-dropTarget');
    this._dropIndicator.style.display = 'none';

    const dragData = event.dataTransfer?.getData('application/x-taskcard');
    if (dragData && DragDropManager.dragSource instanceof TaskCard) {
      const source = DragDropManager.dragSource;
      
      // 确保源卡片仍然有效
      if (!source.isDisposed) {
        if (source.parent) {
          source.parent.layout?.removeWidget(source);
        }
        
        // 在指示器位置插入卡片
        const insertIndex = this._getInsertIndex(event.clientY);
        this.insertWidget(insertIndex, source);
      }
      
      DragDropManager.dragSource = null;
    }
  }

  private _updateDropIndicator(clientY: number): void {
    const cards = Array.from(this.widgets) as TaskCard[];
    
    if (cards.length === 0) {
      // 如果没有卡片，显示在顶部
      this._dropIndicator.style.display = 'block';
      this._dropIndicator.style.top = '8px';
      return;
    }

    const insertIndex = this._getInsertIndex(clientY);
    if (insertIndex === cards.length) {
      // 放在最后一个卡片下面
      const lastCard = cards[cards.length - 1];
      const rect = lastCard.node.getBoundingClientRect();
      this._dropIndicator.style.top = `${rect.bottom - this.node.getBoundingClientRect().top}px`;
    } else {
      // 放在指定卡片上面
      const targetCard = cards[insertIndex];
      const rect = targetCard.node.getBoundingClientRect();
      this._dropIndicator.style.top = `${rect.top - this.node.getBoundingClientRect().top}px`;
    }
    this._dropIndicator.style.display = 'block';
  }

  private _getInsertIndex(clientY: number): number {
    const cards = Array.from(this.widgets) as TaskCard[];
    
    let insertIndex = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rect = card.node.getBoundingClientRect();
      const cardMiddleY = rect.top + rect.height / 2;
      
      if (clientY < cardMiddleY) {
        insertIndex = i;
        break;
      }
    }
    
    return insertIndex;
  }

  private _dropIndicator: HTMLDivElement;
}

/**
 * The main panel for displaying tasks
 */
export class TaskListPanel extends SidePanel {
  constructor(options: TaskListPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    this.addClass('jp-TaskList-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Create the options panel with toolbar
    const optionsPanel = new PanelWithToolbar();
    optionsPanel.addClass('jp-TaskList-section');
    optionsPanel.title.label = this.trans.__('Kanban Settings');
    // Add new task button to toolbar
    optionsPanel.toolbar.addItem(
      'newStage',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          this._optionsWidget.addNewStage();
        },
        tooltip: this.trans.__('Add new stage')
      })
    );
    this._optionsWidget = new KanbanOptionsPanel({
      trans: this.trans,
      // onClose: () => this._hideOptionsPanel()
    });
    optionsPanel.addWidget(this._optionsWidget);
    this._optionsPanel = optionsPanel;

    // Add Backlog panel with example tasks
    const backlogPanel = new PanelWithToolbar();
    backlogPanel.addClass('jp-TaskList-section');
    backlogPanel.title.label = this.trans.__('Backlog');
    
    // Create more options button with toggle state
    const moreOptionsButton = new ToolbarButton({
      icon: tocIcon,
      onClick: () => {
        this._toggleOptionsPanel();
      },
      tooltip: this.trans.__('More Options'),
      pressed: false
    });
    this._moreOptionsButton = moreOptionsButton;
    
    backlogPanel.toolbar.addItem('moreOptions', moreOptionsButton);

    // Add new task button to toolbar
    backlogPanel.toolbar.addItem(
      'newTask',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          console.log('Add new task clicked');
        },
        tooltip: this.trans.__('Add new task')
      })
    );
    
    this._backlogColumn = new TaskColumn(this.trans, true);
    backlogPanel.addWidget(this._backlogColumn);
    this._backlogPanel = backlogPanel;

    // Add Done panel
    const donePanel = new PanelWithToolbar();
    donePanel.addClass('jp-TaskList-section');
    donePanel.title.label = this.trans.__('Done');
    
    this._doneColumn = new TaskColumn(this.trans);
    donePanel.addWidget(this._doneColumn);
    this._donePanel = donePanel;

    // Add panels to the layout
    this.addWidget(backlogPanel);
    this.addWidget(donePanel);
  }

  private _toggleOptionsPanel(): void {
    if (!this._optionsPanel.isAttached) {
      // Store panels' collapsed state
      this._backlogPanelExpanded = !this._backlogPanel.hasClass('jp-mod-collapsed');
      this._donePanelExpanded = !this._donePanel.hasClass('jp-mod-collapsed');

      // Collapse panels
      this._backlogPanel.addClass('jp-mod-collapsed');
      this._donePanel.addClass('jp-mod-collapsed');
      this._backlogPanel.node.setAttribute('aria-expanded', 'false');
      this._donePanel.node.setAttribute('aria-expanded', 'false');
      this._backlogPanel.hide();
      this._donePanel.hide();

      // Disable panels
      this._backlogPanel.addClass('jp-mod-disabled');
      this._donePanel.addClass('jp-mod-disabled');

      // Show options panel
      this.addWidget(this._optionsPanel);
      this._moreOptionsButton.pressed = true;
    } else {
      this._hideOptionsPanel();
    }
  }

  private _hideOptionsPanel(): void {
    if (this._optionsPanel.isAttached) {
      // Remove options panel
      this._optionsPanel.parent = null;
      this._moreOptionsButton.pressed = false;

      // Enable panels
      this._backlogPanel.removeClass('jp-mod-disabled');
      this._donePanel.removeClass('jp-mod-disabled');

      // Restore panels' previous state
      if (this._backlogPanelExpanded) {
        this._backlogPanel.removeClass('jp-mod-collapsed');
        this._backlogPanel.node.setAttribute('aria-expanded', 'true');
        this._backlogPanel.show();
      }
      if (this._donePanelExpanded) {
        this._donePanel.removeClass('jp-mod-collapsed');
        this._donePanel.node.setAttribute('aria-expanded', 'true');
        this._donePanel.show();
      }
    }
  }

  protected trans: TranslationBundle;
  private _backlogColumn: TaskColumn;
  private _doneColumn: TaskColumn;
  private _optionsWidget: KanbanOptionsPanel;
  private _optionsPanel: PanelWithToolbar;
  private _backlogPanel: PanelWithToolbar;
  private _donePanel: PanelWithToolbar;
  private _moreOptionsButton: ToolbarButton;
  private _backlogPanelExpanded: boolean = true;
  private _donePanelExpanded: boolean = true;
}

/**
 * A namespace for TaskListPanel statics.
 */
export namespace TaskListPanel {
  /**
   * The options used to create a TaskListPanel.
   */
  export interface IOptions {
    translator: ITranslator;
  }
}
