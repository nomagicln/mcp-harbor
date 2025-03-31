import { jest } from "@jest/globals";
import { HarborClient } from "@hapic/harbor";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { HarborService } from "../../src/services/harbor.service.js";
import {
  ValidationError,
  ResourceError,
  TOOL_NAMES,
} from "../../src/types/index.js";

// Create mock types
interface Project {
  name: string;
  project_id: number;
  creation_time?: string;
  update_time?: string;
}

interface Repository {
  name: string;
  artifact_count?: number;
  creation_time?: string;
  update_time?: string;
}

interface Artifact {
  digest: string;
  tags?: Array<{
    id?: number;
    name: string;
    push_time?: string;
    pull_time?: string;
    immutable?: boolean;
    repository_id?: number;
    artifact_id?: number;
    signed?: boolean;
  }>;
  size?: number;
  push_time?: string;
  pull_time?: string;
  type?: string;
  project_id?: number;
  repository_id?: number;
  id?: number;
}

type MockHarborClient = {
  project: {
    getMany: jest.MockedFunction<() => Promise<{ data: Project[] }>>;
    getOne: jest.MockedFunction<
      (id: number | string, isName?: boolean) => Promise<Project | null>
    >;
    create: jest.MockedFunction<
      (data: {
        project_name: string;
        metadata?: Record<string, string>;
      }) => Promise<{ id?: number }>
    >;
    delete: jest.MockedFunction<
      (id: number | string, isName?: boolean) => Promise<void>
    >;
  };
  projectRepository: {
    getMany: jest.MockedFunction<() => Promise<{ data: Repository[] }>>;
    delete: jest.MockedFunction<(fullRepoName: string) => Promise<void>>;
  };
  projectRepositoryArtifact: {
    getMany: jest.MockedFunction<() => Promise<Artifact[]>>;
    delete: jest.MockedFunction<
      (params: {
        projectName: string;
        repositoryName: string;
        tagOrDigest: string;
      }) => Promise<void>
    >;
  };
};

