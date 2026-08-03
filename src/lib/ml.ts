import * as tf from '@tensorflow/tfjs';
import { CandleData, DataPoint } from './indicators';

// Hyperparameters
const LOOK_BACK = 20; 
const PREDICT_FORWARD = 7; 

export async function trainAndPredictLSTM(data: CandleData[]): Promise<DataPoint[]> {
  if (data.length < LOOK_BACK + 20) return []; 

  // Make sure backend is ready
  await tf.ready();

  const closes = data.map(d => d.close);
  
  // Normalization
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const normalize = (val: number) => (val - min) / (max - min);
  const denormalize = (val: number) => val * (max - min) + min;

  const normalizedCloses = closes.map(normalize);

  const xs: number[][] = [];
  const ys: number[] = [];
  
  for (let i = 0; i < normalizedCloses.length - LOOK_BACK - 1; i++) {
    xs.push(normalizedCloses.slice(i, i + LOOK_BACK));
    ys.push(normalizedCloses[i + LOOK_BACK]);
  }

  const xsTensor = tf.tensor2d(xs).expandDims(2); 
  const ysTensor = tf.tensor1d(ys);

  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: false,
    inputShape: [LOOK_BACK, 1]
  }));
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  // Train (kept small for fast UI feedback)
  await model.fit(xsTensor, ysTensor, {
    epochs: 15,
    batchSize: 32,
    shuffle: true,
  });

  const predictions: DataPoint[] = [];
  let currentWindow = normalizedCloses.slice(-LOOK_BACK);
  let lastDate = new Date(data[data.length - 1].time);

  // Predict into the future
  for (let i = 0; i < PREDICT_FORWARD; i++) {
    const input = tf.tensor2d([currentWindow]).expandDims(2);
    const pred = model.predict(input) as tf.Tensor;
    const predValue = (await pred.data())[0];
    
    // Increment date (simple approach)
    lastDate.setDate(lastDate.getDate() + 1);
    
    predictions.push({
      time: lastDate.toISOString().split('T')[0],
      value: denormalize(predValue)
    });
    
    currentWindow.shift();
    currentWindow.push(predValue);
    
    tf.dispose([input, pred]);
  }

  // Connect the prediction line smoothly to the last known point
  predictions.unshift({
    time: data[data.length - 1].time,
    value: data[data.length - 1].close
  });

  tf.dispose([xsTensor, ysTensor]);
  model.dispose();

  return predictions;
}
