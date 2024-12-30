import { Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { YFile, DocumentChange, FileChange } from '@jupyter/ydoc'; //  ISharedFile
import { DocumentModel, DocumentRegistry, TextModelFactory } from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';

/**
 * Interface for Kanban model options
 */
export namespace Kanban {
  export interface IModelOptions extends DocumentRegistry.IModelOptions<YFile> {
    /**
     * The shared model for collaborative editing
     */
    sample_name?: string;
  }

  /**
   * Interface for Kanban model
   */
  export interface IModel extends DocumentRegistry.ICodeModel {
    /**
     * The shared model for collaborative editing
     */
    // readonly sharedModel: ISharedFile;

    /**
     * Signal for tracking changes in the model
     */
    readonly changed: Signal<IModel, IChangedArgs<string>>;

    /**
     * Signal emitted when the model's read-only state changes.
     */
    readonly readOnlyChanged: Signal<this, IChangedArgs<boolean>>;

    /**
     * Dispose the model
     */
    dispose(): void;

    /**
     * Check if the model is disposed
     */
    readonly isDisposed: boolean;
  }
}

/**
 * Implementation of Kanban.IModel
 */
export class KanbanModel extends DocumentModel implements Kanban.IModel {
  private _sharedModel: YFile;
  private _changed = new Signal<this, IChangedArgs<string>>(this);
  private _readOnlyChanged = new Signal<this, IChangedArgs<boolean>>(this);
  readonly model_name = 'kanban';

  constructor(options: Kanban.IModelOptions = {}) {
    // Pass all options to parent constructor, including collaborative flag
    super(options);

    // TODO: 不应该 有 new File 的情况。
    this._sharedModel = options.sharedModel ?? new YFile();
    // Connect to the shared model's changed event
    this._sharedModel.changed.connect(this._onSharedModelChanged, this);
    // Initialize with default content if empty
    if (this._sharedModel.getSource().trim() === '') {
      this._sharedModel.setSource('# Task Board\n\nThis is the task board description.');
    }
  }

  get changed(): Signal<this, IChangedArgs<string>> {
    return this._changed;
  }

  get readOnlyChanged(): Signal<this, IChangedArgs<boolean>> {
    return this._readOnlyChanged;
  }

  override dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // Disconnect the event handler
    this._sharedModel.changed.disconnect(this._onSharedModelChanged, this);
    
    Signal.clearData(this);
    super.dispose();
  }

  /**
   * Handler for shared model changes
   */
  private _onSharedModelChanged(sender: YFile, changes: DocumentChange): void {
    console.log('Shared model changed:', changes);
    if ((changes as FileChange).sourceChange) {
      // Emit a change signal with the current source
      this._changed.emit({
        name: 'source',
        oldValue: sender.source,
        newValue: sender.source
      });
      // Update dirty state
      this.dirty = true;
    }
    if (changes.stateChange) {
      changes.stateChange.forEach(value => {
        if (value.name === 'readOnly') {
          this.readOnly = value.newValue;
          this._readOnlyChanged.emit({
            name: 'readOnly',
            oldValue: !value.newValue,
            newValue: value.newValue
          });
        }
      });
    }
  }

  /**
   * Append text to the shared model
   * @param text Text to append
   */
  appendText(text: string): void {
    if (this.readOnly) {
      return;
    }
    const currentSource = this._sharedModel.source;
    const newSource = currentSource + '\n' + text;
    this._sharedModel.setSource(newSource);
    
    // Emit a change signal
    this._changed.emit({
      name: 'source',
      oldValue: currentSource,
      newValue: newSource
    });
  }
}

/**
 * An implementation of a model factory for kanban files.
 */
export class KanbanModelFactory extends TextModelFactory {
  /**
   * The name of the model type.
   *
   * #### Notes
   * This is a read-only property.
   */
  constructor(collaborative?: boolean) {
    super(collaborative);
  }

  get name(): string {
    return 'kanban_model';
  }

  /**
   * The type of the file.
   *
   * #### Notes
   * This is a read-only property.
   */
  get contentType(): Contents.ContentType {
    return 'file';
  }

  /**
   * The format of the file.
   *
   * This is a read-only property.
   */
  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  /**
   * Create a new model.
   *
   * @param options - Model options.
   *
   * @returns A new document model.
   */
  createNew(options: DocumentRegistry.IModelOptions<YFile> = {}): DocumentRegistry.ICodeModel {
    return new KanbanModel(options);
  }
}
