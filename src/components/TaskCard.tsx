import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Drag } from '@lumino/dragdrop';
import { MimeData } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';

/**
 * The mime type for kanban tasks.
 */
export const MIME_TYPE = 'application/x-kanban-task';

export interface ITaskData {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
}

/**
 * A draggable task card component
 */
export class TaskCard extends ReactWidget {
  constructor(taskData: ITaskData) {
    super();
    this._data = taskData;
    this.addClass('jp-TaskCard');
  }

  render(): JSX.Element {
    return (
      <div className="jp-TaskCard-content">
        <div className="jp-TaskCard-title">{this._data.title}</div>
        <div className="jp-TaskCard-status">{this._data.status}</div>
      </div>
    );
  }

  get data(): ITaskData {
    return this._data;
  }

  /**
   * Handle the DOM events for the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      default:
        break;
    }
  }

  /**
   * Handle `after-attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * Handle `before-detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
    super.onBeforeDetach(msg);
  }

  private _evtMouseDown(event: MouseEvent): void {
    // Only handle left mouse button
    if (event.button !== 0) {
      return;
    }

    // Create drag image
    const dragImage = this.node.cloneNode(true) as HTMLElement;
    dragImage.style.position = 'absolute';
    dragImage.style.opacity = '0.7';
    document.body.appendChild(dragImage);

    // Create mime data
    const mimeData = new MimeData();
    mimeData.setData(MIME_TYPE, JSON.stringify(this._data));

    // Start drag operation
    const drag = new Drag({
      mimeData,
      dragImage,
      proposedAction: 'move',
      supportedActions: 'move',
      source: this
    });

    drag.start(event.clientX, event.clientY).then(() => {
      document.body.removeChild(dragImage);
    });
  }

  private readonly _data: ITaskData;
}

/**
 * A namespace for TaskCard statics.
 */
export namespace TaskCard {}
