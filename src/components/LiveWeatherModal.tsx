import React, { useState } from 'react';
import { LiveWeatherData } from '../types';

interface LiveWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: string;
}

const WEATHER_STATIONS: Record<string, LiveWeatherData> = {
  'Anand, Gujarat': {
    location: 'Anand, Gujarat',
    temperature: 31,
    condition: 'Partly Cloudy & Warm',
    humidity: 58,
    windSpeed: 11,
    rainProbability: 15,
    uvIndex: 7,
    airQuality: 'Good (AQI 42)',
    forecast: [
      { day: 'Today', date: '05 Aug', highTemp: 32, lowTemp: 24, condition: 'Partly Cloudy', icon: 'partly_cloudy_day', rainProbability: 15, humidity: 58, windSpeed: 11 },
      { day: 'Thu', date: '06 Aug', highTemp: 33, lowTemp: 25, condition: 'Sunny & Clear', icon: 'wb_sunny', rainProbability: 5, humidity: 52, windSpeed: 12 },
      { day: 'Fri', date: '07 Aug', highTemp: 30, lowTemp: 23, condition: 'Light Monsoon Shower', icon: 'rainy', rainProbability: 65, humidity: 78, windSpeed: 18 },
      { day: 'Sat', date: '08 Aug', highTemp: 29, lowTemp: 23, condition: 'Thunderstorm Expected', icon: 'thunderstorm', rainProbability: 80, humidity: 82, windSpeed: 22 },
      { day: 'Sun', date: '09 Aug', highTemp: 31, lowTemp: 24, condition: 'Scattered Clouds', icon: 'cloud', rainProbability: 25, humidity: 64, windSpeed: 14 },
    ]
  },
  'Ludhiana, Punjab': {
    location: 'Ludhiana, Punjab',
    temperature: 34,
    condition: 'Sunny & Humid',
    humidity: 64,
    windSpeed: 9,
    rainProbability: 10,
    uvIndex: 8,
    airQuality: 'Moderate (AQI 68)',
    forecast: [
      { day: 'Today', date: '05 Aug', highTemp: 34, lowTemp: 26, condition: 'Sunny', icon: 'wb_sunny', rainProbability: 10, humidity: 64, windSpeed: 9 },
      { day: 'Thu', date: '06 Aug', highTemp: 35, lowTemp: 27, condition: 'Hot & Clear', icon: 'sunny', rainProbability: 5, humidity: 58, windSpeed: 10 },
      { day: 'Fri', date: '07 Aug', highTemp: 32, lowTemp: 25, condition: 'Scattered Rain', icon: 'rainy', rainProbability: 55, humidity: 72, windSpeed: 15 },
      { day: 'Sat', date: '08 Aug', highTemp: 31, lowTemp: 24, condition: 'Passing Showers', icon: 'shower', rainProbability: 45, humidity: 70, windSpeed: 13 },
      { day: 'Sun', date: '09 Aug', highTemp: 33, lowTemp: 25, condition: 'Partly Cloudy', icon: 'partly_cloudy_day', rainProbability: 20, humidity: 62, windSpeed: 11 },
    ]
  },
  'Nashik, Maharashtra': {
    location: 'Nashik, Maharashtra',
    temperature: 27,
    condition: 'Overcast & Cool',
    humidity: 76,
    windSpeed: 16,
    rainProbability: 40,
    uvIndex: 5,
    airQuality: 'Excellent (AQI 28)',
    forecast: [
      { day: 'Today', date: '05 Aug', highTemp: 27, lowTemp: 21, condition: 'Light Drizzle', icon: 'weather_mix', rainProbability: 40, humidity: 76, windSpeed: 16 },
      { day: 'Thu', date: '06 Aug', highTemp: 28, lowTemp: 22, condition: 'Moderate Rain', icon: 'rainy', rainProbability: 70, humidity: 82, windSpeed: 19 },
      { day: 'Fri', date: '07 Aug', highTemp: 26, lowTemp: 20, condition: 'Heavy Showers', icon: 'thunderstorm', rainProbability: 85, humidity: 88, windSpeed: 24 },
      { day: 'Sat', date: '08 Aug', highTemp: 27, lowTemp: 21, condition: 'Overcast', icon: 'cloud', rainProbability: 35, humidity: 75, windSpeed: 15 },
      { day: 'Sun', date: '09 Aug', highTemp: 29, lowTemp: 22, condition: 'Breaks of Sun', icon: 'partly_cloudy_day', rainProbability: 20, humidity: 68, windSpeed: 12 },
    ]
  },
  'Indore, Madhya Pradesh': {
    location: 'Indore, Madhya Pradesh',
    temperature: 29,
    condition: 'Breezy & Mostly Cloudy',
    humidity: 70,
    windSpeed: 14,
    rainProbability: 25,
    uvIndex: 6,
    airQuality: 'Good (AQI 38)',
    forecast: [
      { day: 'Today', date: '05 Aug', highTemp: 29, lowTemp: 22, condition: 'Mostly Cloudy', icon: 'cloud', rainProbability: 25, humidity: 70, windSpeed: 14 },
      { day: 'Thu', date: '06 Aug', highTemp: 30, lowTemp: 23, condition: 'Passing Shower', icon: 'shower', rainProbability: 40, humidity: 72, windSpeed: 15 },
      { day: 'Fri', date: '07 Aug', highTemp: 28, lowTemp: 22, condition: 'Monsoon Rain', icon: 'rainy', rainProbability: 75, humidity: 84, windSpeed: 20 },
      { day: 'Sat', date: '08 Aug', highTemp: 28, lowTemp: 21, condition: 'Light Rain', icon: 'rainy', rainProbability: 60, humidity: 80, windSpeed: 17 },
      { day: 'Sun', date: '09 Aug', highTemp: 30, lowTemp: 23, condition: 'Partly Sunny', icon: 'partly_cloudy_day', rainProbability: 20, humidity: 65, windSpeed: 12 },
    ]
  }
};

