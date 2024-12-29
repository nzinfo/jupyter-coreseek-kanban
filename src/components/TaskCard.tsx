import { Widget } from '@lumino/widgets';

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
    
    // 创建卡片内容
    const header = document.createElement('div');
    header.className = 'jp-TaskCard-header';
    
    const title = document.createElement('span');
    title.className = 'jp-TaskCard-title';
    title.textContent = options.title;
    
    const avatar = document.createElement('img');
    avatar.className = 'jp-TaskCard-avatar';
    avatar.src = options.assignee.avatarUrl;
    avatar.alt = options.assignee.name;
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
} 