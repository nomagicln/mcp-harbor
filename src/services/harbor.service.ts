import { HarborClient } from "@hapic/harbor";

export interface ProjectData {
  project_name: string;
  metadata?: {
    public?: string;
    enable_content_trust?: string;
    prevent_vul?: string;
    severity?: string;
    auto_scan?: string;
  };
}

export class HarborService {
  private client: HarborClient;

  constructor(apiUrl: string, auth: { username: string; password: string }) {
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
  async getProjects() {
    const response = await this.client.project.getMany({
      query: {},
    });
    return response || [];
  }

  async getProject(projectId: string) {
    // Check if projectId is a number
    if (!isNaN(Number(projectId))) {
      return this.client.project.getOne(Number(projectId));
    }
    // Otherwise, assume it's a name
    return this.client.project.getOne(projectId, true);
  }

  async createProject(projectData: ProjectData) {
    return this.client.project.create({
      project_name: projectData.project_name,
      ...(projectData.metadata && { metadata: projectData.metadata }),
    });
  }

  async deleteProject(projectId: string) {
    // Check if projectId is a number
    if (!isNaN(Number(projectId))) {
      return this.client.project.delete(Number(projectId));
    }
    // Otherwise, assume it's a name
    return this.client.project.delete(projectId, true);
  }

  // Repository/Image operations
  async getRepositories(projectId: string) {
    const response = await this.client.projectRepository.getMany({
      projectName: projectId,
      query: {},
    });
    return response || [];
  }

  async deleteRepository(projectId: string, repositoryName: string) {
    // The @hapic/harbor package expects the full repository name in the format "project-name/repository-name"
    const fullRepoName = `${projectId}/${repositoryName}`;
    return this.client.projectRepository.delete(fullRepoName);
  }

  async getTags(projectId: string, repositoryName: string) {
    // Get artifacts for the repository
    const artifacts = await this.client.projectRepositoryArtifact.getMany({
      projectName: projectId,
      repositoryName: repositoryName,
      query: {},
    });

    // Extract tag information from artifacts
    return (artifacts || []).map((artifact: any) => ({
      name: artifact.digest,
      tags: artifact.tags || [],
      size: artifact.size,
      push_time: artifact.push_time,
      pull_time: artifact.pull_time,
    }));
  }

  async deleteTag(projectId: string, repositoryName: string, tag: string) {
    try {
      // Get artifacts for the repository
      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: repositoryName,
        query: {},
      });

      // Find the artifact with the matching tag
      const artifact = (artifacts || []).find(
        (a: any) => a.tags && a.tags.includes(tag)
      );
      if (!artifact) {
        throw new Error(`Tag ${tag} not found in repository ${repositoryName}`);
      }

      // Delete the artifact using its tag or digest
      await this.client.projectRepositoryArtifact.delete({
        projectName: projectId,
        repositoryName: repositoryName,
        tagOrDigest: artifact.digest,
      });

      return {
        success: true,
        message: `Tag ${tag} deleted successfully`,
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete tag");
    }
  }

  // Helm Chart operations
  async getCharts(projectId: string) {
    // Get all repositories in the project
    const repositories = await this.client.projectRepository.getMany({
      projectName: projectId,
      query: {},
    });

    // Handle repositories safely
    let repoArray: any[] = [];
    if (repositories && typeof repositories === "object") {
      if (Array.isArray(repositories)) {
        repoArray = repositories;
      } else if ("data" in repositories) {
        repoArray = (repositories as any).data || [];
      }
    }

    // Filter for chart repositories
    const chartRepos = repoArray.filter(
      (repo) => repo.name && repo.name.includes("/charts/")
    );

    // Map to the expected format
    return chartRepos.map((repo: any) => ({
      name: repo.name.split("/").pop(),
      total_versions: repo.artifact_count || 0,
      latest_version: "", // Would need additional API calls to get this
      created: repo.creation_time,
      updated: repo.update_time,
    }));
  }

  async getChartVersions(projectId: string, chartName: string) {
    try {
      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        query: {},
      });

      return (artifacts || []).map((artifact: any) => ({
        name: artifact.digest,
        version: artifact.tags?.[0] || "",
        created: artifact.push_time,
        updated: artifact.update_time,
      }));
    } catch (error) {
      return [];
    }
  }

  async deleteChart(projectId: string, chartName: string, version: string) {
    try {
      // Get artifacts for the chart repository
      const artifacts = await this.client.projectRepositoryArtifact.getMany({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        query: {},
      });

      // Find the artifact with the matching version tag
      const artifact = (artifacts || []).find(
        (a: any) => a.tags && a.tags.includes(version)
      );

      if (!artifact) {
        throw new Error(
          `Chart version ${version} not found for chart ${chartName}`
        );
      }

      // Delete the artifact using its tag or digest
      await this.client.projectRepositoryArtifact.delete({
        projectName: projectId,
        repositoryName: `charts/${chartName}`,
        tagOrDigest: artifact.digest,
      });

      return {
        success: true,
        message: `Chart ${chartName} version ${version} deleted successfully`,
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete chart version");
    }
  }
}
