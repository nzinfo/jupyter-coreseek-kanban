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
import { IKanbanManager } from './tokens';
import { KanbanManager } from './service';
import { activateSidePanel } from './leftPanel';

/**
 * The MIME type for Kanban markdown.
 */
const MIME_TYPE = 'text/markdown-kanban';
const FILE_EXTENSION = '.md';
const PLUGIN_ID = '@coreseek/jupyter-kanban:plugin';

/**
 * Initialization data for the @coreseek/jupyter-kanban extension.
 */
const plugin: JupyterFrontEndPlugin<IKanbanManager> = {
  id: PLUGIN_ID,
  description: 'A Kanban board extension for JupyterLab',
  autoStart: true,
  requires: [IDocumentManager, ICommandPalette, ILayoutRestorer],
  optional: [ISettingRegistry, IFileBrowserFactory, IMarkdownViewerTracker],
  provides: IKanbanManager,
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    settingRegistry: ISettingRegistry | null,
    browserFactory: IFileBrowserFactory | null,
    markdownViewerTracker: IMarkdownViewerTracker | null
  ): IKanbanManager => {
    console.log('JupyterLab extension @coreseek/jupyter-kanban is activated!');

    // Create the kanban manager
    const manager = new KanbanManager();

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
      // Update the manager's active widget
      manager.activeKanban = widget;
    });

    // Track focus changes
    tracker.currentChanged.connect((_, widget) => {
      manager.activeKanban = widget;
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
            path: dirPath
          });
        } catch (error) {
          console.log('Directory already exists or error creating it:', error);
        }

        const model = await app.serviceManager.contents.newUntitled({
          type: 'file',
          path: '__worklog__',
          ext: FILE_EXTENSION
        });

        const widget = await docManager.open(model.path);
        if (widget) {
          widget.title.label = 'Kanban Board';
        }
        return widget;
      }
    });

    // Add open tasks command
    app.commands.addCommand('kanban:open-tasks', {
      label: 'Open Tasks',
      execute: async () => {
        const path = '__worklog__/tasks.md';
        try {
          await app.serviceManager.contents.get(path);
        } catch (error) {
          // If file doesn't exist, create it
          await app.serviceManager.contents.save(path, {
            type: 'file',
            format: 'text',
            content: '---\ntype: kanban\n---\n\n# Tasks\n\n## Backlog\n\n## Todo\n\n## Doing\n\n## Review\n\n## Done\n'
          });
        }
        
        // Use our factory to open the file
        const widget = await docManager.open(path, 'Kanban');
        if (widget) {
          widget.title.label = 'Tasks';
        }
        return widget;
      }
    });

    palette.addItem({ command: createCommand, category: 'Kanban' });

    // Activate the side panel
    activateSidePanel(app, app.commands);

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

    return manager;
  }
};

export default plugin;
