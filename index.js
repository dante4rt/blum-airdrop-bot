require('dotenv').config();
require('colors');
const readlineSync = require('readline-sync');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const {
  getToken,
  getUsername,
  getBalance,
  getTribe,
  claimFarmReward,
  startFarmingSession,
  getTasks,
  claimTaskReward,
  getGameId,
  claimGamePoints,
  startTask,
  claimDailyReward,
} = require('./src/api.js');
const {
  setupCronJob,
  setupBalanceCheckJob,
  setupDailyRewardCron,
  setupFarmRewardCron,
} = require('./src/cronJobs');
const { delay } = require('./src/utils');
const { displayHeader } = require('./src/display');

const TOKEN_FILE_PATH = path.join(__dirname, 'accessToken.txt');

const getTokenAndSave = async () => {
  const token = await getToken();
  fs.writeFileSync(TOKEN_FILE_PATH, token);
  console.log('✅ New token has been saved.');

  return token;
};

const handleDefaultFlow = async (token) => {
  try {
    const featureChoice = readlineSync.question(
      'Which feature would you like to use?\n1. Claim Farm Reward 🌾\n2. Start Farming Session 🚜\n3. Auto Complete Tasks ✅\n4. Auto Play and Claim Game Points 🎮\n5. Claim Daily Reward ✨\nChoose 1, 2, 3, 4, or 5: '
    );

    if (featureChoice === '1') {
      console.log('🌾 Claiming farm reward...'.yellow);
      const claimResponse = await claimFarmReward(token);

      if (claimResponse) {
        console.log('✅ Farm reward claimed successfully!'.green);
      }

      const runAgain = readlineSync.question(
        'Do you want to run this farm reward claim every 9 hours? (yes/no): '
      );

      if (runAgain.toLowerCase() === 'yes') {
        setupFarmRewardCron(token);
      } else {
        console.log('👋 Exiting the bot. See you next time!'.cyan);
        process.exit(0);
      }
    } else if (featureChoice === '2') {
      console.log('🚜 Starting farming session...'.yellow);
      console.log('');

      const farmingSession = await startFarmingSession(token);
      const farmStartTime = moment(farmingSession.startTime).format(
        'MMMM Do YYYY, h:mm:ss A'
      );
      const farmEndTime = moment(farmingSession.endTime).format(
        'MMMM Do YYYY, h:mm:ss A'
      );

      console.log(`✅ Farming session started!`.green);
      console.log(`⏰ Start time: ${farmStartTime}`);
      console.log(`⏳ End time: ${farmEndTime}`);

      const balance = await getBalance(token);

      if (balance) {
        console.log(
          `🌾 Updated farming balance: ${balance.farming.balance} BLUM`.green
        );
      }

      setupCronJob(token);
      setupBalanceCheckJob(token);
    } else if (featureChoice === '3') {
      console.log('✅ Auto completing tasks...'.yellow);
      console.log('');

      const tasksData = await getTasks(token);

      tasksData.forEach(async (category) => {
        if (
          category.tasks &&
          category.tasks.length > 0 &&
          category.tasks[0].subTasks
        ) {
          for (const task of category.tasks[0].subTasks) {
            if (task.status === 'FINISHED') {
              console.log(
                `⏭️  Task "${task.title}" is already completed.`.cyan
              );
            } else if (task.status === 'NOT_STARTED') {
              console.log(
                `⏳ Task "${task.title}" is not started yet. Starting now...`
                  .red
              );

              const startedTask = await startTask(token, task.id, task.title);

              if (startedTask) {
                console.log(
                  `✅ Task "${startedTask.title}" has been started!`.green
                );

                console.log(
                  `⏳ Claiming reward for "${task.title}" is starting now...`
                    .red
                );

                try {
                  const claimedTask = await claimTaskReward(token, task.id);
                  console.log(
                    `✅ Task "${claimedTask.title}" has been claimed!`.green
                  );
                  console.log(`🎁 Reward: ${claimedTask.reward}`.green);
                } catch (error) {
                  console.log(
                    `🚫 Unable to claim task "${task.title}", please try to claim it manually.`
                      .red
                  );
                }
              }
            } else if (
              task.status === 'STARTED' ||
              task.status === 'READY_FOR_CLAIM'
            ) {
              try {
                const claimedTask = await claimTaskReward(token, task.id);

                console.log(
                  `✅ Task "${claimedTask.title}" has been claimed!`.green
                );
                console.log(`🎁 Reward: ${claimedTask.reward}`.green);
              } catch (error) {
                console.log(`🚫 Unable to claim task "${task.title}".`.red);
              }
            }
          }
        }

        if (
          category.subSections &&
          category.subSections.length > 0 &&
          category.subSections[0].tasks
        ) {
          for (const fetchedTasks of category.subSections) {
            for (const task of fetchedTasks.tasks) {
              if (task.status === 'FINISHED') {
                console.log(
                  `⏭️  Task "${task.title}" is already completed.`.cyan
                );
              } else if (task.status === 'NOT_STARTED') {
                console.log(
                  `⏳ Task "${task.title}" is not started yet. Starting now...`
                    .red
                );

                const startedTask = await startTask(token, task.id, task.title);

                if (startedTask) {
                  console.log(
                    `✅ Task "${startedTask.title}" has been started!`.green
                  );

                  console.log(
                    `⏳ Claiming reward for "${task.title}" is starting now...`
                      .red
                  );

                  try {
                    const claimedTask = await claimTaskReward(token, task.id);
                    console.log(
                      `✅ Task "${claimedTask.title}" has been claimed!`.green
                    );
                    console.log(`🎁 Reward: ${claimedTask.reward}`.green);
                  } catch (error) {
                    console.log(
                      `🚫 Unable to claim task "${task.title}", please try to claim it manually.`
                        .red
                    );
                  }
                }
              } else if (
                task.status === 'STARTED' ||
                task.status === 'READY_FOR_CLAIM'
              ) {
                try {
                  const claimedTask = await claimTaskReward(token, task.id);

                  console.log(
                    `✅ Task "${claimedTask.title}" has been claimed!`.green
                  );
                  console.log(`🎁 Reward: ${claimedTask.reward}`.green);
                } catch (error) {
                  console.log(`🚫 Unable to claim task "${task.title}".`.red);
                }
              }
            }
          }
        }
      });
    } else if (featureChoice === '4') {
      console.log('🎮 Auto playing game and claiming reward...'.yellow);

      const balance = await getBalance(token);

      if (balance.playPasses > 0) {
        let counter = balance.playPasses;
        while (counter > 0) {
          const gameData = await getGameId(token);

          console.log('⌛ Please wait for 1 minute to play the game...'.yellow);
          await delay(60000);

          const randPoints = Math.floor(Math.random() * (240 - 160 + 1)) + 160;
          const letsPlay = await claimGamePoints(
            token,
            gameData.gameId,
            randPoints
          );

          if (letsPlay === 'OK') {
            const balance = await getBalance(token);
            if (balance) {
              console.log(
                `🎮 Play game success! Your balance now: ${balance.availableBalance} BLUM`
                  .green
              );
            } else {
              console.log(`🎮 Play game success!`.green);
            }
          }
          counter--;
        }
      } else {
        console.log(
          `🚫 You can't play again because you have ${balance.playPasses} chance(s) left.`
            .red
        );
      }
    } else if (featureChoice === '5') {
      const reward = await claimDailyReward(token);

      if (reward) {
        console.log('✅ Daily reward claimed successfully!'.green);
      }

      const runAgain = readlineSync.question(
        'Do you want to run this daily reward claim every 24 hours? (yes/no): '
      );

      if (runAgain.toLowerCase() === 'yes') {
        setupDailyRewardCron(token);
      } else {
        console.log('👋 Exiting the bot. See you next time!'.cyan);
        process.exit(0);
      }
    } else {
      console.log(
        '🚫 Invalid choice! Please restart the program and choose a valid option.'
          .red
      );
    }
  } catch (error) {
    handleApiError(error);
  }
};

