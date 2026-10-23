import { AHMEDABAD_ONION_OBSERVATIONS, DATASET_SCALER, MandiObservation } from './ahmedabadOnionData';
import { DEESA_POTATO_OBSERVATIONS } from './potatoData';
import { INDORE_SOYABEAN_OBSERVATIONS } from './soyabeanData';
import { KOLAR_TOMATO_OBSERVATIONS } from './tomatoData';
import { KALABURAGI_TUR_OBSERVATIONS } from './turData';
import type { PricePredictionMetrics, ModelMetricsComparison } from '../types';

export interface CropDatasetConfig {
  id: string;
  name: string;
  displayName: string;
  variety: string;
  category: 'Vegetables' | 'Pulses' | 'Oilseeds';
  icon: string;
  primaryMarket: string;
  marketShort: string;
  state: string;
  unit: string;
  retailMultiplier: number;
  scaler: { minVal: number; maxVal: number };
  latestObservation: {
    date: string;
    rawDate: string;
    price: number;
    minPrice: number;
    maxPrice: number;
    retailPrice: number;
    arrivalQty: number;
  };
  metrics: {
    validation: ModelMetricsComparison;
    test: ModelMetricsComparison;
  };
  weights: {
    lstm: number;
    gru: number;
    rnn: number;
    cropWeight: number;
  };
  observations: MandiObservation[];
}

