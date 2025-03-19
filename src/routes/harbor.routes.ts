import { Router } from "express";
import { HarborController } from "../controllers/harbor.controller";

const router = Router();
const harborController = new HarborController();

// Project routes
router.get("/projects", harborController.getProjects.bind(harborController));
router.get("/projects/:id", harborController.getProject.bind(harborController));
router.post("/projects", harborController.createProject.bind(harborController));
router.delete(
  "/projects/:id",
  harborController.deleteProject.bind(harborController)
);

// Repository routes
router.get(
  "/projects/:projectId/repositories",
  harborController.getRepositories.bind(harborController)
);
router.delete(
  "/projects/:projectId/repositories/:repositoryName",
  harborController.deleteRepository.bind(harborController)
);

// Tag routes
router.get(
  "/projects/:projectId/repositories/:repositoryName/tags",
  harborController.getTags.bind(harborController)
);
router.delete(
  "/projects/:projectId/repositories/:repositoryName/tags/:tag",
  harborController.deleteTag.bind(harborController)
);

// Chart routes
router.get(
  "/projects/:projectId/charts",
  harborController.getCharts.bind(harborController)
);
router.get(
  "/projects/:projectId/charts/:chartName/versions",
  harborController.getChartVersions.bind(harborController)
);
router.delete(
  "/projects/:projectId/charts/:chartName/versions/:version",
  harborController.deleteChart.bind(harborController)
);

export default router;
