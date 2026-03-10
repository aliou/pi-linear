/**
 * Plain JSON representation of an Issue for tool results.
 * The SDK's Issue class has lazy async getters that can't be serialized,
 * so we resolve them into this shape before returning from execute().
 */
export interface SerializedIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: string;
  assignee?: string;
  priority: number;
  priorityLabel: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimate?: number;
  labels: string[];
  project?: string;
  team: string;
  parentId?: string;
}
