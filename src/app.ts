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
import { HarborService, ProjectData } from "./services/harbor.service";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Harbor service using the @hapic/harbor package
const harborService = new HarborService(process.env.HARBOR_URL || "", {
  username: process.env.HARBOR_USERNAME || "",
  password: process.env.HARBOR_PASSWORD || "",
});

class HarborMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "harbor-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error("[MCP Error]", error);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Project tools
        {
          name: "list_projects",
          description: "List all projects in Harbor",
        },
        {
          name: "get_project",
          description: "Get project details by ID",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "create_project",
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
        {
          name: "delete_project",
          description: "Delete a project by ID",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        // Repository tools
        {
          name: "list_repositories",
          description: "List all repositories in a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "delete_repository",
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
        {
          name: "list_tags",
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
        {
          name: "delete_tag",
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
        // Helm Chart tools
        {
          name: "list_charts",
          description: "List all Helm charts in a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "list_chart_versions",
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
        {
          name: "delete_chart",
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
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        try {
          const args = request.params.arguments || {};

          switch (request.params.name) {
            // Project operations
            case "list_projects":
              return {
                content: [
                  { type: "json", json: await harborService.getProjects() },
                ],
              };

            case "get_project": {
              const projectId = args.projectId as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.getProject(projectId),
                  },
                ],
              };
            }

            case "create_project": {
              const projectData = args as unknown as ProjectData;
              if (!projectData.project_name)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "project_name is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.createProject(projectData),
                  },
                ],
              };
            }

            case "delete_project": {
              const projectId = args.projectId as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              await harborService.deleteProject(projectId);
              return {
                content: [
                  { type: "text", text: "Project deleted successfully" },
                ],
              };
            }

            // Repository operations
            case "list_repositories": {
              const projectId = args.projectId as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.getRepositories(projectId),
                  },
                ],
              };
            }

            case "delete_repository": {
              const projectId = args.projectId as string;
              const repositoryName = args.repositoryName as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              if (!repositoryName)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "repositoryName is required"
                );
              await harborService.deleteRepository(projectId, repositoryName);
              return {
                content: [
                  { type: "text", text: "Repository deleted successfully" },
                ],
              };
            }

            case "list_tags": {
              const projectId = args.projectId as string;
              const repositoryName = args.repositoryName as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              if (!repositoryName)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "repositoryName is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.getTags(
                      projectId,
                      repositoryName
                    ),
                  },
                ],
              };
            }

            case "delete_tag": {
              const projectId = args.projectId as string;
              const repositoryName = args.repositoryName as string;
              const tag = args.tag as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              if (!repositoryName)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "repositoryName is required"
                );
              if (!tag)
                throw new McpError(ErrorCode.InvalidParams, "tag is required");
              await harborService.deleteTag(projectId, repositoryName, tag);
              return {
                content: [{ type: "text", text: "Tag deleted successfully" }],
              };
            }

            // Helm Chart operations
            case "list_charts": {
              const projectId = args.projectId as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.getCharts(projectId),
                  },
                ],
              };
            }

            case "list_chart_versions": {
              const projectId = args.projectId as string;
              const chartName = args.chartName as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              if (!chartName)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "chartName is required"
                );
              return {
                content: [
                  {
                    type: "json",
                    json: await harborService.getChartVersions(
                      projectId,
                      chartName
                    ),
                  },
                ],
              };
            }

            case "delete_chart": {
              const projectId = args.projectId as string;
              const chartName = args.chartName as string;
              const version = args.version as string;
              if (!projectId)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "projectId is required"
                );
              if (!chartName)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "chartName is required"
                );
              if (!version)
                throw new McpError(
                  ErrorCode.InvalidParams,
                  "version is required"
                );
              await harborService.deleteChart(projectId, chartName, version);
              return {
                content: [{ type: "text", text: "Chart deleted successfully" }],
              };
            }

            default:
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
              );
          }
        } catch (error: any) {
          if (error instanceof McpError) throw error;
          throw new McpError(
            ErrorCode.InternalError,
            error?.message || "Unknown error occurred"
          );
        }
      }
    );
  }

  async run() {
    if (!process.env.HARBOR_URL)
      throw new Error("HARBOR_URL environment variable is required");
    if (!process.env.HARBOR_USERNAME)
      throw new Error("HARBOR_USERNAME environment variable is required");
    if (!process.env.HARBOR_PASSWORD)
      throw new Error("HARBOR_PASSWORD environment variable is required");

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Harbor MCP server running on stdio");
  }
}

const server = new HarborMcpServer();
server.run().catch(console.error);
