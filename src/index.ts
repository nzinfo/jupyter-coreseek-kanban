import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { WidgetTracker } from '@jupyterlab/apputils';
import { IMarkdownViewerTracker } from '@jupyterlab/markdownviewer';

import { KanbanDocWidget } from './widget';
import { KanbanFactory } from './factory';
import { IKanban } from './tokens';
import { KanbanService } from './service';

/**
 * The MIME type for Kanban markdown.
 */
const MIME_TYPE = 'text/markdown-kanban';
const FILE_EXTENSION = '.md';
const PLUGIN_ID = '@coreseek/jupyter-kanban:plugin';

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<IKanban> = {
  id: PLUGIN_ID,
  description: 'A Kanban board extension for JupyterLab',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer],
  optional: [ISettingRegistry, IFileBrowserFactory, IMarkdownViewerTracker],
  provides: IKanban,
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    settingRegistry: ISettingRegistry | null,
    browserFactory: IFileBrowserFactory | null,
    markdownViewerTracker: IMarkdownViewerTracker | null
  ): IKanban => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // Create the kanban service
    const service = new KanbanService();

    // Create a widget tracker for Kanban boards
    const tracker = new WidgetTracker<KanbanDocWidget>({ namespace: 'kanban' });

    // Register the Kanban factory
    const factory = new KanbanFactory({
      name: 'Kanban',
      fileTypes: ['markdown-kanban'],
      defaultFor: ['markdown-kanban'],
      readOnly: false
    });
    
    app.docRegistry.addFileType({
      name: 'markdown-kanban',
      mimeTypes: [MIME_TYPE],
      extensions: [FILE_EXTENSION],
      contentType: 'file',
      fileFormat: 'text'
    });

    app.docRegistry.addWidgetFactory(factory);

    // Track widget changes
    factory.widgetCreated.connect((sender, widget) => {
      // Track the widget
      void tracker.add(widget);
      // Update the service's active widget
      service.activeKanban = widget;
    });

    // Track focus changes
    tracker.currentChanged.connect((_, widget) => {
      service.activeKanban = widget;
    });

    // Restore widgets on layout restore
    if (restorer) {
      void restorer.restore(tracker, {
        command: 'kanban:create',
        name: () => 'kanban'
      });
    }

    // Add commands
    const createCommand = 'kanban:create';
    app.commands.addCommand(createCommand, {
      label: 'Create New Kanban Board',
      execute: () => {
        // const cwd = browserFactory ? browserFactory.defaultBrowser.model.path : '';
        const model = docManager.newUntitled({
          ext: FILE_EXTENSION,
          type: 'file',
          path: '.worklog/tasks.md'
        });
        
        model.then(model => {
          docManager.openOrReveal(model.path);
        });
      }
    });

    const newTaskCommand = 'kanban:new-task';
    app.commands.addCommand(newTaskCommand, {
      label: 'New Task',
      execute: () => {
        if (service.activeKanban) {
          service.addTask({
            title: 'New Task',
            description: 'Add description here',
            status: 'backlog'
          });
        }
      }
    });

    // Add commands to palette
    palette.addItem({ command: createCommand, category: 'Kanban' });
    palette.addItem({ command: newTaskCommand, category: 'Kanban' });

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

    return service;
  }
};

export default plugin;
