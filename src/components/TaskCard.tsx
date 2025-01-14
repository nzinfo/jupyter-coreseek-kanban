import { Widget } from '@lumino/widgets';
import { DragDropManager } from './dragdrop';
import { KanbanTask } from '../model';
import { editIcon } from '@jupyterlab/ui-components';
import { TaskCardEditor } from './TaskCardEditor';
import { AssigneeSelector } from './AssigneeSelector';
import { TagSelector } from './TagSelector';

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
    // this._editorServices = options.editorServices;
    
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
      { name: 'Jerry' },
      { name: 'Spike' },
      { name: 'Morty' },
      { name: 'Bender' },
      { name: 'Fry' },
      { name: 'Leela' },
      { name: 'Homer' },
      { name: 'Maggie' },
      { name: 'Moe' },
      { name: 'Bart' },
      { name: 'Lisa' },
    ]);
    if (this._task.assignee && this._task.assignee.length > 0) {
      this._assigneeSelector.setCurrentAssignee(this._task.assignee[0]);
    } else {
      this._assigneeSelector.setCurrentAssignee();
    }
    this._assigneeSelector.assigneeChanged.connect(this._handleAssigneeChange);
    header.appendChild(this._assigneeSelector.node);

    const summary = document.createElement('div');
    summary.className = 'jp-TaskCard-summary';
    summary.textContent = this._task.description;
    
    // Create tags container
    this._tagsContainer = document.createElement('div');
    this._tagsContainer.className = 'jp-TaskCard-tags';

    // Create tag selector
    this._tagSelector = new TagSelector();
    this._updateTagSelector();
    this._tagSelector.tagToggled.connect((_, tag) => {
      if (!this._task.tags) {
        this._task.tags = [];
      }
      const index = this._task.tags.indexOf(tag.name);
      if (index === -1) {
        // Add tag
        this._task.tags.push(tag.name);
      } else {
        // Remove tag
        this._task.tags.splice(index, 1);
      }
      this._renderTags();
      this._emitTaskChanged(this._task);
    });

    // Add tag selector and render existing tags
    this._tagsContainer.appendChild(this._tagSelector.node);
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
    this._tagSelector.dispose();
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
    this._emitTaskChanged(this._task);
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
      this._emitTaskChanged(this._task);
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
    
    // Get the TaskCard's position and dimensions
    const cardRect = this.node.getBoundingClientRect();
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    
    // Create editor
    const editor = new TaskCardEditor({
      task: this._task,
      // editorServices: this._editorServices
    });
    
    // Calculate available space
    const minEditorHeight = 300; // Minimum height needed for editor
    const minEditorWidth = 300;  // Minimum width needed for editor
    const spaceBelow = window.innerHeight - buttonRect.top;
    const spaceRight = window.innerWidth - cardRect.right;
    const spaceLeft = cardRect.left;
    
    // Set editor position and dimensions based on available space
    editor.container.node.style.position = 'absolute';
    editor.container.node.style.height = `${cardRect.height}px`;
    
    if (spaceBelow >= minEditorHeight) {
      // Default position: below the card
      editor.container.node.style.left = `${cardRect.left}px`;
      editor.container.node.style.top = `${buttonRect.top}px`;
      editor.container.node.style.right = `${window.innerWidth - buttonRect.right}px`;
    } else if (spaceRight >= minEditorWidth) {
      // Position on the right side
      editor.container.node.style.left = `${cardRect.right + 8}px`;
      editor.container.node.style.top = `${cardRect.top}px`;
      editor.container.node.style.width = `${minEditorWidth}px`;
    } else if (spaceLeft >= minEditorWidth) {
      // Position on the left side
      editor.container.node.style.right = `${window.innerWidth - cardRect.left + 8}px`;
      editor.container.node.style.top = `${cardRect.top}px`;
      editor.container.node.style.width = `${minEditorWidth}px`;
    } else {
      // Fallback: position below even if space is limited
      editor.container.node.style.left = `${cardRect.left}px`;
      editor.container.node.style.top = `${buttonRect.top}px`;
      editor.container.node.style.right = `${window.innerWidth - buttonRect.right}px`;
    }
    
    // Listen for task changes
    editor.taskChanged.connect((_, task) => {
      this._task = task;
      this._emitTaskChanged(task);
      this._renderTitle();
    });
    
    // Add to body
    document.body.appendChild(editor.node);
  };

  private _renderTags(): void {
    // Clear existing tags (except tag selector)
    const children = Array.from(this._tagsContainer.children);
    children.forEach(child => {
      if (!child.classList.contains('jp-TagSelector')) {
        child.remove();
      }
    });

    // Add existing tags before the tag selector
    this._task.tags?.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'jp-TaskCard-tag';
      tagElement.textContent = tag;
      this._tagsContainer.insertBefore(
        tagElement,
        this._tagSelector.node
      );
    });
  }

  private _updateTagSelector(): void {
    // Collect all available tags
    const availableTags = new Set<string>();
    
    // Add task ID if it exists
    if (this._task.id) {
      availableTags.add(this._task.id);
    }
    
    // Add existing tags
    if (this._task.tags) {
      this._task.tags.forEach(tag => availableTags.add(tag));
    }

    // Add some demo tags (这里应该从外部获取所有可用的标签)
    ['bug', 'feature', 'documentation', 'enhancement',
      'updated', 'both', 'selector', 'components', 'to', 
      'handle', 'scrolling', 'maximum', 'height', 'and', 
      'scrolling'
    ].forEach(tag => 
      availableTags.add(tag)
    );
    
    // Convert to array of tag objects
    const tagObjects = Array.from(availableTags).map(name => ({ name }));
    
    // Update tag selector
    this._tagSelector.setAvailableTags(tagObjects);
    this._tagSelector.setSelectedTags(
      this._task.tags?.map(t => ({ name: t })) || []
    );
  }

  private _onTaskChanged: ((task: KanbanTask) => void) | null = null;

  /**
   * Set the callback function for task changes
   */
  setTaskChangedCallback(callback: ((task: KanbanTask) => void) | null): void {
    this._onTaskChanged = callback;
  }

  /**
   * Emit task changed event
   */
  private _emitTaskChanged(task: KanbanTask): void {
    if (this._onTaskChanged) {
      this._onTaskChanged(task);
    }
  }

  private _task: KanbanTask;
  private _editState: { value: string } | null;
  private _isEditing: boolean;
  private _titleContainer: HTMLElement;
  private _commandsContainer: HTMLElement;
  private _assigneeSelector: AssigneeSelector;
  private _tagSelector: TagSelector;
  private _tagsContainer: HTMLElement;
  // private _taskChanged = this.taskChanged;
  // private _editorServices: any;
}