import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import { KanbanWidget, KanbanDocWidget } from './widget';

export class KanbanFactory extends ABCWidgetFactory<KanbanDocWidget, DocumentRegistry.ICodeModel> {
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    super(options);
  }

  protected createNewWidget(
    context: DocumentRegistry.IContext<DocumentRegistry.ICodeModel>
  ): KanbanDocWidget {
    const content = new KanbanWidget();
    const widget = new KanbanDocWidget({ content, context });
    return widget;
  }
}
