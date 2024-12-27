import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { DocumentRegistry, ABCWidgetFactory, IDocumentWidget } from '@jupyterlab/docregistry';
import { CollaborativeEditorWidget } from './editor';
import { KanbanWidget } from './widget';
import { PathExt } from '@jupyterlab/coreutils';
import { IMarkdownViewerTracker } from '@jupyterlab/markdownviewer';


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
  IDocumentWidget,
  DocumentRegistry.IModel
> {
  constructor(
    defaultFactory: DocumentRegistry.WidgetFactory,
    options: DocumentRegistry.IWidgetFactoryOptions<IDocumentWidget>
  ) {
    super(options);
    this.defaultWidgetFactory = defaultFactory;
  }

  /**
   * Check if the file should be opened with Kanban widget
   * @param context Document context
   */
  static isKanbanFile(context: DocumentRegistry.Context): boolean {
    const fileName = PathExt.basename(context.path);
    return fileName.toLowerCase().includes('kanban');
  }

  /**
   * Create a new widget for the document
   * @param context Document context
   */
  protected createNewWidget(context: DocumentRegistry.Context): IDocumentWidget {
    if (!KanbanWidgetFactory.isKanbanFile(context)) {
      return this.defaultWidgetFactory.createNew(context) as IDocumentWidget;
    }
    return new KanbanWidget(context);
  }

  readonly defaultWidgetFactory: DocumentRegistry.WidgetFactory;
}

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coreseek/jupyter-kanban:plugin',
  description: 'A JupyterLab extension for collaborative Kanban boards',
  autoStart: true,
  requires: [IFileBrowserFactory, IEditorServices],
  optional: [ISettingRegistry, IMarkdownViewerTracker],
  activate: (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    editorServices: IEditorServices,
    settingRegistry: ISettingRegistry | null,
    tracker?: IMarkdownViewerTracker
  ) => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // const defualtFactory = app.docRegistry.defaultWidgetFactory();

    // Register the editor factory
    const editorFactory = new CollaborativeEditorFactory({
      name: 'Kanban Editor',
      fileTypes: ['markdown'],
      defaultFor: []
    }, editorServices);

    /**
    const factory = new MarkdownViewerFactory({
      rendermime,
      name: FACTORY,
      primaryFileType: docRegistry.getFileType('markdown'),
      fileTypes: ['markdown'],
      defaultRendered: ['markdown']
    });
     */

    app.docRegistry.addWidgetFactory(editorFactory);

    // 获取 markdown 文件类型
    const markdownFileType = app.docRegistry.getFileType('markdown');
    if (!markdownFileType) {
      console.warn('Markdown file type not found in registry');
      return;
    }

    // 获取该文件类型的默认工厂
    const defaultFactory = app.docRegistry.defaultWidgetFactory("__.md");

    // Register the Kanban widget factory
    const kanbanFactory = new KanbanWidgetFactory(defaultFactory, {
      name: 'Kanban Widget',
      fileTypes: ['text'],
      defaultFor: ['text'],
      preferKernel: false,
      canStartKernel: false
    });

    // Add a custom widget factory that checks for Kanban files
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
