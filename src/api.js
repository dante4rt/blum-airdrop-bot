const axios = require('axios');

async function getToken() {
  const { data } = await axios({
    url: 'https://gateway.blum.codes/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP',
    method: 'POST',
    data: {
      query: process.env.QUERY_ID,
      referralToken: 'vTHusRz4j0', // changeable
    },
  });

  return `Bearer ${data.token.access}`;
}

async function getUsername(token) {
  const response = await axios({
    url: 'https://gateway.blum.codes/v1/user/me',
    method: 'GET',
    headers: { Authorization: token },
  });
  return response.data.username;
}

async function getBalance(token) {
  const response = await axios({
    url: 'https://game-domain.blum.codes/api/v1/user/balance',
    method: 'GET',
    headers: { Authorization: token },
  });
  return response.data;
}

async function getTribe(token) {
  try {
    const response = await axios({
      url: 'https://game-domain.blum.codes/api/v1/tribe/my',
      method: 'GET',
      headers: { Authorization: token },
    });
    return response.data;
  } catch (error) {
    if (error.response.data.message === 'NOT_FOUND') {
      return;
    } else {
      console.log(error.response.data.message);
    }
  }
}

async function claimFarmReward(token) {
  try {
    const { data } = await axios({
      url: 'https://game-domain.blum.codes/api/v1/farming/claim',
      method: 'POST',
      headers: { Authorization: token },
      data: null,
    });
    return data;
  } catch (error) {
    if (error.response.data.message === `It's too early to claim`) {
      console.error(`🚨 Claim failed! It's too early to claim.`.red);
    } else {
      console.error(`🚨 Error occured from farm claim: ${error}`.red);
    }
  }
}

async function claimDailyReward(token) {
  try {
    const { data } = await axios({
      url: 'https://game-domain.blum.codes/api/v1/daily-reward?offset=-420',
      method: 'POST',
      headers: {
        Authorization: token,
      },
      data: null,
    });

    return data;
  } catch (error) {
    if (error.response.data.message === 'same day') {
      console.error(
        `🚨 Daily claim failed because you already claim this day.`.red
      );
    } else {
      console.error(`🚨 Error occured from daily claim: ${error}`.red);
    }
  }
}

async function startFarmingSession(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/farming/start',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

async function getTasks(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/tasks',
    method: 'GET',
    headers: { Authorization: token },
  });
  return data;
}

async function startTask(token, taskId, title) {
  try {
    const { data } = await axios({
      url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/start`,
      method: 'POST',
      headers: { Authorization: token },
      data: null,
    });
    return data;
  } catch (error) {
    if (
      error.response &&
      error.response.data &&
      error.response.data.message === 'Task type does not support start'
    ) {
      console.error(
        `🚨 Start task "${title}" failed, because the task is not started yet.`
          .red
      );
    } else {
      console.log(error.response.data.message);
    }
  }
}

async function claimTaskReward(token, taskId) {
  const { data } = await axios({
    url: `https://game-domain.blum.codes/api/v1/tasks/${taskId}/claim`,
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

async function getGameId(token) {
  const { data } = await axios({
    url: 'https://game-domain.blum.codes/api/v1/game/play',
    method: 'POST',
    headers: { Authorization: token },
    data: null,
  });
  return data;
}

async function claimGamePoints(token, gameId, points) {
  const { data } = await axios({
    url: `https://game-domain.blum.codes/api/v1/game/claim`,
    method: 'POST',
    headers: { Authorization: token },
    data: {
      gameId,
      points,
    },
  });
  return data;
}

module.exports = {
  getToken,
  getUsername,
  getBalance,
  getTribe,
  claimFarmReward,
  claimDailyReward,
  startFarmingSession,
  getTasks,
  claimTaskReward,
  getGameId,
  claimGamePoints,
  startTask,
};
