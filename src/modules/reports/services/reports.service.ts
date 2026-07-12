import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";
import { AnalyticsService } from "../../analytics/services/analytics.service";
import { uploadFile } from "../../../config/s3";
import { logger } from "../../../config/logger";

const analyticsService = new AnalyticsService();

export class ReportsService {
  async generateFleetUtilizationPDF(): Promise<Buffer> {
    const data = await analyticsService.getFleetUtilization();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("TransitOps Fleet Utilization Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toISOString()}`, { align: "center" });
      doc.moveDown(2);

      // Table header
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Vehicle", 40, doc.y, { width: 120, continued: true });
      doc.text("Trips", 160, doc.y, { width: 50, continued: true });
      doc.text("Dist (km)", 210, doc.y, { width: 80, continued: true });
      doc.text("Revenue ($)", 290, doc.y, { width: 90, continued: true });
      doc.text("Cost ($)", 380, doc.y, { width: 80, continued: true });
      doc.text("ROI (%)", 460, doc.y, { width: 80 });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.fontSize(10).font("Helvetica");
      for (const v of data) {
        const y = doc.y;
        doc.text(v.registrationNumber, 40, y, { width: 120, continued: true });
        doc.text(String(v.totalTrips), 160, y, { width: 50, continued: true });
        doc.text(String(v.totalDistanceKm), 210, y, { width: 80, continued: true });
        doc.text(String(v.totalRevenue), 290, y, { width: 90, continued: true });
        doc.text(String(v.totalCost), 380, y, { width: 80, continued: true });
        doc.text(`${v.roiPercent}%`, 460, y, { width: 80 });
        doc.moveDown(0.5);
        if (doc.y > 700) {
          doc.addPage();
        }
      }

      doc.end();
    });
  }

  async generateFleetUtilizationCSV(): Promise<string> {
    const data = await analyticsService.getFleetUtilization();

    const rows = data.map((v: any) => ({
      "Registration Number": v.registrationNumber,
      "Vehicle Name": v.name,
      Status: v.status,
      "Total Trips": v.totalTrips,
      "Total Distance (km)": v.totalDistanceKm,
      "Total Revenue ($)": v.totalRevenue,
      "Total Cost ($)": v.totalCost,
      "Profit ($)": v.profit,
      "ROI (%)": v.roiPercent,
      "Fuel Efficiency (km/L)": v.fuelEfficiencyKmL,
    }));

    return stringify(rows, { header: true });
  }

  async generateFleetUtilizationExcel(): Promise<Buffer> {
    const data = await analyticsService.getFleetUtilization();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Fleet Utilization");

    // Headers
    sheet.columns = [
      { header: "Registration Number", key: "registrationNumber", width: 20 },
      { header: "Vehicle Name", key: "name", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Total Trips", key: "totalTrips", width: 12 },
      { header: "Total Distance (km)", key: "totalDistanceKm", width: 20 },
      { header: "Total Revenue ($)", key: "totalRevenue", width: 18 },
      { header: "Total Cost ($)", key: "totalCost", width: 15 },
      { header: "Profit ($)", key: "profit", width: 12 },
      { header: "ROI (%)", key: "roiPercent", width: 10 },
      { header: "Fuel Efficiency (km/L)", key: "fuelEfficiencyKmL", width: 22 },
    ];

    // Bold headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    sheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

    data.forEach((v: any) => sheet.addRow(v));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async uploadAndGetUrl(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    try {
      const key = `reports/${Date.now()}_${filename}`;
      return await uploadFile(key, buffer, contentType);
    } catch (error) {
      logger.error("Failed to upload report to S3:", error);
      throw error;
    }
  }
}
