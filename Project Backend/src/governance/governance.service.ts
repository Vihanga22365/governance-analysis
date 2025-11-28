import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import { CreateGovernanceDto } from './dto/create-governance.dto';
import { GovernanceBasicDetails } from './interfaces/governance.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GovernanceService {
  private readonly tableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  async createGovernanceDetails(
    createGovernanceDto: CreateGovernanceDto,
  ): Promise<{ message: string; data: GovernanceBasicDetails }> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      // Check if governance_id already exists
      const snapshot = await governanceRef
        .orderByChild('governance_id')
        .equalTo(createGovernanceDto.governance_id)
        .once('value');

      if (snapshot.exists()) {
        throw new BadRequestException(
          `Governance with ID ${createGovernanceDto.governance_id} already exists`,
        );
      }

      // Get uploaded documents from UUID folder if any
      const uuidDir = path.join(
        process.cwd(),
        'documents',
        createGovernanceDto.user_chat_session_id,
      );
      let uploadedDocuments: any[] = [];

      if (fs.existsSync(uuidDir)) {
        const files = fs.readdirSync(uuidDir);
        uploadedDocuments = files.map((file) => ({
          documentName: file.replace(/^\d+-/, ''), // Remove timestamp prefix
          documentUrl: path.join(
            'documents',
            createGovernanceDto.user_chat_session_id,
            file,
          ),
          uploadedAt: new Date().toISOString(),
        }));
      }

      // Merge uploaded documents with any manually provided documents
      const cleanDocuments =
        createGovernanceDto.relevant_documents?.map((doc) => {
          const cleanDoc: any = {
            documentName: doc.documentName,
            documentUrl: doc.documentUrl,
          };
          if (doc.description !== undefined && doc.description !== null) {
            cleanDoc.description = doc.description;
          }
          return cleanDoc;
        }) || [];

      const allDocuments = [...uploadedDocuments, ...cleanDocuments];

      const governanceData: GovernanceBasicDetails = {
        governance_id: createGovernanceDto.governance_id,
        user_chat_session_id: createGovernanceDto.user_chat_session_id,
        user_name: createGovernanceDto.user_name,
        use_case: createGovernanceDto.use_case,
        relevant_documents: allDocuments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Push data to Firebase Realtime Database
      const newGovernanceRef = governanceRef.push();
      await newGovernanceRef.set(governanceData);

      return {
        message: 'Governance details created successfully',
        data: governanceData,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create governance details: ${error.message}`,
      );
    }
  }

  async getAllGovernanceDetails(): Promise<GovernanceBasicDetails[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      const snapshot = await governanceRef.once('value');
      const data = snapshot.val();

      if (!data) {
        return [];
      }

      // Convert object to array
      return Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch governance details: ${error.message}`,
      );
    }
  }

  async getGovernanceById(
    governanceId: string,
  ): Promise<GovernanceBasicDetails | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      const snapshot = await governanceRef
        .orderByChild('governance_id')
        .equalTo(governanceId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Get the first match
      const key = Object.keys(data)[0];
      return {
        ...data[key],
        id: key,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch governance details: ${error.message}`,
      );
    }
  }

  async searchGovernance(
    searchTerm: string,
  ): Promise<GovernanceBasicDetails[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      const snapshot = await governanceRef.once('value');
      const data = snapshot.val();

      if (!data) {
        return [];
      }

      // Filter by governance_id only
      const results = Object.keys(data)
        .map((key) => ({
          ...data[key],
          id: key,
        }))
        .filter((item) =>
          item.governance_id?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      return results;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to search governance details: ${error.message}`,
      );
    }
  }

  async uploadDocument(
    uuid: string,
    file: any,
  ): Promise<{ message: string; filePath: string; fileName: string }> {
    try {
      // Create documents directory if it doesn't exist
      const documentsDir = path.join(process.cwd(), 'documents');
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // Create UUID-specific folder
      const uuidDir = path.join(documentsDir, uuid);
      if (!fs.existsSync(uuidDir)) {
        fs.mkdirSync(uuidDir, { recursive: true });
      }

      // Check if file with same name already exists
      const existingFiles = fs.readdirSync(uuidDir);
      const fileExists = existingFiles.some((existingFile) =>
        existingFile.endsWith(`-${file.originalname}`),
      );

      if (fileExists) {
        throw new BadRequestException(
          `File '${file.originalname}' already exists in this session`,
        );
      }

      // Save file to UUID folder
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const filePath = path.join(uuidDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      return {
        message: 'Document uploaded successfully',
        filePath: path.relative(process.cwd(), filePath),
        fileName: file.originalname,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload document: ${error.message}`,
      );
    }
  }

  async uploadMultipleDocuments(
    uuid: string,
    files: any[],
  ): Promise<{
    message: string;
    uploadedFiles: { filePath: string; fileName: string }[];
    skippedFiles: string[];
    totalUploaded: number;
    totalSkipped: number;
  }> {
    try {
      // Create documents directory if it doesn't exist
      const documentsDir = path.join(process.cwd(), 'documents');
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // Create UUID-specific folder
      const uuidDir = path.join(documentsDir, uuid);
      if (!fs.existsSync(uuidDir)) {
        fs.mkdirSync(uuidDir, { recursive: true });
      }

      // Get existing files
      const existingFiles = fs.readdirSync(uuidDir);

      const uploadedFiles: { filePath: string; fileName: string }[] = [];
      const skippedFiles: string[] = [];

      // Save each file to UUID folder
      for (const file of files) {
        // Check if file with same name already exists
        const fileExists = existingFiles.some((existingFile) =>
          existingFile.endsWith(`-${file.originalname}`),
        );

        if (fileExists) {
          skippedFiles.push(file.originalname);
          continue; // Skip this file
        }

        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname}`;
        const filePath = path.join(uuidDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        uploadedFiles.push({
          filePath: path.relative(process.cwd(), filePath),
          fileName: file.originalname,
        });

        // Small delay to ensure unique timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return {
        message:
          skippedFiles.length > 0
            ? `${uploadedFiles.length} document(s) uploaded, ${skippedFiles.length} skipped (already exist)`
            : 'Documents uploaded successfully',
        uploadedFiles,
        skippedFiles,
        totalUploaded: uploadedFiles.length,
        totalSkipped: skippedFiles.length,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload documents: ${error.message}`,
      );
    }
  }

  async getUploadedDocuments(uuid: string): Promise<string[]> {
    try {
      const uuidDir = path.join(process.cwd(), 'documents', uuid);

      if (!fs.existsSync(uuidDir)) {
        return [];
      }

      const files = fs.readdirSync(uuidDir);
      return files.map((file) => path.join('documents', uuid, file));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get uploaded documents: ${error.message}`,
      );
    }
  }
}