export const LiveWeatherModal: React.FC<LiveWeatherModalProps> = ({ isOpen, onClose, initialLocation = 'Anand, Gujarat' }) => {
  const [selectedStationKey, setSelectedStationKey] = useState<string>(
    WEATHER_STATIONS[initialLocation] ? initialLocation : 'Anand, Gujarat'
  );

  if (!isOpen) return null;

  const currentData = WEATHER_STATIONS[selectedStationKey] || WEATHER_STATIONS['Anand, Gujarat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-2xl w-full my-8 slide-up shadow-2xl relative border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">wb_sunny</span>
              <span>Live Agricultural Weather Station</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">Weather & Micro-Climate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Location Selector */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase text-on-surface-variant block mb-2">Select Farm Location / Mandi Region</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(WEATHER_STATIONS).map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedStationKey(loc)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-left ${
                  selectedStationKey === loc
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-on-surface border-outline-variant/40 hover:bg-surface-container-high'
                }`}
              >
                {loc.split(',')[0]}
                <span className="block text-[10px] font-normal opacity-80">{loc.split(',')[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Weather Main Banner */}
        <div className="glass-card rounded-2xl p-6 mb-6 bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{currentData.location}</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-black">{currentData.temperature}°C</span>
                <span className="text-sm font-semibold text-emerald-200">{currentData.condition}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-amber-400 text-6xl">
              {currentData.rainProbability > 50 ? 'rainy' : 'partly_cloudy_day'}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold">Humidity</span>
              <span className="text-base font-extrabold">{currentData.humidity}%</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold">Wind Speed</span>
              <span className="text-base font-extrabold">{currentData.windSpeed} km/h</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold">Rain Chance</span>
              <span className="text-base font-extrabold text-amber-300">{currentData.rainProbability}%</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <span className="text-emerald-300 block text-[10px] uppercase font-bold">UV Index</span>
              <span className="text-base font-extrabold">{currentData.uvIndex} (Moderate)</span>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface mb-3 flex items-center justify-between">
            <span>5-Day Farm Weather Forecast</span>
            <span className="text-[11px] font-bold text-primary">AQI: {currentData.airQuality}</span>
          </h3>

          <div className="space-y-2">
            {currentData.forecast.map((fc, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-outline-variant/30 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 w-28">
                  <span className="material-symbols-outlined text-amber-500 text-2xl">{fc.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">{fc.day}</span>
                    <span className="text-[10px] text-on-surface-variant">{fc.date}</span>
                  </div>
                </div>

                <div className="flex-1 px-2 text-center hidden sm:block">
                  <span className="text-xs font-semibold text-on-surface">{fc.condition}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-xs">water_drop</span>
                    <span>{fc.rainProbability}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-on-surface">{fc.highTemp}°</span>
                    <span className="text-on-surface-variant text-[11px] ml-1">/ {fc.lowTemp}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agronomist Advisory Note */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">lightbulb</span>
          <div>
            <span className="font-bold block mb-0.5">AI Weather Agronomy Insight:</span>
            {currentData.rainProbability > 50 ? (
              <p>Rain probability is high within 48 hours. Postpone foliar pesticide sprays and maintain field drainage channels to protect roots.</p>
            ) : (
              <p>Conditions in {currentData.location} are optimal for harvesting, sun-drying grains, and field aeration. Ensure storage bags remain dry.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
