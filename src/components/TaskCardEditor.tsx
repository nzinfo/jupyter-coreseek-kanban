import { Panel } from '@lumino/widgets';
import { KanbanTask } from '../model';
import { Signal } from '@lumino/signaling';
import { saveIcon } from '@jupyterlab/ui-components';

interface ITaskCardEditorOptions {
  task: KanbanTask;
}

/**
 * Task card editor component for editing task details
 */
export class TaskCardEditor extends Panel {
  constructor(options: ITaskCardEditorOptions) {
    super();
    this._task = options.task;
    this._taskChanged = new Signal<this, KanbanTask>(this);

    this.addClass('jp-TaskCardEditor-overlay');
    
    // Create main container
    this._container = new Panel();
    this._container.addClass('jp-TaskCardEditor-container');
    
    // Create editor content
    const editorContent = new Panel();
    editorContent.addClass('jp-TaskCardEditor-content');
    
    // Create textarea
    this._textarea = document.createElement('textarea');
    this._textarea.className = 'jp-TaskCardEditor-textarea';
    this._textarea.value = this._task.description;
    this._textarea.placeholder = 'Enter task description...';
    this._textarea.spellcheck = false;
    
    // Create save button
    const saveButton = document.createElement('button');
    saveButton.className = 'jp-TaskCardEditor-saveButton';
    saveButton.title = 'Save';
    saveButton.appendChild(saveIcon.element({
      stylesheet: 'toolbarButton'
    }));
    saveButton.addEventListener('click', this._handleSave);
    
    // Add components to editor content
    editorContent.node.appendChild(this._textarea);
    editorContent.node.appendChild(saveButton);
    
    // Add editor content to container
    this._container.addWidget(editorContent);
    
    // Add container to overlay
    this.addWidget(this._container);
    
    // Add keyboard shortcuts
    this.node.addEventListener('keydown', this._handleKeyDown);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.node.removeEventListener('keydown', this._handleKeyDown);
    super.dispose();
  }

  get taskChanged(): Signal<this, KanbanTask> {
    return this._taskChanged;
  }

  get container(): Panel {
    return this._container;
  }
  
  private _handleSave = (): void => {
    const newDescription = this._textarea.value.trim();
    if (newDescription !== this._task.description) {
      this._task.description = newDescription;
      this._taskChanged.emit(this._task);
    }
    this.dispose();
  };

  private _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.dispose();
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      this._handleSave();
    }
  };

  private _task: KanbanTask;
  private _container: Panel;
  private _textarea: HTMLTextAreaElement;
  private _taskChanged: Signal<this, KanbanTask>;
}
