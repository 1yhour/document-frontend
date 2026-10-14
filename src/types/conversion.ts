// Conversion status values as returned by the backend
export type ConversionStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

// A single Operation as returned by GET /api/conversions/operations
export interface Operation {
  operation: string;
  label: string;
  input_format: string;
  output_format: string;
  allowed_extensions: string[];
  allowed_mime_types: string[];
  max_file_size_kb: number;
}

// A Conversion record as returned by show / index
export interface Conversion {
  id: string;
  operation: string;
  original_name: string;
  status: ConversionStatus;
  progress: number;
  error_message: string | null;
  completed_at: string | null;
  created_at: string | null;
}

// GET /api/conversions/operations response
export interface OperationsResponse {
  status: boolean;
  data: Operation[];
}

// POST /api/conversions response (202)
export interface StoreConversionResponse {
  status: boolean;
  message: string;
  data: Pick<Conversion, "id" | "operation" | "original_name" | "status" | "progress">;
}

// GET /api/conversions/{id} response
export interface ConversionResponse {
  status: boolean;
  data: Conversion;
}

// GET /api/conversions response (paginated)
export interface PaginatedConversionsResponse {
  status: boolean;
  data: {
    data: Conversion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
