import { Signal } from '@lumino/signaling';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { YFile } from '@jupyter/ydoc';

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
  export interface IModel {
    /**
     * The shared model for collaborative editing
     */
    readonly sharedModel: YFile;

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
export class KanbanModel implements Kanban.IModel {
  private _sharedModel: YFile;
  private _isDisposed = false;
  private _changed = new Signal<Kanban.IModel, IChangedArgs<string>>(this);

  constructor(options: Kanban.IModelOptions = {}) {
    this._sharedModel = options.sharedModel ?? new YFile();
    
    // Connect to the shared model's changed event
    this._sharedModel.changed.connect(this._onSharedModelChanged, this);
  }

  get sharedModel(): YFile {
    return this._sharedModel;
  }

  get changed(): Signal<Kanban.IModel, IChangedArgs<string>> {
    return this._changed;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // Disconnect the event handler
    this._sharedModel.changed.disconnect(this._onSharedModelChanged, this);
    
    this._isDisposed = true;
    Signal.clearData(this);
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
 * /
export type Delta<T> = Array<{
  insert?: T;
  delete?: number;
  retain?: number;
}>;

/**
* Changes on a map-like data.
* /
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
