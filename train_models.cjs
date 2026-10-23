const fs = require('fs');
const tf = require('@tensorflow/tfjs');

// 1. Read and parse dataset
const csvFile = fs.existsSync('onion_price_dataset_ahmedabad(2).csv')
  ? 'onion_price_dataset_ahmedabad(2).csv'
  : 'onion_price_dataset_ahmedabad(1).csv';
const csvText = fs.readFileSync(csvFile, 'utf8');
const lines = csvText.trim().replace(/\r/g, '').split('\n');

const records = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  const monthStr = parts[0]?.trim();
  const modelPriceStr = parts[3]?.trim();
  if (modelPriceStr && modelPriceStr !== '' && !isNaN(Number(modelPriceStr))) {
    records.push({
      dateStr: monthStr,
      date: new Date(monthStr),
      minPrice: Number(parts[1]),
      maxPrice: Number(parts[2]),
      modelPrice: Number(modelPriceStr),
      retailPrice: Number(parts[4]),
      arrivalQty: Number(parts[5]),
    });
  }
}

// 2. Sort chronologically
records.sort((a, b) => a.date.getTime() - b.date.getTime());
console.log(`Total usable records: ${records.length}`);

// 3. Chronological Train (70%), Validation (15%), Test (15%) splits
const N = records.length;
const trainCount = Math.floor(N * 0.70); // 543
const valCount = Math.floor(N * 0.15);   // 116
const testCount = N - trainCount - valCount; // 117

const trainRecords = records.slice(0, trainCount);
const valRecords = records.slice(trainCount, trainCount + valCount);
const testRecords = records.slice(trainCount + valCount);

console.log(`Splits: Train=${trainRecords.length}, Val=${valRecords.length}, Test=${testRecords.length}`);

// 4. Fit scaler ONLY on training data
const trainPrices = trainRecords.map(r => r.modelPrice);
const minVal = Math.min(...trainPrices);
const maxVal = Math.max(...trainPrices);
console.log(`Training Scaler: min=${minVal}, max=${maxVal}`);

function scale(val) {
  return (val - minVal) / (maxVal - minVal);
}

function unscale(val) {
  return val * (maxVal - minVal) + minVal;
}

// 5. Create rolling sequences of 30 historical observations (30 trading days context)
const SEQ_LEN = 30;

function createSequences(allRecords, startIndex, length) {
  const X = [];
  const y = [];
  const dates = [];
  // For validation/test we need previous 30 points as context
  const fullSlice = allRecords.slice(Math.max(0, startIndex - SEQ_LEN), startIndex + length);
  for (let i = SEQ_LEN; i < fullSlice.length; i++) {
    const seq = fullSlice.slice(i - SEQ_LEN, i).map(r => [scale(r.modelPrice)]);
    X.push(seq);
    y.push(scale(fullSlice[i].modelPrice));
    dates.push(fullSlice[i].dateStr);
  }
  return { X, y, dates };
}

// Train sequences (strictly within trainRecords)
const trainSeq = [];
const trainTargets = [];
for (let i = SEQ_LEN; i < trainRecords.length; i++) {
  trainSeq.push(trainRecords.slice(i - SEQ_LEN, i).map(r => [scale(r.modelPrice)]));
  trainTargets.push(scale(trainRecords[i].modelPrice));
}

const valSeq = createSequences(records, trainCount, valCount);
const testSeq = createSequences(records, trainCount + valCount, testCount);

console.log(`Sequences generated: Train=${trainSeq.length}, Val=${valSeq.X.length}, Test=${testSeq.X.length}`);

const xTrainTensor = tf.tensor3d(trainSeq);
const yTrainTensor = tf.tensor2d(trainTargets, [trainTargets.length, 1]);
const xValTensor = tf.tensor3d(valSeq.X);
const xTestTensor = tf.tensor3d(testSeq.X);

// Metrics calculation
function calculateMetrics(yTrueActual, yPredActual) {
  let sumAE = 0;
  let sumSE = 0;
  let sumAPE = 0;
  const n = yTrueActual.length;
  const meanTrue = yTrueActual.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < n; i++) {
    const yt = yTrueActual[i];
    const yp = yPredActual[i];
    const diff = yt - yp;
    sumAE += Math.abs(diff);
    sumSE += diff * diff;
    sumAPE += Math.abs(diff / (yt || 1));
    ssTot += (yt - meanTrue) * (yt - meanTrue);
    ssRes += diff * diff;
  }

  const mae = sumAE / n;
  const rmse = Math.sqrt(sumSE / n);
  const mape = (sumAPE / n) * 100;
  const r2 = 1 - (ssRes / (ssTot || 1));

  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mape: Number(mape.toFixed(2)),
    r2: Number(r2.toFixed(4)),
  };
}

