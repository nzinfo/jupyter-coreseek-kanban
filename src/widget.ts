import {
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';

import { 
  Widget 
} from '@lumino/widgets';

import { 
  ToolbarButton 
} from '@jupyterlab/apputils';

import { 
  Signal 
} from '@lumino/signaling';

import { KanbanModel } from './model';
import { YFile } from '@jupyter/ydoc';

/**
 * A widget for Kanban board functionality
 */
export class KanbanWidget extends DocumentWidget<Widget, DocumentRegistry.IModel> {
  private _model: KanbanModel;
  private _ready: Signal<this, void>;

  constructor(
    context: DocumentRegistry.Context
  ) {
    // Create a main content widget
    const content = new Widget();
    content.addClass('jp-KanbanWidget');
    
    // Call the parent constructor
    super({ context, content });

    // Initialize the ready signal
    this._ready = new Signal<this, void>(this);

    // Create the Kanban model
    this._model = new KanbanModel({
      sharedModel: context.model.sharedModel as YFile
    });

    // Create a "Hello World" button
    const helloButton = new ToolbarButton({
      label: 'Add Hello World',
      onClick: () => this._onHelloButtonClicked()
    });

    // Add the button to the toolbar
    this.toolbar.addItem('hello', helloButton);

    // Append the button to the content
    content.node.appendChild(helloButton.node);

    // Handle context ready
    void context.ready.then(() => {
      this._ready.emit();
    });
  }

  /**
   * Handler for the Hello World button click
   */
  private _onHelloButtonClicked(): void {
    // Append "hello world" to the shared model
    this._model.appendText('hello world');
  }

  /**
   * Getter for the ready signal
   */
  get ready(): Signal<this, void> {
    return this._ready;
  }

  /**
   * Dispose the widget
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._model.dispose();
    super.dispose();
  }
}
