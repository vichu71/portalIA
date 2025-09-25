import { Task } from "../../../services/taskService";
import { Project } from "../../../services/projectService";

export type ViewMode = "days" | "weeks" | "months";

export interface TimelineProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TaskBarStyle {
  left: string;
  width: string;
}

export interface TimelineFilters {
  projectFilter: string;
}

export interface TimelineState {
  viewMode: ViewMode;
  filters: TimelineFilters;
  selectedTask: Task | null;
}

// Drag & Drop types
export interface DragState {
  isDragging: boolean;
  draggedTask: Task | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  initialMouseX: number;
  initialStartDate: Date | null;
  initialDueDate: Date | null;
  previewStartDate: Date | null;
  previewDueDate: Date | null;
}

// Re-export types from services
export type { Task } from "../../../services/taskService";
export type { Project } from "../../../services/projectService";