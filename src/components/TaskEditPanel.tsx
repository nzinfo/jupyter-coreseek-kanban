import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  ReactWidget,
  ToolbarButton,
  PanelWithToolbar,
  caretLeftIcon,
  caretRightIcon,
  saveIcon,
  closeIcon
} from '@jupyterlab/ui-components';
import { Panel, SplitPanel } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { Message } from '@lumino/messaging';
import React from 'react';

interface ITaskTag {
  name: string;
  color: string;
}

interface ITaskAssignee {
  name: string;
  avatarUrl: string;
}

interface ITask {
  title: string;
  summary: string;
  tags: ITaskTag[];
  assignee: ITaskAssignee;
  details?: string;
}

/**
 * Task details panel content component
 */
class TaskDetailsPanelContent extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskEdit-details-content');
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskEdit-form">
        <div className="jp-TaskEdit-field">
          <label>{this.trans.__('Title')}</label>
          <input
            type="text"
            placeholder={this.trans.__('Enter task title')}
          />
        </div>

        <div className="jp-TaskEdit-field">
          <label>{this.trans.__('Summary')}</label>
          <input
            type="text"
            placeholder={this.trans.__('Enter task summary')}
          />
        </div>

        <div className="jp-TaskEdit-field">
          <label>{this.trans.__('Tags')}</label>
          {/* Tag editor will be added here */}
        </div>

        <div className="jp-TaskEdit-field">
          <label>{this.trans.__('Assignee')}</label>
          {/* Assignee selector will be added here */}
        </div>

        <div className="jp-TaskEdit-field">
          <label>{this.trans.__('Details')}</label>
          {/* Markdown editor will be added here */}
        </div>
      </div>
    );
  }
}

/**
 * Task details panel component
 */
class TaskDetailsPanel extends Panel {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskEdit-details');
    this.addWidget(new TaskDetailsPanelContent(trans));
  }
}

/**
 * Task related items panel content component
 */
class TaskRelatedPanelContent extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskEdit-related-content');
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskEdit-related-list">
        <h3>{this.trans.__('Related Tasks')}</h3>
        {/* Related tasks list will be added here */}
      </div>
    );
  }
}

/**
 * Task related items panel component
 */
class TaskRelatedPanel extends Panel {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskEdit-related');
    this.addWidget(new TaskRelatedPanelContent(trans));
  }
}

/**
 * The main panel for editing tasks
 */
export class TaskEditPanel extends PanelWithToolbar {
  constructor(options: TaskEditPanel.IOptions) {
    // Initialize PanelWithToolbar with correct options
    super();
    
    this.addClass('jp-TaskEdit-panel');
    this.toolbar.addClass('jp-TaskEdit-toolbar');
    this.trans = options.translator.load('jupyter-coreseek-kanban');

    // Create content holder panel
    const contentHolder = new Panel();
    contentHolder.addClass('jp-TaskEdit-contentHolder');

    // Create split panel for main content
    const splitPanel = new SplitPanel({
      orientation: 'vertical',
      spacing: 1
    });
    splitPanel.addClass('jp-TaskEdit-content');

    // Add details panel
    const detailsPanel = new TaskDetailsPanel(this.trans);
    splitPanel.addWidget(detailsPanel);

    // Add related tasks panel
    const relatedPanel = new TaskRelatedPanel(this.trans);
    splitPanel.addWidget(relatedPanel);

    // Set relative sizes (70% details, 30% related)
    splitPanel.setRelativeSizes([0.7, 0.3]);

    // Add split panel to content holder
    contentHolder.addWidget(splitPanel);

    // Add content holder to main panel
    this.addWidget(contentHolder);

    // Add navigation buttons to toolbar (left-aligned)
    const backButton = new ToolbarButton({
      icon: caretLeftIcon,
      onClick: () => {
        console.log('Navigate back');
      },
      tooltip: this.trans.__('Back')
    });
    backButton.addClass('jp-TaskEdit-toolbarButton');
    this.toolbar.addItem('back', backButton);

    const forwardButton = new ToolbarButton({
      icon: caretRightIcon,
      onClick: () => {
        console.log('Navigate forward');
      },
      tooltip: this.trans.__('Forward')
    });
    forwardButton.addClass('jp-TaskEdit-toolbarButton');
    this.toolbar.addItem('forward', forwardButton);

    // Add spacer
    const spacer = new Panel();
    spacer.addClass('jp-TaskEdit-toolbarSpacer');
    this.toolbar.addItem('spacer', spacer);

    // Add save/close button (right-aligned)
    const saveCloseButton = new ToolbarButton({
      icon: options.collaborative ? saveIcon : closeIcon,
      onClick: () => {
        if (options.collaborative) {
          console.log('Auto-saving enabled');
        } else {
          console.log('Save and close');
          this.close();
        }
      },
      tooltip: options.collaborative
        ? this.trans.__('Auto-saving enabled')
        : this.trans.__('Save and close')
    });
    saveCloseButton.addClass('jp-TaskEdit-toolbarButton');
    this.toolbar.addItem('saveClose', saveCloseButton);
  }

  /**
   * Handle close request messages.
   */
  protected onCloseRequest(msg: Message): void {
    this.dispose();
  }

  /**
   * A signal emitted when the task is saved.
   */
  get taskSaved(): Signal<this, ITask> {
    return this._taskSaved;
  }

  protected trans: TranslationBundle;
  private _taskSaved = new Signal<this, ITask>(this);
}

/**
 * A namespace for TaskEditPanel statics.
 */
export namespace TaskEditPanel {
  /**
   * The options used to create a TaskEditPanel.
   */
  export interface IOptions {
    translator: ITranslator;
    collaborative?: boolean;
  }
}
