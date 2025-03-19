/**
 * MCP Harbor Debug Script
 *
 * This script demonstrates how to debug the MCP Harbor server using Node.js debugging tools.
 *
 * To use this script:
 * 1. Build the project: npm run build
 * 2. Run with Node.js inspector: node --inspect test/test-mcp.js
 * 3. Open Chrome and navigate to chrome://inspect
 * 4. Click on "Open dedicated DevTools for Node"
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

// Set up environment variables for the MCP server
const env = {
  ...process.env,
  HARBOR_URL: "your_harbor_url",
  HARBOR_USERNAME: "your_username",
  HARBOR_PASSWORD: "your_password",
  // Enable debug logging for MCP
  DEBUG: "mcp:*",
};

// Function to run the MCP server and capture its output
function runMcpServer() {
  console.log("Starting MCP Harbor server in debug mode...");

  // Path to the built app.js file
  const appPath = path.resolve(__dirname, "../src/app.ts");

  // Check if the file exists
  if (!fs.existsSync(appPath)) {
    console.error(
      `Error: ${appPath} does not exist. Make sure to build the project first.`
    );
    process.exit(1);
  }

  // Spawn the MCP server process
  const serverProcess = spawn("ts-node", [appPath], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Handle server output
  serverProcess.stdout.on("data", (data) => {
    console.log(`[MCP Server stdout]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[MCP Server stderr]: ${data.toString().trim()}`);
  });

  // Handle server exit
  serverProcess.on("close", (code) => {
    console.log(`MCP Server process exited with code ${code}`);
  });

  // Handle errors
  serverProcess.on("error", (err) => {
    console.error("Failed to start MCP Server:", err);
  });

  // Return the server process for later use
  return serverProcess;
}

// Start the MCP server
const server = runMcpServer();

// Set up a timeout to stop the server after a while
setTimeout(() => {
  console.log("Stopping MCP server...");
  server.kill();
  process.exit(0);
}, 30000); // Run for 30 seconds

// Handle script termination
process.on("SIGINT", () => {
  console.log("Received SIGINT. Stopping MCP server...");
  server.kill();
  process.exit(0);
});
