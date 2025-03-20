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
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Set up environment variables for the MCP server
const env = {
  ...process.env,
  HARBOR_URL: process.env.HARBOR_URL || "",
  HARBOR_USERNAME: process.env.HARBOR_USERNAME || "",
  HARBOR_PASSWORD: process.env.HARBOR_PASSWORD || "",
  // Enable debug logging for MCP
  DEBUG: "mcp:*",
};

// Function to run the MCP server and capture its output
function runMcpServer() {
  console.log("Starting MCP Harbor server in debug mode...");

  // Verify required environment variables
  if (!env.HARBOR_URL || !env.HARBOR_USERNAME || !env.HARBOR_PASSWORD) {
    console.error(
      "Error: Missing required environment variables. Please check your .env file."
    );
    console.error(
      "Required variables: HARBOR_URL, HARBOR_USERNAME, HARBOR_PASSWORD"
    );
    process.exit(1);
  }

  // Get the directory name in ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Path to the built app.js file
  const appPath = join(__dirname, "../dist/app.js");

  // Check if the file exists
  if (!fs.existsSync(appPath)) {
    console.error(
      `Error: ${appPath} does not exist. Make sure to build the project first.`
    );
    process.exit(1);
  }

  // Spawn the MCP server process
  const serverProcess = spawn("node", [appPath], {
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
