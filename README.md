# MCP Harbor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

MCP Harbor is a Node.js application that provides a Model Context Protocol (MCP) server for interacting with Harbor container registry. It also includes a REST API for Harbor operations.

## Table of Contents

- [MCP Harbor](#mcp-harbor)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Configuration File](#configuration-file)
  - [API Endpoints](#api-endpoints)
    - [Projects](#projects)
    - [Repositories](#repositories)
    - [Tags](#tags)
    - [Helm Charts](#helm-charts)
  - [MCP Tools](#mcp-tools)
  - [Development](#development)
    - [Running in Development Mode](#running-in-development-mode)
    - [Running Tests](#running-tests)
    - [Debug Tools](#debug-tools)
  - [Project Structure](#project-structure)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debug Mode](#debug-mode)
    - [Support](#support)
  - [License](#license)

## Features

- **MCP Server**: Exposes tools for interacting with Harbor through the Model Context Protocol
- **REST API**: Provides RESTful endpoints for Harbor operations
- **Harbor Operations**: Supports operations for projects, repositories, tags, and Helm charts
- **TypeScript**: Written in TypeScript for better type safety and developer experience
- **Automated Tests**: Comprehensive test suite for reliable functionality

## Prerequisites

Before installing MCP Harbor, ensure you have:

- Node.js 18.x or higher
- npm 8.x or higher
- Access to a Harbor registry instance
- Git (for cloning the repository)

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

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the application:

   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
HARBOR_URL=https://your-harbor-instance.com
HARBOR_USERNAME=your_username
HARBOR_PASSWORD=your_password

# Optional
PORT=3000                  # Server port (default: 3000)
LOG_LEVEL=info            # Logging level (default: info)
ENABLE_HTTPS=false       # Enable HTTPS (default: false)
SSL_CERT_PATH=/path/to/cert.pem  # Required if ENABLE_HTTPS=true
SSL_KEY_PATH=/path/to/key.pem    # Required if ENABLE_HTTPS=true
```

### Configuration File

Additional configuration options can be set in `src/config/harbor.config.ts`:

```typescript
{
  timeout: 30000,         // API request timeout in milliseconds
  retryAttempts: 3,      // Number of retry attempts for failed requests
  cacheEnabled: true,     // Enable response caching
  cacheTTL: 300          // Cache TTL in seconds
}
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

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_projects` | List all projects in Harbor | None |
| `get_project` | Get project details by ID | `id: number` |
| `create_project` | Create a new project | `name: string, public?: boolean` |
| `delete_project` | Delete a project | `id: number` |
| `list_repositories` | List repositories in a project | `projectId: number` |
| `delete_repository` | Delete a repository | `projectId: number, repoName: string` |
| `list_tags` | List tags in a repository | `projectId: number, repoName: string` |
| `delete_tag` | Delete a tag | `projectId: number, repoName: string, tag: string` |
| `list_charts` | List Helm charts | `projectId: number` |
| `list_chart_versions` | List chart versions | `projectId: number, chartName: string` |
| `delete_chart` | Delete chart version | `projectId: number, chartName: string, version: string` |

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- test/harbor.test.ts
```

### Debug Tools

The project includes debug tools in the `tools` directory:

```bash
# Test Harbor connection
npm run test:connection

# Start debug server
npm run debug:server
```

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
├── tools
│   ├── debug-server.ts        # Debug server implementation
│   └── test-connection.ts     # Connection testing utility
├── .env.example              # Example environment variables
├── .gitignore               # Git ignore file
├── package.json            # Project dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md             # Project documentation
```

## Troubleshooting

### Common Issues

1. **Connection Failed**

   ```
   Error: Unable to connect to Harbor instance
   ```

   - Verify HARBOR_URL is correct and accessible
   - Check network connectivity
   - Ensure Harbor instance is running

2. **Authentication Failed**

   ```
   Error: Invalid credentials
   ```

   - Verify HARBOR_USERNAME and HARBOR_PASSWORD are correct
   - Check if user has required permissions

3. **Build Errors**

   ```
   Error: TypeScript compilation failed
   ```

   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript version compatibility
   - Clear the `dist` directory and rebuild

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

### Support

For additional help:

1. Check the [DEBUG.md](DEBUG.md) file
2. Run the connection test: `npm run test:connection`
3. Review the application logs in `logs/` directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
