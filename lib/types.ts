export type DocumentType = "article" | "pdf";
export type DocumentStatus = "unread" | "read" | "starred" | "archived";

export type Document = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  author: string | null;
  site_name: string | null;
  source_url: string | null;
  excerpt: string | null;
  reading_time_minutes: number;
  page_count: number | null;
  created_at: string;
};
