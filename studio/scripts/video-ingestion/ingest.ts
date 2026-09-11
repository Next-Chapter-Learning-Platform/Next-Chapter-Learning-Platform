import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildVideoDocument } from "./transform";
import type {
  IngestionFailure,
  IngestionReport,
  RawVideoExtraction,
  SanityVideoDocument,
  VideoCatalog,
  VideoCatalogRecord,
} from "./types";
import { extractYouTubeVideo } from "./youtube";

type Options = {
  commit: boolean;
  refresh: boolean;
  limit?: number;
  video?: string;
};

type SelectedVideo = {
  slug: string;
  source: VideoCatalogRecord;
};

const studioRoot = path.resolve(
  fileURLToPath(new URL("../..", import.meta.url)),
);
const repositoryRoot = path.resolve(studioRoot, "..");
const sourcePath = path.join(repositoryRoot, "videos.json");
const workDirectory = path.join(studioRoot, ".video-ingestion");
const cacheDirectory = path.join(workDirectory, "cache");
const outputPath = path.join(workDirectory, "video-import.ndjson");
const reportPath = path.join(workDirectory, "report.json");
const concurrency = 2;

function parseArguments(argv: string[]): Options {
  const args = argv.filter((argument) => argument !== "--");
  const options: Options = { commit: false, refresh: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--commit") {
      options.commit = true;
    } else if (argument === "--refresh") {
      options.refresh = true;
    } else if (argument === "--limit") {
      const value = Number(args[++index]);
      if (!Number.isInteger(value) || value < 1)
        throw new Error("--limit must be a positive integer");
      options.limit = value;
    } else if (argument.startsWith("--video=")) {
      const value = argument.slice("--video=".length);
      if (!value)
        throw new Error("--video requires a lesson slug or YouTube video ID");
      options.video = value;
    } else if (argument === "--video") {
      const value = args[++index];
      if (!value)
        throw new Error("--video requires a lesson slug or YouTube video ID");
      options.video = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function validateCatalog(value: unknown): VideoCatalog {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("videos.json must contain an object keyed by lesson slug");
  }

  const catalog = value as VideoCatalog;
  const ids = new Set<string>();

  for (const [slug, record] of Object.entries(catalog)) {
    if (
      !record ||
      typeof record.id !== "string" ||
      !/^[A-Za-z0-9_-]{11}$/.test(record.id) ||
      typeof record.title !== "string" ||
      typeof record.channel !== "string" ||
      !Number.isFinite(record.duration) ||
      record.duration <= 0 ||
      typeof record.query !== "string"
    ) {
      throw new Error(`Invalid video metadata for lesson slug: ${slug}`);
    }

    if (ids.has(record.id))
      throw new Error(
        `Duplicate YouTube video ID in videos.json: ${record.id}`,
      );
    ids.add(record.id);
  }

  return catalog;
}

async function loadCatalog() {
  return validateCatalog(
    JSON.parse(await readFile(sourcePath, "utf8")) as unknown,
  );
}

function selectVideos(catalog: VideoCatalog, options: Options) {
  let selected = Object.entries(catalog).map(([slug, source]) => ({
    slug,
    source,
  }));

  if (options.video) {
    selected = selected.filter(
      ({ slug, source }) =>
        slug === options.video || source.id === options.video,
    );
    if (selected.length === 0)
      throw new Error(`No videos.json entry matches: ${options.video}`);
  }

  return options.limit ? selected.slice(0, options.limit) : selected;
}

function cachePath(videoId: string) {
  return path.join(cacheDirectory, `${videoId}.json`);
}

async function loadExtraction(video: SelectedVideo, refresh: boolean) {
  const target = cachePath(video.source.id);

  if (!refresh) {
    try {
      const cached = JSON.parse(
        await readFile(target, "utf8"),
      ) as RawVideoExtraction;
      if (
        cached.version === 1 &&
        cached.videoId === video.source.id &&
        cached.transcript.length > 0
      ) {
        return { extraction: cached, cacheHit: true };
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }

  const extraction = await extractYouTubeVideo(video.source);
  await writeFile(target, `${JSON.stringify(extraction, null, 2)}\n`, "utf8");
  return { extraction, cacheHit: false };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  workerCount: number,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(workerCount, items.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

async function commitDocuments(documents: SanityVideoDocument[]) {
  const { getCliClient } = await import("sanity/cli");
  const client = getCliClient({ apiVersion: "2026-08-31" });

  for (let offset = 0; offset < documents.length; offset += 25) {
    const batch = documents.slice(offset, offset + 25);
    let transaction = client.transaction();

    for (const document of batch)
      transaction = transaction.createOrReplace(document);
    await transaction.commit({ visibility: "deferred" });
  }

  return client.fetch<{
    totalVideoDocuments: number;
    selectedVideoDocuments: number;
  }>(
    `{
      "totalVideoDocuments": count(*[_type == "video"]),
      "selectedVideoDocuments": count(*[_type == "video" && _id in $ids])
    }`,
    { ids: documents.map((document) => document._id) },
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const catalog = await loadCatalog();
  const selected = selectVideos(catalog, options);
  const documents: SanityVideoDocument[] = [];
  const failures: IngestionFailure[] = [];
  let cacheHitCount = 0;

  await mkdir(cacheDirectory, { recursive: true });

  await mapWithConcurrency(
    selected,
    async (video) => {
      try {
        const { extraction, cacheHit } = await loadExtraction(
          video,
          options.refresh,
        );
        if (cacheHit) cacheHitCount += 1;
        documents.push(buildVideoDocument(extraction));
        console.log(
          `${cacheHit ? "cache" : "extract"} ${video.source.id} (${video.slug})`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ slug: video.slug, videoId: video.source.id, message });
        console.error(`failed ${video.source.id} (${video.slug}): ${message}`);
      }
    },
    concurrency,
  );

  documents.sort((a, b) => a._id.localeCompare(b._id));
  await writeFile(
    outputPath,
    documents.length > 0
      ? `${documents.map((document) => JSON.stringify(document)).join("\n")}\n`
      : "",
    "utf8",
  );

  let verification: IngestionReport["verification"];

  if (options.commit && failures.length === 0 && documents.length > 0) {
    verification = await commitDocuments(documents);
  } else if (options.commit && failures.length > 0) {
    console.error(
      "Commit skipped because at least one selected video failed extraction.",
    );
  }

  const report: IngestionReport = {
    mode: options.commit ? "commit" : "dry-run",
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceCount: Object.keys(catalog).length,
    selectedCount: selected.length,
    producedCount: documents.length,
    failedCount: failures.length,
    cacheHitCount,
    outputPath,
    failures,
    verification,
  };

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
