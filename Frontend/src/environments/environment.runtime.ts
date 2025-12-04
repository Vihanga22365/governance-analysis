/**
 * Runtime Configuration
 *
 * This file contains configuration values that should be externalized.
 * Update these values based on your deployment environment.
 *
 * DO NOT hardcode 'localhost' in production deployments.
 * Replace with your actual server IP address or domain name.
 *
 * Examples:
 * - Development: 'localhost' or '127.0.0.1'
 * - Network access: '192.168.1.100' (your PC's IP)
 * - Production: 'api.yourdomain.com'
 */
export const runtimeConfig = {
  // Backend API Host Configuration
  // Change this to your server's IP address or domain name
  pcIpAddress: 'localhost',

  // Port Configuration
  agenticApplicationPort: '8350',
  backendApiPort: '8353',
  mcpServerPort: '8354',
};
