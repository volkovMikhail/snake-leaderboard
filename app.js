require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');

const path = require('path');
const cors = require('cors');

//all env vars
const port = process.env.PORT ?? 3000;
const baseDomain = process.env.BASE_DOMAIN;
const mongodbUri = process.env.MONGODB_CONNECTION;

const app = express();
const mongoClient = new MongoClient(mongodbUri);
const db = mongoClient.db('snake');

app.use(cors({ origin: [baseDomain] }));
app.use(express.json());
app.use(express.static(path.resolve('public')));

const maxSnakeLength = 25 * 25; // maximum snake length

app.post('/result', async (req, res) => {
  const response = await handleResult({ ...req.body });

  res.status(response.status).json(response);
});

app.get('/leaderboard', async (req, res) => {
  const response = await getLeaderboard(req.query);

  res.status(response.status).json(response);
});

app.listen(port, () => console.log(`app listen on ${port} port...`));

//Logic
async function handleResult({ username, score, time }) {
  const leaderboard = db.collection('leaderboard');

  if (score > maxSnakeLength) {
    return {
      status: 400,
      message: 'Score greater then maximum value',
    };
  }

  const existingRecord = await leaderboard.findOne({ username });

  if (existingRecord === null) {
    await leaderboard.insertOne({ username, score, time });

    console.log(
      `New leaderboard record: ${username}, ${score} scores, ${time} sec`
    );

    return {
      status: 200,
      message: 'Added',
    };
  }

  const updateValues = {};

  if (existingRecord.score < score) {
    updateValues.score = score;
    updateValues.time = time;
  }

  if (Object.keys(updateValues).length > 0) {
    await leaderboard.updateOne({ username }, { $set: updateValues });

    console.log(
      `Existing leaderboard record updated: ${username}, ${score} scores, ${time} sec`
    );

    return {
      status: 200,
      message: 'Updated',
    };
  }

  return {
    status: 200,
    message: 'Ok',
  };
}

async function getLeaderboard(options) {
  const limit = Number(options.limit);
  const skip = Number(options.skip);

  if (isNaN(limit) || isNaN(skip)) {
    return {
      status: 400,
      message: 'limit and skip should be number type',
    };
  }

  if (limit > 30) {
    return {
      status: 400,
      message: 'Can not return more then 30 entries',
    };
  }

  const leaderboard = db.collection('leaderboard');

  const findResult = await leaderboard
    .find({})
    .sort({
      score: -1,
      time: 1,
    })
    .limit(limit)
    .skip(skip);

  const response = await findResult.toArray();

  let offset = skip ?? 0;

  return {
    status: 200,
    data: response.map((i) => ({ ...i, place: ++offset })),
  };
}
