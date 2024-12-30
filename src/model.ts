import { Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { YFile } from '@jupyter/ydoc'; //  ISharedFile
import { DocumentModel, DocumentRegistry, TextModelFactory } from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';
// import { ISharedFile } from '@jupyterlab/shared-models';

/**
 * Interface for Kanban model options
 */
export namespace Kanban {
  export interface IModelOptions {
    sharedModel?: YFile;
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
  readonly model_name = 'kanban';

  constructor(options: Kanban.IModelOptions = {}) {
    super({ sharedModel: options.sharedModel });
    this._sharedModel = options.sharedModel ?? new YFile();
    
    // Connect to the shared model's changed event
    this._sharedModel.changed.connect(this._onSharedModelChanged, this);
    
  }

  // override get sharedModel(): ISharedFile {
  //    return this._sharedModel;
  // }

  get changed(): Signal<this, IChangedArgs<string>> {
    return this._changed;
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
  private _onSharedModelChanged(sender: YFile, args: any): void {
    console.log('Shared model changed:', args);
/*
 * 重要注释： 勿删除
 *
 * Changes on Sequence-like data are expressed as Quill-inspired deltas.
 *
 * @source https://quilljs.com/docs/delta/
 * 
export type Delta<T> = Array<{
  insert?: T;
  delete?: number;
  retain?: number;
}>;

export type MapChanges = Map<string, {
  action: 'add' | 'update' | 'delete';
  oldValue: any;
}>;
@jupyter/ydoc/lib/api.d.ts

Eg:
    {
      "sourceChange": [
        {
          "retain": 36
        },
        {
          "delete": 11
        },
        {
          "insert": "1"
        }
      ]
    }
    */
    // Emit a change signal with the current source
    this._changed.emit({
      name: 'source',
      oldValue: sender.source,
      newValue: sender.source
    });
  }

  /**
   * Append text to the shared model
   * @param text Text to append
   */
  appendText(text: string): void {
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
