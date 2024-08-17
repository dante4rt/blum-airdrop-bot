const cron = require('cron');
const { getBalance, claimDailyReward } = require('./api');

function setupCronJob(token) {
  const job = new cron.CronJob('0 */10 * * *', async () => {
    console.log('🔄 Starting farming session every 10 hours...'.yellow);
    await claimFarmReward(token);
    console.log('🌾 Farming reward claimed!'.green);
  });
  job.start();
  console.log('⏰ Cron job set up to run every 10 hours.'.green);
}

function setupBalanceCheckJob(token) {
  const job = new cron.CronJob('* * * * *', async () => {
    const balance = await getBalance(token);
    console.log(
      `🌾 Updated farming balance: ${balance.farming.balance} BLUM`.green
    );
  });
  job.start();
  console.log('⏰ Balance check job set up to run every minute.'.green);
}

function setupDailyRewardCron(token) {
  const job = new cron.CronJob('0 0 * * *', async () => {
    console.log('⏰ Running daily reward cron job...'.yellow);
    const reward = await claimDailyReward(token);

    if (reward) {
      console.log('✅ Daily reward claimed successfully!'.green);
    }
  });
  job.start();

  console.log(
    '🕒 Daily reward cron job scheduled to run every 24 hours.'.green
  );
}

module.exports = {
  setupCronJob,
  setupBalanceCheckJob,
  setupDailyRewardCron,
};
