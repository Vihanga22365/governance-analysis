import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ChatbotService } from '../services/chatbot.service';
import { DocumentUploadService } from '../services/document-upload.service';
import { environment } from '../../environments/environment';
// Configure PDF.js worker - version 3.x uses different worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = environment.pdfjsWorkerUrl;

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface Attachment {
  id: number;
  name: string;
  sizeLabel: string;
  file: File;
}

interface ChatMessage {
  id: number;
  author: string;
  timestamp: string;
  text: string;
  type: 'incoming' | 'outgoing';
  attachments?: Attachment[];
  html?: SafeHtml | null;
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [NgClass, NgIf, FormsModule],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.scss',
})
export class ChatInterfaceComponent implements OnInit {
  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private documentUploadService: DocumentUploadService
  ) {}
  @ViewChild('userInputArea') userInputArea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageList') messageList?: ElementRef<HTMLOListElement>;
  sessionId: string = this.generateUUID();
  userName: string = 'Chathusha Wijenayake';
  userInitials: string = 'CW';

  readonly threadSummary = {
    title: 'Quarterly Risk Review',
    participants: ['You', 'Risk CoPilot'],
  };

  private messageCounter = 0;

  readonly messages: ChatMessage[] = [];

  attachments: Attachment[] = [];
  isDragging = false;
  userInput: string = '';
  private attachmentCounter = 0;
  private sessionCreated = false;
  isAgentTyping = false;

  ngOnInit(): void {
    if (this.messages.length) {
      this.scrollToLatestMessage();
    }
    this.createChatSession();
  }

  private createChatSession(): void {
    console.log('Creating chat session with ID:', this.sessionId);

    this.chatbotService
      .createSession(
        this.sessionId,
        'Chathusha Wijenayake',
        'Software Architect'
      )
      .subscribe({
        next: (response) => {
          console.log('Session created successfully:', response);
          this.sessionCreated = true;
        },
        error: (error) => {
          console.error('Failed to create session:', error);
          console.log('Will retry on first message send');
        },
      });
  }

  get isSendDisabled(): boolean {
    return !this.userInput.trim() && this.attachments.length === 0;
  }

  onInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.isSendDisabled) {
        this.sendMessage();
      }
    }
  }

  getFileIconLabel(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'FILE';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'DOC';
    return ext.toUpperCase();
  }

  downloadAttachment(att: Attachment): void {
    const blob = new Blob([att.file], { type: att.file.type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      input.value = '';
      return;
    }

    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const validFiles = Array.from(files).filter((file) =>
        this.isValidFileType(file)
      );
      if (validFiles.length > 0) {
        this.addFiles(validFiles);
      }
    }
  }

  private isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];

    return (
      allowedTypes.includes(file.type) ||
      allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  private addFiles(files: File[]): void {
    const existingNames = new Set(this.attachments.map((att) => att.name));
    const newAttachments = files
      .filter((file) => !existingNames.has(file.name))
      .map((file) => ({
        id: ++this.attachmentCounter,
        name: file.name,
        sizeLabel: this.formatFileSize(file.size),
        file,
      }));

    this.attachments = [...this.attachments, ...newAttachments];

    // After adding files, move focus to the text input
    queueMicrotask(() => {
      this.userInputArea?.nativeElement.focus();
    });
  }

  private uploadNewAttachments(newAttachments: Attachment[]): void {
    if (!newAttachments.length) {
      return;
    }

    const files = newAttachments.map((attachment) => attachment.file);

    this.documentUploadService
      .uploadDocuments(this.sessionId, files)
      .subscribe({
        next: (response: unknown) => {
          console.log('Documents uploaded successfully:', response);
        },
        error: (error: unknown) => {
          console.error('Failed to upload documents:', error);
          this.addErrorMessage(
            'Failed to upload documents. Please verify the upload service and try again.'
          );
        },
      });
  }

  removeAttachment(id: number): void {
    this.attachments = this.attachments.filter((file) => file.id !== id);
  }

  async sendMessage(): Promise<void> {
    if (this.isSendDisabled) {
      return;
    }

    console.log('=== Send Message Clicked ===');
    console.log('Session ID:', this.sessionId);
    console.log('User:', this.userName);

    // 1) Build console payload
    let formattedOutput = '';

    formattedOutput += '<from_user>\n';
    formattedOutput += '<user_query>\n';
    if (this.userInput.trim()) {
      formattedOutput += `  ${this.userInput.trim()}\n`;
    } else {
      formattedOutput += '  NO USER QUERY\n';
    }
    formattedOutput += '</user_query>\n\n';

    formattedOutput += '<user_uploaded_document_contents>\n';
    if (this.attachments.length > 0) {
      for (const attachment of this.attachments) {
        try {
          const text = await this.extractTextFromFile(attachment.file);
          formattedOutput += `\n=== ${attachment.name} Document Content Start ===\n`;
          formattedOutput += text;
          formattedOutput += `=== ${attachment.name} Document Content End ===\n`;
        } catch (error) {
          console.error(
            `Failed to extract text from ${attachment.name}:`,
            error
          );
          formattedOutput += `\n=== ${attachment.name} Document Content Start ===\n`;
          formattedOutput += `[Error extracting content: ${error}]\n`;
          formattedOutput += `=== ${attachment.name} Document Content End ===\n`;
        }
      }
    } else {
      formattedOutput += '  NO DOCUMENT CONTENT\n';
    }
    formattedOutput += '</user_uploaded_document_contents>\n';
    formattedOutput += '</from_user>';

    console.log('\n' + formattedOutput);
    console.log('\n=== Message Processing Complete ===\n');

    const outboundPayload = formattedOutput;

    // 2) Push a chat bubble with user query + attachments
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage = this.userInput.trim();
    const userHtml = this.convertMarkdownToHtml(userMessage);
    const userAttachments = this.attachments.length
      ? [...this.attachments]
      : undefined;

    if (userAttachments && userAttachments.length) {
      this.uploadNewAttachments(userAttachments);
    }

    this.messages.push({
      id: this.nextMessageId(),
      author: 'You',
      timestamp: timeLabel,
      text: userMessage,
      type: 'outgoing',
      attachments: userAttachments,
      html: userHtml ?? undefined,
    });

    this.cdr.detectChanges();
    this.scrollToLatestMessage();

    // Clear input and attachments after sending
    this.userInput = '';
    this.attachments = [];

    // 3) Send message to chatbot API
    if (!this.sessionCreated) {
      console.log('Session not created yet, creating now...');
      this.chatbotService
        .createSession(
          this.sessionId,
          'Chathusha Wijenayake',
          'Software Architect'
        )
        .subscribe({
          next: () => {
            this.sessionCreated = true;
            this.sendToChatbot(outboundPayload);
          },
          error: (error) => {
            console.error('Failed to create session:', error);
            this.addErrorMessage(
              'Failed to connect to chatbot. Please try again.'
            );
          },
        });
    } else {
      this.sendToChatbot(outboundPayload);
    }
  }

  private sendToChatbot(message: string): void {
    console.log('Sending message to chatbot:', message);

    this.isAgentTyping = true;
    this.cdr.detectChanges();
    this.scrollToLatestMessage();

    this.chatbotService.sendMessage(this.sessionId, message).subscribe({
      next: (response: any) => {
        console.log('Chatbot response:', response);

        this.isAgentTyping = false;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        let messageText = this.extractMessageText(response).trim();
        if (!messageText) {
          messageText =
            typeof response === 'string'
              ? response
              : JSON.stringify(response, null, 2);
        }
        const messageHtml = this.convertMarkdownToHtml(messageText);

        // Add chatbot response to messages
        this.messages.push({
          id: this.nextMessageId(),
          author: 'Risk CoPilot',
          timestamp: timeLabel,
          text: messageText,
          type: 'incoming',
          html: messageHtml ?? undefined,
        });

        this.cdr.detectChanges();
        this.scrollToLatestMessage();
      },
      error: (error: any) => {
        console.error('Failed to send message to chatbot:', error);
        this.isAgentTyping = false;
        this.addErrorMessage(
          'Failed to get response from chatbot. Please try again.'
        );
      },
    });
  }

  private addErrorMessage(errorText: string): void {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const errorHtml = this.convertMarkdownToHtml(errorText);

    this.messages.push({
      id: this.nextMessageId(),
      author: 'System',
      timestamp: timeLabel,
      text: errorText,
      type: 'incoming',
      html: errorHtml ?? undefined,
    });

    this.cdr.detectChanges();
    this.scrollToLatestMessage();
  }

  private scrollToLatestMessage(): void {
    setTimeout(() => {
      const container = this.messageList?.nativeElement;
      if (!container) {
        return;
      }

      const runScroll = () => {
        try {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        } catch {
          container.scrollTop = container.scrollHeight;
        }
      };

      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        requestAnimationFrame(runScroll);
      } else {
        runScroll();
      }
    }, 0);
  }

  private extractMessageText(response: any): string {
    if (response == null) {
      return '';
    }

    if (typeof response === 'string') {
      return response;
    }

    if (Array.isArray(response)) {
      // First, check if this is an array of message objects with content.role === 'model'
      // Iterate from the end to find the last model response with text
      for (let i = response.length - 1; i >= 0; i--) {
        const item = response[i];
        if (
          item?.content?.role === 'model' &&
          item?.content?.parts &&
          Array.isArray(item.content.parts)
        ) {
          // Find text part in the parts array
          for (const part of item.content.parts) {
            if (part?.text && typeof part.text === 'string') {
              return part.text;
            }
          }
        }
      }

      // If no model response found, fall back to extracting from all items
      const parts = response
        .map((item) => this.extractMessageText(item))
        .filter((text) => text && text.trim().length > 0);
      return parts.join('\n\n');
    }

    if (typeof response === 'object') {
      const maybeResponse = (response as { response?: unknown }).response;
      if (typeof maybeResponse === 'string') {
        return maybeResponse;
      }

      const content = (response as { content?: unknown }).content;
      if (content) {
        const contentText = this.extractMessageText(content);
        if (contentText.trim().length > 0) {
          return contentText;
        }
      }

      const partsProp = (response as { parts?: unknown }).parts;
      if (partsProp) {
        const partsText = this.extractMessageText(partsProp);
        if (partsText.trim().length > 0) {
          return partsText;
        }
      }

      const textProp = (response as { text?: unknown }).text;
      if (typeof textProp === 'string') {
        return textProp;
      }

      const messageProp = (response as { message?: unknown }).message;
      if (messageProp) {
        const messageText = this.extractMessageText(messageProp);
        if (messageText.trim().length > 0) {
          return messageText;
        }
      }

      const newMessageProp = (response as { newMessage?: unknown }).newMessage;
      if (newMessageProp) {
        const newMessageText = this.extractMessageText(newMessageProp);
        if (newMessageText.trim().length > 0) {
          return newMessageText;
        }
      }
    }

    if (typeof response === 'object') {
      try {
        return JSON.stringify(response, null, 2);
      } catch {
        return String(response);
      }
    }

    return String(response);
  }

  private convertMarkdownToHtml(markdown: string): SafeHtml | null {
    if (!markdown || !markdown.trim()) {
      return null;
    }

    const rawHtml = marked.parse(markdown) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractPdfText(file);
    }

    // Handle Word documents (.doc, .docx)
    if (
      fileType === 'application/msword' ||
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      return await this.extractWordText(file);
    }

    return 'Unsupported file type';
  }

  private async extractPdfText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Suppress warnings
      }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Preserve formatting by tracking vertical positions
        let lastY = -1;
        let currentLine = '';
        const lines: string[] = [];

        textContent.items.forEach((item: any, index: number) => {
          const text = item.str;
          const y = item.transform[5]; // Y position

          // Check if we're on a new line (Y position changed significantly)
          if (lastY !== -1 && Math.abs(y - lastY) > 2) {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = text;
          } else {
            // Same line - add space if needed
            if (
              currentLine &&
              !currentLine.endsWith(' ') &&
              !text.startsWith(' ')
            ) {
              currentLine += ' ';
            }
            currentLine += text;
          }

          lastY = y;
        });

        // Add the last line
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        const pageText = lines.join('\n');
        fullText += `Page ${pageNum}\n${pageText}\n\n`;
      }

      return fullText || '[PDF appears to be empty or contains only images]';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF text: ${error}`);
    }
  }

  private async extractWordText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use convertToHtml to preserve formatting, then convert to readable text
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.messages && result.messages.length > 0) {
        console.warn('Word extraction warnings:', result.messages);
      }

      // Convert HTML to formatted plain text preserving structure
      const formattedText = this.htmlToFormattedText(result.value);
      return formattedText || '[Word document appears to be empty]';
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error(`Failed to extract Word text: ${error}`);
    }
  }

  private htmlToFormattedText(html: string): string {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let formattedText = '';

    // Process each element to preserve structure
    const processNode = (node: Node, indent: string = ''): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          formattedText += text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
          case 'p':
            element.childNodes.forEach((child) => processNode(child, indent));
            formattedText += '\n\n';
            break;
          case 'br':
            formattedText += '\n';
            break;
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            formattedText += '\n';
            element.childNodes.forEach((child) => processNode(child, indent));
            formattedText += '\n\n';
            break;
          case 'li':
            formattedText += indent + '• ';
            element.childNodes.forEach((child) =>
              processNode(child, indent + '  ')
            );
            formattedText += '\n';
            break;
          case 'ul':
          case 'ol':
            formattedText += '\n';
            let counter = 1;
            element.childNodes.forEach((child) => {
              if (
                child.nodeType === Node.ELEMENT_NODE &&
                (child as Element).tagName.toLowerCase() === 'li'
              ) {
                if (tagName === 'ol') {
                  formattedText += indent + `${counter}. `;
                  counter++;
                } else {
                  formattedText += indent + '• ';
                }
                (child as Element).childNodes.forEach((grandChild) =>
                  processNode(grandChild, indent + '  ')
                );
                formattedText += '\n';
              }
            });
            formattedText += '\n';
            break;
          case 'strong':
          case 'b':
            element.childNodes.forEach((child) => processNode(child, indent));
            break;
          case 'em':
          case 'i':
            element.childNodes.forEach((child) => processNode(child, indent));
            break;
          case 'table':
            formattedText += '\n[Table]\n';
            element.childNodes.forEach((child) => processNode(child, indent));
            formattedText += '\n';
            break;
          case 'tr':
            element.childNodes.forEach((child) => processNode(child, indent));
            formattedText += '\n';
            break;
          case 'td':
          case 'th':
            formattedText += '| ';
            element.childNodes.forEach((child) => processNode(child, indent));
            formattedText += ' ';
            break;
          default:
            element.childNodes.forEach((child) => processNode(child, indent));
        }
      }
    };

    tempDiv.childNodes.forEach((node) => processNode(node));

    // Clean up excessive line breaks
    return formattedText.replace(/\n{3,}/g, '\n\n').trim();
  }

  createNewSession(): void {
    this.sessionId = this.generateUUID();
    this.attachments = [];
    this.userInput = '';
    this.messages.length = 0;
    this.sessionCreated = false;
    this.messageCounter = 0;

    this.cdr.detectChanges();
    this.scrollToLatestMessage();

    // Create new chatbot session
    this.createChatSession();
  }

  private nextMessageId(): number {
    return ++this.messageCounter;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const power = Math.min(
      Math.floor(Math.log(sizeInBytes) / Math.log(1024)),
      units.length - 1
    );
    const converted = sizeInBytes / Math.pow(1024, power);
    return `${converted.toFixed(converted >= 10 ? 0 : 1)} ${units[power]}`;
  }
}
