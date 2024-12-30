import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget,
  IDocumentWidget
} from '@jupyterlab/docregistry';

import { 
  Signal 
} from '@lumino/signaling';

import { KanbanModel } from './model';
import { PathExt } from '@jupyterlab/coreutils';
import { KanbanLayout } from './components/KanbanLayout';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { IEditorServices } from '@jupyterlab/codeeditor';

/**
 * A widget for Kanban board functionality
 */
export class KanbanWidget extends DocumentWidget<KanbanLayout, DocumentRegistry.IModel> {
  private _model: KanbanModel;
  private _ready: Signal<this, void>;

  constructor(
    context: DocumentRegistry.Context,
    translator: ITranslator,
    editorServices: IEditorServices
  ) {
    // Create the main layout widget
    const content = new KanbanLayout({
      translator: translator || nullTranslator,
      editorServices: editorServices,
      model: context.model
    });
    
    // Call the parent constructor
    super({ context, content });

    // Initialize the ready signal
    this._ready = new Signal<this, void>(this);

    // Create the Kanban model
    if (!(context.model instanceof KanbanModel)) {
      console.warn('Model is not a KanbanModel instance:', context.model);
    }
    this._model = context.model as KanbanModel;

    // Handle context ready
    void context.ready.then(() => {
      this._ready.emit();
    });
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

/**
 * A widget factory for Kanban widgets.
 */
export class KanbanWidgetFactory extends ABCWidgetFactory<
  IDocumentWidget,
  DocumentRegistry.IModel
> {
  readonly defaultWidgetFactory: DocumentRegistry.WidgetFactory;
  private _editorServices: IEditorServices;

  constructor(
    defaultFactory: DocumentRegistry.WidgetFactory,
    options: DocumentRegistry.IWidgetFactoryOptions<IDocumentWidget>,
    editorServices: IEditorServices,
    translator?: ITranslator,
  ) {
    super(options);
    this.defaultWidgetFactory = defaultFactory;
    this._editorServices = editorServices;
  }

  /**
   * Check if the file should be opened with Kanban widget
   * @param context Document context
   */
  isKanbanFile(context: DocumentRegistry.Context): boolean {
    const name = PathExt.basename(context.path).toLowerCase();
    return name.endsWith('.kmd');
  }

  /**
   * Create a new widget for the document
   * @param context Document context
   */
  createNewWidget(context: DocumentRegistry.Context): IDocumentWidget {
    if (!this.isKanbanFile(context)) {
      return this.defaultWidgetFactory.createNew(context);
    }
    
    return new KanbanWidget(context, this.translator, this._editorServices);
  }
}
