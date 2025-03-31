import { HarborClient } from "@hapic/harbor";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  HarborArtifact,
  HarborArtifactTag,
  HarborChart,
  HarborChartVersion,
  HarborRepository,
  ProjectData,
  ResourceError,
  ValidationError,
  DeleteResponse,
  TOOL_NAMES,
  HarborMetadata,
} from "../types/index.js";

// Internal type definitions to match Harbor API types
interface BaseResource {
  name: string;
  creation_time?: string;
  update_time?: string;
}

interface Project extends BaseResource {
  project_id: number;
  owner_id: number;
  owner_name: string;
  repo_count: number;
  metadata: {
    public: boolean;
    auto_scan?: string;
    severity?: string;
  };
}

interface Repository extends BaseResource {
  artifact_count?: number;
}

interface ResourceCollection<T> {
  data: T[];
  meta?: {
    total?: number;
  };
}

export class HarborService {
  private client: HarborClient;

  constructor(apiUrl: string, auth: { username: string; password: string }) {
    if (!apiUrl) throw new ValidationError("API URL is required");
    if (!auth.username) throw new ValidationError("Username is required");
    if (!auth.password) throw new ValidationError("Password is required");

    this.client = new HarborClient({
      request: {
        credentials: "include",
      },
      connectionOptions: {
        host: apiUrl,
        user: auth.username,
        password: auth.password,
      },
    });
  }

  // Project operations
  async getProjects(): Promise<HarborRepository[]> {
    try {
      const response = (await this.client.project.getMany({
        query: {},
      })) as ResourceCollection<Project>;

      return (response?.data || []).map((project) => ({
        name: project.name,
        project_id: project.project_id,
        creation_time: project.creation_time,
        update_time: project.update_time,
      }));
    } catch (error: unknown) {
      throw this.handleError(error, "Failed to get projects");
    }
  }

  async getProject(projectId: string): Promise<HarborRepository> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");

      const response = !isNaN(Number(projectId))
        ? ((await this.client.project.getOne(Number(projectId))) as Project)
        : ((await this.client.project.getOne(projectId, true)) as Project);

      if (!response) {
        throw new ResourceError(`Project ${projectId} not found`);
      }

