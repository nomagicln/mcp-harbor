#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { HarborService } from "./services/harbor.service.js";
import { TOOL_NAMES, ProjectData, HarborMetadata } from "./types/index.js";
import { config } from "dotenv";

// Disable TLS/SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

config();

// Tool definitions
const TOOL_DEFINITIONS = {
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

class HarborMcpServer {
  private server!: Server;
  private harborService!: HarborService;

  constructor() {
    this.validateEnvironment();
    this.initializeHarborService();
    this.initializeServer();
    this.setupErrorHandler();
    this.setupToolHandlers();
  }

  private validateEnvironment(): void {
    if (!process.env.HARBOR_URL) {
      throw new Error("HARBOR_URL environment variable is required");
    }
    if (!process.env.HARBOR_USERNAME) {
      throw new Error("HARBOR_USERNAME environment variable is required");
    }
    if (!process.env.HARBOR_PASSWORD) {
      throw new Error("HARBOR_PASSWORD environment variable is required");
    }
  }

  private initializeHarborService(): void {
    this.harborService = new HarborService(process.env.HARBOR_URL || "", {
      username: process.env.HARBOR_USERNAME || "",
      password: process.env.HARBOR_PASSWORD || "",
    });
  }

  private initializeServer(): void {
    this.server = new Server(
      {
        name: "harbor-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: TOOL_DEFINITIONS,
        },
      }
    );
  }

  private setupErrorHandler(): void {
    this.server.onerror = (error: Error): void => {
      console.error("[MCP Error]", error);
      console.error("[MCP Error Stack]", error.stack);

      if (error.cause) {
        console.error("[MCP Error Cause]", error.cause);
      }
    };
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.entries(TOOL_DEFINITIONS).map(([name, def]) => ({
        name,
        description: def.description,
        inputSchema: def.inputSchema,
      })),
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        try {
          const args = request.params.arguments || {};
          return await this.handleToolRequest(request.params.name, args);
        } catch (error: unknown) {
          if (error instanceof McpError) throw error;
          throw new McpError(
            ErrorCode.InternalError,
            error instanceof Error ? error.message : "Unknown error occurred"
          );
        }
      }
    );
  }

  private async handleToolRequest(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    const validateParam = (param: unknown, name: string): string => {
      if (!param) {
        throw new McpError(ErrorCode.InvalidParams, `${name} is required`);
      }
      return param as string;
    };

    switch (toolName) {
      case TOOL_NAMES.LIST_PROJECTS:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getProjects(),
                null,
                2
              ),
            },
          ],
        };

      case TOOL_NAMES.GET_PROJECT: {
        const projectId = validateParam(args.projectId, "projectId");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getProject(projectId),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.CREATE_PROJECT: {
        const project_name = validateParam(args.project_name, "project_name");
        const metadata = args.metadata as HarborMetadata | undefined;

        const projectData: ProjectData = {
          project_name,
          ...(metadata && { metadata }),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.createProject(projectData),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.DELETE_PROJECT: {
        const projectId = validateParam(args.projectId, "projectId");
        await this.harborService.deleteProject(projectId);
        return {
          content: [{ type: "text", text: "Project deleted successfully" }],
        };
      }

      case TOOL_NAMES.LIST_REPOSITORIES: {
        const projectId = validateParam(args.projectId, "projectId");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getRepositories(projectId),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.DELETE_REPOSITORY: {
        const projectId = validateParam(args.projectId, "projectId");
        const repositoryName = validateParam(
          args.repositoryName,
          "repositoryName"
        );
        await this.harborService.deleteRepository(projectId, repositoryName);
        return {
          content: [{ type: "text", text: "Repository deleted successfully" }],
        };
      }

      case TOOL_NAMES.LIST_TAGS: {
        const projectId = validateParam(args.projectId, "projectId");
        const repositoryName = validateParam(
          args.repositoryName,
          "repositoryName"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getTags(projectId, repositoryName),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.DELETE_TAG: {
        const projectId = validateParam(args.projectId, "projectId");
        const repositoryName = validateParam(
          args.repositoryName,
          "repositoryName"
        );
        const tag = validateParam(args.tag, "tag");
        await this.harborService.deleteTag(projectId, repositoryName, tag);
        return {
          content: [{ type: "text", text: "Tag deleted successfully" }],
        };
      }

      case TOOL_NAMES.LIST_CHARTS: {
        const projectId = validateParam(args.projectId, "projectId");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getCharts(projectId),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.LIST_CHART_VERSIONS: {
        const projectId = validateParam(args.projectId, "projectId");
        const chartName = validateParam(args.chartName, "chartName");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await this.harborService.getChartVersions(projectId, chartName),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.DELETE_CHART: {
        const projectId = validateParam(args.projectId, "projectId");
        const chartName = validateParam(args.chartName, "chartName");
        const version = validateParam(args.version, "version");
        await this.harborService.deleteChart(projectId, chartName, version);
        return {
          content: [{ type: "text", text: "Chart deleted successfully" }],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
    }
  }

  async run(): Promise<void> {
    console.error("[MCP Server] Starting Harbor MCP server...");
    this.logEnvironmentStatus();

    const transport = new StdioServerTransport();

    try {
      await this.server.connect(transport);
      console.error("[MCP Server] Successfully connected to transport");
    } catch (err: unknown) {
      console.error("[MCP Transport Error]", err);
      throw err;
    }

    console.error("[MCP Server] Harbor MCP server running on stdio");
  }

  private logEnvironmentStatus(): void {
    console.error("[MCP Server] Environment check:");
    console.error(
      `[MCP Server] - HARBOR_URL: ${process.env.HARBOR_URL ? "Set" : "Not set"}`
    );
    console.error(
      `[MCP Server] - HARBOR_USERNAME: ${
        process.env.HARBOR_USERNAME ? "Set" : "Not set"
      }`
    );
    console.error(
      `[MCP Server] - HARBOR_PASSWORD: ${
        process.env.HARBOR_PASSWORD ? "Set" : "Not set"
      }`
    );
    console.error(`[MCP Server] - DEBUG: ${process.env.DEBUG || "Not set"}`);
  }
}

const server = new HarborMcpServer();
server.run().catch(console.error);
