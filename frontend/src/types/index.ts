// src/types/index.ts

export interface MappingField {
    jsonPath: string;
    csvField: string | null;
    isStatic: boolean;
    staticValue: string;
  }
  
  export interface CSVData {
    headers: string[];
    preview: string[];
  }
  
  export interface FileState {
    isLoading: boolean;
    content: string;
    fileName: string | null;
  }
  
  export interface SavedMapping {
    id: string;
    name: string;
    mappingFields: MappingField[];
    jsonTemplate: any;
    createdAt: string;
  }
  
  export interface HistoryEntry {
    id: string;
    filename: string;
    status: "created" | "processed" | "failed";
    createdAt: string;
    processedAt?: string;
    errorMessage?: string;
  }
  
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
    companyId?: string;
    companyName?: string;
  }