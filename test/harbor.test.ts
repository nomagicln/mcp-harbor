import { HarborService } from "../src/services/harbor.service";
import { ValidationError, ResourceError } from "../src/types/index";

const mockGetMany = jest.fn();
const mockGetOne = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();

// Mock the @hapic/harbor module
jest.mock("@hapic/harbor", () => ({
  HarborClient: jest.fn().mockImplementation(() => ({
    project: {
      getMany: mockGetMany,
      getOne: mockGetOne,
      create: mockCreate,
      delete: mockDelete,
    },
    projectRepository: {
      getMany: mockGetMany,
      delete: mockDelete,
    },
    projectRepositoryArtifact: {
      getMany: mockGetMany,
      delete: mockDelete,
    },
  })),
}));

describe("HarborService", () => {
  let harborService: HarborService;
  const apiUrl = "https://harbor.example.com";
  const auth = { username: "testuser", password: "testpass" };

  beforeEach(() => {
    jest.clearAllMocks();
    harborService = new HarborService(apiUrl, auth);
  });

  describe("Constructor Validation", () => {
    it("should throw ValidationError if apiUrl is missing", () => {
      expect(() => new HarborService("", auth)).toThrow(ValidationError);
      expect(() => new HarborService("", auth)).toThrow("API URL is required");
    });

    it("should throw ValidationError if username is missing", () => {
      expect(
        () => new HarborService(apiUrl, { username: "", password: "test" })
      ).toThrow(ValidationError);
      expect(
        () => new HarborService(apiUrl, { username: "", password: "test" })
      ).toThrow("Username is required");
    });

    it("should throw ValidationError if password is missing", () => {
      expect(
        () => new HarborService(apiUrl, { username: "test", password: "" })
      ).toThrow(ValidationError);
      expect(
        () => new HarborService(apiUrl, { username: "test", password: "" })
      ).toThrow("Password is required");
    });
  });

  describe("Project operations", () => {
    it("should get projects", async () => {
      const mockProjects = {
        data: [
          {
            name: "project1",
            project_id: 1,
            creation_time: "2023-01-01",
            update_time: "2023-01-02",
          },
          {
            name: "project2",
            project_id: 2,
            creation_time: "2023-02-01",
            update_time: "2023-02-02",
          },
        ],
      };
      mockGetMany.mockResolvedValueOnce(mockProjects);

      const result = await harborService.getProjects();

      expect(mockGetMany).toHaveBeenCalledWith({ query: {} });
      expect(result).toEqual(mockProjects.data);
    });

    it("should get a project by ID", async () => {
      const mockProject = {
        name: "project1",
        project_id: 1,
        creation_time: "2023-01-01",
        update_time: "2023-01-02",
      };
      mockGetOne.mockResolvedValueOnce(mockProject);

      const result = await harborService.getProject("1");

      expect(mockGetOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });

    it("should throw ValidationError when getting project with empty ID", async () => {
      await expect(harborService.getProject("")).rejects.toThrow(
        ValidationError
      );
      await expect(harborService.getProject("")).rejects.toThrow(
        "Project ID is required"
      );
    });

    it("should create a project", async () => {
      const projectData = {
        project_name: "new-project",
        metadata: {
          public: "true",
        },
      };
      const mockCreatedProject = {
        name: "new-project",
        project_id: 3,
        creation_time: "2023-01-01",
        update_time: "2023-01-02",
      };
      mockCreate.mockResolvedValueOnce({ id: 3 });
      mockGetOne.mockResolvedValueOnce(mockCreatedProject);

      const result = await harborService.createProject(projectData);

      expect(mockCreate).toHaveBeenCalledWith({
        project_name: "new-project",
        metadata: { public: "true" },
      });
      expect(result).toEqual(mockCreatedProject);
    });

    it("should throw ValidationError when creating project without name", async () => {
      const projectData = { project_name: "" };
      await expect(harborService.createProject(projectData)).rejects.toThrow(
        ValidationError
      );
      await expect(harborService.createProject(projectData)).rejects.toThrow(
        "Project name is required"
      );
    });
  });

  describe("Repository operations", () => {
    it("should get repositories", async () => {
      const mockRepositories = {
        data: [
          {
            name: "repo1",
            artifact_count: 5,
            creation_time: "2023-01-01",
            update_time: "2023-01-02",
          },
          {
            name: "repo2",
            artifact_count: 3,
            creation_time: "2023-02-01",
            update_time: "2023-02-02",
          },
        ],
      };
      mockGetMany.mockResolvedValueOnce(mockRepositories);

      const result = await harborService.getRepositories("project1");

      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        query: {},
      });
      expect(result).toEqual(mockRepositories.data);
    });

    it("should throw ValidationError when getting repositories without project ID", async () => {
      await expect(harborService.getRepositories("")).rejects.toThrow(
        ValidationError
      );
      await expect(harborService.getRepositories("")).rejects.toThrow(
        "Project ID is required"
      );
    });

    it("should delete a repository", async () => {
      mockDelete.mockResolvedValueOnce(undefined);
      await harborService.deleteRepository("project1", "repo1");
      expect(mockDelete).toHaveBeenCalledWith("project1/repo1");
    });

    it("should throw ValidationError when deleting repository without required params", async () => {
      await expect(harborService.deleteRepository("", "repo1")).rejects.toThrow(
        "Project ID is required"
      );
      await expect(
        harborService.deleteRepository("project1", "")
      ).rejects.toThrow("Repository name is required");
    });
  });

  describe("Tag operations", () => {
    const mockArtifacts = [
      {
        digest: "sha256:123",
        tags: [
          {
            id: 1,
            name: "v1.0",
            push_time: "2023-01-01T00:00:00Z",
            pull_time: "2023-01-02T00:00:00Z",
            immutable: false,
            repository_id: 1,
            artifact_id: 1,
            signed: false,
          },
        ],
        size: 1024,
        push_time: "2023-01-01T00:00:00Z",
        pull_time: "2023-01-02T00:00:00Z",
        type: "IMAGE",
        project_id: 1,
        repository_id: 1,
      },
    ];

    it("should get tags", async () => {
      mockGetMany.mockResolvedValueOnce(mockArtifacts);
      const result = await harborService.getTags("project1", "repo1");

      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        repositoryName: "repo1",
        query: {},
      });
      expect(result[0].digest).toBe("sha256:123");
      expect(result[0].tags?.[0].name).toBe("v1.0");
    });

    it("should throw ValidationError when getting tags without required params", async () => {
      await expect(harborService.getTags("", "repo1")).rejects.toThrow(
        "Project ID is required"
      );
      await expect(harborService.getTags("project1", "")).rejects.toThrow(
        "Repository name is required"
      );
    });

    it("should delete a tag", async () => {
      mockGetMany.mockResolvedValueOnce(mockArtifacts);
      mockDelete.mockResolvedValueOnce(undefined);

      const result = await harborService.deleteTag("project1", "repo1", "v1.0");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Tag v1.0 deleted successfully");
    });

    it("should throw ResourceError when deleting non-existent tag", async () => {
      mockGetMany.mockResolvedValueOnce([]);
      await expect(
        harborService.deleteTag("project1", "repo1", "v1.0")
      ).rejects.toThrow(ResourceError);
    });
  });

  describe("Chart operations", () => {
    const mockChartRepositories = {
      data: [
        {
          name: "project1/charts/chart1",
          artifact_count: 2,
          creation_time: "2023-01-01T00:00:00Z",
          update_time: "2023-01-02T00:00:00Z",
        },
      ],
    };

    it("should get charts", async () => {
      mockGetMany.mockResolvedValueOnce(mockChartRepositories);
      const result = await harborService.getCharts("project1");

      expect(result[0].name).toBe("chart1");
      expect(result[0].total_versions).toBe(2);
    });

    it("should throw ValidationError when getting charts without project ID", async () => {
      await expect(harborService.getCharts("")).rejects.toThrow(
        "Project ID is required"
      );
    });

    it("should get chart versions", async () => {
      const mockVersions = [
        {
          digest: "sha256:123",
          tags: [
            {
              id: 1,
              name: "1.0.0",
              push_time: "2023-01-01T00:00:00Z",
              pull_time: "2023-01-02T00:00:00Z",
              immutable: false,
              repository_id: 1,
              artifact_id: 1,
              signed: false,
            },
          ],
          push_time: "2023-01-01T00:00:00Z",
          type: "CHART",
          project_id: 1,
          repository_id: 1,
        },
      ];
      mockGetMany.mockResolvedValueOnce(mockVersions);

      const result = await harborService.getChartVersions("project1", "chart1");

      expect(result[0].name).toBe("sha256:123");
      expect(result[0].version).toBe("1.0.0");
    });

    it("should throw ValidationError when getting chart versions without required params", async () => {
      await expect(
        harborService.getChartVersions("", "chart1")
      ).rejects.toThrow("Project ID is required");
      await expect(
        harborService.getChartVersions("project1", "")
      ).rejects.toThrow("Chart name is required");
    });

    it("should delete a chart version", async () => {
      const mockVersion = {
        digest: "sha256:123",
        tags: [
          {
            id: 1,
            name: "1.0.0",
            push_time: "2023-01-01T00:00:00Z",
            pull_time: "2023-01-02T00:00:00Z",
            immutable: false,
            repository_id: 1,
            artifact_id: 1,
            signed: false,
          },
        ],
      };
      mockGetMany.mockResolvedValueOnce([mockVersion]);
      mockDelete.mockResolvedValueOnce(undefined);

      const result = await harborService.deleteChart(
        "project1",
        "chart1",
        "1.0.0"
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Chart chart1 version 1.0.0 deleted successfully"
      );
    });

    it("should throw ResourceError when deleting non-existent chart version", async () => {
      mockGetMany.mockResolvedValueOnce([]);
      await expect(
        harborService.deleteChart("project1", "chart1", "1.0.0")
      ).rejects.toThrow(ResourceError);
    });
  });
});
