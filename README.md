# MCP Harbor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

MCP Harbor is a Node.js application that provides a Model Context Protocol (MCP) server for interacting with Harbor container registry.

## Table of Contents

- [MCP Harbor](#mcp-harbor)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Command Line Arguments](#command-line-arguments)
    - [Environment Variables](#environment-variables)
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

## Usage

### Command Line Arguments

The application accepts the following command line arguments:

```bash
Options:
  --url       Harbor API URL                     [string] [required]
  --username  Harbor username                    [string] [required]
  --password  Harbor password                    [string] [required]
  --debug     Enable debug mode          [boolean] [default: false]
  --help      Show help                                  [boolean]
```

Example usage:

```bash
npm start -- --url https://harbor.example.com --username admin --password Harbor12345
```

### Environment Variables

Instead of command line arguments, you can also use environment variables. Create a `.env` file in the root directory:

```env
# Harbor API Configuration
HARBOR_URL=https://harbor.example.com
HARBOR_USERNAME=admin
HARBOR_PASSWORD=Harbor12345

# Debug Mode (true/false)
DEBUG=false
```

## MCP Tools

The MCP server exposes the following tools:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_projects` | List all projects in Harbor | None |
| `get_project` | Get project details by ID | `projectId: string` |
| `create_project` | Create a new project | `project_name: string, metadata?: object` |
| `delete_project` | Delete a project | `projectId: string` |
| `list_repositories` | List repositories in a project | `projectId: string` |
| `delete_repository` | Delete a repository | `projectId: string, repositoryName: string` |
| `list_tags` | List tags in a repository | `projectId: string, repositoryName: string` |
| `delete_tag` | Delete a tag | `projectId: string, repositoryName: string, tag: string` |
| `list_charts` | List Helm charts | `projectId: string` |
| `list_chart_versions` | List chart versions | `projectId: string, chartName: string` |
| `delete_chart` | Delete chart version | `projectId: string, chartName: string, version: string` |

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
│   ├── controllers
│   │   └── harbor.controller.ts # Harbor controllers
│   ├── services
│   │   └── harbor.service.ts  # Harbor service implementation
│   ├── models 
│   │   └── harbor.model.ts    # Data models
│   ├── routes
│   │   └── harbor.routes.ts   # Route definitions
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

Enable debug mode by using the `--debug` flag or setting:

```env
DEBUG=true
```

### Support

For additional help:

1. Check the [DEBUG.md](DEBUG.md) file
2. Run the connection test: `npm run test:connection`
3. Review the application logs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
