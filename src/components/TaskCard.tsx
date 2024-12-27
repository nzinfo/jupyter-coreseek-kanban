import React from 'react';
import { ReactWidget } from '@jupyterlab/ui-components';

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
    
    // Make the widget draggable
    this.node.setAttribute('draggable', 'true');
    this.node.addEventListener('dragstart', this._onDragStart.bind(this));
    this.node.addEventListener('dragend', this._onDragEnd.bind(this));
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

  private _onDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.setData('application/x-task', JSON.stringify(this._data));
    event.dataTransfer.effectAllowed = 'move';
    this.addClass('jp-TaskCard-dragging');
  }

  private _onDragEnd(_event: DragEvent): void {
    this.removeClass('jp-TaskCard-dragging');
  }

  private readonly _data: ITaskData;
}
