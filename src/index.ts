import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { 
  DocumentRegistry, 
  ABCWidgetFactory, 
  IDocumentWidget,
  TextModelFactory
} from '@jupyterlab/docregistry';
import { Contents } from '@jupyterlab/services';
import { KanbanWidget } from './widget';
import { KanbanModel } from './model';
import { PathExt } from '@jupyterlab/coreutils';
import { IMarkdownViewerTracker } from '@jupyterlab/markdownviewer';

/**
 * An implementation of a model factory for kanban files.
 */
class KanbanModelFactory extends TextModelFactory {
  /**
   * The name of the model type.
   *
   * #### Notes
   * This is a read-only property.
   */
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
  createNew(options: DocumentRegistry.IModelOptions<any> = {}): DocumentRegistry.ICodeModel {
    return new KanbanModel();
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

    // Register the custom file type for .kmd files
    app.docRegistry.addFileType({
      name: 'kanban',
      extensions: ['.kmd'],
      displayName: 'Kanban Board',
      mimeTypes: ['text/markdown']
    });

    // Create and register the model factory
    const modelFactory = new KanbanModelFactory();
    app.docRegistry.addModelFactory(modelFactory);

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
      fileTypes: ['kanban'],
      defaultFor: ['kanban'],
      modelName: 'kanban_model',
      preferKernel: false,
      canStartKernel: false
    });

    // Add a custom widget factory that checks for Kanban files
    app.docRegistry.addWidgetFactory(kanbanFactory);
    /* 
    重要说明： 勿删除
    目前没有办法重载一个已经存在关联的扩展名的 editor, 会被 docmanager-extension 在 onSettingsUpdated 时
    重新设置，通过 setDefaultWidgetFactory
    可以考虑参考 application-extension/src/index.ts 的实现方式，动态设置 defaultViewers
    */

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
