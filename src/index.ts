import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  IDocumentManager,
  // IDocumentWidgetOpener,
} from '@jupyterlab/docmanager';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentRegistry, ABCWidgetFactory } from '@jupyterlab/docregistry';
import { CollaborativeEditorWidget } from './editor';

/**
 * A widget factory for collaborative editors.
 */
class CollaborativeEditorFactory extends ABCWidgetFactory<
  CollaborativeEditorWidget,
  DocumentRegistry.IModel
> {
  private editorServices: IEditorServices;
  private sharedWidget: CollaborativeEditorWidget | null = null;

  constructor(options: DocumentRegistry.IWidgetFactoryOptions<CollaborativeEditorWidget>, editorServices: IEditorServices) {
    super(options);
    this.editorServices = editorServices;
  }

  protected createNewWidget(context: DocumentRegistry.Context): CollaborativeEditorWidget {
    if (!this.sharedWidget) {
      this.sharedWidget = new CollaborativeEditorWidget(context, this.editorServices);
    }
    return this.sharedWidget;
  }
}

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coreseek/jupyter-kanban:plugin',
  description: 'A JupyterLab extension for collaborative Kanban boards',
  autoStart: true,
  requires: [IDocumentManager, IFileBrowserFactory, IEditorServices],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    browserFactory: IFileBrowserFactory,
    editorServices: IEditorServices,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // Register the editor factory
    const factory = new CollaborativeEditorFactory({
      name: 'Kanban Editor',
      fileTypes: ['markdown'],
      defaultFor: ['markdown']
    }, editorServices);

    app.docRegistry.addWidgetFactory(factory);

    // Create and register the right panel
    const widget = docManager.openOrReveal('kanban.md', 'Kanban Editor');
    if (widget) {
      widget.id = 'collaborative-editor-panel';
      widget.title.label = 'Collaborative Editor';
      widget.title.closable = true;
      
      app.shell.add(widget, 'right', { rank: 1000 });
    }

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('@coreseek/jupyter-kanban settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @coreseek/jupyter-kanban.', reason);
        });
    }
  }
};

export default plugin;
