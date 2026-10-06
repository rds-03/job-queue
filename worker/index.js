const pool = require("../shared/db");

const MAX_ATTEMPTS = 5; // Maximum number of attempts to process a job
const sleeper =(ms)=> new Promise(resolve => setTimeout(resolve, ms));

const processNextJob = async () => {

        //find jobs which are pending and run_at is less than or equal to current time.
        const result = await pool.query('UPDATE jobs SET status =\'processing\', updated_at =now() where id=(SELECT id FROM jobs WHERE status = $1 AND run_at <= now() ORDER BY created_at ASC LIMIT 1 for update skip locked) RETURNING *', ['pending']);
        const job = result.rows[0];

        if(!job){
            console.log('No pending jobs found. Retrying in 5 seconds...');
            return ;
        }
        
        try{
            console.log(`Processing job ${job.id} of type ${job.type} with payload: ${JSON.stringify(job.payload)}`);
            await sleeper(2000); // Simulate job processing time
            await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['done', job.id]);
            console.log(`Job ${job.id} completed successfully.`);
        }catch(err){
            const newAttempts = job.attempts + 1;
            const delaySecond = 2**newAttempts; // Exponential backoff(2s,4s,8s...)
            if(newAttempts < MAX_ATTEMPTS){
                await pool.query('UPDATE jobs SET status = $1, attempts = $2, run_at = now() + make_interval(secs => $4)  WHERE id = $3', ['pending', newAttempts, job.id, delaySecond]);
                console.error(`Job ${job.id} failed with error: ${err.message}. Retrying in ${delaySecond} seconds...`);
            }else{
                await pool.query('UPDATE jobs SET status = $1, attempts = $2 WHERE id = $3', ['dead', newAttempts, job.id]); //dead letter query
                console.error(`Job ${job.id} failed after ${MAX_ATTEMPTS} attempts. Error: ${err.message}`);
            }
        }
}

async function startWorker() {
    while(true){
        await processNextJob();
        await sleeper(5000); // Wait for 5 seconds before checking for the next job
    }
}
startWorker()