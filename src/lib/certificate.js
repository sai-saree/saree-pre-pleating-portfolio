import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Generate a certificate PDF.
 * If a custom template is placed in `public/templates/certificate-template.pdf`,
 * it loads and overlays the name, event title, and date.
 * Otherwise, it falls back to a programmatically generated layout.
 */
export async function generateCertificate({ userName, eventTitle, eventDate, organizationName = "Sai Saree Pre-Pleating" }) {
  const templatePath = path.join(process.cwd(), "public", "templates", "certificate-template.pdf");
  
  let pdfDoc;
  let page;
  let isTemplateUsed = false;
  
  if (fs.existsSync(templatePath)) {
    try {
      console.log(`[CERTIFICATE] Loading custom template from: ${templatePath}`);
      const templateBytes = fs.readFileSync(templatePath);
      pdfDoc = await PDFDocument.load(templateBytes);
      page = pdfDoc.getPages()[0];
      isTemplateUsed = true;
    } catch (err) {
      console.error(`[CERTIFICATE] Failed to load custom template: ${err.message}. Falling back to default.`);
    }
  }

  // Fallback: Generate the template programmatically
  if (!isTemplateUsed) {
    const WIDTH = 842; // A4 landscape width
    const HEIGHT = 595; // A4 landscape height
    pdfDoc = await PDFDocument.create();
    page = pdfDoc.addPage([WIDTH, HEIGHT]);

    const gold = rgb(0.76, 0.6, 0.23);       // #c29a3b
    const darkText = rgb(0.15, 0.15, 0.15);   // #262626
    const lightText = rgb(0.4, 0.4, 0.4);     // #666666
    const coral = rgb(0.91, 0.26, 0.5);       // #e8437f
    const white = rgb(1, 1, 1);

    // Outer border
    const borderInset = 30;
    page.drawRectangle({
      x: borderInset,
      y: borderInset,
      width: WIDTH - borderInset * 2,
      height: HEIGHT - borderInset * 2,
      borderColor: gold,
      borderWidth: 3,
      color: white,
    });

    // Inner border
    page.drawRectangle({
      x: borderInset + 10,
      y: borderInset + 10,
      width: WIDTH - (borderInset + 10) * 2,
      height: HEIGHT - (borderInset + 10) * 2,
      borderColor: gold,
      borderWidth: 1,
    });

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    const headerText = "CERTIFICATE OF COMPLETION";
    const headerSize = 28;
    const headerWidth = helveticaBold.widthOfTextAtSize(headerText, headerSize);
    page.drawText(headerText, {
      x: (WIDTH - headerWidth) / 2,
      y: HEIGHT - 120,
      size: headerSize,
      font: helveticaBold,
      color: gold,
    });

    // Sub-header
    const presentText = "This is proudly presented to";
    const presentSize = 14;
    const presentWidth = helvetica.widthOfTextAtSize(presentText, presentSize);
    page.drawText(presentText, {
      x: (WIDTH - presentWidth) / 2,
      y: HEIGHT - 180,
      size: presentSize,
      font: helvetica,
      color: lightText,
    });

    // Organization Signature
    const sigLineY = 100;
    page.drawLine({
      start: { x: WIDTH / 2 - 100, y: sigLineY },
      end: { x: WIDTH / 2 + 100, y: sigLineY },
      thickness: 1,
      color: darkText,
    });

    const sigText = "Authorized Representative";
    const sigTextWidth = helvetica.widthOfTextAtSize(sigText, 10);
    page.drawText(sigText, {
      x: (WIDTH - sigTextWidth) / 2,
      y: sigLineY - 18,
      size: 10,
      font: helvetica,
      color: lightText,
    });

    const orgText = organizationName;
    const orgWidth = helveticaBold.widthOfTextAtSize(orgText, 12);
    page.drawText(orgText, {
      x: (WIDTH - orgWidth) / 2,
      y: sigLineY - 36,
      size: 12,
      font: helveticaBold,
      color: gold,
    });
  }

  const { width: pageWidth, height: pageHeight } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const darkText = rgb(0.15, 0.15, 0.15);
  const coral = rgb(0.91, 0.26, 0.5);

  // 1. Overlay Participant Name (Centered)
  // Adjust Y positions to align with empty spaces on typical template designs
  const nameY = isTemplateUsed ? pageHeight / 2 + 10 : pageHeight - 245;
  const nameSize = Math.min(36, 36 * (20 / Math.max(userName.length, 20)));
  const nameWidth = helveticaBold.widthOfTextAtSize(userName, nameSize);
  page.drawText(userName, {
    x: (pageWidth - nameWidth) / 2,
    y: nameY,
    size: nameSize,
    font: helveticaBold,
    color: coral,
  });

  // 2. Overlay Course Title
  const courseY = isTemplateUsed ? pageHeight / 2 - 60 : pageHeight - 335;
  const eventSize = Math.min(22, 22 * (30 / Math.max(eventTitle.length, 30)));
  const eventWidth = helveticaBold.widthOfTextAtSize(eventTitle, eventSize);
  page.drawText(eventTitle, {
    x: (pageWidth - eventWidth) / 2,
    y: courseY,
    size: eventSize,
    font: helveticaBold,
    color: darkText,
  });

  // 3. Overlay Date
  const dateY = isTemplateUsed ? pageHeight / 2 - 120 : pageHeight - 375;
  const dateStr = isTemplateUsed ? `Date: ${eventDate}` : `Given this day on ${eventDate}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateStr, 12);
  page.drawText(dateStr, {
    x: (pageWidth - dateWidth) / 2,
    y: dateY,
    size: 12,
    font: helvetica,
    color: darkText,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
