import { Component, Input } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [NgClass, NgIf, NgFor],
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.scss'],
})
export class ChatHistoryComponent {
  @Input() chatHistory: {
    author: string;
    type: string;
    text?: string;
    attachments?: Array<{
      id: number;
      name: string;
      sizeLabel: string;
      file?: File;
    }>;
    timestamp: string;
  }[] = [];
  getFileIconLabel(fileName: string): string {
    // Simple logic: return file extension in uppercase, or 'FILE' if none
    const ext = fileName.split('.').pop();
    return ext ? ext.toUpperCase() : 'FILE';
  }

  trackByTimestamp(
    index: number,
    item: {
      author: string;
      type: string;
      text?: string;
      attachments?: Array<{
        id: number;
        name: string;
        sizeLabel: string;
        file?: File;
      }>;
      timestamp: string;
    }
  ): number {
    // Use timestamp string's hash for trackBy
    let hash = 0;
    for (let i = 0; i < item.timestamp.length; i++) {
      hash = (hash << 5) - hash + item.timestamp.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }
}
