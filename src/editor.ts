import {
  DocumentRegistry,
  IDocumentWidget
} from '@jupyterlab/docregistry';

import {
  IEditorServices,
  CodeEditorWrapper,
  CodeEditor,
  IEditorMimeTypeService
} from '@jupyterlab/codeeditor';

import { ISharedText, YFile } from '@jupyter/ydoc';
import { Widget, BoxLayout } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { Toolbar } from '@jupyterlab/ui-components';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IObservableMap, ObservableMap } from '@jupyterlab/observables';

/**
 * A custom implementation of CodeEditor.IModel
 */
class CollaborativeEditorModel implements CodeEditor.IModel {
  constructor(options: CodeEditor.Model.IOptions = {}) {
    this._sharedModel = options.sharedModel ?? new YFile();
    this._mimeType = options.mimeType ?? IEditorMimeTypeService.defaultMimeType;
    this._selections = new ObservableMap<CodeEditor.ITextSelection[]>();
  }

  get mimeTypeChanged(): Signal<CodeEditor.IModel, IChangedArgs<string>> {
    return this._mimeTypeChanged;
  }

  get selections(): IObservableMap<CodeEditor.ITextSelection[]> {
    return this._selections;
  }

  get mimeType(): string {
    return this._mimeType;
  }
  set mimeType(newValue: string) {
    const oldValue = this._mimeType;
    if (oldValue === newValue) {
      return;
    }
    this._mimeType = newValue;
    this._mimeTypeChanged.emit({
      name: 'mimeType',
      oldValue,
      newValue
    });
  }

  get sharedModel(): ISharedText {
    return this._sharedModel;
  }

  private _mimeType: string;
  private _selections: ObservableMap<CodeEditor.ITextSelection[]>;
  private _mimeTypeChanged = new Signal<CodeEditor.IModel, IChangedArgs<string>>(this);
  private _sharedModel: ISharedText;

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  private _isDisposed = false;
}

export class CollaborativeEditorWidget extends Widget implements IDocumentWidget<Widget, DocumentRegistry.IModel> {
  //readonly revealed = new Signal<this, void>(this);

  constructor(context: DocumentRegistry.Context, editorServices: IEditorServices) {
    super();
    this.addClass('jp-CollaborativeEditor');
    
    // Create layout
    const layout = new BoxLayout();
    this.layout = layout;
    
    // Create toolbar
    this._toolbar = new Toolbar();
    // layout.addWidget(this._toolbar);

    // Initialize the signal
    this._ready = new Signal<this, void>(this);
    this.context = context;

    // Create the editor model
    const editorModel = new CollaborativeEditorModel({
      sharedModel: context.model.sharedModel as YFile,
      mimeType: IEditorMimeTypeService.defaultMimeType
    });

    // Create the editor widget
    const editorWidget = new CodeEditorWrapper({
      model: editorModel,
      factory: editorServices.factoryService.newInlineEditor,
      editorOptions: {
        config: {
          readOnly: false,
          lineNumbers: true
        }
      }
    });

    this._editor = editorWidget;
    layout.addWidget(editorWidget);

    // Set content widget
    this._content = this._editor;

    // Set up collaboration
    // const sharedModel = context.model.sharedModel;
    // sharedModel.changed.connect(this._onModelChanged, this);
    
    void context.ready.then(() => {
      this._ready.emit();
      //this._onModelChanged();
    });

    /*
    // Add a save button to the toolbar
    const saveButton = new ToolbarButton({
      icon: 'ui-components:save',
      onClick: () => {
        void context.save();
      },
      tooltip: 'Save'
    });
    this._toolbar.addItem('save', saveButton);
    */
   
    // Handle collaborative features if available
    if (context.model.collaborative) {
      console.log('Collaborative features are available');
    }
    
    this._revealed = Promise.resolve(undefined);
  }

  readonly context: DocumentRegistry.Context;
  
  get content(): Widget {
    return this._content;
  }

  get toolbar(): Toolbar<Widget> {
    return this._toolbar;
  }

  /**
 * Whether the content widget or an error is revealed.
 */
  get isRevealed(): boolean {
    return this._isRevealed;
  }

  /**
   * A promise that resolves when the widget is revealed.
   */
  get revealed(): Promise<void> {
    return this._revealed;
  }  

  setFragment(fragment: string): void {
    // No-op implementation for fragment handling
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // this._ready.dispose();
    super.dispose();
  }

  private readonly _ready: Signal<this, void>;
  private _editor: CodeEditorWrapper;
  private _toolbar: Toolbar<Widget>;
  private _content: Widget;
  private _isRevealed = false;
  private _revealed: Promise<void>;
}
