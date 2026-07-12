import { Worker, Job } from "bullmq";
import { bullMqConnection } from "../config/bullmq";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import nodemailer from "nodemailer";

// ─── Email Transport ─────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "TransitOps <alerts@transitops.com>",
    to,
    subject,
    html,
  });
};

// ─── Email Dispatch Worker ────────────────────────────────────────────────────

export const emailWorker = new Worker(
  "email-dispatch",
  async (job: Job) => {
    const { to, subject, html } = job.data;
    logger.info(`Processing email job: ${job.id} → ${to}`);
    await sendEmail(to, subject, html);
    logger.info(`Email sent successfully: ${job.id} → ${to}`);
  },
  { connection: bullMqConnection as any }
);

emailWorker.on("failed", (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, err);
});

// ─── License Expiry Check Worker ─────────────────────────────────────────────

export const licenseWorker = new Worker(
  "license-expiry-check",
  async (job: Job) => {
    logger.info(`Running license expiry check: job ${job.id}`);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiry: { lte: thirtyDaysFromNow },
        deletedAt: null,
      },
      include: { user: true },
    });

    for (const driver of expiringDrivers) {
      const daysLeft = Math.ceil(
        (new Date(driver.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (driver.user?.email) {
        await sendEmail(
          driver.user.email,
          `TransitOps: License Expiry Alert – ${driver.name}`,
          `
            <h3>License Expiry Alert</h3>
            <p>Driver <strong>${driver.name}</strong>'s license (${driver.licenseNumber}) will expire in <strong>${daysLeft} day(s)</strong> on <strong>${new Date(driver.licenseExpiry).toDateString()}</strong>.</p>
            <p>Please renew the license before the expiry date to avoid dispatch restrictions.</p>
          `
        );
      }

      // Create notification record
      if (driver.userId) {
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            title: "License Expiry Alert",
            message: `Your driver's license (${driver.licenseNumber}) expires in ${daysLeft} day(s). Please renew immediately.`,
            type: "EXPIRY_REMINDER",
          },
        });
      }

      logger.info(`License expiry alert sent for driver: ${driver.name} (${daysLeft} days left)`);
    }
  },
  { connection: bullMqConnection as any }
);

licenseWorker.on("failed", (job, err) => {
  logger.error(`License expiry check job ${job?.id} failed:`, err);
});

// ─── Maintenance Reminder Worker ─────────────────────────────────────────────

export const maintenanceWorker = new Worker(
  "maintenance-reminder",
  async (job: Job) => {
    logger.info(`Running maintenance reminder check: job ${job.id}`);

    // Find vehicles with open (IN_PROGRESS/SCHEDULED) maintenance logs overdue by 3+ days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const overdueRecords = await prisma.maintenanceLog.findMany({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        date: { lte: threeDaysAgo },
        deletedAt: null,
      },
      include: { vehicle: true },
    });

    for (const record of overdueRecords) {
      logger.warn(
        `Overdue maintenance: vehicle=${record.vehicle.registrationNumber}, type=${record.type}, since=${record.date.toDateString()}`
      );
    }

    if (overdueRecords.length > 0) {
      logger.info(`Found ${overdueRecords.length} overdue maintenance records.`);
    }
  },
  { connection: bullMqConnection as any }
);

maintenanceWorker.on("failed", (job, err) => {
  logger.error(`Maintenance reminder job ${job?.id} failed:`, err);
});

// ─── Report Generation Worker ─────────────────────────────────────────────────

export const reportWorker = new Worker(
  "report-generation",
  async (job: Job) => {
    logger.info(`Processing report generation job ${job.id}: ${JSON.stringify(job.data)}`);
    // Placeholder: async report generation logic would go here
    // e.g., generate PDF, upload to S3, email download link to requester
    logger.info(`Report generation job ${job.id} completed.`);
  },
  { connection: bullMqConnection as any }
);

reportWorker.on("failed", (job, err) => {
  logger.error(`Report generation job ${job?.id} failed:`, err);
});

export const initWorkers = (): void => {
  logger.info("BullMQ workers initialized: email-dispatch, license-expiry-check, maintenance-reminder, report-generation");
};
