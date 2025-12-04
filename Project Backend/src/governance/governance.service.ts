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

  private async generateGovernanceId(): Promise<string> {
    const database = this.firebaseConfig.getDatabase();
    const governanceRef = database.ref(this.tableName);
    const snapshot = await governanceRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return 'GOV0001';
    }

    // Get all governance IDs and find the highest number
    const ids = Object.values(data).map((item: any) => item.governance_id);
    const numbers = ids
      .map((id: string) => parseInt(id.replace('GOV', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `GOV${nextNumber.toString().padStart(4, '0')}`;
  }

  async createGovernanceDetails(
    createGovernanceDto: CreateGovernanceDto,
  ): Promise<{ message: string; data: GovernanceBasicDetails }> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      // Auto-generate governance_id
      const governance_id = await this.generateGovernanceId();

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
          documentUrl:
            `${createGovernanceDto.user_chat_session_id}/${file}`.replace(
              /\\/g,
              '/',
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
        governance_id,
        user_chat_session_id: createGovernanceDto.user_chat_session_id,
        user_name: createGovernanceDto.user_name,
        use_case_title: createGovernanceDto.use_case_title,
        use_case_description: createGovernanceDto.use_case_description,
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

  async getGovernanceBySessionId(
    sessionId: string,
  ): Promise<GovernanceBasicDetails[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.tableName);

      const snapshot = await governanceRef
        .orderByChild('user_chat_session_id')
        .equalTo(sessionId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return [];
      }

      // Convert object to array with Firebase keys as id
      return Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch governance by session ID: ${error.message}`,
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

      const lowerSearchTerm = searchTerm.toLowerCase();

      // Filter by governance_id, user_name, or use_case_title
      const results = Object.keys(data)
        .map((key) => ({
          ...data[key],
          id: key,
        }))
        .filter((item) => {
          const governanceIdMatch = item.governance_id
            ?.toLowerCase()
            .includes(lowerSearchTerm);
          const userNameMatch = item.user_name
            ?.toLowerCase()
            .includes(lowerSearchTerm);
          const useCaseTitleMatch = item.use_case_title
            ?.toLowerCase()
            .includes(lowerSearchTerm);

          return governanceIdMatch || userNameMatch || useCaseTitleMatch;
        });

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
    overwrittenFiles: string[];
    totalUploaded: number;
    totalOverwritten: number;
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
      const overwrittenFiles: string[] = [];

      // Save each file to UUID folder
      for (const file of files) {
        // Check if file with same name already exists and delete it
        const existingFile = existingFiles.find((existingFile) =>
          existingFile.endsWith(`-${file.originalname}`),
        );

        if (existingFile) {
          // Delete the old file
          const oldFilePath = path.join(uuidDir, existingFile);
          fs.unlinkSync(oldFilePath);
          overwrittenFiles.push(file.originalname);
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
          overwrittenFiles.length > 0
            ? `${uploadedFiles.length} document(s) uploaded, ${overwrittenFiles.length} overwritten`
            : 'Documents uploaded successfully',
        uploadedFiles,
        overwrittenFiles,
        totalUploaded: uploadedFiles.length,
        totalOverwritten: overwrittenFiles.length,
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
