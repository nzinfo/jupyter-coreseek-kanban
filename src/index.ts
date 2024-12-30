import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { KanbanWidgetFactory } from './widget';
import { KanbanModelFactory } from './model';
import { IMarkdownViewerTracker } from '@jupyterlab/markdownviewer';
import { addCommands } from './commands';

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@coreseek/jupyter-kanban:plugin',
  description: 'A JupyterLab extension for collaborative Kanban boards',
  autoStart: true,
  requires: [IFileBrowserFactory, IEditorServices, ICommandPalette, ITranslator],
  optional: [ISettingRegistry, IMarkdownViewerTracker],
  activate: (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    editorServices: IEditorServices,
    palette: ICommandPalette,
    translator: ITranslator,
    settingRegistry: ISettingRegistry | null,
    tracker?: IMarkdownViewerTracker
  ) => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // Add commands
    addCommands(app, translator, palette);

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
    if (!defaultFactory) {
      console.warn('Default markdown widget factory not found');
      return;
    }

    // Create and register the widget factory
    const widgetFactory = new KanbanWidgetFactory(
      defaultFactory,
      {
        name: 'Kanban Board',
        fileTypes: ['kanban', 'markdown'],
        defaultFor: ['kanban'],
        translator: translator
      }
    );

    // Add a custom widget factory that checks for Kanban files
    app.docRegistry.addWidgetFactory(widgetFactory);
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
            factory: 'Kanban Board'
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
