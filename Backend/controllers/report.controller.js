const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const transporter = require('../config/mailer');

exports.generateReport = async (req, res) => {
  const { student_id } = req.params;

  try {
    // Student info fetch karo
    const studentResult = await pool.query(
      `SELECT s.*, u.name as parent_name, u.email as parent_email
       FROM students s
       JOIN users u ON s.parent_id = u.id
       WHERE s.id = $1`,
      [student_id]
    );

    if (studentResult.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    const student = studentResult.rows[0];

    // Marks fetch karo
    const marksResult = await pool.query(
      `SELECT subject, marks_obtained, max_marks,
        ROUND(marks_obtained * 100.0 / max_marks, 2) as percentage
       FROM marks WHERE student_id = $1`,
      [student_id]
    );

    // Attendance fetch karo
    const attendanceResult = await pool.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as percentage
       FROM attendance WHERE student_id = $1`,
      [student_id]
    );

    const attendance = attendanceResult.rows[0];
    const marks = marksResult.rows;

    // GPA calculate karo
    const totalObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.max_marks, 0);
    const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const gpa = ((overallPercentage / 100) * 10).toFixed(2);

    const getGrade = (p) => {
      if (p >= 90) return 'A+';
      if (p >= 80) return 'A';
      if (p >= 70) return 'B+';
      if (p >= 60) return 'B';
      if (p >= 50) return 'C';
      if (p >= 40) return 'D';
      return 'F';
    };

    // PDF banao
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Email pe bhejo
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.parent_email,
        subject: `📄 Report Card — ${student.name}`,
        html: `<h2>Dear ${student.parent_name},</h2>
               <p>Please find attached the report card for <strong>${student.name}</strong>.</p>
               <p>GPA: <strong>${gpa}</strong> | Grade: <strong>${getGrade(overallPercentage)}</strong></p>
               <p>Regards,<br/>EduTrack System</p>`,
        attachments: [{
          filename: `${student.name}_ReportCard.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });

      // Download ke liye bhi bhejo
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${student.name}_ReportCard.pdf"`);
      res.send(pdfBuffer);
    });

    // PDF content likhna shuru
    // Header
    doc.fontSize(20).font('Helvetica-Bold')
       .text('EDUTRACK SCHOOL', { align: 'center' });
    doc.fontSize(14).font('Helvetica')
       .text('Student Report Card', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Student Info
    doc.fontSize(12).font('Helvetica-Bold').text('Student Information');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Name: ${student.name}`);
    doc.text(`Roll Number: ${student.roll_number}`);
    doc.text(`Class: ${student.class} - ${student.section}`);
    doc.text(`Parent: ${student.parent_name}`);
    doc.moveDown();

    // Attendance
    doc.font('Helvetica-Bold').fontSize(12).text('Attendance Summary');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Total Days: ${attendance.total_days}`);
    doc.text(`Present Days: ${attendance.present_days}`);
    doc.text(`Attendance Percentage: ${attendance.percentage}%`);
    doc.moveDown();

    // Marks Table
    doc.font('Helvetica-Bold').fontSize(12).text('Academic Performance');
    doc.moveDown(0.5);

    // Table header
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Subject', 50, doc.y, { width: 200 });
    doc.text('Marks', 250, doc.y - 12, { width: 80 });
    doc.text('Max', 330, doc.y - 12, { width: 80 });
    doc.text('Grade', 410, doc.y - 12, { width: 80 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(10);
    marks.forEach(m => {
      doc.text(m.subject, 50, doc.y, { width: 200 });
      doc.text(String(m.marks_obtained), 250, doc.y - 12, { width: 80 });
      doc.text(String(m.max_marks), 330, doc.y - 12, { width: 80 });
      doc.text(getGrade(m.percentage), 410, doc.y - 12, { width: 80 });
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // GPA Summary
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Overall GPA: ${gpa}   |   Grade: ${getGrade(overallPercentage)}   |   Percentage: ${overallPercentage.toFixed(2)}%`);
    doc.moveDown(2);

    // Signature
    doc.font('Helvetica').fontSize(10);
    doc.text('Class Teacher: _______________', 50, doc.y);
    doc.text('Principal: _______________', 300, doc.y - 12);

    doc.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};