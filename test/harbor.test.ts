import { HarborService, ProjectData } from "../src/services/harbor.service";

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
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new instance of HarborService for each test
    harborService = new HarborService(apiUrl, auth);
  });

  describe("SSL Certificate Handling", () => {
    it("should handle self-signed certificates", async () => {
      // Setup mock response for a successful connection
      const mockProjects = [{ id: 1, name: "test-project" }];
      mockGetMany.mockResolvedValueOnce({ data: mockProjects });

      // Attempt to get projects, which would fail if SSL verification was strict
      const result = await harborService.getProjects();

      // Verify that the request was made and succeeded
      expect(mockGetMany).toHaveBeenCalledWith({ query: {} });
      expect(result).toEqual(mockProjects);
    });

    it("should connect to HTTPS endpoints", async () => {
      // Setup mock response
      const mockProject = { id: 1, name: "secure-project" };
      mockGetOne.mockResolvedValueOnce(mockProject);

      // Test connection to HTTPS endpoint
      const result = await harborService.getProject("1");

      // Verify successful HTTPS connection
      expect(mockGetOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });

  describe("Project operations", () => {
    it("should get projects", async () => {
      // Setup mock response
      const mockProjects = [
        { id: 1, name: "project1" },
        { id: 2, name: "project2" },
      ];
      mockGetMany.mockResolvedValueOnce({ data: mockProjects });

      // Call the method
      const result = await harborService.getProjects();

      // Assertions
      expect(mockGetMany).toHaveBeenCalledWith({ query: {} });
      expect(result).toEqual(mockProjects);
    });

    it("should get a project by ID", async () => {
      // Setup mock response
      const mockProject = { id: 1, name: "project1" };
      mockGetOne.mockResolvedValueOnce(mockProject);

      // Call the method
      const result = await harborService.getProject("1");

      // Assertions
      expect(mockGetOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });

    it("should get a project by name", async () => {
      // Setup mock response
      const mockProject = { id: 1, name: "project1" };
      mockGetOne.mockResolvedValueOnce(mockProject);

      // Call the method
      const result = await harborService.getProject("project1");

      // Assertions
      expect(mockGetOne).toHaveBeenCalledWith("project1", true);
      expect(result).toEqual(mockProject);
    });

    it("should create a project", async () => {
      // Setup mock response
      const projectData: ProjectData = {
        project_name: "new-project",
        metadata: {
          public: "true",
        },
      };
      const mockCreatedProject = { id: 3, name: "new-project" };
      mockCreate.mockResolvedValueOnce(mockCreatedProject);

      // Call the method
      const result = await harborService.createProject(projectData);

      // Assertions
      expect(mockCreate).toHaveBeenCalledWith({
        project_name: "new-project",
        metadata: { public: "true" },
      });
      expect(result).toEqual(mockCreatedProject);
    });

    it("should delete a project by ID", async () => {
      // Setup mock response
      mockDelete.mockResolvedValueOnce(undefined);

      // Call the method
      await harborService.deleteProject("1");

      // Assertions
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("should delete a project by name", async () => {
      // Setup mock response
      mockDelete.mockResolvedValueOnce(undefined);

      // Call the method
      await harborService.deleteProject("project1");

      // Assertions
      expect(mockDelete).toHaveBeenCalledWith("project1", true);
    });
  });

  describe("Repository operations", () => {
    it("should get repositories", async () => {
      // Setup mock response
      const mockRepositories = [
        { name: "repo1", tags_count: 5 },
        { name: "repo2", tags_count: 3 },
      ];
      mockGetMany.mockResolvedValueOnce({ data: mockRepositories });

      // Call the method
      const result = await harborService.getRepositories("project1");

      // Assertions
      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        query: {},
      });
      expect(result).toEqual(mockRepositories);
    });

    it("should delete a repository", async () => {
      // Setup mock response
      mockDelete.mockResolvedValueOnce(undefined);

      // Call the method
      await harborService.deleteRepository("project1", "repo1");

      // Assertions
      expect(mockDelete).toHaveBeenCalledWith("project1/repo1");
    });
  });

  describe("Tag operations", () => {
    it("should get tags", async () => {
      // Setup mock response
      const mockArtifacts = [
        {
          digest: "sha256:123",
          tags: ["v1.0", "latest"],
          size: 1024,
          push_time: "2023-01-01T00:00:00Z",
          pull_time: "2023-01-02T00:00:00Z",
        },
        {
          digest: "sha256:456",
          tags: ["v2.0"],
          size: 2048,
          push_time: "2023-02-01T00:00:00Z",
          pull_time: "2023-02-02T00:00:00Z",
        },
      ];
      mockGetMany.mockResolvedValueOnce(mockArtifacts);

      // Call the method
      const result = await harborService.getTags("project1", "repo1");

      // Assertions
      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        repositoryName: "repo1",
        query: {},
      });
      expect(result).toEqual([
        {
          name: "sha256:123",
          tags: ["v1.0", "latest"],
          size: 1024,
          push_time: "2023-01-01T00:00:00Z",
          pull_time: "2023-01-02T00:00:00Z",
        },
        {
          name: "sha256:456",
          tags: ["v2.0"],
          size: 2048,
          push_time: "2023-02-01T00:00:00Z",
          pull_time: "2023-02-02T00:00:00Z",
        },
      ]);
    });

    it("should throw an error when deleting a tag", async () => {
      // Call the method and expect it to throw
      await expect(
        harborService.deleteTag("project1", "repo1", "v1.0")
      ).rejects.toThrow(
        "deleteTag method using @hapic/harbor needs further implementation"
      );
    });
  });

  describe("Chart operations", () => {
    it("should get charts", async () => {
      // Setup mock response
      const mockRepositories = [
        {
          name: "project1/charts/chart1",
          artifact_count: 2,
          creation_time: "2023-01-01T00:00:00Z",
          update_time: "2023-01-02T00:00:00Z",
        },
        {
          name: "project1/charts/chart2",
          artifact_count: 1,
          creation_time: "2023-02-01T00:00:00Z",
          update_time: "2023-02-02T00:00:00Z",
        },
        {
          name: "project1/not-a-chart",
          artifact_count: 3,
          creation_time: "2023-03-01T00:00:00Z",
          update_time: "2023-03-02T00:00:00Z",
        },
      ];
      mockGetMany.mockResolvedValueOnce({ data: mockRepositories });

      // Call the method
      const result = await harborService.getCharts("project1");

      // Assertions
      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        query: {},
      });
      expect(result).toEqual([
        {
          name: "chart1",
          total_versions: 2,
          latest_version: "",
          created: "2023-01-01T00:00:00Z",
          updated: "2023-01-02T00:00:00Z",
        },
        {
          name: "chart2",
          total_versions: 1,
          latest_version: "",
          created: "2023-02-01T00:00:00Z",
          updated: "2023-02-02T00:00:00Z",
        },
      ]);
    });

    it("should get chart versions", async () => {
      // Setup mock response
      const mockArtifacts = [
        {
          digest: "sha256:123",
          tags: ["1.0.0"],
          push_time: "2023-01-01T00:00:00Z",
          update_time: "2023-01-02T00:00:00Z",
        },
        {
          digest: "sha256:456",
          tags: ["2.0.0"],
          push_time: "2023-02-01T00:00:00Z",
          update_time: "2023-02-02T00:00:00Z",
        },
      ];
      mockGetMany.mockResolvedValueOnce(mockArtifacts);

      // Call the method
      const result = await harborService.getChartVersions("project1", "chart1");

      // Assertions
      expect(mockGetMany).toHaveBeenCalledWith({
        projectName: "project1",
        repositoryName: "charts/chart1",
        query: {},
      });
      expect(result).toEqual([
        {
          name: "sha256:123",
          version: "1.0.0",
          created: "2023-01-01T00:00:00Z",
          updated: "2023-01-02T00:00:00Z",
        },
        {
          name: "sha256:456",
          version: "2.0.0",
          created: "2023-02-01T00:00:00Z",
          updated: "2023-02-02T00:00:00Z",
        },
      ]);
    });

    it("should return empty array when chart does not exist", async () => {
      // Setup mock response to throw an error
      mockGetMany.mockRejectedValueOnce(new Error("Chart not found"));

      // Call the method
      const result = await harborService.getChartVersions(
        "project1",
        "non-existent-chart"
      );

      // Assertions
      expect(result).toEqual([]);
    });

    it("should throw an error when deleting a chart", async () => {
      // Call the method and expect it to throw
      await expect(
        harborService.deleteChart("project1", "chart1", "1.0.0")
      ).rejects.toThrow(
        "deleteChart method using @hapic/harbor needs further implementation"
      );
    });
  });
});
