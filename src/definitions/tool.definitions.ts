import { TOOL_NAMES } from "../types/index.js";

export const TOOL_DEFINITIONS = {
  [TOOL_NAMES.LIST_PROJECTS]: {
    description: "List all projects in Harbor",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  [TOOL_NAMES.GET_PROJECT]: {
    description: "Get project details by ID",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  [TOOL_NAMES.CREATE_PROJECT]: {
    description: "Create a new project in Harbor",
    inputSchema: {
      type: "object",
      properties: {
        project_name: { type: "string" },
        metadata: {
          type: "object",
          properties: {
            public: { type: "string" },
            enable_content_trust: { type: "string" },
            prevent_vul: { type: "string" },
            severity: { type: "string" },
            auto_scan: { type: "string" },
          },
        },
      },
      required: ["project_name"],
    },
  },
  [TOOL_NAMES.DELETE_PROJECT]: {
    description: "Delete a project by ID",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  [TOOL_NAMES.LIST_REPOSITORIES]: {
    description: "List all repositories in a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  [TOOL_NAMES.DELETE_REPOSITORY]: {
    description: "Delete a repository",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        repositoryName: { type: "string" },
      },
      required: ["projectId", "repositoryName"],
    },
  },
  [TOOL_NAMES.LIST_TAGS]: {
    description: "List all tags in a repository",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        repositoryName: { type: "string" },
      },
      required: ["projectId", "repositoryName"],
    },
  },
  [TOOL_NAMES.DELETE_TAG]: {
    description: "Delete a tag from a repository",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        repositoryName: { type: "string" },
        tag: { type: "string" },
      },
      required: ["projectId", "repositoryName", "tag"],
    },
  },
  [TOOL_NAMES.LIST_CHARTS]: {
    description: "List all Helm charts in a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  [TOOL_NAMES.LIST_CHART_VERSIONS]: {
    description: "List all versions of a Helm chart",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        chartName: { type: "string" },
      },
      required: ["projectId", "chartName"],
    },
  },
  [TOOL_NAMES.DELETE_CHART]: {
    description: "Delete a specific version of a Helm chart",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        chartName: { type: "string" },
        version: { type: "string" },
      },
      required: ["projectId", "chartName", "version"],
    },
  },
};
