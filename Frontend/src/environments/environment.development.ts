export const environment = {
  production: false,
  // Backend API Configuration
  // TODO: Replace 'localhost' with your PC's IP address (e.g., '192.168.1.100') for network access
  pcIpAddress: 'localhost',
  agenticApplicationPort: '7350',
  backendApiPort: '3000',

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

  // Application Configuration
  appName: 'agentic_application',
  defaultUserId: 'Chathusha Wijenayake',

  // External CDN URLs
  pdfjsWorkerUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
};
