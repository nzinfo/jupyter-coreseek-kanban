import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { listIcon } from '@jupyterlab/ui-components';
// import { Widget } from '@lumino/widgets';
import { TaskEditPanel } from './components/TaskEditPanel';

/**
 * The command IDs used by the plugin.
 */
export namespace CommandIDs {
  export const toggleTaskEditor = 'kanban:toggle-task-editor';
  export const newTask = 'kanban:new-task';
}

/**
 * Adds commands to the application
 */
export function addCommands(
  app: JupyterFrontEnd,
  translator: ITranslator,
  palette: ICommandPalette
): void {
  const trans = translator.load('jupyter-coreseek-kanban');
  let taskEditor: TaskEditPanel | null = null;

  // Command to toggle the task editor
  app.commands.addCommand(CommandIDs.toggleTaskEditor, {
    label: trans.__('Toggle Task Editor'),
    execute: () => {
      if (!taskEditor || taskEditor.isDisposed) {
        taskEditor = new TaskEditPanel({
          translator,
          collaborative: false // TODO: 根据环境配置
        });
        taskEditor.id = 'jp-task-editor';
        taskEditor.title.label = '';  // 不显示文本
        taskEditor.title.icon = listIcon;  // 使用与 Table of Contents 相同的图标
        taskEditor.title.closable = true;
      }

      if (!taskEditor.isAttached) {
        app.shell.add(taskEditor, 'right', { rank: 1000 });
      }

      if (taskEditor.isVisible) {
        taskEditor.hide();
      } else {
        taskEditor.show();
      }
    }
  });

  // Command to create a new task
  app.commands.addCommand(CommandIDs.newTask, {
    label: trans.__('New Task'),
    execute: () => {
      // First ensure the task editor is visible
      app.commands.execute(CommandIDs.toggleTaskEditor);
      if (taskEditor) {
        // TODO: Reset task editor to create new task state
      }
    }
  });

  // Add commands to command palette
  palette.addItem({
    command: CommandIDs.toggleTaskEditor,
    category: trans.__('Kanban')
  });
  palette.addItem({
    command: CommandIDs.newTask,
    category: trans.__('Kanban')
  });
}
