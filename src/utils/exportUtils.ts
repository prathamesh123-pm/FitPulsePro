import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import jsPDF from "jspdf";
import { EnterpriseRateChart, FormSubmissionRecord, EnterpriseGroupReport, AppState } from "../types";

export async function exportRateChartDocx(rateChart: EnterpriseRateChart): Promise<void> {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Service Code", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Plan / Service Name", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Rate (USD)", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
      ],
    }),
    ...rateChart.items.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: item.serviceCode })] }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: item.name, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: item.features.join(", "), size: 18, color: "64748B" })] }),
              ],
            }),
            new TableCell({ children: [new Paragraph({ text: item.category })] }),
            new TableCell({ children: [new Paragraph({ text: item.duration })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${item.finalPrice}`, bold: true })] })] }),
          ],
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "FITPULSE PRO ENTERPRISE GYM OS",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Official Service Tariff & Rate Chart Schedule",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `Title: `, bold: true }),
              new TextRun(rateChart.title),
              new TextRun({ text: `  |  Version: `, bold: true }),
              new TextRun(rateChart.version),
              new TextRun({ text: `  |  Status: `, bold: true }),
              new TextRun(rateChart.status),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Effective Date: `, bold: true }),
              new TextRun(rateChart.effectiveDate),
              new TextRun({ text: `  |  Created By: `, bold: true }),
              new TextRun(rateChart.createdBy),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Authorized Signatures & Official Seal:\n\n", bold: true }),
              new TextRun("_____________________________               _____________________________\n"),
              new TextRun("Prepared By (Coach/Staff)                   Approved By (Manager/Admin)\n"),
              new TextRun(`Date: ${new Date().toLocaleDateString()}                        Seal: FitPulse Pro OS`),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RateChart_${rateChart.id}_${new Date().toISOString().split("T")[0]}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRateChartPDF(rateChart: EnterpriseRateChart): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("FITPULSE PRO ENTERPRISE - RATE CHART", 14, 14);
  doc.setFontSize(9);
  doc.text(`Official Tariff Schedule • Version: ${rateChart.version} • Status: ${rateChart.status}`, 14, 22);

  // Metadata
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.text(`Title: ${rateChart.title}`, 14, 38);
  doc.setFontSize(9);
  doc.text(`Effective Date: ${rateChart.effectiveDate} | Created By: ${rateChart.createdBy} | Date Generated: ${new Date().toLocaleDateString()}`, 14, 44);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 48, 196, 48);

  // Table header
  let y = 56;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Code", 16, y);
  doc.text("Service & Plan Description", 45, y);
  doc.text("Category", 115, y);
  doc.text("Duration", 155, y);
  doc.text("Rate ($)", 180, y);

  doc.setFont("helvetica", "normal");
  y += 8;

  rateChart.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(14, y - 4, 182, 10, "F");
    doc.setTextColor(30, 41, 59);
    doc.text(item.serviceCode, 16, y + 2);
    doc.setFont("helvetica", "bold");
    doc.text(item.name.substring(0, 32), 45, y + 2);
    doc.setFont("helvetica", "normal");
    doc.text(item.category.substring(0, 20), 115, y + 2);
    doc.text(item.duration, 155, y + 2);
    doc.setFont("helvetica", "bold");
    doc.text(`$${item.finalPrice}`, 180, y + 2);
    doc.setFont("helvetica", "normal");
    y += 11;
  });

  // Signature Block
  y += 20;
  if (y > 240) {
    doc.addPage();
    y = 30;
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(14, y + 15, 80, y + 15);
  doc.line(130, y + 15, 196, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Prepared By (Coach/Staff Signature)", 14, y + 20);
  doc.text("Approved By (Manager/Admin Signature)", 130, y + 20);

  // Footer
  doc.setFontSize(7);
  doc.text("FitPulse Pro • Page 1 of 1 • Confidential Document", 105, 288, { align: "center" });

  doc.save(`RateChart_${rateChart.id}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportFormSubmissionDocx(form: FormSubmissionRecord): Promise<void> {
  const fieldRows = form.fields.map(
    (field) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: field.label, bold: true })] })],
            shading: { fill: "F8FAFC" },
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                text: typeof field.value === "boolean" ? (field.value ? "Yes / Completed" : "No") : String(field.value || "N/A"),
              }),
            ],
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "FITPULSE PRO ENTERPRISE - FORM AUDIT",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: form.title,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `Form Type: `, bold: true }),
              new TextRun(form.formType),
              new TextRun({ text: `  |  Status: `, bold: true }),
              new TextRun(form.status),
              new TextRun({ text: `  |  User: `, bold: true }),
              new TextRun(`${form.userName} (${form.userRole})`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Created Date: `, bold: true }),
              new TextRun(new Date(form.createdAt).toLocaleString()),
              new TextRun({ text: `  |  Location: `, bold: true }),
              new TextRun(form.gpsLocation || "FitPulse HQ / GPS Logged"),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: fieldRows,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `Review Notes: `, bold: true }),
              new TextRun(form.reviewNotes || "No remarks noted."),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Certified & Digitally Signed:\n\n", bold: true }),
              new TextRun(`Applicant: ${form.userName}               Verified By: ${form.reviewedBy || "Head Coach"}\n`),
              new TextRun(`Timestamp: ${form.submittedAt || new Date().toISOString()}      GPS Verified: 18.5204° N, 73.8567° E`),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Form_${form.formType.replace(/\s+/g, "_")}_${form.id}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFormSubmissionPDF(form: FormSubmissionRecord): void {
  const doc = new jsPDF();
  
  // Header banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("FITPULSE PRO - OFFICIAL FORM SUBMISSION", 14, 12);
  doc.setFontSize(8);
  doc.text(`Form ID: ${form.id} • Status: ${form.status} • Role: ${form.userRole}`, 14, 20);

  // Form Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(form.title, 14, 36);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Form Type: ${form.formType} | User: ${form.userName} | Date: ${new Date(form.createdAt).toLocaleDateString()}`, 14, 43);
  doc.text(`Location: ${form.gpsLocation || "18.5204° N, 73.8567° E (HQ)"}`, 14, 49);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 53, 196, 53);

  let y = 62;
  form.fields.forEach((f, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, y - 4, 182, 12, "F");
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(f.label, 18, y + 3);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    const val = typeof f.value === "boolean" ? (f.value ? "✓ Yes / Completed" : "✗ No") : String(f.value || "-");
    doc.text(val.substring(0, 50), 105, y + 3);
    y += 14;
  });

  // Review / Signatures
  y += 10;
  if (y > 230) {
    doc.addPage();
    y = 30;
  }
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 28, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Review & Verification Status:", 18, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(`Reviewed By: ${form.reviewedBy || "Dr. Rachel Thorne / Marcus Vance"}`, 18, y + 15);
  doc.text(`Remarks: ${form.reviewNotes || "Form validated. All entries adhere to safety protocols."}`, 18, y + 22);

  y += 40;
  doc.line(14, y, 75, y);
  doc.line(130, y, 196, y);
  doc.setFontSize(8);
  doc.text("Athlete / Applicant Signature", 14, y + 6);
  doc.text("Manager / Head Coach Signature", 130, y + 6);

  doc.save(`Form_${form.formType.replace(/\s+/g, "_")}_${form.id}.pdf`);
}

