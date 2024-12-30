import { TranslationBundle } from '@jupyterlab/translation';
import { PanelWithToolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { saveIcon, undoIcon } from '@jupyterlab/ui-components';
import { CodeEditorWrapper, IEditorServices } from '@jupyterlab/codeeditor';
import { Signal } from '@lumino/signaling';
import { ISharedText, YFile } from '@jupyter/ydoc';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IObservableMap, ObservableMap } from '@jupyterlab/observables';
import { CodeEditor } from '@jupyterlab/codeeditor';

/**
 * A custom implementation of CodeEditor.IModel for collaborative editing
 */
class CollaborativeEditorModel implements CodeEditor.IModel {
  constructor(options: { sharedModel?: YFile } = {}) {
    this._sharedModel = options.sharedModel ?? new YFile();
    this._mimeType = 'text/markdown';
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

/**
 * The header editor panel for the task board
 */
export class TaskBoardHeaderEditor extends PanelWithToolbar {
  constructor(options: TaskBoardHeaderEditor.IOptions) {
    super();
    this.trans = options.trans;
    this.addClass('jp-TaskBoard-headerEditor');
    this.title.label = this.trans.__('Description');

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

    // Create the editor model
    this._editorModel = new CollaborativeEditorModel({
      sharedModel: options.sharedModel
    });

    // Create the editor widget
    this._editor = new CodeEditorWrapper({
      model: this._editorModel,
      factory: options.editorServices.factoryService.newInlineEditor,
      editorOptions: {
        config: {
          readOnly: false,
          lineNumbers: true
        }
      }
    });

    // Add the editor to the panel
    this.addWidget(this._editor);

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

  /**
   * Get the editor content
   */
  getContent(): string {
    return this._editorModel.sharedModel.toString();
  }

  /**
   * Set the editor content
   */
  setContent(content: string): void {
    this._editorModel.sharedModel.setSource(content);
  }

  private _onSave: (() => void) | null = null;
  private _onRevert: (() => void) | null = null;
  protected trans: TranslationBundle;
  private _editor: CodeEditorWrapper;
  private _editorModel: CollaborativeEditorModel;
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

    /**
     * The editor services for creating the editor.
     */
    editorServices: IEditorServices;

    /**
     * The shared model for collaborative editing.
     */
    sharedModel?: YFile;
  }
}
