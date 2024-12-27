import React from 'react';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  FilterBox,
  PanelWithToolbar,
  ReactWidget,
  addIcon,
  SidePanel,
  ToolbarButton,
  ToolbarButtonComponent,
  caretUpEmptyThinIcon,
  caretDownEmptyThinIcon,
  ellipsesIcon
} from '@jupyterlab/ui-components';

/**
 * Task board header component
 */
class TaskBoardHeader extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
    this.addClass('jp-TaskBoard-header');
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskBoard-header">
        <FilterBox
          placeholder={this.trans.__('Search tasks...')}
          updateFilter={() => {}}
          useFuzzyFilter={false}
          caseSensitive={false}
          disabled={false}
        />
        <h2>{this.trans.__('Task Board')}</h2>
        <ToolbarButtonComponent
          icon={ellipsesIcon}
          onClick={() => {
            console.log('More options clicked');
          }}
          tooltip={this.trans.__('More options')}
        />
      </div>
    );
  }
}

/**
 * Task board content component
 */
class TaskBoardContent extends ReactWidget {
  constructor(protected trans: TranslationBundle) {
    super();
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskBoard-content">
        <div className="jp-TaskBoard-columns">
          <div className="jp-TaskBoard-column">
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Todo')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Todo tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column">
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Doing')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Doing tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column">
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Review')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Review tasks will go here */}
            </div>
          </div>
          <div className="jp-TaskBoard-column">
            <div className="jp-TaskBoard-columnHeader">
              <h3>{this.trans.__('Done')}</h3>
            </div>
            <div className="jp-TaskBoard-columnContent">
              {/* Done tasks will go here */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * The main panel for displaying the task board
 */
export class TaskBoardPanel extends SidePanel {
  constructor(options: TaskBoardPanel.IOptions) {
    const { translator } = options;
    super({ translator });
    
    this.addClass('jp-TaskBoard-panel');
    this.trans = translator.load('jupyter-coreseek-kanban');

    // Add header
    this.header.addWidget(new TaskBoardHeader(this.trans));

    // Add main content panel with toolbar
    const contentPanel = new PanelWithToolbar();
    contentPanel.addClass('jp-TaskBoard-section');
    contentPanel.title.label = 'main';

    // Add move up/down and new task buttons to toolbar
    contentPanel.toolbar.addItem(
      'moveUp',
      new ToolbarButton({
        icon: caretUpEmptyThinIcon,
        onClick: () => {
          console.log('Move up clicked');
        },
        tooltip: this.trans.__('Move up')
      })
    );

    contentPanel.toolbar.addItem(
      'moveDown',
      new ToolbarButton({
        icon: caretDownEmptyThinIcon,
        onClick: () => {
          console.log('Move down clicked');
        },
        tooltip: this.trans.__('Move down')
      })
    );

    contentPanel.toolbar.addItem(
      'newTask',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          console.log('Add new task clicked');
        },
        tooltip: this.trans.__('Add new task')
      })
    );

    // Add task board content
    contentPanel.addWidget(new TaskBoardContent(this.trans));
    this.addWidget(contentPanel);
  }

  protected trans: TranslationBundle;
}

/**
 * A namespace for TaskBoardPanel statics.
 */
export namespace TaskBoardPanel {
  /**
   * The options used to create a TaskBoardPanel.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    translator: ITranslator;
  }
}
