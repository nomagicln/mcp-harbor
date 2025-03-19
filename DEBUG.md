# Debugging MCP Harbor

This document provides instructions on how to debug the MCP Harbor server using various tools and techniques.

## Prerequisites

- Node.js and npm installed
- MCP Harbor project cloned and dependencies installed
- Harbor API credentials (URL, username, password)

## Setting Up Environment Variables

1. Create a `.env` file in the project root based on the `.env.example` template:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your Harbor API credentials:

```
# Harbor API Configuration
HARBOR_URL=https://your-harbor-instance.com
HARBOR_USERNAME=your_username
HARBOR_PASSWORD=your_password

# Debug Configuration
DEBUG=mcp:*
```

## Debugging Methods

### 1. Using VS Code Debugger

The project includes VS Code launch configurations for debugging:

1. Open the project in VS Code
2. Go to the "Run and Debug" panel (Ctrl+Shift+D or Cmd+Shift+D)
3. Select one of the following configurations:
   - **Debug MCP Server**: Runs the MCP server with debugging enabled
   - **Debug MCP Test Script**: Runs the test script with debugging enabled
   - **Run Tests**: Runs the Jest tests with debugging enabled
4. Press F5 or click the green play button to start debugging
5. Set breakpoints in your code by clicking in the gutter next to line numbers
6. Use the debug toolbar to control execution (continue, step over, step into, etc.)
7. Inspect variables in the "Variables" panel

### 2. Using Node.js Inspector

You can debug the MCP server using Node.js built-in inspector:

```bash
node --inspect src/app.ts
```

Then open Chrome and navigate to `chrome://inspect` to connect to the Node.js inspector.

### 3. Using the Connection Test Script

The project includes a connection test script (`tools/test-connection.ts`) that can be used to test the connection to the MCP server:

```bash
npm run test:connection
```

This script:

- Starts the MCP server with debug logging enabled
- Attempts to connect to the server using STDIO transport
- Lists the available tools if the connection is successful
- Provides recommendations based on the test results

If you're having issues connecting to the MCP server with the inspector, this script can help diagnose the problem.

### 4. Using the Debug Server Script

The project includes a debug server script (`tools/debug-server.ts`) that can be used to run the MCP server with enhanced debugging:

```bash
ts-node tools/debug-server.ts
```

This script:

- Starts the MCP server with debug logging enabled
- Displays environment variable information
- Inherits stdio to show all server output in the console
- Handles server exit and error events

This is useful when you need to see all the server output in real-time and diagnose issues with the MCP server.

### 5. Using the Debug Script

The project also includes a debug script (`test/test-mcp.ts`) that can be used to debug the MCP server:

```bash
ts-node test/test-mcp.ts
```

This script starts the MCP server with debug logging enabled and captures its output.

### 6. Enabling Debug Logging

You can enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=mcp:* npm start
```

This will output detailed debug information to the console.

## Debugging Specific Issues

### Debugging MCP Tool Calls

To debug MCP tool calls, add console.log statements in the tool handler functions in `src/app.ts`:

```typescript
case "list_projects":
  console.log("[DEBUG] list_projects called");
  return {
    content: [
      { type: "json", json: await harborService.getProjects() },
    ],
  };
```

### Debugging Harbor Service

To debug the Harbor service, add console.log statements in the service methods in `src/services/harbor.service.ts`:

```typescript
async getProjects() {
  console.log("[DEBUG] getProjects called");
  const response = await this.client.project.getMany({
    query: {},
  });
  console.log("[DEBUG] getProjects response:", response);
  return response.data;
}
```

## Troubleshooting Common Issues

### Error: HARBOR_URL environment variable is required

Make sure you have set up the `.env` file with your Harbor API credentials.

### Error: Cannot read properties of undefined

This usually indicates that an object is null or undefined when you're trying to access its properties. Use the debugger to inspect the object and check if it's properly initialized.

### Error: Failed to connect to transport

This indicates an issue with the MCP server transport. Check if the server is running and if the transport is properly configured.

## Known Issues with @modelcontextprotocol/inspector

The @modelcontextprotocol/inspector tool may have compatibility issues with the MCP Harbor server. Here are some common issues and workarounds:

### Connection Issues

If you're unable to connect to the MCP Harbor server using the @modelcontextprotocol/inspector, try the following:

1. Use the connection test script to verify that the MCP server is working correctly:

   ```bash
   npm run test:connection
   ```

2. Check the version compatibility between the @modelcontextprotocol/inspector and the @modelcontextprotocol/sdk. The MCP Harbor server uses SDK version 1.7.0, which may not be compatible with all versions of the inspector.

3. Try using a different transport method. If STDIO transport is not working, try SSE transport if available.

4. Ensure that the environment variables are set correctly in your `.env` file.

### Alternative Approaches

If you're unable to use the @modelcontextprotocol/inspector, consider these alternatives:

1. Use the connection test script to test the MCP server functionality.
2. Use the VS Code debugger to step through the code and inspect variables.
3. Add console.log statements to the code to track execution flow and debug issues.
4. Use the Node.js inspector to debug the MCP server.

## Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [MCP Inspector Documentation](https://github.com/modelcontextprotocol/inspector) (if available)
