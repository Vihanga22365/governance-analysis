import { Module, Global } from '@nestjs/common';
import { FirebaseConfig } from './firebase.config';

@Global()
@Module({
  providers: [FirebaseConfig],
  exports: [FirebaseConfig],
})
export class FirebaseModule {}
