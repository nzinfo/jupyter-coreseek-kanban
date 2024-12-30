import { TaskCard } from './TaskCard';

/**
 * Shared state for drag and drop operations
 */
export namespace DragDropManager {
  export let dragSource: TaskCard | null = null;
} 