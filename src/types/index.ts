// Custom Error Types
export class HarborError extends Error {
  public readonly code: number;
  public readonly data?: unknown;
  public override readonly name: string;

  constructor(message: string, code: number = -32603) {
    // InternalError
    super(message);
    this.code = code;
    this.name = "HarborError";
    Object.setPrototypeOf(this, HarborError.prototype);
  }
}

export class ValidationError extends HarborError {
  public override readonly name: string;

  constructor(message: string) {
    super(message, -32602); // InvalidParams
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ResourceError extends HarborError {
  public override readonly name: string;

  constructor(message: string) {
    super(message, -32601); // MethodNotFound
    this.name = "ResourceError";
    Object.setPrototypeOf(this, ResourceError.prototype);
  }
}

// Harbor API Response Types
export interface HarborMetadata {
  public?: string;
  enable_content_trust?: string;
  prevent_vul?: string;
  severity?: string;
  auto_scan?: string;
}

export interface HarborRepository {
  name: string;
  project_id?: number;
  artifact_count?: number;
  creation_time?: string;
  update_time?: string;
}

export interface HarborArtifactTag {
  id: number;
  name: string;
  push_time: string;
  pull_time: string;
  immutable: boolean;
  repository_id?: number;
  artifact_id?: number;
  signed?: boolean;
}

export interface HarborArtifact {
  digest: string;
  tags?: HarborArtifactTag[];
  size?: number;
  push_time?: string;
  pull_time?: string;
  update_time?: string;
  type?: string;
  project_id?: number;
  repository_id?: number;
  id?: number;
}

export interface HarborChart {
  name: string;
  total_versions: number;
  latest_version: string;
  created: string;
  updated: string;
}

export interface HarborChartVersion {
  name: string;
  version: string;
  created: string;
  updated: string;
}

// Tool Constants
export const TOOL_NAMES = {
  LIST_PROJECTS: "list_projects",
  GET_PROJECT: "get_project",
  CREATE_PROJECT: "create_project",
  DELETE_PROJECT: "delete_project",
  LIST_REPOSITORIES: "list_repositories",
  DELETE_REPOSITORY: "delete_repository",
  LIST_TAGS: "list_tags",
  DELETE_TAG: "delete_tag",
  LIST_CHARTS: "list_charts",
  LIST_CHART_VERSIONS: "list_chart_versions",
  DELETE_CHART: "delete_chart",
} as const;

// Response Types
export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface ProjectData {
  project_name: string;
  metadata?: HarborMetadata;
}

// Common validation functions
export const validateRequired = (value: unknown, name: string): void => {
  if (!value) {
    throw new ValidationError(`${name} is required`);
  }
};

export const validateProjectId = (projectId: unknown): void => {
  validateRequired(projectId, "projectId");
};

export const validateRepositoryName = (repositoryName: unknown): void => {
  validateRequired(repositoryName, "repositoryName");
};

export const validateChartName = (chartName: unknown): void => {
  validateRequired(chartName, "chartName");
};

export const validateTag = (tag: unknown): void => {
  validateRequired(tag, "tag");
};

export const validateVersion = (version: unknown): void => {
  validateRequired(version, "version");
};