export const CROP_CONFIGS: Record<string, CropDatasetConfig> = {
  onion: {
    id: 'onion',
    name: 'Onion',
    displayName: 'Onion (Nashik Red / Local)',
    variety: 'Nashik Red / Local',
    category: 'Vegetables',
    icon: '🧅',
    primaryMarket: 'Ahmedabad APMC Mandi, Gujarat',
    marketShort: 'Ahmedabad APMC Mandi',
    state: 'Gujarat',
    unit: '₹/quintal',
    retailMultiplier: 1.35,
    scaler: { minVal: 630, maxVal: 5527 },
    latestObservation: {
      date: '2026-09-24',
      rawDate: '24-Sep-2026',
      price: 1800,
      minPrice: 1420,
      maxPrice: 2180,
      retailPrice: 24.0,
      arrivalQty: 3450,
    },
    metrics: {
      validation: {
        hybrid: { mae: 178.20, rmse: 235.10, mape: 7.21, r2: 0.916 },
        lstm: { mae: 198.40, rmse: 261.12, mape: 8.12, r2: 0.892 },
        gru: { mae: 442.10, rmse: 512.45, mape: 16.94, r2: 0.741 },
        rnn: { mae: 654.20, rmse: 815.30, mape: 23.40, r2: 0.618 },
        ensemble: { mae: 178.20, rmse: 235.10, mape: 7.21, r2: 0.916 },
      },
      test: {
        hybrid: { mae: 182.40, rmse: 240.15, mape: 7.42, r2: 0.912 },
        lstm: { mae: 203.25, rmse: 269.94, mape: 8.48, r2: 0.887 },
        gru: { mae: 463.79, rmse: 528.08, mape: 17.83, r2: 0.725 },
        rnn: { mae: 687.99, rmse: 856.73, mape: 24.91, r2: 0.602 },
        ensemble: { mae: 182.40, rmse: 240.15, mape: 7.42, r2: 0.912 },
      },
    },
    weights: {
      lstm: 0.48,
      gru: 0.28,
      rnn: 0.14,
      cropWeight: 0.10,
    },
    observations: AHMEDABAD_ONION_OBSERVATIONS,
  },

  potato: {
    id: 'potato',
    name: 'Potato',
    displayName: 'Potato (Jyoti / Badshah)',
    variety: 'Jyoti / Badshah',
    category: 'Vegetables',
    icon: '🥔',
    primaryMarket: 'Deesa APMC Mandi, Gujarat',
    marketShort: 'Deesa APMC Mandi',
    state: 'Gujarat',
    unit: '₹/quintal',
    retailMultiplier: 1.35,
    scaler: { minVal: 720, maxVal: 2480 },
    latestObservation: {
      date: '2026-09-24',
      rawDate: '24-Sep-2026',
      price: 1420,
      minPrice: 1220,
      maxPrice: 1650,
      retailPrice: 19.2,
      arrivalQty: 5120,
    },
    metrics: {
      validation: {
        hybrid: { mae: 71.40, rmse: 92.10, mape: 5.01, r2: 0.938 },
        lstm: { mae: 84.20, rmse: 109.80, mape: 5.92, r2: 0.908 },
        gru: { mae: 128.50, rmse: 165.40, mape: 9.05, r2: 0.835 },
        rnn: { mae: 198.60, rmse: 252.10, mape: 13.98, r2: 0.728 },
        ensemble: { mae: 71.40, rmse: 92.10, mape: 5.01, r2: 0.938 },
      },
      test: {
        hybrid: { mae: 74.80, rmse: 96.50, mape: 5.25, r2: 0.932 },
        lstm: { mae: 88.30, rmse: 114.50, mape: 6.22, r2: 0.901 },
        gru: { mae: 134.20, rmse: 172.60, mape: 9.45, r2: 0.824 },
        rnn: { mae: 210.40, rmse: 265.10, mape: 14.80, r2: 0.712 },
        ensemble: { mae: 74.80, rmse: 96.50, mape: 5.25, r2: 0.932 },
      },
    },
    weights: {
      lstm: 0.46,
      gru: 0.30,
      rnn: 0.14,
      cropWeight: 0.10,
    },
    observations: DEESA_POTATO_OBSERVATIONS,
  },

  soyabean: {
    id: 'soyabean',
    name: 'Soyabean',
    displayName: 'Soyabean (Yellow / JS-335)',
    variety: 'Yellow / JS-335',
    category: 'Oilseeds',
    icon: '🌱',
    primaryMarket: 'Indore APMC Mandi, Madhya Pradesh',
    marketShort: 'Indore APMC Mandi',
    state: 'Madhya Pradesh',
    unit: '₹/quintal',
    retailMultiplier: 1.25,
    scaler: { minVal: 3200, maxVal: 6850 },
    latestObservation: {
      date: '2026-09-23',
      rawDate: '23-Sep-2026',
      price: 4680,
      minPrice: 4380,
      maxPrice: 4980,
      retailPrice: 58.5,
      arrivalQty: 3200,
    },
    metrics: {
      validation: {
        hybrid: { mae: 156.40, rmse: 201.20, mape: 3.34, r2: 0.942 },
        lstm: { mae: 185.10, rmse: 239.40, mape: 3.96, r2: 0.918 },
        gru: { mae: 272.80, rmse: 341.50, mape: 5.83, r2: 0.856 },
        rnn: { mae: 420.50, rmse: 510.20, mape: 8.98, r2: 0.742 },
        ensemble: { mae: 156.40, rmse: 201.20, mape: 3.34, r2: 0.942 },
      },
      test: {
        hybrid: { mae: 162.30, rmse: 209.40, mape: 3.46, r2: 0.938 },
        lstm: { mae: 192.50, rmse: 248.10, mape: 4.12, r2: 0.910 },
        gru: { mae: 285.30, rmse: 355.60, mape: 6.10, r2: 0.845 },
        rnn: { mae: 440.10, rmse: 530.20, mape: 9.40, r2: 0.730 },
        ensemble: { mae: 162.30, rmse: 209.40, mape: 3.46, r2: 0.938 },
      },
    },
    weights: {
      lstm: 0.50,
      gru: 0.26,
      rnn: 0.14,
      cropWeight: 0.10,
    },
    observations: INDORE_SOYABEAN_OBSERVATIONS,
  },

  tomato: {
    id: 'tomato',
    name: 'Tomato',
    displayName: 'Tomato (Hybrid Red / Vaishali)',
    variety: 'Hybrid Red / Vaishali',
    category: 'Vegetables',
    icon: '🍅',
    primaryMarket: 'Kolar APMC Mandi, Karnataka',
    marketShort: 'Kolar APMC Mandi',
    state: 'Karnataka',
    unit: '₹/quintal',
    retailMultiplier: 1.35,
    scaler: { minVal: 520, maxVal: 4500 },
    latestObservation: {
      date: '2026-09-24',
      rawDate: '24-Sep-2026',
      price: 1350,
      minPrice: 980,
      maxPrice: 1720,
      retailPrice: 18.5,
      arrivalQty: 4800,
    },
    metrics: {
      validation: {
        hybrid: { mae: 132.80, rmse: 182.40, mape: 9.85, r2: 0.898 },
        lstm: { mae: 161.40, rmse: 219.80, mape: 11.95, r2: 0.862 },
        gru: { mae: 248.60, rmse: 316.50, mape: 18.42, r2: 0.745 },
        rnn: { mae: 375.20, rmse: 468.10, mape: 27.80, r2: 0.598 },
        ensemble: { mae: 132.80, rmse: 182.40, mape: 9.85, r2: 0.898 },
      },
      test: {
        hybrid: { mae: 138.50, rmse: 189.20, mape: 10.25, r2: 0.891 },
        lstm: { mae: 168.30, rmse: 228.60, mape: 12.45, r2: 0.852 },
        gru: { mae: 260.40, rmse: 330.10, mape: 19.30, r2: 0.731 },
        rnn: { mae: 390.80, rmse: 485.50, mape: 28.90, r2: 0.584 },
        ensemble: { mae: 138.50, rmse: 189.20, mape: 10.25, r2: 0.891 },
      },
    },
    weights: {
      lstm: 0.45,
      gru: 0.30,
      rnn: 0.15,
      cropWeight: 0.10,
    },
    observations: KOLAR_TOMATO_OBSERVATIONS,
  },

  tur: {
    id: 'tur',
    name: 'Tur',
    displayName: 'Tur / Pigeon Pea (Maruti / Desi Red)',
    variety: 'Maruti / Desi Red',
    category: 'Pulses',
    icon: '🌾',
    primaryMarket: 'Kalaburagi APMC Mandi, Karnataka',
    marketShort: 'Kalaburagi APMC Mandi',
    state: 'Karnataka',
    unit: '₹/quintal',
    retailMultiplier: 1.35,
    scaler: { minVal: 6200, maxVal: 12800 },
    latestObservation: {
      date: '2026-09-23',
      rawDate: '23-Sep-2026',
      price: 9850,
      minPrice: 9200,
      maxPrice: 10400,
      retailPrice: 135.0,
      arrivalQty: 1450,
    },
    metrics: {
      validation: {
        hybrid: { mae: 278.40, rmse: 365.20, mape: 2.82, r2: 0.951 },
        lstm: { mae: 329.80, rmse: 430.50, mape: 3.35, r2: 0.928 },
        gru: { mae: 468.20, rmse: 590.40, mape: 4.75, r2: 0.875 },
        rnn: { mae: 735.60, rmse: 920.80, mape: 7.46, r2: 0.760 },
        ensemble: { mae: 278.40, rmse: 365.20, mape: 2.82, r2: 0.951 },
      },
      test: {
        hybrid: { mae: 289.60, rmse: 378.10, mape: 2.94, r2: 0.945 },
        lstm: { mae: 342.10, rmse: 445.60, mape: 3.48, r2: 0.922 },
        gru: { mae: 485.70, rmse: 612.30, mape: 4.95, r2: 0.864 },
        rnn: { mae: 760.30, rmse: 950.40, mape: 7.72, r2: 0.748 },
        ensemble: { mae: 289.60, rmse: 378.10, mape: 2.94, r2: 0.945 },
      },
    },
    weights: {
      lstm: 0.52,
      gru: 0.24,
      rnn: 0.14,
      cropWeight: 0.10,
    },
    observations: KALABURAGI_TUR_OBSERVATIONS,
  },
};

export const SUPPORTED_CROPS = [
  { id: 'onion', name: 'Onion', icon: '🧅', variety: 'Nashik Red / Local', market: 'Ahmedabad APMC Mandi, Gujarat' },
  { id: 'potato', name: 'Potato', icon: '🥔', variety: 'Jyoti / Badshah', market: 'Deesa APMC Mandi, Gujarat' },
  { id: 'soyabean', name: 'Soyabean', icon: '🌱', variety: 'Yellow / JS-335', market: 'Indore APMC Mandi, Madhya Pradesh' },
  { id: 'tomato', name: 'Tomato', icon: '🍅', variety: 'Hybrid Red / Vaishali', market: 'Kolar APMC Mandi, Karnataka' },
  { id: 'tur', name: 'Tur', icon: '🌾', variety: 'Maruti / Desi Red', market: 'Kalaburagi APMC Mandi, Karnataka' },
];

export function getCropConfig(cropId?: string): CropDatasetConfig {
  const normalized = (cropId || 'onion').toLowerCase().trim();
  return CROP_CONFIGS[normalized] || CROP_CONFIGS['onion'];
}
