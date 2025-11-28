import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfig {
  private firebaseApp: admin.app.App;

  constructor() {
    // Initialize Firebase Admin SDK only if not already initialized
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  getDatabase(): admin.database.Database {
    return admin.database();
  }

  getApp(): admin.app.App {
    return this.firebaseApp;
  }
}
