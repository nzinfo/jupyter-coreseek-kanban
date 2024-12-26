import {
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';

import {
  IEditorServices,
  CodeEditorWrapper,
  CodeEditor,
  IEditorMimeTypeService
} from '@jupyterlab/codeeditor';

import { ISharedText, YFile } from '@jupyter/ydoc';
import { Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { ToolbarButton } from '@jupyterlab/apputils';
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

export class CollaborativeEditorWidget extends DocumentWidget<Widget, DocumentRegistry.IModel> {
  constructor(context: DocumentRegistry.Context, editorServices: IEditorServices) {
    const content = new Widget();
    content.addClass('jp-CollaborativeEditor');
    super({ context, content });

    // Initialize the signal before using it
    this._ready = new Signal<this, void>(this);

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
    content.node.appendChild(editorWidget.node);

    // Set up collaboration
    const sharedModel = context.model.sharedModel;
    sharedModel.changed.connect(this._onModelChanged, this);
    
    void context.ready.then(() => {
      this._ready.emit();
      this._onModelChanged();
    });

    // Add a save button to the toolbar
    const saveButton = new ToolbarButton({
      icon: 'ui-components:save',
      onClick: () => {
        void context.save();
      },
      tooltip: 'Save'
    });
    this.toolbar.addItem('save', saveButton);

    // Handle collaborative features if available
    if (context.model.collaborative) {
      console.log('Collaborative features are available');
      // TODO: Implement collaborative features when API is available
    }
  }

  private _onModelChanged(): void {
    /*
    const handler = (sender: ISharedText, args: SourceChange) => {
        expect(args.sourceChange).toEqual([{ insert: 'foo' }]);
        called = true;
      };
      model.sharedModel.changed.connect(handler);
    */
    if (!this._editor) {
      return;
    }
    const model = this.context.model;
    const editorModel = this._editor.editor.model;
    const currentSource = editorModel.sharedModel.source;
    const modelSource = model.toString();

    console.log('Model change detected:', {
      currentSource: currentSource.slice(0, 100) + '...', 
      modelSource: modelSource.slice(0, 100) + '...'
    });

    // Only update if sources are different to prevent recursive updates
    if (currentSource !== modelSource) {
      console.log('Updating shared model source');
      editorModel.sharedModel.setSource(modelSource);
    }
  }

  private _ready: Signal<this, void>;
  private _editor: CodeEditorWrapper;

  get ready(): Signal<this, void> {
    return this._ready;
  }
}
