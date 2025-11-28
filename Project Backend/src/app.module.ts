import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './config/firebase.module';
import { GovernanceModule } from './governance/governance.module';
import { ChatHistoryModule } from './chat-history/chat-history.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule,
    GovernanceModule,
    ChatHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
