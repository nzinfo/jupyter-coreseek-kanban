import { SplitPanel } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { TaskListPanel } from './TaskListPanel';
import { TaskBoardPanel } from './TaskBoardPanel';

/**
 * The main layout for the Kanban board.
 */
export class KanbanLayout extends SplitPanel {
  constructor(options: KanbanLayout.IOptions) {
    super({
      orientation: 'horizontal',
      renderer: SplitPanel.defaultRenderer,
      spacing: 1
    });

    this._translator = options.translator || nullTranslator;
    this._commands = options.commands;
    
    // Create left panel widget
    this._tasklistWidget = new TaskListPanel({ 
      translator: this._translator,
      commands: this._commands
    });
    this._tasklistWidget.addClass('jp-KanbanLayout-right');
    
    // Create right panel widget
    this._boardWidget = new TaskBoardPanel({ translator: this._translator });
    this._boardWidget.addClass('jp-KanbanLayout-left');
    
    // Add widgets to the split panel
    this.addWidget(this._boardWidget);
    this.addWidget(this._tasklistWidget);
    
    // Set the relative sizes of the panels (90% left, 10% right)
    this.setRelativeSizes([0.9, 0.1]);
    
    this.id = 'jp-kanban-layout';
    this.addClass('jp-KanbanLayout');
  }

  /**
   * Toggle the visibility of the task list panel
   */
  toggleTaskList(visible?: boolean): void {
    if (visible === undefined) {
      visible = !this._tasklistWidget.isVisible;
    }
    
    this._tasklistWidget.setHidden(!visible);
    
    // Adjust the relative sizes
    if (visible) {
      this.setRelativeSizes([0.9, 0.1]);
    } else {
      this.setRelativeSizes([1, 0]);
    }
  }

  /**
   * Get the task board panel
   */
  get boardWidget(): TaskBoardPanel {
    return this._boardWidget;
  }

  /**
   * Handle `'after-attach'` messages.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }

  /**
   * Handle `'update-request'` messages.
   */
  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
  }

  protected readonly _translator: ITranslator;
  private _commands: CommandRegistry | undefined;
  private _tasklistWidget: TaskListPanel;
  private _boardWidget: TaskBoardPanel;
}

/**
 * A namespace for KanbanLayout statics.
 */
export namespace KanbanLayout {
  /**
   * The options used to create a KanbanLayout.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator?: ITranslator;
    commands?: CommandRegistry;
  }
}
