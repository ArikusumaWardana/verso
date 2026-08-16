import type { Document } from "@/lib/types";

export const demoDocuments: Document[] = [
  {
    id: "demo-1",
    type: "article",
    status: "unread",
    title: "The Garden of Forking Paths",
    author: "Jorge Luis Borges",
    site_name: "The New Republic",
    source_url: "https://example.com/forking-paths",
    excerpt: "A meditation on time, choice, and the impossible shape of a book that contains every outcome.",
    reading_time_minutes: 12,
    page_count: null,
    created_at: "2026-08-16T08:10:00.000Z"
  },
  {
    id: "demo-2",
    type: "pdf",
    status: "starred",
    title: "Attention Is All You Need",
    author: "Vaswani et al.",
    site_name: "NeurIPS",
    source_url: "https://arxiv.org/abs/1706.03762",
    excerpt: "A network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions.",
    reading_time_minutes: 38,
    page_count: 15,
    created_at: "2026-08-15T10:25:00.000Z"
  },
  {
    id: "demo-3",
    type: "article",
    status: "read",
    title: "A Pattern Language for Personal Archives",
    author: "Mara Kline",
    site_name: "Field Notes",
    source_url: "https://example.com/personal-archives",
    excerpt: "Why a useful archive depends less on perfect folders and more on reliable retrieval cues.",
    reading_time_minutes: 8,
    page_count: null,
    created_at: "2026-08-13T06:00:00.000Z"
  }
];
