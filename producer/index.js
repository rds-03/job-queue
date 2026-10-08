const express = require('express');
const pool = require('../shared/db');

const app =express();
app.use(express.json()); // for parsing  req.body
app.post('/jobs', async (req, res) => {
    try{
        const { type, payload } = req.body;
        const result = await pool.query('INSERT INTO jobs (type, payload) VALUES ($1, $2) RETURNING *', [type, payload]);
        console.log(`Job ${result.rows[0].id} of type ${type} created with payload: ${JSON.stringify(payload)}`);
        res.status(201).json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}   );
// Endpoint to get job statistics
app.get('/stats', async (req, res) => {
    try{
        const result = await pool.query('SELECT status, COUNT(*) as count FROM jobs GROUP BY status');
        const stats = {};
        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count, 10);
        });
        res.json(stats);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Endpoint to list recent jobs for the dashboard
app.get('/jobs', async (req, res) => {
    try{
        const result = await pool.query('SELECT id, type, status, attempts, recent_error, created_at, updated_at FROM jobs ORDER BY id DESC LIMIT 50');
        res.json(result.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use(express.static(__dirname + '/../dashboard'));

app.listen(process.env.PORT, () => {
    console.log('Producer service is running on port ' + process.env.PORT);
});