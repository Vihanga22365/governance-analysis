import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './config/firebase.module';
import { GovernanceModule } from './governance/governance.module';
import { ChatHistoryModule } from './chat-history/chat-history.module';
import { GenerateReportModule } from './generate-report/generate-report.module';
import { RiskAnalyseModule } from './risk-analyse/risk-analyse.module';
import { CostDetailsModule } from './cost-details/cost-details.module';
import { EnvironmentDetailsModule } from './environment-details/environment-details.module';
import { CostClarificationsModule } from './cost-clarifications/cost-clarifications.module';
import { EnvironmentClarificationsModule } from './environment-clarifications/environment-clarifications.module';
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
    CostDetailsModule,
    EnvironmentDetailsModule,
    CostClarificationsModule,
    EnvironmentClarificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
