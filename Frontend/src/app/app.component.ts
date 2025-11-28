import { Component } from '@angular/core';
import { ChatInterfaceComponent } from './chat-interface/chat-interface.component';
import { GovernanceDetailsComponent } from './governance-details/governance-details.component';

@Component({
  selector: 'app-root',
  imports: [ChatInterfaceComponent, GovernanceDetailsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'MainApp';
}
