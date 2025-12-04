export const AgenticConfig = {
  PC_IP_ADDRESS: process.env.AGENTIC_PC_IP || 'localhost',
  AGENTIC_APPLICATION_PORT: process.env.AGENTIC_PORT || '8350',

  getAgenticApplicationUrl(): string {
    return `http://${this.PC_IP_ADDRESS}:${this.AGENTIC_APPLICATION_PORT}`;
  },

  getChatHistoryUrl(userName: string, sessionId: string): string {
    return `${this.getAgenticApplicationUrl()}/apps/agentic_application/users/${userName}/sessions/${sessionId}`;
  },
};
