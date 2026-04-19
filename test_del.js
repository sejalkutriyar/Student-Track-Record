const axios = require('axios');

(async () => {
    // Generate an admin/teacher token manually or use DB to check
    const pool = require('./Backend/config/db');
    try {
        console.log("Connecting DB...");
        // Get the first student id
        const s = await pool.query("SELECT id FROM students LIMIT 1");
        if (s.rows.length === 0) return console.log("no students");
        const studentId = s.rows[0].id;
        
        console.log("Deleting studentId:", studentId);

        // Delete dependencies first
        await pool.query('DELETE FROM attendance WHERE student_id = $1', [studentId]);
        await pool.query('DELETE FROM marks WHERE student_id = $1', [studentId]);
        await pool.query('DELETE FROM remarks WHERE student_id = $1', [studentId]);

        // Finally, delete the student
        const result = await pool.query(
          'DELETE FROM students WHERE id=$1 RETURNING *',
          [studentId]
        );
        console.log("Success:", result.rows);
    } catch(e) {
        console.error("DB Error:", e.message);
    }
    process.exit(0);
})();
