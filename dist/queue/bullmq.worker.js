"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWorkers = exports.reportWorker = exports.maintenanceWorker = exports.licenseWorker = exports.emailWorker = void 0;
const bullmq_1 = require("bullmq");
const bullmq_2 = require("../config/bullmq");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const nodemailer_1 = __importDefault(require("nodemailer"));
// ─── Email Transport ─────────────────────────────────────────────────────────
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || "TransitOps <alerts@transitops.com>",
        to,
        subject,
        html,
    });
};
// ─── Email Dispatch Worker ────────────────────────────────────────────────────
exports.emailWorker = new bullmq_1.Worker("email-dispatch", async (job) => {
    const { to, subject, html } = job.data;
    logger_1.logger.info(`Processing email job: ${job.id} → ${to}`);
    await sendEmail(to, subject, html);
    logger_1.logger.info(`Email sent successfully: ${job.id} → ${to}`);
}, { connection: bullmq_2.bullMqConnection });
exports.emailWorker.on("failed", (job, err) => {
    logger_1.logger.error(`Email job ${job?.id} failed:`, err);
});
// ─── License Expiry Check Worker ─────────────────────────────────────────────
exports.licenseWorker = new bullmq_1.Worker("license-expiry-check", async (job) => {
    logger_1.logger.info(`Running license expiry check: job ${job.id}`);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringDrivers = await database_1.prisma.driver.findMany({
        where: {
            licenseExpiry: { lte: thirtyDaysFromNow },
            deletedAt: null,
        },
        include: { user: true },
    });
    for (const driver of expiringDrivers) {
        const daysLeft = Math.ceil((new Date(driver.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (driver.user?.email) {
            await sendEmail(driver.user.email, `TransitOps: License Expiry Alert – ${driver.name}`, `
            <h3>License Expiry Alert</h3>
            <p>Driver <strong>${driver.name}</strong>'s license (${driver.licenseNumber}) will expire in <strong>${daysLeft} day(s)</strong> on <strong>${new Date(driver.licenseExpiry).toDateString()}</strong>.</p>
            <p>Please renew the license before the expiry date to avoid dispatch restrictions.</p>
          `);
        }
        // Create notification record
        if (driver.userId) {
            await database_1.prisma.notification.create({
                data: {
                    userId: driver.userId,
                    title: "License Expiry Alert",
                    message: `Your driver's license (${driver.licenseNumber}) expires in ${daysLeft} day(s). Please renew immediately.`,
                    type: "EXPIRY_REMINDER",
                },
            });
        }
        logger_1.logger.info(`License expiry alert sent for driver: ${driver.name} (${daysLeft} days left)`);
    }
}, { connection: bullmq_2.bullMqConnection });
exports.licenseWorker.on("failed", (job, err) => {
    logger_1.logger.error(`License expiry check job ${job?.id} failed:`, err);
});
// ─── Maintenance Reminder Worker ─────────────────────────────────────────────
exports.maintenanceWorker = new bullmq_1.Worker("maintenance-reminder", async (job) => {
    logger_1.logger.info(`Running maintenance reminder check: job ${job.id}`);
    // Find vehicles with open (IN_PROGRESS/SCHEDULED) maintenance logs overdue by 3+ days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const overdueRecords = await database_1.prisma.maintenanceLog.findMany({
        where: {
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            date: { lte: threeDaysAgo },
            deletedAt: null,
        },
        include: { vehicle: true },
    });
    for (const record of overdueRecords) {
        logger_1.logger.warn(`Overdue maintenance: vehicle=${record.vehicle.registrationNumber}, type=${record.type}, since=${record.date.toDateString()}`);
    }
    if (overdueRecords.length > 0) {
        logger_1.logger.info(`Found ${overdueRecords.length} overdue maintenance records.`);
    }
}, { connection: bullmq_2.bullMqConnection });
exports.maintenanceWorker.on("failed", (job, err) => {
    logger_1.logger.error(`Maintenance reminder job ${job?.id} failed:`, err);
});
// ─── Report Generation Worker ─────────────────────────────────────────────────
exports.reportWorker = new bullmq_1.Worker("report-generation", async (job) => {
    logger_1.logger.info(`Processing report generation job ${job.id}: ${JSON.stringify(job.data)}`);
    // Placeholder: async report generation logic would go here
    // e.g., generate PDF, upload to S3, email download link to requester
    logger_1.logger.info(`Report generation job ${job.id} completed.`);
}, { connection: bullmq_2.bullMqConnection });
exports.reportWorker.on("failed", (job, err) => {
    logger_1.logger.error(`Report generation job ${job?.id} failed:`, err);
});
const initWorkers = () => {
    logger_1.logger.info("BullMQ workers initialized: email-dispatch, license-expiry-check, maintenance-reminder, report-generation");
};
exports.initWorkers = initWorkers;
