import * as XLSX from 'exceljs';

export interface AttendanceRecord {
  id: string;
  name: string;
  father: string;
  status: 'Present' | 'Absent';
  checkInTime?: string;
}

export interface SessionInfo {
  date: string;
  subject: string;
  secretCode: string;
}

/**
 * Export attendance data to Excel
 */
export async function exportToExcel(
  records: AttendanceRecord[],
  sessionInfo: SessionInfo
): Promise<void> {
  try {
    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // Add header information
    worksheet.mergeCells('A1:F1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = `GNDU Attendance System - ${sessionInfo.subject}`;
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    const dateRow = worksheet.getCell('A2');
    dateRow.value = `Date: ${sessionInfo.date}`;
    dateRow.font = { bold: true };
    dateRow.alignment = { horizontal: 'center' };

    // Add column headers
    const headers = ['Roll Number', 'Student ID', 'Name', 'Father\'s Name', 'Status', 'Check-in Time'];
    const headerRow = worksheet.getRow(4);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3498db' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    // Add data rows
    records.forEach((record, index) => {
      const row = worksheet.getRow(index + 5);
      row.getCell(1).value = index + 1; // Roll number
      row.getCell(2).value = record.id;
      row.getCell(3).value = record.name;
      row.getCell(4).value = record.father;
      row.getCell(5).value = record.status;
      row.getCell(6).value = record.checkInTime || '-';

      // Color code present/absent
      if (record.status === 'Present') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFc8e6c9' }
          };
        });
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${sessionInfo.subject}-${sessionInfo.date}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Export attendance data to PDF
 */
export async function exportToPDF(
  records: AttendanceRecord[],
  sessionInfo: SessionInfo
): Promise<void> {
  try {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>GNDU Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .date { font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3498db; color: white; font-weight: bold; }
            .present { background-color: #c8e6c9; }
            .stats { margin-top: 20px; display: flex; justify-content: space-around; }
            .stat { text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">GNDU Attendance System</div>
            <div class="title">${sessionInfo.subject}</div>
            <div class="date">Date: ${sessionInfo.date}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Father's Name</th>
                <th>Status</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((record, index) => `
                <tr class="${record.status === 'Present' ? 'present' : ''}">
                  <td>${index + 1}</td>
                  <td>${record.id}</td>
                  <td>${record.name}</td>
                  <td>${record.father}</td>
                  <td>${record.status}</td>
                  <td>${record.checkInTime || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${records.length}</div>
              <div class="stat-label">Total Students</div>
            </div>
            <div class="stat">
              <div class="stat-number">${records.filter(r => r.status === 'Present').length}</div>
              <div class="stat-label">Present</div>
            </div>
            <div class="stat">
              <div class="stat-number">${records.filter(r => r.status === 'Absent').length}</div>
              <div class="stat-label">Absent</div>
            </div>
            <div class="stat">
              <div class="stat-number">${Math.round((records.filter(r => r.status === 'Present').length / records.length) * 100)}%</div>
              <div class="stat-label">Attendance</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Use html2pdf to generate PDF
    const opt = {
      margin: 1,
      filename: `attendance-${sessionInfo.subject}-${sessionInfo.date}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf().set(opt).from(htmlContent).save();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

/**
 * Print attendance report
 */
export function printAttendance(
  records: AttendanceRecord[],
  sessionInfo: SessionInfo
): void {
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>GNDU Attendance Report</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .date { font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .present { background-color: #e8f5e8; }
          .stats { margin-top: 20px; display: flex; justify-content: space-around; }
          .stat { text-align: center; }
          .stat-number { font-size: 18px; font-weight: bold; }
          .stat-label { font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">GNDU Attendance System</div>
          <div class="title">Department of Computer Engineering & Technology</div>
          <div class="title">${sessionInfo.subject}</div>
          <div class="date">Date: ${sessionInfo.date}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Father's Name</th>
              <th>Status</th>
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((record, index) => `
              <tr class="${record.status === 'Present' ? 'present' : ''}">
                <td>${index + 1}</td>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.father}</td>
                <td>${record.status}</td>
                <td>${record.checkInTime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-number">${records.length}</div>
            <div class="stat-label">Total Students</div>
          </div>
          <div class="stat">
            <div class="stat-number">${records.filter(r => r.status === 'Present').length}</div>
            <div class="stat-label">Present</div>
          </div>
          <div class="stat">
            <div class="stat-number">${records.filter(r => r.status === 'Absent').length}</div>
            <div class="stat-label">Absent</div>
          </div>
          <div class="stat">
            <div class="stat-number">${Math.round((records.filter(r => r.status === 'Present').length / records.length) * 100)}%</div>
            <div class="stat-label">Attendance</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}