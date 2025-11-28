import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker - version 3.x uses different worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface Attachment {
  id: number;
  name: string;
  sizeLabel: string;
  file: File;
}

interface ChatMessage {
  author: string;
  timestamp: string;
  text: string;
  type: 'incoming' | 'outgoing';
  attachments?: Attachment[];
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [NgClass, NgIf, FormsModule],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.scss',
})
export class ChatInterfaceComponent {
  @ViewChild('userInputArea') userInputArea?: ElementRef<HTMLTextAreaElement>;
  sessionId: string = this.generateUUID();
  userName: string = 'Chathusha Wijenayake';
  userInitials: string = 'CW';

  readonly threadSummary = {
    title: 'Quarterly Risk Review',
    participants: ['You', 'Risk CoPilot'],
  };

  readonly messages: ChatMessage[] = [
    {
      author: 'Risk CoPilot',
      timestamp: '09:12 AM',
      text: 'Morning! Drop in any field reports or models you would like me to review.',
      type: 'incoming',
    },
    {
      author: 'You',
      timestamp: '09:18 AM',
      text: 'Uploading the latest incident summary. Need a mitigation brief and governance checklist.',
      type: 'outgoing',
    },
    {
      author: 'Risk CoPilot',
      timestamp: '09:20 AM',
      text: 'Received the summary and highlighted the three emerging risks tied to deployment delays. Want me to notify Governance? ',
      type: 'incoming',
    },
  ];

  attachments: Attachment[] = [];
  isDragging = false;
  userInput: string = '';
  private attachmentCounter = 0;

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
    formattedOutput += '</user_uploaded_document_contents>';

    console.log('\n' + formattedOutput);
    console.log('\n=== Message Processing Complete ===\n');

    // 2) Push a chat bubble with user query + attachments
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.messages.push({
      author: 'You',
      timestamp: timeLabel,
      text: this.userInput.trim(),
      type: 'outgoing',
      attachments: this.attachments.length ? [...this.attachments] : undefined,
    });

    // Clear input and attachments after sending
    this.userInput = '';
    this.attachments = [];
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
