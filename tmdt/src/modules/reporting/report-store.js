import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { logError, logInfo } from "../../shared/utils/logger.js";

const DATA_DIR = path.join(process.cwd(), ".data");
const REPORTS_FILE = path.join(
  DATA_DIR,
  process.env.NODE_ENV === "test" ? `test-${process.pid}-reports.json` : "reports.json",
);
const PROCESS_DELAY_MS = process.env.NODE_ENV === "test" ? 25 : 2000;

let writeQueue = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJobs() {
  await ensureDir();
  try {
    const data = await fs.readFile(REPORTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err?.code === "ENOENT") return [];
    logError("READ_REPORT_JOBS_FAIL", err);
    return [];
  }
}

async function writeJobs(jobs) {
  await ensureDir();
  await fs.writeFile(REPORTS_FILE, JSON.stringify(jobs, null, 2));
}

function runWrite(task) {
  const nextTask = writeQueue.then(task, task);
  writeQueue = nextTask.then(
    () => undefined,
    () => undefined,
  );
  return nextTask;
}

function createCsvContent(job) {
  const rows = [
    ["reportId", "type", "format", "startDate", "endDate", "generatedAt"],
    [job.id, job.type, job.format, job.startDate, job.endDate, new Date().toISOString()],
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function createPdfLikeContent(job) {
  return [
    "%PDF-1.1",
    `% Report ${job.id}`,
    `% Type ${job.type}`,
    `% Range ${job.startDate} -> ${job.endDate}`,
    `% Generated ${new Date().toISOString()}`,
    "%%EOF",
  ].join("\n");
}

function buildArtifact(job) {
  if (job.format === "PDF") {
    return {
      fileName: `${job.type.toLowerCase()}-${job.id}.pdf`,
      contentType: "application/pdf",
      content: createPdfLikeContent(job),
    };
  }

  return {
    fileName: `${job.type.toLowerCase()}-${job.id}.csv`,
    contentType: "text/csv; charset=utf-8",
    content: createCsvContent(job),
  };
}

export async function createExportJob(type, format, startDate, endDate, requestedBy, correlationId) {
  const newJob = await runWrite(async () => {
    const jobs = await readJobs();
    const nextJob = {
      id: `job_${randomUUID()}`,
      type,
      format,
      startDate,
      endDate,
      requestedBy,
      status: "Processing",
      downloadUrl: null,
      artifact: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    jobs.push(nextJob);
    await writeJobs(jobs);
    return nextJob;
  });

  setTimeout(() => {
    void processExportJob(newJob.id, correlationId);
  }, PROCESS_DELAY_MS);

  logInfo("CREATE_EXPORT_JOB", { jobId: newJob.id, type, format }, correlationId);
  return { success: true, job: newJob };
}

async function processExportJob(jobId, correlationId) {
  try {
    const completedJob = await runWrite(async () => {
      const jobs = await readJobs();
      const job = jobs.find((item) => item.id === jobId);
      if (!job) return null;

      job.status = "Completed";
      job.downloadUrl = `/api/admin/reports/download/${job.id}`;
      job.artifact = buildArtifact(job);
      job.completedAt = new Date().toISOString();

      await writeJobs(jobs);
      return job;
    });

    if (completedJob) {
      logInfo("PROCESS_EXPORT_JOB_SUCCESS", { jobId }, correlationId);
    }
  } catch (err) {
    logError("PROCESS_EXPORT_JOB_FAIL", err, correlationId);
    await runWrite(async () => {
      const jobs = await readJobs();
      const job = jobs.find((item) => item.id === jobId);
      if (!job) return;

      job.status = "Failed";
      job.completedAt = new Date().toISOString();
      await writeJobs(jobs);
    });
  }
}

export async function getExportJobs() {
  const jobs = await readJobs();
  return {
    success: true,
    jobs: jobs
      .map((job) => ({
        ...job,
        artifact: undefined,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
}

export async function getExportJobById(jobId) {
  const jobs = await readJobs();
  return jobs.find((job) => job.id === jobId) ?? null;
}

export async function __resetAdminReportsForTests() {
  await runWrite(async () => {
    await writeJobs([]);
  });
}
