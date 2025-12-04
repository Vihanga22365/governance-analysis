export const environment = {
  production: true,
  // Backend API Configuration
  pcIpAddress: 'localhost',
  agenticApplicationPort: '8350',
  backendApiPort: '8353',

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
