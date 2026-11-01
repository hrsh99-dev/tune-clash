'use client';

import React from 'react';
import { RoomSettings } from '@/shared';
import {
  Film,
  Globe,
  Radio,
  Sparkles,
  Music,
  Check,
  Flame,
  Clock,
  Layers,
  Calendar,
  Languages,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';

export interface TrackSummary {
  id: string;
  languages: string[];
  categories: string[];
  era: string;
  genres: string[];
  difficulty: number;
}

interface RoomFilterSettingsProps {
  settings: RoomSettings;
  onUpdateSetting: (key: keyof RoomSettings, value: any) => void;
  isHost: boolean;
  availableFilters?: {
    languages: string[];
    categories: string[];
    eras: string[];
  };
  trackSummaries?: TrackSummary[];
}

export const RoomFilterSettings: React.FC<RoomFilterSettingsProps> = ({
  settings,
  onUpdateSetting,
  isHost,
  availableFilters,
  trackSummaries = [],
}) => {
  // Compute how many songs match the currently selected settings
  const matchingCount = trackSummaries.filter((track) => {
    if (settings.categories && settings.categories.length > 0) {
      const hasCat = track.categories.some((c) => settings.categories.includes(c));
      if (!hasCat) return false;
    }
    if (settings.languages && settings.languages.length > 0) {
      const hasLang = track.languages.some((l) => settings.languages.includes(l));
      if (!hasLang) return false;
    }
    if (settings.eras && settings.eras.length > 0) {
      if (!settings.eras.includes(track.era)) return false;
    }
    if (settings.difficultyMode && settings.difficultyMode !== 'all') {
      if (track.difficulty !== Number(settings.difficultyMode)) return false;
    }
    return true;
  }).length;

  const totalTracks = trackSummaries.length || 1065;

  const toggleArrayItem = (key: 'categories' | 'languages' | 'eras', item: string) => {
    if (!isHost) return;
    const current = settings[key] || [];
    if (current.includes(item)) {
      onUpdateSetting(
        key,
        current.filter((x) => x !== item)
      );
    } else {
      onUpdateSetting(key, [...current, item]);
    }
  };

  const applyPreset = (preset: 'all' | 'bollywood' | 'hollywood' | 'retro' | 'modern') => {
    if (!isHost) return;
    switch (preset) {
      case 'all':
        onUpdateSetting('categories', []);
        onUpdateSetting('languages', []);
        onUpdateSetting('eras', []);
        break;
      case 'bollywood':
        onUpdateSetting('categories', ['Bollywood']);
        onUpdateSetting('languages', ['Hindi']);
        onUpdateSetting('eras', []);
        break;
      case 'hollywood':
        onUpdateSetting('categories', ['Hollywood']);
        onUpdateSetting('languages', ['English']);
        onUpdateSetting('eras', []);
        break;
      case 'retro':
        onUpdateSetting('eras', ['1970s', '1980s', '1990s']);
        break;
      case 'modern':
        onUpdateSetting('eras', ['2010s', '2020s']);
        break;
    }
  };

  const isAllCategories = !settings.categories || settings.categories.length === 0;
  const isAllLanguages = !settings.languages || settings.languages.length === 0;
  const isAllEras = !settings.eras || settings.eras.length === 0;

  const isPresetAll = isAllCategories && isAllLanguages && isAllEras;
  const isPresetBollywood =
    settings.categories?.length === 1 &&
    settings.categories[0] === 'Bollywood' &&
    settings.languages?.length === 1 &&
    settings.languages[0] === 'Hindi' &&
    isAllEras;
  const isPresetHollywood =
    settings.categories?.length === 1 &&
    settings.categories[0] === 'Hollywood' &&
    settings.languages?.length === 1 &&
    settings.languages[0] === 'English' &&
    isAllEras;
  const isPresetRetro =
    settings.eras?.length === 3 &&
    ['1970s', '1980s', '1990s'].every((e) => settings.eras.includes(e));
  const isPresetModern =
    settings.eras?.length === 2 &&
    ['2010s', '2020s'].every((e) => settings.eras.includes(e));

  // Non-Host View (Horizontal Layout)
  if (!isHost) {
    return (
      <div className="w-full bg-white border-2 border-black rounded-2xl p-5 shadow-neo space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-black gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-black stroke-[2.5]" />
            <h3 className="font-black text-sm uppercase text-black">Room Playlist Rules</h3>
          </div>
          <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-neo-yellow text-black border border-black shadow-neo-sm">
            Configured by Host
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-neutral-50 rounded-xl border border-black">
            <span className="text-xs font-black uppercase text-neutral-600 flex items-center gap-1.5 mb-2">
              <Film className="w-4 h-4 text-black" /> Music Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {isAllCategories ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black border border-black">
                  All Types (Bollywood + Hollywood)
                </span>
              ) : (
                settings.categories.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-neo-yellow text-black border border-black shadow-neo-sm"
                  >
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-black">
            <span className="text-xs font-black uppercase text-neutral-600 flex items-center gap-1.5 mb-2">
              <Languages className="w-4 h-4 text-black" /> Languages
            </span>
            <div className="flex flex-wrap gap-1.5">
              {isAllLanguages ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black border border-black">
                  All Languages (Hindi + English)
                </span>
              ) : (
                settings.languages.map((l) => (
                  <span
                    key={l}
                    className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-neo-cyan text-black border border-black shadow-neo-sm"
                  >
                    {l}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-black">
            <span className="text-xs font-black uppercase text-neutral-600 flex items-center gap-1.5 mb-2">
              <Calendar className="w-4 h-4 text-black" /> Eras
            </span>
            <div className="flex flex-wrap gap-1.5">
              {isAllEras ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-black border border-black">
                  All Eras (1970s to 2020s)
                </span>
              ) : (
                settings.eras.map((e) => (
                  <span
                    key={e}
                    className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-neo-pink text-white border border-black shadow-neo-sm"
                  >
                    {e}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-between gap-3 text-xs font-black uppercase text-black">
          <span className="px-3 py-1 bg-neutral-100 rounded-lg border border-black">
            {settings.roundCount} Rounds • {settings.clipSeconds}s Clip Length
          </span>
          {settings.chaosMode && (
            <span className="font-black text-black bg-neo-orange px-3 py-1 rounded-lg border-2 border-black flex items-center gap-1.5 shadow-neo-sm">
              <Flame className="w-4 h-4 fill-current" /> Chaos Modifiers Active
            </span>
          )}
        </div>
      </div>
    );
  }

  // Interactive Horizontal View for Host
  return (
    <div className="w-full bg-white border-2 border-black rounded-2xl p-5 sm:p-6 shadow-neo space-y-6">
      {/* 1. Header with Live Match Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black">
        <div>
          <h3 className="font-black text-base sm:text-lg uppercase text-black flex items-center gap-2">
            <Film className="w-5 h-5 stroke-[2.5]" /> Song Style & Era Filters
          </h3>
          <p className="text-xs font-medium text-neutral-600 mt-0.5">
            Customize the musical styles, languages, and eras for this match.
          </p>
        </div>

        {/* Live track pool counter pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black shadow-neo-sm transition-all ${
            matchingCount > 0
              ? 'bg-neo-green text-black'
              : 'bg-neo-pink text-white animate-pulse'
          }`}
          title="Number of catalog songs matching your selected filters"
        >
          {matchingCount > 0 ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{matchingCount} SONGS READY</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>0 MATCHES! BROADEN SELECTION</span>
            </>
          )}
        </span>
      </div>

      {/* 2. QUICK 1-CLICK PRESETS (Wide 5-column layout) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-black text-black" /> Quick Presets
          </label>
          <span className="text-[11px] text-neutral-500 font-bold uppercase">1-Click Room Setups</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: 'all',
              label: '🌟 All-Time Mix',
              desc: 'Bollywood + Hollywood',
              active: isPresetAll,
              color: 'bg-neo-yellow',
            },
            {
              id: 'bollywood',
              label: '🎬 Bollywood Hits',
              desc: 'Hindi Cinema Only',
              active: isPresetBollywood,
              color: 'bg-neo-yellow',
            },
            {
              id: 'hollywood',
              label: '🌎 Hollywood Pop',
              desc: 'English Hits & Pop',
              active: isPresetHollywood,
              color: 'bg-neo-yellow',
            },
            {
              id: 'retro',
              label: '📻 Golden Retro',
              desc: '70s, 80s & 90s Classics',
              active: isPresetRetro,
              color: 'bg-neo-orange',
            },
            {
              id: 'modern',
              label: '🚀 2010s & 2020s',
              desc: 'Modern Streaming Hits',
              active: isPresetModern,
              color: 'bg-neo-cyan',
            },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id as any)}
              className={`p-3 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all min-h-[72px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                preset.active
                  ? `${preset.color} text-black shadow-neo font-black`
                  : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
              }`}
            >
              <span className="text-xs font-black uppercase leading-tight line-clamp-1">
                {preset.label}
              </span>
              <span className="text-[11px] text-neutral-700 font-medium leading-snug mt-1 line-clamp-1">
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN FILTER GRID (Full horizontal width: 3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t-2 border-black">
        {/* Column A: Music Category (4 cols) */}
        <div className="md:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Film className="w-4 h-4 stroke-[2.5]" /> Industry / Category
            </label>
            <button
              type="button"
              onClick={() => onUpdateSetting('categories', [])}
              className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border-2 border-black transition-all ${
                isAllCategories
                  ? 'bg-neo-yellow text-black shadow-neo-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:text-black'
              }`}
            >
              All Types
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-2">
            {[
              { id: 'Bollywood', label: '🎬 Bollywood', desc: 'Hindi cinema songs' },
              { id: 'Hollywood', label: '🌎 Hollywood', desc: 'Western hits & pop' },
              { id: 'Indie', label: '🎸 Indie / Alt', desc: 'Independent & rock' },
            ].map((cat) => {
              const isSelected = settings.categories?.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleArrayItem('categories', cat.id)}
                  className={`p-2.5 rounded-xl border-2 border-black text-left transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isSelected
                      ? 'bg-neo-yellow text-black font-black shadow-neo-sm'
                      : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black leading-tight">{cat.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />}
                  </div>
                  <span className="text-[11px] text-neutral-600 block mt-0.5 leading-snug">
                    {cat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column B: Languages (3 cols) */}
        <div className="md:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Languages className="w-4 h-4 stroke-[2.5]" /> Languages
            </label>
            <button
              type="button"
              onClick={() => onUpdateSetting('languages', [])}
              className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border-2 border-black transition-all ${
                isAllLanguages
                  ? 'bg-neo-cyan text-black shadow-neo-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:text-black'
              }`}
            >
              All Languages
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { id: 'Hindi', label: '🇮🇳 Hindi', desc: 'Bollywood & Hindi tracks' },
              { id: 'English', label: '🇬🇧 English', desc: 'Hollywood & Global hits' },
              { id: 'Regional', label: '🌐 Regional / Other', desc: 'Tamil, Telugu, Punjabi' },
            ].map((lang) => {
              const isSelected = settings.languages?.includes(lang.id);
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => toggleArrayItem('languages', lang.id)}
                  className={`p-2.5 rounded-xl border-2 border-black text-left transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isSelected
                      ? 'bg-neo-cyan text-black font-black shadow-neo-sm'
                      : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black leading-tight">{lang.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3] shrink-0" />}
                  </div>
                  <span className="text-[11px] text-neutral-600 block mt-0.5 leading-snug">
                    {lang.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column C: Eras Timeline (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between mb-2.5 gap-1.5">
            <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Calendar className="w-4 h-4 stroke-[2.5]" /> Era Timeline
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateSetting('eras', ['1970s', '1980s', '1990s'])}
                className="text-[10px] font-black uppercase text-black hover:bg-neo-yellow px-2 py-0.5 rounded-lg border-2 border-black shadow-neo-sm"
              >
                Old (70s-90s)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSetting('eras', ['2000s', '2010s', '2020s'])}
                className="text-[10px] font-black uppercase text-black hover:bg-neo-cyan px-2 py-0.5 rounded-lg border-2 border-black shadow-neo-sm"
              >
                New (00s+)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSetting('eras', [])}
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border-2 border-black ${
                  isAllEras
                    ? 'bg-neo-yellow text-black shadow-neo-sm'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
            {[
              { id: '1970s', label: '1970s', sub: 'Classic' },
              { id: '1980s', label: '1980s', sub: 'Retro' },
              { id: '1990s', label: '1990s', sub: '90s Hits' },
              { id: '2000s', label: '2000s', sub: 'Y2K' },
              { id: '2010s', label: '2010s', sub: 'Streaming' },
              { id: '2020s', label: '2020s', sub: 'Latest' },
            ].map((era) => {
              const isSelected = settings.eras?.includes(era.id);
              return (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => toggleArrayItem('eras', era.id)}
                  className={`p-2.5 rounded-xl border-2 border-black text-center transition-all flex flex-col items-center justify-center min-h-[58px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    isSelected
                      ? 'bg-neo-orange text-black font-black shadow-neo-sm'
                      : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
                  }`}
                >
                  <div className="text-xs font-black leading-none">{era.label}</div>
                  <div
                    className={`text-[10px] uppercase font-bold mt-1 leading-none ${
                      isSelected ? 'text-black' : 'text-neutral-500'
                    }`}
                  >
                    {era.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. GAMEPLAY SETTINGS: ROUNDS, AUDIO CLIP LENGTH, & CHAOS (Wide Horizontal Row) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t-2 border-black">
        {/* Rounds Count (4 cols) */}
        <div className="md:col-span-4">
          <label className="block text-xs font-black uppercase text-black mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Number of Rounds
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[3, 5, 8, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => onUpdateSetting('roundCount', cnt)}
                className={`py-2.5 rounded-xl border-2 border-black text-xs font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  settings.roundCount === cnt
                    ? 'bg-neo-yellow text-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Clip Length (4 cols) */}
        <div className="md:col-span-4">
          <label className="block text-xs font-black uppercase text-black mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Clip Guessing Window
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { sec: 6, label: '6s', speed: 'Fast' },
              { sec: 8, label: '8s', speed: 'Standard' },
              { sec: 10, label: '10s', speed: 'Extended' },
            ].map((dur) => (
              <button
                key={dur.sec}
                type="button"
                onClick={() => onUpdateSetting('clipSeconds', dur.sec)}
                className={`p-2 rounded-xl border-2 border-black text-center transition-all flex flex-col items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  settings.clipSeconds === dur.sec
                    ? 'bg-neo-yellow text-black font-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
                }`}
              >
                <span className="text-xs font-black leading-none">{dur.label}</span>
                <span className="text-[10px] uppercase font-bold text-neutral-600 mt-0.5 leading-none">
                  {dur.speed}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chaos Mode Card (4 cols) */}
        <div className="md:col-span-4 flex items-center">
          <label
            htmlFor="chaos-mode-toggle"
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-neo-yellow-light/60 hover:bg-neo-yellow-light border-2 border-black shadow-neo-sm cursor-pointer transition-all"
          >
            <div className="pr-3">
              <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-neo-orange fill-current" /> Chaos Modifiers
              </span>
              <span className="text-[11px] font-medium text-neutral-700 block mt-0.5 leading-snug">
                Double points, 8s lightning rounds & sudden death.
              </span>
            </div>
            <input
              type="checkbox"
              id="chaos-mode-toggle"
              checked={settings.chaosMode}
              onChange={(e) => onUpdateSetting('chaosMode', e.target.checked)}
              className="w-5 h-5 cursor-pointer accent-black shrink-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
