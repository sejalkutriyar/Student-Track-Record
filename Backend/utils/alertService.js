const transporter = require('../config/mailer');
const pool = require('../config/db');

exports.checkAndSendAlerts = async (student_id) => {
  try {
    // Attendance % calculate karo
    const result = await pool.query(
      `SELECT 
        ROUND(
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) as percentage
       FROM attendance WHERE student_id = $1`,
      [student_id]
    );

    const percentage = parseFloat(result.rows[0].percentage);

    // 75% se neeche hai to alert bhejo
    if (percentage < 75) {
      // Student aur parent info fetch karo
      const studentResult = await pool.query(
        `SELECT s.name as student_name, u.email as parent_email, u.name as parent_name
         FROM students s
         JOIN users u ON s.parent_id = u.id
         WHERE s.id = $1`,
        [student_id]
      );

      const { student_name, parent_email, parent_name } = studentResult.rows[0];

      // Email bhejo
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: parent_email,
        subject: `⚠️ Low Attendance Alert — ${student_name}`,
        html: `
          <h2>Dear ${parent_name},</h2>
          <p>This is an automated alert from <strong>EduTrack</strong>.</p>
          <p>Your child <strong>${student_name}</strong>'s attendance has dropped to 
          <strong style="color:red">${percentage}%</strong>.</p>
          <p>Minimum required attendance is <strong>75%</strong>.</p>
          <p>Please contact the school for further discussion.</p>
          <br/>
          <p>Regards,<br/>EduTrack System</p>
        `
      });

      console.log(`✅ Alert sent to ${parent_email}`);
      return { alert_sent: true, percentage, parent_email };
    }

    return { alert_sent: false, percentage };
  } catch (err) {
    console.error('Alert error:', err.message);
  }
};