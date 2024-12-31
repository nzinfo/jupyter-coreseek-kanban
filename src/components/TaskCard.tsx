import { Widget } from '@lumino/widgets';
import { DragDropManager } from './dragdrop';
import { KanbanTask } from '../model';

interface ITaskCardOptions {
  task: KanbanTask;
}

class CellTagComponent extends Widget {
  constructor(name: string) {
    super();
    this.addClass('jp-CellTag');
    this.node.textContent = name;
  }
}

export class TaskCard extends Widget {
  constructor(options: ITaskCardOptions) {
    super();
    this.addClass('jp-TaskCard');
    
    // 启用拖动
    this.node.draggable = true;
    this.node.addEventListener('dragstart', this);
    this.node.addEventListener('dragend', this);
    
    this._task = options.task;
    this._createContent();
  }

  get task(): KanbanTask {
    return this._task;
  }

  /**
   * Handle the DOM events for the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dragstart':
        this.handleDragStart(event as DragEvent);
        break;
      case 'dragend':
        this.handleDragEnd(event as DragEvent);
        break;
    }
  }

  private handleDragStart(event: DragEvent): void {
    event.stopPropagation();
    event.dataTransfer?.setData('application/x-taskcard', 'true');
    DragDropManager.dragSource = this;
    event.dataTransfer!.effectAllowed = 'move';
  }

  private handleDragEnd(event: DragEvent): void {
    event.stopPropagation();
    DragDropManager.dragSource = null;
  }

  private _createContent(): void {
    // 创建卡片内容
    const header = document.createElement('div');
    header.className = 'jp-TaskCard-header';
    
    const title = document.createElement('span');
    title.className = 'jp-TaskCard-title';
    title.textContent = this._task.title;
    header.appendChild(title);
    
    // Add assignee if exists
    if (this._task.assignee) {
      const avatar = document.createElement('div');
      avatar.className = 'jp-TaskCard-avatar';
      avatar.textContent = this._task.assignee.name.charAt(0).toUpperCase();
      avatar.title = this._task.assignee.name;
      header.appendChild(avatar);
    }
    
    // Add description
    if (this._task.description) {
      const description = document.createElement('div');
      description.className = 'jp-TaskCard-description';
      description.textContent = this._task.description;
      this.node.appendChild(description);
    }
    
    // Add detail file indicator if exists
    if (this._task.detailFile) {
      const detailIndicator = document.createElement('div');
      detailIndicator.className = 'jp-TaskCard-detail';
      detailIndicator.innerHTML = '<span class="jp-FileIcon"></span>';
      detailIndicator.title = this._task.detailFile;
      this.node.appendChild(detailIndicator);
    }
    
    // Add tags
    if (this._task.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'jp-CellTags';
      
      this._task.tags.forEach(tag => {
        const tagWidget = new CellTagComponent(tag);
        tagsContainer.appendChild(tagWidget.node);
      });
      
      this.node.appendChild(tagsContainer);
    }
    
    // 将所有元素添加到 Widget 的 node 中
    this.node.appendChild(header);
  }

  private _task: KanbanTask;
}