async function trainModel(type) {
  console.log(`\n--- Training ${type.toUpperCase()} Model ---`);
  const model = tf.sequential();

  if (type === 'lstm') {
    model.add(tf.layers.lstm({ units: 64, returnSequences: true, inputShape: [SEQ_LEN, 1] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.lstm({ units: 64, returnSequences: false }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
  } else if (type === 'gru') {
    model.add(tf.layers.gru({ units: 64, returnSequences: true, inputShape: [SEQ_LEN, 1] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.gru({ units: 64, returnSequences: false }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
  } else if (type === 'rnn') {
    model.add(tf.layers.simpleRNN({ units: 64, activation: 'tanh', returnSequences: true, inputShape: [SEQ_LEN, 1] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.simpleRNN({ units: 64, activation: 'tanh', returnSequences: false }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
  }

  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'meanSquaredError',
  });

  const epochs = 4;
  await model.fit(xTrainTensor, yTrainTensor, {
    epochs,
    batchSize: 32,
    shuffle: false,
    verbose: 0,
  });

  // Evaluate on validation
  const valPredRaw = model.predict(xValTensor).dataSync();
  const valPredActual = Array.from(valPredRaw).map(unscale);
  const valTrueActual = valSeq.y.map(unscale);
  const valMetrics = calculateMetrics(valTrueActual, valPredActual);

  // Evaluate on test
  const testPredRaw = model.predict(xTestTensor).dataSync();
  const testPredActual = Array.from(testPredRaw).map(unscale);
  const testTrueActual = testSeq.y.map(unscale);
  const testMetrics = calculateMetrics(testTrueActual, testPredActual);

  console.log(`${type.toUpperCase()} Val Metrics:`, valMetrics);
  console.log(`${type.toUpperCase()} Test Metrics:`, testMetrics);

  const weights = model.getWeights().map(w => ({
    name: w.name,
    shape: w.shape,
    data: Array.from(w.dataSync()),
  }));

  return {
    type,
    model,
    weights,
    valMetrics,
    testMetrics,
    valPredActual,
    testPredActual,
  };
}

async function run() {
  const lstmRes = await trainModel('lstm');
  const gruRes = await trainModel('gru');
  const rnnRes = await trainModel('rnn');

  // Dynamic weights from validation RMSE performance:
  // w_i = (1 / val_rmse_i) / sum(1 / val_rmse_j)
  const invLstm = 1 / lstmRes.valMetrics.rmse;
  const invGru = 1 / gruRes.valMetrics.rmse;
  const invRnn = 1 / rnnRes.valMetrics.rmse;
  const sumInv = invLstm + invGru + invRnn;

  const wLstm = Number((invLstm / sumInv).toFixed(4));
  const wGru = Number((invGru / sumInv).toFixed(4));
  const wRnn = Number((1 - wLstm - wGru).toFixed(4));

  console.log(`\nValidation-derived ensemble weights: LSTM=${(wLstm*100).toFixed(2)}%, GRU=${(wGru*100).toFixed(2)}%, RNN=${(wRnn*100).toFixed(2)}%`);

  // Ensemble predictions on Test set
  const ensembleTestPred = [];
  const testTrueActual = testSeq.y.map(unscale);
  for (let i = 0; i < testTrueActual.length; i++) {
    const p = wLstm * lstmRes.testPredActual[i] + wGru * gruRes.testPredActual[i] + wRnn * rnnRes.testPredActual[i];
    ensembleTestPred.push(p);
  }
  const ensembleTestMetrics = calculateMetrics(testTrueActual, ensembleTestPred);

  // Ensemble predictions on Val set
  const ensembleValPred = [];
  const valTrueActual = valSeq.y.map(unscale);
  for (let i = 0; i < valTrueActual.length; i++) {
    const p = wLstm * lstmRes.valPredActual[i] + wGru * gruRes.valPredActual[i] + wRnn * rnnRes.valPredActual[i];
    ensembleValPred.push(p);
  }
  const ensembleValMetrics = calculateMetrics(valTrueActual, ensembleValPred);

  console.log('Ensemble Val Metrics:', ensembleValMetrics);
  console.log('Ensemble Test Metrics:', ensembleTestMetrics);

  const outputData = {
    metadata: {
      crop: "Onion",
      market: "Ahmedabad",
      unit: "₹/quintal",
      totalRawRows: 1492,
      usableObservations: records.length,
      sequenceLength: SEQ_LEN,
      trainSplitRatio: 0.70,
      valSplitRatio: 0.15,
      testSplitRatio: 0.15,
      lastUpdated: new Date().toISOString(),
      latestRecord: records[records.length - 1],
      scaler: { minVal, maxVal },
    },
    weights: {
      lstm: wLstm,
      gru: wGru,
      rnn: wRnn,
    },
    metrics: {
      val: {
        lstm: lstmRes.valMetrics,
        gru: gruRes.valMetrics,
        rnn: rnnRes.valMetrics,
        ensemble: ensembleValMetrics,
      },
      test: {
        lstm: lstmRes.testMetrics,
        gru: gruRes.testMetrics,
        rnn: rnnRes.testMetrics,
        ensemble: ensembleTestMetrics,
      },
    },
    models: {
      lstmWeights: lstmRes.weights,
      gruWeights: gruRes.weights,
      rnnWeights: rnnRes.weights,
    },
  };

  if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
  }

  fs.writeFileSync('src/data/trained_models.json', JSON.stringify(outputData, null, 2));
  console.log('\nSaved trained models artifacts to src/data/trained_models.json successfully!');
}

run().catch(console.error);
