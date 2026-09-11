export type VideoCatalogRecord = {
  id: string;
  title: string;
  channel: string;
  duration: number;
  query: string;
};

export type VideoCatalog = Record<string, VideoCatalogRecord>;

export type TranscriptCue = {
  startSeconds: number;
  durationSeconds: number;
  text: string;
};

export type VideoChapter = {
  startSeconds: number;
  label: string;
};

export type RawVideoExtraction = {
  version: 1;
  provider: "youtube";
  videoId: string;
  url: string;
  title: string;
  description: string;
  expectedDurationSeconds: number;
  transcript: TranscriptCue[];
  chapters: VideoChapter[];
  fetchedAt: string;
};

export type SanityVideoDocument = {
  _id: string;
  _type: "video";
  videoId: string;
  url: string;
  chapters: Array<VideoChapter & { _key: string; _type: "chapter" }>;
  chunks: Array<{
    _key: string;
    _type: "transcriptChunk";
    startSeconds: number;
    text: string;
  }>;
};

export type IngestionFailure = {
  slug: string;
  videoId: string;
  message: string;
};

export type IngestionReport = {
  mode: "dry-run" | "commit";
  startedAt: string;
  finishedAt: string;
  sourceCount: number;
  selectedCount: number;
  producedCount: number;
  failedCount: number;
  cacheHitCount: number;
  outputPath: string;
  failures: IngestionFailure[];
  verification?: {
    totalVideoDocuments: number;
    selectedVideoDocuments: number;
  };
};
