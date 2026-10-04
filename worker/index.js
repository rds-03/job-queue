const pool = require("../shared/db");

const sleeper =(ms)=> new Promise(resolve => setTimeout(resolve, ms));

const processNextJob = async () => {
        const result = await pool.query('SELECT * FROM jobs WHERE status = $1 ORDER BY created_at ASC LIMIT 1 ', ['pending']);
        const job = result.rows[0];

        if(!job){
            console.log('No pending jobs found. Retrying in 5 seconds...');
            return ;
        }
        
        await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['processing', job.id]);
        try{
            console.log(`Processing job ${job.id} of type ${job.type} with payload: ${JSON.stringify(job.payload)}`);
            await sleeper(2000); // Simulate job processing time
            await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['done', job.id]);
            console.log(`Job ${job.id} completed successfully.`);
        }catch(err){
            await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', job.id]);
            console.error(`Job ${job.id} failed with error: ${err.message}`);
        }
}

async function startWorker() {
    while(true){
        await processNextJob();
        await sleeper(5000); // Wait for 5 seconds before checking for the next job
    }
}
startWorker()