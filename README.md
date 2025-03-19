# MCP Harbor

MCP Harbor is a Node.js application that provides a Model Context Protocol (MCP) server for interacting with Harbor container registry. It also includes a REST API for Harbor operations.

## Features

- **MCP Server**: Exposes tools for interacting with Harbor through the Model Context Protocol
- **REST API**: Provides RESTful endpoints for Harbor operations
- **Harbor Operations**: Supports operations for projects, repositories, tags, and Helm charts

## Project Structure

```
mcp-harbor
├── src
│   ├── app.ts                 # Main application entry point (MCP server)
│   ├── config
│   │   └── harbor.config.ts   # Harbor configuration
│   ├── controllers
│   │   └── harbor.controller.ts # REST API controllers
│   ├── services
│   │   └── harbor.service.ts  # Harbor service implementation
│   ├── models 
│   │   └── harbor.model.ts    # Data models
│   ├── routes
│   │   └── harbor.routes.ts   # API route definitions
│   └── types
│       └── index.ts           # TypeScript type definitions
├── test
│   └── harbor.test.ts         # Tests for Harbor service
├── .env                       # Environment variables
├── .gitignore                 # Git ignore file
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nomagicln/mcp-harbor.git
   ```

2. Navigate to the project directory:

   ```bash
   cd mcp-harbor
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   HARBOR_URL=https://your-harbor-instance.com
   HARBOR_USERNAME=your_username
   HARBOR_PASSWORD=your_password
   ```

5. Build the project:

   ```bash
   npm run build
   ```

6. Start the application:

   ```bash
   npm start
   ```

## API Endpoints

### Projects

- `GET /projects` - List all projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create a new project
- `DELETE /projects/:id` - Delete a project

### Repositories

- `GET /projects/:projectId/repositories` - List repositories in a project
- `DELETE /projects/:projectId/repositories/:repositoryName` - Delete a repository

### Tags

- `GET /projects/:projectId/repositories/:repositoryName/tags` - List tags in a repository
- `DELETE /projects/:projectId/repositories/:repositoryName/tags/:tag` - Delete a tag

### Helm Charts

- `GET /projects/:projectId/charts` - List Helm charts in a project
- `GET /projects/:projectId/charts/:chartName/versions` - List versions of a Helm chart
- `DELETE /projects/:projectId/charts/:chartName/versions/:version` - Delete a Helm chart version

## MCP Tools

The MCP server exposes the following tools:

- `list_projects` - List all projects in Harbor
- `get_project` - Get project details by ID
- `create_project` - Create a new project in Harbor
- `delete_project` - Delete a project by ID
- `list_repositories` - List all repositories in a project
- `delete_repository` - Delete a repository
- `list_tags` - List all tags in a repository
- `delete_tag` - Delete a tag from a repository
- `list_charts` - List all Helm charts in a project
- `list_chart_versions` - List all versions of a Helm chart
- `delete_chart` - Delete a specific version of a Helm chart

## Development

To run the project in development mode:

```bash
npm run dev
```

To run tests:

```bash
npm test
```

## License

This project is licensed under the MIT License.
