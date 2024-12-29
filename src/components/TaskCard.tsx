import { Widget } from '@lumino/widgets';
import { DragDropManager } from './dragdrop';

interface ITaskCardOptions {
  title: string;
  summary: string;
  tags: Array<{
    name: string;
    color: string;
  }>;
  assignee: {
    name: string;
    avatarUrl: string;
  };
}

class CellTagComponent extends Widget {
  constructor(name: string) {
    super();
    this.addClass('jp-CellTag');
    
    const tagName = document.createElement('span');
    tagName.className = 'jp-CellTag-label';
    tagName.textContent = name;
    
    this.node.appendChild(tagName);
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
    
    // 创建卡片内容
    const header = document.createElement('div');
    header.className = 'jp-TaskCard-header';
    
    const title = document.createElement('span');
    title.className = 'jp-TaskCard-title';
    title.textContent = options.title;
    
    let avatar: HTMLElement;
    if (options.assignee.avatarUrl) {
      // 如果有头像URL，使用img标签
      const imgAvatar = document.createElement('img');
      imgAvatar.src = options.assignee.avatarUrl;
      imgAvatar.alt = options.assignee.name;
      avatar = imgAvatar;
    } else {
      // 如果没有头像URL，创建一个显示首字母的div
      avatar = document.createElement('div');
      avatar.textContent = options.assignee.name.charAt(0);
    }
    avatar.className = 'jp-TaskCard-avatar';
    avatar.title = options.assignee.name;
    
    header.appendChild(title);
    header.appendChild(avatar);
    
    const summary = document.createElement('div');
    summary.className = 'jp-TaskCard-summary';
    summary.textContent = options.summary;
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'jp-CellTags';
    
    options.tags.forEach(tag => {
      const tagWidget = new CellTagComponent(tag.name);
      tagsContainer.appendChild(tagWidget.node);
    });
    
    // 将所有元素添加到 Widget 的 node 中
    this.node.appendChild(header);
    this.node.appendChild(summary);
    this.node.appendChild(tagsContainer);
  }

  /**
   * 从父组件中分离此组件
   */
  detach(): void {
    if (this.parent) {
      this.parent.layout?.removeWidget(this);
    }
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
} 