import { Widget } from '@lumino/widgets';
import { DragDropManager } from './dragdrop';
import { KanbanTask } from '../model';
import { Signal } from '@lumino/signaling';
import { editIcon, addIcon } from '@jupyterlab/ui-components';
import { TaskCardEditor } from './TaskCardEditor';
import { AssigneeSelector } from './AssigneeSelector';

interface ITaskCardOptions {
  task: KanbanTask;
  editorServices?: any;
}

export class TaskCard extends Widget {
  constructor(options: ITaskCardOptions) {
    super();
    this._task = options.task;
    this._editState = null;
    this._isEditing = false;
    this._editorServices = options.editorServices;
    
    this.addClass('jp-TaskCard');
    
    // 启用拖动
    this._setDraggable(true);
    this.node.addEventListener('dragstart', this);
    this.node.addEventListener('dragend', this);
    this.node.addEventListener('mouseenter', this._showCommands);
    this.node.addEventListener('mouseleave', this._hideCommands);
    
    // 创建浮动命令按钮
    this._commandsContainer = document.createElement('div');
    this._commandsContainer.className = 'jp-TaskCard-commands';
    this._commandsContainer.style.display = 'none';
    
    const editButton = document.createElement('button');
    editButton.className = 'jp-TaskCard-command-button';
    editButton.title = 'Edit';
    editButton.appendChild(editIcon.element({
      stylesheet: 'toolbarButton'
    }));
    editButton.addEventListener('click', this._onEditClick);
    this._commandsContainer.appendChild(editButton);
    
    // 创建卡片内容
    const header = document.createElement('div');
    header.className = 'jp-TaskCard-header';
    
    // 添加拖动把手
    const dragHandle = document.createElement('span');
    dragHandle.className = 'jp-TaskCard-draghandle';
    dragHandle.textContent = '::';
    header.appendChild(dragHandle);

    // 创建标题容器
    this._titleContainer = document.createElement('div');
    this._titleContainer.className = 'jp-TaskCard-title-container';
    this._renderTitle();
    header.appendChild(this._titleContainer);

    // 创建并初始化 AssigneeSelector
    this._assigneeSelector = new AssigneeSelector();
    this._assigneeSelector.setAssignees([
      { name: 'Tom' },
      { name: 'Jerry' }
    ]);
    if (this._task.assignee && this._task.assignee.length > 0) {
      this._assigneeSelector.setCurrentAssignee(this._task.assignee[0]);
    }
    this._assigneeSelector.assigneeChanged.connect(this._handleAssigneeChange);
    header.appendChild(this._assigneeSelector.node);

    const summary = document.createElement('div');
    summary.className = 'jp-TaskCard-summary';
    summary.textContent = this._task.description;
    
    this._tagsContainer = document.createElement('div');
    this._tagsContainer.className = 'jp-TaskCard-tags';

    // Create add tag button
    const addTagButton = document.createElement('div');
    addTagButton.className = 'jp-TaskCard-tag jp-TaskCard-addTag';
    const addIconElement = addIcon.element({
      tag: 'span',
      className: 'jp-TaskCard-addTagIcon'
    });
    addTagButton.appendChild(addIconElement);
    addTagButton.addEventListener('click', this._handleAddTagClick);
    this._tagsContainer.appendChild(addTagButton);

    // Create tag input container (hidden by default)
    this._tagInputContainer = document.createElement('div');
    this._tagInputContainer.className = 'jp-TaskCard-tagInput';
    this._tagInputContainer.style.display = 'none';

    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.className = 'jp-TaskCard-tagInputField';
    tagInput.placeholder = 'Enter tag...';
    tagInput.addEventListener('keydown', this._handleTagInputKeydown);
    tagInput.addEventListener('blur', this._handleTagInputBlur);
    this._tagInputContainer.appendChild(tagInput);
    this._tagsContainer.appendChild(this._tagInputContainer);

    // Render existing tags
    this._renderTags();

    // 添加所有元素到卡片
    this.node.appendChild(this._commandsContainer);
    this.node.appendChild(header);
    this.node.appendChild(summary);
    this.node.appendChild(this._tagsContainer);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._assigneeSelector.dispose();
    super.dispose();
  }

  private _setDraggable(draggable: boolean): void {
    this.node.draggable = draggable;
    if (draggable) {
      this.removeClass('jp-mod-editing');
    } else {
      this.addClass('jp-mod-editing');
    }
  }

  private _renderTitle(): void {
    this._titleContainer.innerHTML = '';
    
    if (this._editState) {
      this._isEditing = true;
      this._setDraggable(false);
      
      const editContainer = document.createElement('div');
      editContainer.className = 'jp-TaskCard-title-edit';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'jp-KanbanOptions-edit-input';
      input.value = this._editState.value;
      input.spellcheck = false;
      
      input.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (this._editState) {
          this._editState.value = target.value;
        }
      });
      
