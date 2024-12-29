import { Widget } from '@lumino/widgets';
// import { addIcon } from '@jupyterlab/ui-components';

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

class SimpleTag extends Widget {
  constructor(tag: string, color: string) {
    super();
    this.addClass('jp-CellTag');
    this.node.textContent = tag;
    this.node.style.backgroundColor = color;
    this.node.style.color = 'white'; // 确保文字颜色为白色
    this.node.style.padding = '0 8px';
    this.node.style.borderRadius = '3px';
    this.node.style.display = 'inline-block';
    this.node.style.height = '20px';
    this.node.style.lineHeight = '20px';
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
      const tagWidget = new SimpleTag(tag.name, tag.color);
      tagsContainer.appendChild(tagWidget.node);
    });
    
    // 将所有元素添加到 Widget 的 node 中
    this.node.appendChild(header);
    this.node.appendChild(summary);
    this.node.appendChild(tagsContainer);
  }
} 