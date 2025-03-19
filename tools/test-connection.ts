#!/usr/bin/env node
/**
 * MCP Harbor Connection Tester
 *
 * This script tests the connection to the MCP Harbor server using different transport methods.
 * It can be used to diagnose connection issues with the MCP server.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
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
 * Test connection using STDIO transport
 */
async function testStdioConnection() {
  console.log("Testing STDIO connection...");

  try {
    // Start the MCP server process
    console.log("Starting MCP server...");
    const serverProcess = spawn("ts-node", [appPath], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle server output for debugging
    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server stdout]: ${data.toString().trim()}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server stderr]: ${data.toString().trim()}`);
    });

    // Wait for the server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a client with STDIO transport
    console.log("Creating MCP client with STDIO transport...");
    const transport = new StdioClientTransport({
      command: "ts-node",
      args: [appPath],
      env,
    });

    const client = new Client({
      name: "mcp-harbor-tester",
      version: "1.0.0",
    });

    // Connect to the server
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    console.log("Connected to MCP server successfully!");

    // List available tools
    console.log("Listing available tools...");
    const tools = await client.listTools();
    console.log("Available tools:", tools);

    // Close the connection
    await client.close();
    console.log("Connection closed.");

    // Stop the server
    serverProcess.kill();
    console.log("Server stopped.");

    return true;
  } catch (error) {
    console.error("Error testing STDIO connection:", error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("MCP Harbor Connection Tester");
  console.log("============================");
  console.log("");

  console.log("Environment variables:");
  console.log(`- HARBOR_URL: ${env.HARBOR_URL ? "Set" : "Not set"}`);
  console.log(`- HARBOR_USERNAME: ${env.HARBOR_USERNAME ? "Set" : "Not set"}`);
  console.log(`- HARBOR_PASSWORD: ${env.HARBOR_PASSWORD ? "Set" : "Not set"}`);
  console.log(`- DEBUG: ${env.DEBUG || "Not set"}`);
  console.log("");

  // Test STDIO connection
  const stdioSuccess = await testStdioConnection();

  console.log("");
  console.log("Connection Test Results:");
  console.log(`- STDIO: ${stdioSuccess ? "Success" : "Failed"}`);

  // Provide recommendations based on test results
  console.log("");
  console.log("Recommendations:");

  if (!stdioSuccess) {
    console.log("- Check that the MCP server is configured correctly");
    console.log("- Ensure that the environment variables are set correctly");
    console.log("- Check for any errors in the server logs");
    console.log("- Try running the server directly with: ts-node src/app.ts");
  } else {
    console.log("- The MCP server is working correctly with STDIO transport");
    console.log(
      "- If you are still having issues with the inspector, check the inspector configuration"
    );
  }
}

// Run the main function
main().catch(console.error);
