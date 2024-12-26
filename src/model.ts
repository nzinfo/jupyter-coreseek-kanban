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
    this._isDisposed = true;
    Signal.clearData(this);
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
