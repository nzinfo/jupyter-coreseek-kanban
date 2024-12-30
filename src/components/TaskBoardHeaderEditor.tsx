// import React from 'react';
// import { ReactWidget } from '@jupyterlab/ui-components';
import { TranslationBundle } from '@jupyterlab/translation';
import { PanelWithToolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { saveIcon, undoIcon } from '@jupyterlab/ui-components';

/**
 * The header editor panel for the task board
 */
export class TaskBoardHeaderEditor extends PanelWithToolbar {
  constructor(options: TaskBoardHeaderEditor.IOptions) {
    super();
    this.trans = options.trans;
    this.addClass('jp-TaskBoard-headerEditor');
    this.title.label = this.trans.__('Board Description');

    // Add toolbar buttons
    this.toolbar.addItem(
      'revert',
      new ToolbarButton({
        icon: undoIcon,
        onClick: () => {
          if (this._onRevert) {
            this._onRevert();
          }
        },
        tooltip: this.trans.__('Revert changes')
      })
    );

    this.toolbar.addItem(
      'save',
      new ToolbarButton({
        icon: saveIcon,
        onClick: () => {
          if (this._onSave) {
            this._onSave();
          }
        },
        tooltip: this.trans.__('Save changes')
      })
    );

    // Initially hide the panel
    this.hide();
  }

  /**
   * Set the save callback
   */
  setOnSave(callback: () => void): void {
    this._onSave = callback;
  }

  /**
   * Set the revert callback
   */
  setOnRevert(callback: () => void): void {
    this._onRevert = callback;
  }

  private _onSave: (() => void) | null = null;
  private _onRevert: (() => void) | null = null;
  protected trans: TranslationBundle;
}

/**
 * A namespace for TaskBoardHeaderEditor statics.
 */
export namespace TaskBoardHeaderEditor {
  /**
   * The options used to create a TaskBoardHeaderEditor.
   */
  export interface IOptions {
    /**
     * The application language translator.
     */
    trans: TranslationBundle;
  }
}
