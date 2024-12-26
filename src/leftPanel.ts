import { Widget } from '@lumino/widgets';
import { IDisposable } from '@lumino/disposable';
import { CommandRegistry } from '@lumino/commands';
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * A widget for the left side bar.
 */
export class KanbanSidePanel extends Widget {
  constructor(commands: CommandRegistry) {
    super();
    this.addClass('jp-KanbanSidePanel');
    this.id = 'kanban-side-panel';
    this.title.iconClass = 'jp-KanbanIcon jp-SideBar-tabIcon';
    this.title.caption = 'Kanban';

    // Create the header
    const header = document.createElement('div');
    header.className = 'jp-KanbanSidePanel-header';
    header.textContent = 'Kanban Tasks';
    this.node.appendChild(header);

    // Create the content area
    const content = document.createElement('div');
    content.className = 'jp-KanbanSidePanel-content';
    
    // Create a button to open tasks
    const button = document.createElement('button');
    button.className = 'jp-KanbanSidePanel-button';
    button.textContent = 'Open Tasks';
    button.onclick = () => {
      commands.execute('kanban:open-tasks');
    };
    content.appendChild(button);

    this.node.appendChild(content);
  }
}

/**
 * Activate the side panel extension.
 */
export function activateSidePanel(
  app: JupyterFrontEnd,
  commands: CommandRegistry
): IDisposable {
  // Create the widget
  const widget = new KanbanSidePanel(commands);

  // Add the widget to the left side panel
  app.shell.add(widget, 'left', { rank: 200 });

  return widget;
}
