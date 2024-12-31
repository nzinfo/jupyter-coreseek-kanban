import { TranslationBundle } from '@jupyterlab/translation';
import { Panel } from '@lumino/widgets';
import { TaskCard } from './TaskCard';
import { DragDropManager } from './dragdrop';
import { KanbanColumn, KanbanTask } from '../model';

/**
 * Task column component showing tasks in a specific status
 */
export class TaskColumn extends Panel {
  constructor(trans: TranslationBundle, column?: KanbanColumn) {
    super();
    this.addClass('jp-TaskColumn');
    this._column = column || null;

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

    // 创建初始任务
    this._createContent();
  }

  /**
   * Set column data
   */
  setColumn(column: KanbanColumn) {
    this._column = column;
    this._createContent();
  }

  /**
   * Get current column
   */
  get column(): KanbanColumn | null {
    return this._column;
  }

  /**
   * Set callback for task moved event
   */
  setTaskMovedCallback(callback: (task: KanbanTask, column: KanbanColumn) => void) {
    this._onTaskMoved = callback;
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
    // 检查是否有正在拖拽的源
    if (DragDropManager.dragSource) {
      event.preventDefault();
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

        // 通知任务移动
        if (this._onTaskMoved && this._column) {
          this._onTaskMoved(source.task, this._column);
        }
      }
      
      DragDropManager.dragSource = null;
    }
  }

  private _createContent(): void {
    // Clear existing content
    this.widgets.forEach(widget => widget.dispose());

    // Create tasks
    if (this._column) {
      this._column.tasks.forEach(task => {
        const card = new TaskCard({ task });
        this.addWidget(card);
      });
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
  private _column: KanbanColumn | null = null;
  private _onTaskMoved: ((task: KanbanTask, column: KanbanColumn) => void) | null = null;
}