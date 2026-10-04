const express = require('express');
const pool = require('../shared/db');

const app =express();
app.use(express.json()); // for parsing  req.body
app.post('/jobs', async (req, res) => {
    try{
        const { type, payload } = req.body;
        const result = await pool.query('INSERT INTO jobs (type, payload) VALUES ($1, $2) RETURNING *', [type, payload]);

        res.status(201).json(result.rows[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}   );

app.listen(process.env.PORT, () => {
    console.log('Producer service is running on port ' + process.env.PORT);
});