const handleApiError = async (error) => {
  if (
    error.response &&
    error.response.data &&
    error.response.data.message === `It's too early to claim`
  ) {
    console.error(`🚨 Claim failed! It's too early to claim.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Need to start farm'
  ) {
    console.error(`🚨 Claim failed! You need to start farm first.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Need to claim farm'
  ) {
    console.error(`🚨 Claim failed! You need to claim farm first.`.red);
  } else if (
    error.response &&
    error.response.data &&
    error.response.data.message === 'Token expired'
  ) {
    console.error(`🚨 Token expired! Refreshing the token...`.red);
    await delay(3000);
    const newToken = await getTokenAndSave();
    await handleDefaultFlow(newToken);
  } else {
    if (error.response && error.response.data) {
      console.error(
        `🚨 An unexpected error occurred because of Cloudflare, please try again in a few minutes.`
          .red
      );
    } else {
      console.error(`🚨 An unexpected error occurred: ${error.message}`.red);
    }
  }
};

const handleOneTimeFlow = async (token) => {
  try {
    console.log('Starting one-time flow...');

    console.log('🌾 Claiming farm reward...');
    const farmRewardResponse = await claimFarmReward(token);
    if (farmRewardResponse) {
      console.log('✅ Farm reward claimed successfully!'.green);
    }

    console.log('✨ Claiming daily reward...');
    const dailyRewardResponse = await claimDailyReward(token);
    if (dailyRewardResponse) {
      console.log('✅ Daily reward claimed successfully!'.green);
    }

    console.log('🎮 Claiming game points...');
    const balance = await getBalance(token);

    if (balance.playPasses > 0) {
      let counter = balance.playPasses;
      while (counter > 0) {
        const gameData = await getGameId(token);

        console.log('⌛ Please wait for 1 minute to play the game...'.yellow);
        await delay(60000);

        const randPoints = Math.floor(Math.random() * (240 - 160 + 1)) + 160;
        const letsPlay = await claimGamePoints(
          token,
          gameData.gameId,
          randPoints
        );

        if (letsPlay === 'OK') {
          const balance = await getBalance(token);
          console.log(
            `🎮 Play game success! Your balance now: ${balance.availableBalance} BLUM`
              .green
          );
        }
        counter--;
      }
    } else {
      console.log(
        `🚫 You can't play again because you have ${balance.playPasses} chance(s) left.`
          .red
      );
    }

    console.log('🚜 Starting farming session...');
    const farmingSession = await startFarmingSession(token);
    const farmStartTime = moment(farmingSession.startTime).format(
      'MMMM Do YYYY, h:mm:ss A'
    );
    const farmEndTime = moment(farmingSession.endTime).format(
      'MMMM Do YYYY, h:mm:ss A'
    );
    console.log(`✅ Farming session started!`.green);
    console.log(`⏰ Start time: ${farmStartTime}`);
    console.log(`⏳ End time: ${farmEndTime}`);

    if (balance.farming.balance) {
      console.log(
        `🌾 Updated farming balance: ${balance.farming.balance} BLUM`.green
      );
    } else {
      return;
    }
  } catch (error) {
    if (
      error.response &&
      error.response.data &&
      error.response.data.message === 'cannot start game'
    ) {
      console.error(`🚨 Can't start the game, please try again later.`.red);
    } else {
      console.error(`🚨 Error in one-time flow: ${error.message}`.red);
    }
  }
};

const runScript = async () => {
  displayHeader();

  const token = await getTokenAndSave();

  const username = await getUsername(token);
  const balance = await getBalance(token);
  const tribe = await getTribe(token);

  console.log(`👋 Hello, ${username}!`.green);
  console.log(
    `💰 Your current BLUM balance is: ${balance.availableBalance}`.green
  );
  console.log(`🎮 Your chances to play the game: ${balance.playPasses}`);
  console.log('');
  console.log('🏰 Your tribe details:');
  if (tribe) {
    console.log(`   - Name: ${tribe.title}`);
    console.log(`   - Members: ${tribe.countMembers}`);
    console.log(`   - Earn Balance: ${tribe.earnBalance}`);
    console.log(`   - Your Role: ${tribe.role}`);
    console.log('');
  } else {
    console.error('🚨 Tribe not found!'.red);
    console.log(
      `Join HCA Tribe here: https://t.me/HappyCuanAirdrop/19694\n`.blue
    );
  }

  const option = readlineSync.question(
    'Choose the script to run:\n1. Default Flow\n2. One-time Flow\nEnter 1 or 2: '
  );

  if (option === '1') {
    await handleDefaultFlow(token);
  } else if (option === '2') {
    while (true) {
      const refreshedToken = await getTokenAndSave();
      await handleOneTimeFlow(refreshedToken);
      console.log('🔄 Restarting one-time flow in 60 minutes...'.yellow);
      await delay(3600000);
    }
  } else {
    console.log('🚫 Invalid option selected! Please restart the program.'.red);
    process.exit(1);
  }
};

runScript();
