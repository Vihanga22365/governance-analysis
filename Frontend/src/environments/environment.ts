import { runtimeConfig } from './environment.runtime';

export const environment = {
  production: true,
  // Backend API Configuration - Values from runtime config
  pcIpAddress: runtimeConfig.pcIpAddress,
  agenticApplicationPort: runtimeConfig.agenticApplicationPort,
  backendApiPort: runtimeConfig.backendApiPort,
  mcpServerPort: runtimeConfig.mcpServerPort,

  // Constructed URLs
  get agenticApplicationUrl(): string {
    return `http://${this.pcIpAddress}:${this.agenticApplicationPort}`;
  },
  get backendApiUrl(): string {
    return `http://${this.pcIpAddress}:${this.backendApiPort}/api`;
  },
  get backendBaseUrl(): string {
    return `http://${this.pcIpAddress}:${this.backendApiPort}`;
  },
  get mcpServerWsUrl(): string {
    return `ws://${this.pcIpAddress}:${this.mcpServerPort}`;
  },

  // Application Configuration
  appName: 'agentic_application',
  defaultUserId: 'Chathusha Wijenayake',

  // External CDN URLs
  pdfjsWorkerUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
};
