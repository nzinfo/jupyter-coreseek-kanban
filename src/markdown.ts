import { ITask, IStage, ICategory, IFeature } from './model';

export interface IFeatureFile {
  feature: IFeature;
  tasks: ITask[];
}

export class MarkdownSerializer {
  static serialize(feature: IFeature): string {
    let markdown = '---\ntype: kanban\n---\n\n';

    // Add task list at the top
    markdown += '# Tasks\n\n';
    const allTasks = this._getAllTasks(feature);
    allTasks.forEach(task => {
      markdown += `- [${task.completed ? 'x' : ' '}] ${task.id}: ${task.title}\n`;
    });
    markdown += '\n';

    // Add stages and their categories
    for (const [stageName, stage] of feature.stages) {
      markdown += `# ${stageName}\n\n`;
      if (stage.nameI18n) {
        markdown += `> ${stage.nameI18n}\n\n`;
      }

      // Add categories within stage
      for (const [categoryName, category] of stage.categories) {
        markdown += `## ${categoryName}\n\n`;
        if (category.nameI18n) {
          markdown += `> ${category.nameI18n}\n\n`;
        }

        // Add tasks within category
        for (const task of category.tasks.values()) {
          markdown += `### ${task.title}\n\n`;
          
          // Add tags if present
          if (task.tags.length > 0) {
            markdown += `Tags: ${task.tags.join(', ')}\n\n`;
          }

          // Add description
          if (task.description) {
            markdown += `${task.description}\n\n`;
          }

          // Add subtasks if present
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
              markdown += `#### ${subtask.title}\n`;
              if (subtask.description) {
                markdown += `${subtask.description}\n`;
              }
              markdown += '\n';
            });
          }
        }
      }
    }

    // Add uncategorized tasks if any
    if (feature.uncategorizedTasks.size > 0) {
      markdown += '# Uncategorized Tasks\n\n';
      for (const task of feature.uncategorizedTasks.values()) {
        markdown += `### ${task.title}\n\n`;
        if (task.tags.length > 0) {
          markdown += `Tags: ${task.tags.join(', ')}\n\n`;
        }
        if (task.description) {
          markdown += `${task.description}\n\n`;
        }
      }
    }

    return markdown;
  }

  static deserialize(markdown: string): IFeatureFile | null {
    // Check for kanban type
    if (!markdown.includes('type: kanban')) {
      return null;
    }

    const feature: IFeature = {
      title: '',
      taskPrefix: '',
      description: '',
      stages: new Map(),
      uncategorizedTasks: new Map()
    };

    const lines = markdown.split('\n');
    let currentStage: IStage | null = null;
    let currentCategory: ICategory | null = null;
    let currentTask: Partial<ITask> | null = null;
    let inTaskList = false;
    let taskIdMap = new Map<string, ITask>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and front matter
      if (!line || line === '---') continue;

      // Parse task list
      if (line === '# Tasks') {
        inTaskList = true;
        continue;
      }

      if (inTaskList && line.startsWith('- [')) {
        const match = line.match(/- \[(x| )\] ([\w-]+): (.+)/);
        if (match) {
          const [, completed, id, title] = match;
          const task: ITask = {
            id,
            title,
            description: '',
            stage: '',
            category: '',
            tags: [],
            completed: completed === 'x',
            created: new Date(),
            updated: new Date()
          };
          taskIdMap.set(id, task);
        }
        continue;
      }

      // Parse stages (level-1 headers)
      if (line.startsWith('# ') && line !== '# Tasks') {
        inTaskList = false;
        const stageName = line.slice(2).trim();
        currentStage = {
          name: stageName,
          categories: new Map()
        };
        feature.stages.set(stageName, currentStage);
        currentCategory = null;
        currentTask = null;
        
        // Check for i18n name in next line
        const nextLine = lines[i + 1]?.trim();
        if (nextLine?.startsWith('> ')) {
          currentStage.nameI18n = nextLine.slice(2).trim();
          i++; // Skip next line
        }
        continue;
      }

      // Parse categories (level-2 headers)
      if (line.startsWith('## ')) {
        const categoryName = line.slice(3).trim();
        if (currentStage) {
          currentCategory = {
            name: categoryName,
            tasks: new Map()
          };
          currentStage.categories.set(categoryName, currentCategory);
          currentTask = null;

          // Check for i18n name in next line
          const nextLine = lines[i + 1]?.trim();
          if (nextLine?.startsWith('> ')) {
            currentCategory.nameI18n = nextLine.slice(2).trim();
            i++; // Skip next line
          }
        }
        continue;
      }

      // Parse tasks (level-3 headers)
      if (line.startsWith('### ')) {
        const taskTitle = line.slice(4).trim();
        currentTask = {
          title: taskTitle,
          description: '',
          tags: [],
          subtasks: []
        };
        continue;
      }

      // Parse subtasks (level-4 headers)
      if (line.startsWith('#### ') && currentTask) {
        const subtaskTitle = line.slice(5).trim();
        const subtask: ITask = {
          id: `${currentTask.id}-sub-${Math.random().toString(36).slice(2, 7)}`,
          title: subtaskTitle,
          description: '',
          stage: currentTask.stage || '',
          category: currentTask.category || '',
          tags: [],
          completed: false,
          created: new Date(),
          updated: new Date()
        };
        currentTask.subtasks = currentTask.subtasks || [];
        currentTask.subtasks.push(subtask);
        continue;
      }

      // Parse tags
      if (line.startsWith('Tags: ') && currentTask) {
        currentTask.tags = line.slice(6).split(',').map(tag => tag.trim());
        continue;
      }

      // Add description
      if (currentTask && line) {
        currentTask.description = currentTask.description || '';
        currentTask.description += line + '\n';
      }
    }

    return {
      feature,
      tasks: Array.from(taskIdMap.values())
    };
  }

  private static _getAllTasks(feature: IFeature): ITask[] {
    const tasks: ITask[] = [];
    
    // Get tasks from stages and categories
    for (const stage of feature.stages.values()) {
      for (const category of stage.categories.values()) {
        tasks.push(...category.tasks.values());
      }
    }
    
    // Get uncategorized tasks
    tasks.push(...feature.uncategorizedTasks.values());
    
    return tasks;
  }
}