      input.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          this._commitEdit();
        } else if (event.key === 'Escape') {
          this._cancelEdit();
        }
        event.stopPropagation();
      });
      
      input.addEventListener('blur', () => {
        this._commitEdit();
      });
      
      editContainer.appendChild(input);
      this._titleContainer.appendChild(editContainer);
      
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(0, input.value.length);
      });
    } else {
      this._isEditing = false;
      this._setDraggable(true);
      
      const title = document.createElement('span');
      title.className = 'jp-TaskCard-title';
      title.textContent = this._task.title;
      title.addEventListener('click', this._onTitleClick);
      this._titleContainer.appendChild(title);
    }
  }

  private _handleAssigneeChange = (sender: AssigneeSelector, assignee: { name: string; profile?: string }): void => {
    this._task.assignee = [assignee];
    this.taskChanged.emit(this._task);
  };

  private _onTitleClick = (event: MouseEvent): void => {
    this._editState = { value: this._task.title };
    this._renderTitle();
  };

  private _cancelEdit = (): void => {
    this._editState = null;
    this._isEditing = false;
    this._setDraggable(true);
    this._renderTitle();
  };

  private _commitEdit = (): void => {
    if (this._editState && this._editState.value !== this._task.title) {
      this._task.title = this._editState.value;
      this._taskChanged.emit(this._task);
    }
    this._editState = null;
    this._isEditing = false;
    this._setDraggable(true);
    this._renderTitle();
  };

  /**
   * 从父组件中分离此组件
   */
  detach(): void {
    if (this.parent) {
      this.parent.layout?.removeWidget(this);
    }
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
        if (!this._isEditing) {
          this.handleDragStart(event as DragEvent);
        }
        break;
      case 'dragend':
        if (!this._isEditing) {
          this.handleDragEnd(event as DragEvent);
        }
        break
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

  private _showCommands = (): void => {
    this._commandsContainer.style.display = 'flex';
  };

  private _hideCommands = (): void => {
    this._commandsContainer.style.display = 'none';
  };

  private _onEditClick = (event: MouseEvent): void => {
    event.stopPropagation();
    
    // 获取按钮的位置
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    
    // 创建编辑器
    const editor = new TaskCardEditor({
      task: this._task,
      editorServices: this._editorServices
    });
    
    // 设置编辑器位置
    editor.container.node.style.position = 'absolute';
    editor.container.node.style.left = `${buttonRect.left}px`;
    editor.container.node.style.top = `${buttonRect.bottom + 4}px`;
    
    // 监听任务更改
    editor.taskChanged.connect((_, task) => {
      this._task = task;
      this._taskChanged.emit(task);
      this._renderTitle();
    });
    
    // 添加到 body
    document.body.appendChild(editor.node);
  };

  private _renderTags(): void {
    // Clear existing tags (except add button and input)
    const children = Array.from(this._tagsContainer.children);
    children.forEach(child => {
      if (!child.classList.contains('jp-TaskCard-addTag') && 
          !child.classList.contains('jp-TaskCard-tagInput')) {
        child.remove();
      }
    });

    // Add tags after the add button
    this._task.tags?.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'jp-TaskCard-tag';
      tagElement.textContent = tag;
      // Insert after add button but before any existing tags
      this._tagsContainer.insertBefore(
        tagElement,
        this._tagInputContainer
      );
    });
  }

  private _handleAddTagClick = (): void => {
    this._tagInputContainer.style.display = 'block';
    const input = this._tagInputContainer.querySelector('input');
    if (input) {
      input.focus();
    }
  };

  private _handleTagInputKeydown = (event: KeyboardEvent): void => {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter' && input.value.trim()) {
      this._addTag(input.value.trim());
      input.value = '';
      this._tagInputContainer.style.display = 'none';
    } else if (event.key === 'Escape') {
      input.value = '';
      this._tagInputContainer.style.display = 'none';
    }
  };

  private _handleTagInputBlur = (event: FocusEvent): void => {
    const input = event.target as HTMLInputElement;
    if (input.value.trim()) {
      this._addTag(input.value.trim());
    }
    input.value = '';
    this._tagInputContainer.style.display = 'none';
  };

  private _addTag(tag: string): void {
    if (!this._task.tags) {
      this._task.tags = [];
    }
    if (!this._task.tags.includes(tag)) {
      this._task.tags.push(tag);
      this._renderTags();
      this.taskChanged.emit(this._task);
    }
  }

  readonly taskChanged = new Signal<this, KanbanTask>(this);

  private _task: KanbanTask;
  private _editState: { value: string } | null;
  private _isEditing: boolean;
  private _titleContainer: HTMLElement;
  private _commandsContainer: HTMLElement;
  private _assigneeSelector: AssigneeSelector;
  private _taskChanged = this.taskChanged;
  private _editorServices: any;
  private _tagsContainer: HTMLElement;
  private _tagInputContainer: HTMLElement;
}