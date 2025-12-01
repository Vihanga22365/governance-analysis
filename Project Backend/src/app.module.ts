import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './config/firebase.module';
import { GovernanceModule } from './governance/governance.module';
import { ChatHistoryModule } from './chat-history/chat-history.module';
import { GenerateReportModule } from './generate-report/generate-report.module';
import { RiskAnalyseModule } from './risk-analyse/risk-analyse.module';
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
    GenerateReportModule,
    RiskAnalyseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