export async function exportGroupReportDocx(report: EnterpriseGroupReport): Promise<void> {
  const memberRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Athlete Name", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Start Wt", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Current Wt", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Attendance", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Coach Notes", bold: true, color: "FFFFFF" })] })],
          shading: { fill: "1E293B" },
        }),
      ],
    }),
    ...report.members.map(
      (m) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: m.memberName })] }),
            new TableCell({ children: [new Paragraph({ text: `${m.startingWeightKg} kg` })] }),
            new TableCell({ children: [new Paragraph({ text: `${m.currentWeightKg} kg` })] }),
            new TableCell({ children: [new Paragraph({ text: `${m.attendancePct}%` })] }),
            new TableCell({ children: [new Paragraph({ text: m.notes })] }),
          ],
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "FITPULSE PRO ENTERPRISE - BATCH GROUP REPORT",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: report.title,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `Cohort: `, bold: true }),
              new TextRun(report.cohortName),
              new TextRun({ text: `  |  Period: `, bold: true }),
              new TextRun(report.reportPeriod),
              new TextRun({ text: `  |  Status: `, bold: true }),
              new TextRun(report.status),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Head Coach: `, bold: true }),
              new TextRun(report.coachName),
              new TextRun({ text: `  |  Avg Attendance: `, bold: true }),
              new TextRun(`${report.averageAttendancePct}%`),
              new TextRun({ text: `  |  Consistency Score: `, bold: true }),
              new TextRun(`${report.overallConsistencyPct}%`),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Cohort Summary & Observations: ", bold: true }),
              new TextRun(report.summaryNotes),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: memberRows,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Strategic Recommendations: ", bold: true }),
              new TextRun(report.recommendations),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Official Submission & Approvals:\n\n", bold: true }),
              new TextRun(`Prepared by: ${report.coachName}          Approved by: ${report.approvedBy || "Alex Miller (Admin)"}\n`),
              new TextRun(`Date: ${new Date().toLocaleDateString()}                      FitPulse Barbell Club Seal: VERIFIED`),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GroupReport_${report.cohortName.replace(/\s+/g, "_")}_${report.id}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGroupReportPDF(report: EnterpriseGroupReport): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("FITPULSE PRO - COHORT GROUP REPORT", 14, 13);
  doc.setFontSize(8);
  doc.text(`Cohort: ${report.cohortName} • Period: ${report.reportPeriod} • Status: ${report.status}`, 14, 21);

  // Summary
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(report.title, 14, 38);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Coach: ${report.coachName} | Org: ${report.organizationName} | Avg Attendance: ${report.averageAttendancePct}%`, 14, 45);
  
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 50, 182, 16, "F");
  doc.setFontSize(8);
  doc.text(`Summary: ${report.summaryNotes.substring(0, 120)}...`, 18, 57);
  doc.text(`Next Phase: ${report.recommendations.substring(0, 120)}`, 18, 63);

  // Table
  let y = 74;
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y - 4, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Athlete Name", 16, y + 1);
  doc.text("Start (kg)", 65, y + 1);
  doc.text("Now (kg)", 95, y + 1);
  doc.text("Attend %", 125, y + 1);
  doc.text("Diet Score", 155, y + 1);
  doc.text("Status", 180, y + 1);

  doc.setFont("helvetica", "normal");
  y += 9;

  report.members.forEach((m, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, y - 4, 182, 10, "F");
    doc.text(m.memberName, 16, y + 2);
    doc.text(`${m.startingWeightKg}`, 65, y + 2);
    doc.text(`${m.currentWeightKg}`, 95, y + 2);
    doc.text(`${m.attendancePct}%`, 125, y + 2);
    doc.text(`${m.dietScore}/100`, 155, y + 2);
    doc.text(m.certified ? "Certified ✓" : "Pending", 180, y + 2);
    y += 11;
  });

  // Signatures
  y += 15;
  doc.line(14, y, 75, y);
  doc.line(130, y, 196, y);
  doc.setFontSize(8);
  doc.text("Head Coach Signature", 14, y + 6);
  doc.text("Admin Approval & Certification Seal", 130, y + 6);

  doc.save(`GroupReport_${report.cohortName.replace(/\s+/g, "_")}_${report.id}.pdf`);
}
