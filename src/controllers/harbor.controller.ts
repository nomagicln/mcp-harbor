import { Request, Response } from "express";
import { HarborService } from "../services/harbor.service.js";
import dotenv from "dotenv";

dotenv.config();

export class HarborController {
  private harborService: HarborService;

  constructor() {
    // Initialize the Harbor service using the @hapic/harbor package
    this.harborService = new HarborService(process.env.HARBOR_URL || "", {
      username: process.env.HARBOR_USERNAME || "",
      password: process.env.HARBOR_PASSWORD || "",
    });
  }

  // Project operations
  public async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const projects = await this.harborService.getProjects();
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects", error });
    }
  }

  public async getProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.id;
      const project = await this.harborService.getProject(projectId);
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project", error });
    }
  }

  public async createProject(req: Request, res: Response): Promise<void> {
    try {
      const projectData = req.body;
      const newProject = await this.harborService.createProject(projectData);
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project", error });
    }
  }

  public async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.id;
      await this.harborService.deleteProject(projectId);
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project", error });
    }
  }

  // Repository operations
  public async getRepositories(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const repositories = await this.harborService.getRepositories(projectId);
      res.status(200).json(repositories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get repositories", error });
    }
  }

  public async deleteRepository(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const repositoryName = req.params.repositoryName;
      await this.harborService.deleteRepository(projectId, repositoryName);
      res.status(200).json({ message: "Repository deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete repository", error });
    }
  }

  // Tag operations
  public async getTags(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const repositoryName = req.params.repositoryName;
      const tags = await this.harborService.getTags(projectId, repositoryName);
      res.status(200).json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tags", error });
    }
  }

  public async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const repositoryName = req.params.repositoryName;
      const tag = req.params.tag;
      const result = await this.harborService.deleteTag(
        projectId,
        repositoryName,
        tag
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tag", error });
    }
  }

  // Chart operations
  public async getCharts(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const charts = await this.harborService.getCharts(projectId);
      res.status(200).json(charts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get charts", error });
    }
  }

  public async getChartVersions(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const chartName = req.params.chartName;
      const versions = await this.harborService.getChartVersions(
        projectId,
        chartName
      );
      res.status(200).json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chart versions", error });
    }
  }

  public async deleteChart(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;
      const chartName = req.params.chartName;
      const version = req.params.version;
      const result = await this.harborService.deleteChart(
        projectId,
        chartName,
        version
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chart", error });
    }
  }
}
