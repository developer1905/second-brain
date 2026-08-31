export type PARACategory = 'PROJECT' | 'AREA' | 'RESOURCE' | 'ARCHIVE';
export type SourceType = 'NOTE' | 'TELEGRAM' | 'GITHUB' | 'BOOK' | 'VOICE';

export interface GraphNode {
  id: string;
  label: string;
  category: PARACategory | string;
  sourceType: SourceType | string;
  color: string;
  val: number; // node visual size radius multiplier
  tags: string[];
  isArchived: boolean;
  details?: {
    summary?: string;
    content?: string;
    url?: string;
    deadline?: string;
    progress?: number;
    tasksCount?: number;
    author?: string;
    chatName?: string;
    stars?: number;
  };
  createdAt?: string;
  // Canvas / Physics simulation coordinates
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GraphLink {
  source: string; // node ID or reference object
  target: string; // node ID or reference object
  label?: string;
  color?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  paraCategory: PARACategory;
  sourceType: SourceType;
  tags: string;
  externalUrl?: string | null;
  isArchived: boolean;
  projectId?: string | null;
  areaId?: string | null;
  createdAt: string;
  updatedAt: string;
  incomingCount?: number;
  outgoingCount?: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  deadline?: string | null;
  tags?: string | null;
  areaId?: string | null;
  areaName?: string;
  isArchived: boolean;
  createdAt: string;
  tasks?: TaskItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string | null;
  projectId: string;
}

export interface AreaItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  metric?: string | null;
  projectsCount?: number;
  notesCount?: number;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'BOOK' | 'TELEGRAM' | 'GITHUB' | 'ARTICLE' | 'SNIPPET';
  url?: string | null;
  summary: string;
  content?: string | null;
  tags: string;
  createdAt: string;
}

export interface TelegramMessageItem {
  id: string;
  telegramId?: string | number | null;
  chatName: string;
  text: string;
  date: string;
  mediaType?: string | null;
  paraCategory: string;
  createdAt: string;
}

export interface GithubRepoItem {
  id: string;
  name: string;
  fullName: string;
  description?: string | null;
  url: string;
  stars: number;
  forks: number;
  language?: string | null;
  readmeContent?: string | null;
  syncedAt: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  fileType: string;
  summary: string;
  highlights: string[];
  createdAt: string;
}