// Mock HarborClient
jest.mock("@hapic/harbor", () => {
  return {
    HarborClient: jest.fn().mockImplementation(() => ({
      project: {
        getMany: jest.fn(),
        getOne: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      projectRepository: {
        getMany: jest.fn(),
        delete: jest.fn(),
      },
      projectRepositoryArtifact: {
        getMany: jest.fn(),
        delete: jest.fn(),
      },
    })),
  };
});

describe("HarborService", () => {
  let harborService: HarborService;
  let mockClient: MockHarborClient;

  const testConfig = {
    apiUrl: "http://harbor.example.com",
    auth: {
      username: "testuser",
      password: "testpass",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    harborService = new HarborService(testConfig.apiUrl, testConfig.auth);
    mockClient = (HarborClient as jest.MockedClass<typeof HarborClient>).mock
      .results[0].value as unknown as MockHarborClient;
  });

  describe("constructor", () => {
    it("should throw ValidationError if apiUrl is missing", () => {
      expect(() => new HarborService("", testConfig.auth)).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if username is missing", () => {
      expect(
        () =>
          new HarborService(testConfig.apiUrl, {
            ...testConfig.auth,
            username: "",
          })
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError if password is missing", () => {
      expect(
        () =>
          new HarborService(testConfig.apiUrl, {
            ...testConfig.auth,
            password: "",
          })
      ).toThrow(ValidationError);
    });
  });

  describe("getProjects", () => {
    const mockProjects = {
      data: [
        {
          name: "test-project",
          project_id: 1,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
      ],
    };

    it("should return mapped projects", async () => {
      mockClient.project.getMany.mockResolvedValue(mockProjects);

      const result = await harborService.getProjects();

      expect(result).toEqual([
        {
          name: "test-project",
          project_id: 1,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
      ]);
      expect(mockClient.project.getMany).toHaveBeenCalledWith({ query: {} });
    });

    it("should handle empty response", async () => {
      mockClient.project.getMany.mockResolvedValue({ data: [] });

      const result = await harborService.getProjects();

      expect(result).toEqual([]);
    });

    it("should handle errors", async () => {
      mockClient.project.getMany.mockRejectedValue(new Error());

      await expect(harborService.getProjects()).rejects.toThrow(
        "Failed to get projects"
      );
    });
  });

  describe("getProject", () => {
    const mockProject = {
      name: "test-project",
      project_id: 1,
      creation_time: "2024-01-01T00:00:00Z",
      update_time: "2024-01-02T00:00:00Z",
    };

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.getProject("")).rejects.toThrow(
        ValidationError
      );
    });

    it("should get project by numeric ID", async () => {
      mockClient.project.getOne.mockResolvedValue(mockProject);

      const result = await harborService.getProject("1");

      expect(result).toEqual(mockProject);
      expect(mockClient.project.getOne).toHaveBeenCalledWith(1);
    });

    it("should get project by name", async () => {
      mockClient.project.getOne.mockResolvedValue(mockProject);

      const result = await harborService.getProject("test-project");

      expect(result).toEqual(mockProject);
      expect(mockClient.project.getOne).toHaveBeenCalledWith(
        "test-project",
        true
      );
    });

    it("should throw ResourceError if project not found", async () => {
      mockClient.project.getOne.mockResolvedValue(null);

      await expect(harborService.getProject("1")).rejects.toThrow(
        ResourceError
      );
    });
  });

  describe("createProject", () => {
    const projectData = {
      project_name: "new-project",
      metadata: { public: "true" },
    };

    it("should throw ValidationError if project name is missing", async () => {
      await expect(
        harborService.createProject({ project_name: "" })
      ).rejects.toThrow(ValidationError);
    });

    it("should create project and return details", async () => {
      mockClient.project.create.mockResolvedValue({ id: 1 });
      mockClient.project.getOne.mockResolvedValue({
        name: "new-project",
        project_id: 1,
        creation_time: "2024-01-01T00:00:00Z",
        update_time: "2024-01-02T00:00:00Z",
      });

      const result = await harborService.createProject(projectData);

      expect(result).toEqual({
        name: "new-project",
        project_id: 1,
        creation_time: "2024-01-01T00:00:00Z",
        update_time: "2024-01-02T00:00:00Z",
      });
      expect(mockClient.project.create).toHaveBeenCalledWith({
        project_name: projectData.project_name,
        metadata: projectData.metadata,
      });
    });

    it("should throw error if creation fails", async () => {
      mockClient.project.create.mockResolvedValue({});

      await expect(harborService.createProject(projectData)).rejects.toThrow(
        "Failed to create project: No project ID returned"
      );
    });
  });

  describe("deleteProject", () => {
    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.deleteProject("")).rejects.toThrow(
        ValidationError
      );
    });

    it("should delete project by numeric ID", async () => {
      await harborService.deleteProject("1");
      expect(mockClient.project.delete).toHaveBeenCalledWith(1);
    });

    it("should delete project by name", async () => {
      await harborService.deleteProject("test-project");
      expect(mockClient.project.delete).toHaveBeenCalledWith(
        "test-project",
        true
      );
    });

    it("should handle errors", async () => {
      mockClient.project.delete.mockRejectedValue(new Error());
      await expect(harborService.deleteProject("1")).rejects.toThrow(
        "Failed to delete project 1"
      );
    });
  });

  describe("getRepositories", () => {
    const mockRepos = {
      data: [
        {
          name: "test-repo",
          artifact_count: 5,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
      ],
    };

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.getRepositories("")).rejects.toThrow(
        ValidationError
      );
    });

    it("should return mapped repositories", async () => {
      mockClient.projectRepository.getMany.mockResolvedValue(mockRepos);

      const result = await harborService.getRepositories("test-project");

      expect(result).toEqual([
        {
          name: "test-repo",
          artifact_count: 5,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
      ]);
      expect(mockClient.projectRepository.getMany).toHaveBeenCalledWith({
        projectName: "test-project",
        query: {},
      });
    });
  });

  describe("deleteRepository", () => {
    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.deleteRepository("", "repo")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if repositoryName is empty", async () => {
      await expect(
        harborService.deleteRepository("project", "")
      ).rejects.toThrow(ValidationError);
    });

    it("should delete repository", async () => {
      await harborService.deleteRepository("project", "repo");
      expect(mockClient.projectRepository.delete).toHaveBeenCalledWith(
        "project/repo"
      );
    });
  });

  describe("getTags", () => {
    const mockArtifacts = [
      {
        digest: "sha256:123",
        tags: [
          {
            id: 1,
            name: "latest",
            push_time: "2024-01-01T00:00:00Z",
            pull_time: "2024-01-02T00:00:00Z",
            immutable: false,
            repository_id: 1,
            artifact_id: 1,
            signed: false,
          },
        ],
        size: 1024,
        push_time: "2024-01-01T00:00:00Z",
        pull_time: "2024-01-02T00:00:00Z",
        type: "image",
        project_id: 1,
        repository_id: 1,
        id: 1,
      },
    ];

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.getTags("", "repo")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if repositoryName is empty", async () => {
      await expect(harborService.getTags("project", "")).rejects.toThrow(
        ValidationError
      );
    });

    it("should return mapped tags", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue(
        mockArtifacts
      );

      const result = await harborService.getTags("project", "repo");

      expect(result).toEqual(mockArtifacts);
      expect(mockClient.projectRepositoryArtifact.getMany).toHaveBeenCalledWith(
        {
          projectName: "project",
          repositoryName: "repo",
          query: {},
        }
      );
    });
  });

  describe("deleteTag", () => {
    const mockArtifacts = [
      {
        digest: "sha256:123",
        tags: [{ name: "latest" }],
      },
    ];

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.deleteTag("", "repo", "tag")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if repositoryName is empty", async () => {
      await expect(
        harborService.deleteTag("project", "", "tag")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if tagName is empty", async () => {
      await expect(
        harborService.deleteTag("project", "repo", "")
      ).rejects.toThrow(ValidationError);
    });

    it("should delete tag", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue(
        mockArtifacts
      );

      const result = await harborService.deleteTag("project", "repo", "latest");

      expect(result).toEqual({
        success: true,
        message: "Tag latest deleted successfully",
      });
      expect(mockClient.projectRepositoryArtifact.delete).toHaveBeenCalledWith({
        projectName: "project",
        repositoryName: "repo",
        tagOrDigest: "sha256:123",
      });
    });

    it("should throw ResourceError if tag not found", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue([]);

      await expect(
        harborService.deleteTag("project", "repo", "latest")
      ).rejects.toThrow(ResourceError);
    });
  });

  describe("getCharts", () => {
    const mockRepos = {
      data: [
        {
          name: "test-project/charts/test-chart",
          artifact_count: 2,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
        {
          name: "test-project/not-a-chart",
          artifact_count: 1,
          creation_time: "2024-01-01T00:00:00Z",
          update_time: "2024-01-02T00:00:00Z",
        },
      ],
    };

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.getCharts("")).rejects.toThrow(
        ValidationError
      );
    });

    it("should return mapped charts", async () => {
      mockClient.projectRepository.getMany.mockResolvedValue(mockRepos);

      const result = await harborService.getCharts("test-project");

      expect(result).toEqual([
        {
          name: "test-chart",
          total_versions: 2,
          latest_version: "",
          created: "2024-01-01T00:00:00Z",
          updated: "2024-01-02T00:00:00Z",
        },
      ]);
    });
  });

  describe("getChartVersions", () => {
    const mockArtifacts = [
      {
        digest: "sha256:123",
        tags: [{ name: "1.0.0" }],
        push_time: "2024-01-01T00:00:00Z",
      },
    ];

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(harborService.getChartVersions("", "chart")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError if chartName is empty", async () => {
      await expect(
        harborService.getChartVersions("project", "")
      ).rejects.toThrow(ValidationError);
    });

    it("should return mapped chart versions", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue(
        mockArtifacts
      );

      const result = await harborService.getChartVersions("project", "chart");

      expect(result).toEqual([
        {
          name: "sha256:123",
          version: "1.0.0",
          created: "2024-01-01T00:00:00Z",
          updated: "2024-01-01T00:00:00Z",
        },
      ]);
    });
  });

  describe("deleteChart", () => {
    const mockArtifacts = [
      {
        digest: "sha256:123",
        tags: [{ name: "1.0.0" }],
      },
    ];

    it("should throw ValidationError if projectId is empty", async () => {
      await expect(
        harborService.deleteChart("", "chart", "1.0.0")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if chartName is empty", async () => {
      await expect(
        harborService.deleteChart("project", "", "1.0.0")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if version is empty", async () => {
      await expect(
        harborService.deleteChart("project", "chart", "")
      ).rejects.toThrow(ValidationError);
    });

    it("should delete chart version", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue(
        mockArtifacts
      );

      const result = await harborService.deleteChart(
        "project",
        "chart",
        "1.0.0"
      );

      expect(result).toEqual({
        success: true,
        message: "Chart chart version 1.0.0 deleted successfully",
      });
      expect(mockClient.projectRepositoryArtifact.delete).toHaveBeenCalledWith({
        projectName: "project",
        repositoryName: "charts/chart",
        tagOrDigest: "sha256:123",
      });
    });

    it("should throw ResourceError if chart version not found", async () => {
      mockClient.projectRepositoryArtifact.getMany.mockResolvedValue([]);

      await expect(
        harborService.deleteChart("project", "chart", "1.0.0")
      ).rejects.toThrow(ResourceError);
    });
  });

  describe("handleToolRequest", () => {
    it("should handle LIST_PROJECTS tool", async () => {
      const mockProjects = [{ name: "test-project", project_id: 1 }];
      jest.spyOn(harborService, "getProjects").mockResolvedValue(mockProjects);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.LIST_PROJECTS,
        {}
      );

      expect(result).toEqual({
        content: [
          { type: "text", text: JSON.stringify(mockProjects, null, 2) },
        ],
      });
    });

    it("should handle GET_PROJECT tool", async () => {
      const mockProject = { name: "test-project", project_id: 1 };
      jest.spyOn(harborService, "getProject").mockResolvedValue(mockProject);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.GET_PROJECT,
        {
          projectId: "1",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockProject, null, 2) }],
      });
    });

    it("should throw McpError for unknown tool", async () => {
      await expect(
        harborService.handleToolRequest("UNKNOWN_TOOL", {})
      ).rejects.toThrow(
        new McpError(ErrorCode.MethodNotFound, "Unknown tool: UNKNOWN_TOOL")
      );
    });

    it("should throw McpError for missing required parameters", async () => {
      await expect(
        harborService.handleToolRequest(TOOL_NAMES.GET_PROJECT, {})
      ).rejects.toThrow(
        new McpError(ErrorCode.InvalidParams, "projectId is required")
      );
    });

    it("should handle CREATE_PROJECT tool", async () => {
      const mockProject = { name: "new-project", project_id: 1 };
      jest.spyOn(harborService, "createProject").mockResolvedValue(mockProject);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.CREATE_PROJECT,
        {
          project_name: "new-project",
          metadata: { public: "true" },
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockProject, null, 2) }],
      });
    });

    it("should handle DELETE_PROJECT tool", async () => {
      jest.spyOn(harborService, "deleteProject").mockResolvedValue();

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.DELETE_PROJECT,
        {
          projectId: "1",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: "Project deleted successfully" }],
      });
    });

    it("should handle LIST_REPOSITORIES tool", async () => {
      const mockRepos = [{ name: "test-repo", artifact_count: 5 }];
      jest.spyOn(harborService, "getRepositories").mockResolvedValue(mockRepos);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.LIST_REPOSITORIES,
        {
          projectId: "1",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockRepos, null, 2) }],
      });
    });

    it("should handle DELETE_REPOSITORY tool", async () => {
      jest.spyOn(harborService, "deleteRepository").mockResolvedValue();

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.DELETE_REPOSITORY,
        {
          projectId: "1",
          repositoryName: "test-repo",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: "Repository deleted successfully" }],
      });
    });

    it("should handle LIST_TAGS tool", async () => {
      const mockTags = [
        {
          digest: "sha256:123",
          tags: [
            {
              id: 1,
              name: "latest",
              push_time: "2024-01-01T00:00:00Z",
              pull_time: "2024-01-02T00:00:00Z",
              immutable: false,
              repository_id: 1,
              artifact_id: 1,
              signed: false,
            },
          ],
          size: 1024,
          push_time: "2024-01-01T00:00:00Z",
          pull_time: "2024-01-02T00:00:00Z",
          type: "image",
          project_id: 1,
          repository_id: 1,
          id: 1,
        },
      ];
      jest.spyOn(harborService, "getTags").mockResolvedValue(mockTags);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.LIST_TAGS,
        {
          projectId: "1",
          repositoryName: "test-repo",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockTags, null, 2) }],
      });
    });

    it("should handle DELETE_TAG tool", async () => {
      jest.spyOn(harborService, "deleteTag").mockResolvedValue({
        success: true,
        message: "Tag deleted successfully",
      });

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.DELETE_TAG,
        {
          projectId: "1",
          repositoryName: "test-repo",
          tag: "latest",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: "Tag deleted successfully" }],
      });
    });

    it("should handle LIST_CHARTS tool", async () => {
      const mockCharts = [
        {
          name: "test-chart",
          total_versions: 2,
          latest_version: "1.0.0",
          created: "2024-01-01T00:00:00Z",
          updated: "2024-01-02T00:00:00Z",
        },
      ];
      jest.spyOn(harborService, "getCharts").mockResolvedValue(mockCharts);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.LIST_CHARTS,
        {
          projectId: "1",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: JSON.stringify(mockCharts, null, 2) }],
      });
    });

    it("should handle LIST_CHART_VERSIONS tool", async () => {
      const mockVersions = [
        {
          name: "sha256:123",
          version: "1.0.0",
          created: "2024-01-01T00:00:00Z",
          updated: "2024-01-02T00:00:00Z",
        },
      ];
      jest
        .spyOn(harborService, "getChartVersions")
        .mockResolvedValue(mockVersions);

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.LIST_CHART_VERSIONS,
        {
          projectId: "1",
          chartName: "test-chart",
        }
      );

      expect(result).toEqual({
        content: [
          { type: "text", text: JSON.stringify(mockVersions, null, 2) },
        ],
      });
    });

    it("should handle DELETE_CHART tool", async () => {
      jest.spyOn(harborService, "deleteChart").mockResolvedValue({
        success: true,
        message: "Chart deleted successfully",
      });

      const result = await harborService.handleToolRequest(
        TOOL_NAMES.DELETE_CHART,
        {
          projectId: "1",
          chartName: "test-chart",
          version: "1.0.0",
        }
      );

      expect(result).toEqual({
        content: [{ type: "text", text: "Chart deleted successfully" }],
      });
    });

    it("should throw McpError for missing required parameters in CREATE_PROJECT", async () => {
      await expect(
        harborService.handleToolRequest(TOOL_NAMES.CREATE_PROJECT, {})
      ).rejects.toThrow(
        new McpError(ErrorCode.InvalidParams, "project_name is required")
      );
    });

    it("should throw McpError for missing required parameters in DELETE_REPOSITORY", async () => {
      await expect(
        harborService.handleToolRequest(TOOL_NAMES.DELETE_REPOSITORY, {
          projectId: "1",
        })
      ).rejects.toThrow(
        new McpError(ErrorCode.InvalidParams, "repositoryName is required")
      );
    });

    it("should throw McpError for missing required parameters in DELETE_TAG", async () => {
      await expect(
        harborService.handleToolRequest(TOOL_NAMES.DELETE_TAG, {
          projectId: "1",
          repositoryName: "test-repo",
        })
      ).rejects.toThrow(
        new McpError(ErrorCode.InvalidParams, "tag is required")
      );
    });

    it("should throw McpError for missing required parameters in DELETE_CHART", async () => {
      await expect(
        harborService.handleToolRequest(TOOL_NAMES.DELETE_CHART, {
          projectId: "1",
          chartName: "test-chart",
        })
      ).rejects.toThrow(
        new McpError(ErrorCode.InvalidParams, "version is required")
      );
    });
  });
});
