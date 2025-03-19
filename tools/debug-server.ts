#!/usr/bin/env node
/**
 * MCP Harbor Debug Server
 *
 * This script runs the MCP Harbor server with enhanced debugging.
 * It provides detailed logging of server events and can help diagnose issues with the MCP server.
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the app.ts file
const appPath = path.resolve(__dirname, "../src/app.ts");

// Set up environment variables for the MCP server
const env = {
  ...process.env,
  HARBOR_URL: process.env.HARBOR_URL || "https://example.harbor.com",
  HARBOR_USERNAME: process.env.HARBOR_USERNAME || "test-user",
  HARBOR_PASSWORD: process.env.HARBOR_PASSWORD || "test-password",
  DEBUG: "mcp:*",
};

/**
 * Run the MCP server with enhanced debugging
 */
function runDebugServer() {
  console.log("MCP Harbor Debug Server");
  console.log("======================");
  console.log("");

  console.log("Environment variables:");
  console.log(`- HARBOR_URL: ${env.HARBOR_URL ? "Set" : "Not set"}`);
  console.log(`- HARBOR_USERNAME: ${env.HARBOR_USERNAME ? "Set" : "Not set"}`);
  console.log(`- HARBOR_PASSWORD: ${env.HARBOR_PASSWORD ? "Set" : "Not set"}`);
  console.log(`- DEBUG: ${env.DEBUG || "Not set"}`);
  console.log("");

  console.log("Starting MCP server with enhanced debugging...");
  console.log("Press Ctrl+C to stop the server.");
  console.log("");

  // Start the MCP server process
  const serverProcess = spawn("ts-node", [appPath], {
    env,
    stdio: "inherit", // Inherit stdio to see the output in the console
  });

  // Handle server exit
  serverProcess.on("close", (code) => {
    console.log(`MCP Server process exited with code ${code}`);
  });

  // Handle errors
  serverProcess.on("error", (err) => {
    console.error("Failed to start MCP Server:", err);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Stopping MCP server...");
    serverProcess.kill();
    process.exit(0);
  });
}

// Run the debug server
runDebugServer();
