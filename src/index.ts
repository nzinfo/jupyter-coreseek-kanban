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
      execute: async () => {
        try {
          // First ensure .worklog directory exists
          const dirPath = '__worklog__';
          await app.serviceManager.contents.newUntitled({
            type: 'directory',
            path: ''
          }).then(model => {
            return app.serviceManager.contents.rename(model.path, dirPath);
          }).catch(error => {
            // Directory might already exist, which is fine
            console.log('Directory creation skipped:', error);
          });

          const filePath = `${dirPath}/tasks.md`;
          try {
            // Try to get the file first
            await app.serviceManager.contents.get(filePath);
            // File exists, just open it
            return docManager.openOrReveal(filePath);
          } catch (error) {
            // File doesn't exist, create it with default content
            const model = await app.serviceManager.contents.save(filePath, {
              type: 'file',
              format: 'text',
              content: '# Kanban Board\n\n## Todo\n\n## In Progress\n\n## Done\n'
            });

            // Open the newly created file
            return docManager.openOrReveal(model.path);
          }
        } catch (error) {
          console.error('Error creating kanban board:', error);
        }
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
