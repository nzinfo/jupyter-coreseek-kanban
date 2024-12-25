import { ITask, TaskStatus } from './model';

export class MarkdownSerializer {
  static serialize(tasks: ITask[]): string {
    let markdown = '---\nmime: text/markdown-kanban\n---\n\n';

    // Group tasks by status
    const tasksByStatus = new Map<TaskStatus, ITask[]>();
    tasks.forEach(task => {
      const statusTasks = tasksByStatus.get(task.status) || [];
      statusTasks.push(task);
      tasksByStatus.set(task.status, statusTasks);
    });

    // Generate markdown for each status
    ['backlog', 'todo', 'doing', 'review', 'done'].forEach(status => {
      const statusTasks = tasksByStatus.get(status as TaskStatus) || [];
      markdown += `# ${status.charAt(0).toUpperCase() + status.slice(1)}\n\n`;
      
      statusTasks.forEach(task => {
        markdown += `## ${task.title}\n`;
        if (task.description) {
          markdown += `${task.description}\n`;
        }
        markdown += '\n';
      });
    });

    return markdown;
  }

  static deserialize(markdown: string): ITask[] {
    const tasks: ITask[] = [];
    let currentStatus: TaskStatus | null = null;
    let currentTask: Partial<ITask> | null = null;

    // Check for kanban mime type
    const hasMime = markdown.includes('mime: text/markdown-kanban');
    if (!hasMime) {
      return tasks;
    }

    // Remove YAML front matter
    const lines = markdown
      .split('\n')
      .filter(line => !line.trim().startsWith('---'))
      .filter(Boolean);

    lines.forEach(line => {
      if (line.startsWith('# ')) {
        // Status header
        const status = line.slice(2).trim().toLowerCase();
        if (['backlog', 'todo', 'doing', 'review', 'done'].includes(status)) {
          currentStatus = status as TaskStatus;
        }
      } else if (line.startsWith('## ') && currentStatus) {
        // Task title
        if (currentTask) {
          tasks.push(this._finalizeTask(currentTask, currentStatus));
        }
        currentTask = {
          title: line.slice(3).trim(),
          description: ''
        };
      } else if (currentTask && line.trim()) {
        // Task description
        currentTask.description = (currentTask.description || '') + line + '\n';
      }
    });

    // Add the last task if exists
    if (currentTask && currentStatus) {
      tasks.push(this._finalizeTask(currentTask, currentStatus));
    }

    return tasks;
  }

  private static _finalizeTask(
    task: Partial<ITask>,
    status: TaskStatus
  ): ITask {
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: task.title || 'Untitled Task',
      description: (task.description || '').trim(),
      status,
      created: new Date(),
      updated: new Date()
    };
  }
}