      return {
        name: response.name,
        project_id: response.project_id,
        creation_time: response.creation_time,
        update_time: response.update_time,
      };
    } catch (error: unknown) {
      throw this.handleError(error, `Failed to get project ${projectId}`);
    }
  }

  async createProject(projectData: ProjectData): Promise<HarborRepository> {
    try {
      if (!projectData.project_name) {
        throw new ValidationError("Project name is required");
      }

      const response = await this.client.project.create({
        project_name: projectData.project_name,
        ...(projectData.metadata && { metadata: projectData.metadata }),
      });

      // Since create only returns ID, fetch the full project details
      if (response.id) {
        return this.getProject(response.id.toString());
      }
      throw new Error("Failed to create project: No project ID returned");
    } catch (error: unknown) {
      throw this.handleError(error, "Failed to create project");
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");

      if (!isNaN(Number(projectId))) {
        await this.client.project.delete(Number(projectId));
      } else {
        await this.client.project.delete(projectId, true);
      }
    } catch (error: unknown) {
      throw this.handleError(error, `Failed to delete project ${projectId}`);
    }
  }

  // Repository/Image operations
  async getRepositories(projectId: string): Promise<HarborRepository[]> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");

      const response = (await this.client.projectRepository.getMany({
        projectName: projectId,
        query: {},
      })) as ResourceCollection<Repository>;

      return (response?.data || []).map((repo) => ({
        name: repo.name,
        artifact_count: repo.artifact_count,
        creation_time: repo.creation_time,
        update_time: repo.update_time,
      }));
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to get repositories for project ${projectId}`
      );
    }
  }

  async deleteRepository(
    projectId: string,
    repositoryName: string
  ): Promise<void> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");
      if (!repositoryName)
        throw new ValidationError("Repository name is required");

      const fullRepoName = `${projectId}/${repositoryName}`;
      await this.client.projectRepository.delete(fullRepoName);
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to delete repository ${repositoryName}`
      );
    }
  }

  async getTags(
    projectId: string,
    repositoryName: string
  ): Promise<HarborArtifact[]> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");
      if (!repositoryName)
        throw new ValidationError("Repository name is required");

      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: repositoryName,
        query: {},
      });

      return (artifacts || []).map(
        (artifact): HarborArtifact => ({
          digest: artifact.digest,
          tags: artifact.tags?.map(
            (tag): HarborArtifactTag => ({
              id: tag.id,
              name: tag.name,
              push_time: tag.push_time,
              pull_time: tag.pull_time,
              immutable: tag.immutable,
              repository_id: tag.repository_id,
              artifact_id: tag.artifact_id,
              signed: tag.signed,
            })
          ),
          size: artifact.size,
          push_time: artifact.push_time,
          pull_time: artifact.pull_time,
          type: artifact.type,
          project_id: artifact.project_id,
          repository_id: artifact.repository_id,
          id: artifact.id,
        })
      );
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to get tags for repository ${repositoryName}`
      );
    }
  }

  async deleteTag(
    projectId: string,
    repositoryName: string,
    tagName: string
  ): Promise<DeleteResponse> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");
      if (!repositoryName)
        throw new ValidationError("Repository name is required");
      if (!tagName) throw new ValidationError("Tag name is required");

      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: repositoryName,
        query: {},
      });

      const artifact = (artifacts || []).find((a) =>
        a.tags?.some((tag) => tag.name === tagName)
      );

      if (!artifact) {
        throw new ResourceError(
          `Tag ${tagName} not found in repository ${repositoryName}`
        );
      }

      await this.client.projectRepositoryArtifact.delete({
        projectName: projectId,
        repositoryName: repositoryName,
        tagOrDigest: artifact.digest,
      });

      return {
        success: true,
        message: `Tag ${tagName} deleted successfully`,
      };
    } catch (error: unknown) {
      throw this.handleError(error, `Failed to delete tag ${tagName}`);
    }
  }

  // Helm Chart operations
  async getCharts(projectId: string): Promise<HarborChart[]> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");

      const response = (await this.client.projectRepository.getMany({
        projectName: projectId,
        query: {},
      })) as ResourceCollection<Repository>;

      const chartRepos = (response?.data || []).filter(
        (repo) => repo.name && repo.name.includes("/charts/")
      );

      return chartRepos.map((repo) => ({
        name: repo.name.split("/").pop() || "",
        total_versions: repo.artifact_count || 0,
        latest_version: "",
        created: repo.creation_time || "",
        updated: repo.update_time || "",
      }));
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to get charts for project ${projectId}`
      );
    }
  }

  async getChartVersions(
    projectId: string,
    chartName: string
  ): Promise<HarborChartVersion[]> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");
      if (!chartName) throw new ValidationError("Chart name is required");

      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        query: {},
      });

      return (artifacts || []).map((artifact) => ({
        name: artifact.digest,
        version: artifact.tags?.[0]?.name || "",
        created: artifact.push_time || "",
        updated: artifact.push_time || "", // Using push_time as update_time is not available
      }));
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to get versions for chart ${chartName}`
      );
    }
  }

  async deleteChart(
    projectId: string,
    chartName: string,
    version: string
  ): Promise<DeleteResponse> {
    try {
      if (!projectId) throw new ValidationError("Project ID is required");
      if (!chartName) throw new ValidationError("Chart name is required");
      if (!version) throw new ValidationError("Version is required");

      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        query: {},
      });

      const artifact = (artifacts || []).find((a) =>
        a.tags?.some((tag) => tag.name === version)
      );

      if (!artifact) {
        throw new ResourceError(
          `Chart version ${version} not found for chart ${chartName}`
        );
      }

      await this.client.projectRepositoryArtifact.delete({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        tagOrDigest: artifact.digest,
      });

      return {
        success: true,
        message: `Chart ${chartName} version ${version} deleted successfully`,
      };
    } catch (error: unknown) {
      throw this.handleError(
        error,
        `Failed to delete chart ${chartName} version ${version}`
      );
    }
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (error instanceof Error) {
      if (error instanceof ValidationError || error instanceof ResourceError) {
        throw error;
      }
      throw new Error(error.message || defaultMessage);
    }
    throw new Error(defaultMessage);
  }

  async handleToolRequest(
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
              text: JSON.stringify(await this.getProjects(), null, 2),
            },
          ],
        };

      case TOOL_NAMES.GET_PROJECT: {
        const projectId = validateParam(args.projectId, "projectId");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await this.getProject(projectId), null, 2),
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
                await this.createProject(projectData),
                null,
                2
              ),
            },
          ],
        };
      }

      case TOOL_NAMES.DELETE_PROJECT: {
        const projectId = validateParam(args.projectId, "projectId");
        await this.deleteProject(projectId);
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
                await this.getRepositories(projectId),
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
        await this.deleteRepository(projectId, repositoryName);
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
                await this.getTags(projectId, repositoryName),
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
        await this.deleteTag(projectId, repositoryName, tag);
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
              text: JSON.stringify(await this.getCharts(projectId), null, 2),
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
                await this.getChartVersions(projectId, chartName),
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
        await this.deleteChart(projectId, chartName, version);
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
}
