import { Widget } from '@lumino/widgets';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { DocumentWidget } from '@jupyterlab/docregistry';
// import { Message } from '@lumino/messaging';
// import { KanbanModel, ITask, TaskStatus } from './model';
// import { MarkdownSerializer } from './markdown';
// import { Contents } from '@jupyterlab/services';

export class KanbanWidget extends Widget {
  constructor() {
    super();
    this.addClass('jp-KanbanWidget');
    this.node.innerHTML = '<div>Hello World</div>';
  }
}

export class KanbanDocWidget extends DocumentWidget<KanbanWidget, DocumentRegistry.ICodeModel> {
  constructor(options: DocumentWidget.IOptions<KanbanWidget, DocumentRegistry.ICodeModel>) {
    super(options);
  }
}
