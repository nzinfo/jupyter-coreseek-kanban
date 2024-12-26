import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentRegistry, ABCWidgetFactory } from '@jupyterlab/docregistry';
import { CollaborativeEditorWidget } from './editor';
import { KanbanWidget } from './widget';

/**
 * A widget factory for collaborative editors.
 */
class CollaborativeEditorFactory extends ABCWidgetFactory<
  CollaborativeEditorWidget,
  DocumentRegistry.IModel
> {
  private editorServices: IEditorServices;

  constructor(options: DocumentRegistry.IWidgetFactoryOptions<CollaborativeEditorWidget>, editorServices: IEditorServices) {
    super(options);
    this.editorServices = editorServices;
  }

  protected createNewWidget(context: DocumentRegistry.Context): CollaborativeEditorWidget {
    return new CollaborativeEditorWidget(context, this.editorServices);
  }
}

/**
 * A widget factory for Kanban widgets.
 */
class KanbanWidgetFactory extends ABCWidgetFactory<
  KanbanWidget,
  DocumentRegistry.IModel
> {
  constructor(options: DocumentRegistry.IWidgetFactoryOptions<KanbanWidget>) {
    super(options);
  }

  protected createNewWidget(context: DocumentRegistry.Context): KanbanWidget {
    return new KanbanWidget(context);
  }
}

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coreseek/jupyter-kanban:plugin',
  description: 'A JupyterLab extension for collaborative Kanban boards',
  autoStart: true,
  requires: [IFileBrowserFactory, IEditorServices],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    editorServices: IEditorServices,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // Register the editor factory
    const editorFactory = new CollaborativeEditorFactory({
      name: 'Kanban Editor',
      fileTypes: ['markdown'],
      defaultFor: []
    }, editorServices);

    app.docRegistry.addWidgetFactory(editorFactory);

    // Register the Kanban widget factory
    const kanbanFactory = new KanbanWidgetFactory({
      name: 'Kanban Widget',
      fileTypes: ['markdown'],
      defaultFor: []
    });

    app.docRegistry.addWidgetFactory(kanbanFactory);

    // Add the context menu item
    app.commands.addCommand('kanban:open', {
      label: 'Open as Kanban',
      execute: () => {
        const widget = browserFactory.tracker.currentWidget;
        if (!widget) {
          return;
        }
        const selectedItem = widget.selectedItems().next().value;
        if (selectedItem) {
          const path = selectedItem.path;
          app.commands.execute('docmanager:open', {
            path,
            factory: 'Kanban Widget'
          });
        }
      }
    });

    app.contextMenu.addItem({
      command: 'kanban:open',
      selector: '.jp-DirListing-item',
      rank: 1
    });

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
