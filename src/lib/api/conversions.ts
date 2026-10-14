import apiClient from "./client";
import {
  ConversionResponse,
  OperationsResponse,
  Operation,
  Conversion,
  PaginatedConversionsResponse,
  StoreConversionResponse,
} from "@/types/conversion";

export const conversionApi = {
  /**
   * Fetch available operations (no auth required on this endpoint).
   */
  async getOperations(): Promise<Operation[]> {
    const res = await apiClient.get<OperationsResponse>("/api/conversions/operations");
    return res.data.data;
  },

  /**
   * Submit a file for conversion. Uses multipart/form-data so CSRF and
   * cookies are handled by the existing apiClient interceptors.
   * The browser NEVER touches CloudConvert directly.
   */
  async store(file: File, operation: string): Promise<StoreConversionResponse["data"]> {
    const form = new FormData();
    form.append("file", file);
    form.append("operation", operation);

    const res = await apiClient.post<StoreConversionResponse>("/api/conversions", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  /**
   * Poll the status of a single conversion.
   */
  async getStatus(id: string): Promise<Conversion> {
    const res = await apiClient.get<ConversionResponse>(`/api/conversions/${id}`);
    return res.data.data;
  },

  /**
   * Fetch the user's conversion history, paginated.
   */
  async getList(page = 1): Promise<PaginatedConversionsResponse["data"]> {
    const res = await apiClient.get<PaginatedConversionsResponse>(
      `/api/conversions?page=${page}`
    );
    return res.data.data;
  },

  /**
   * Download the converted file as a Blob through the API (credentials included).
   * Never exposes a direct storage URL to the browser.
   */
  async download(id: string): Promise<{ blob: Blob; filename: string }> {
    const res = await apiClient.get(`/api/conversions/${id}/download`, {
      responseType: "blob",
    });

    // Try to parse filename from Content-Disposition header
    const disposition = res.headers["content-disposition"] as string | undefined;
    let filename = "converted-file";
    if (disposition) {
      const match =
        disposition.match(/filename\*=UTF-8''(.+)/i) ||
        disposition.match(/filename="?([^"]+)"?/i);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    return { blob: res.data as Blob, filename };
  },
};

export default conversionApi;
