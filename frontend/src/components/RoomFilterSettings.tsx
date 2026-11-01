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

  // Non-Host View
  if (!isHost) {
    return (
      <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-black stroke-[2.5]" />
            <h3 className="font-black text-sm uppercase text-black">Room Playlist Rules</h3>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-neo-yellow text-black border border-black shadow-neo-sm">
            Host Rules
          </span>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-neutral-600 flex items-center gap-1">
            <Film className="w-3.5 h-3.5" /> Music Type:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {isAllCategories ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 text-black border border-black">
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

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-neutral-600 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" /> Languages:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {isAllLanguages ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 text-black border border-black">
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

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-neutral-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Eras:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {isAllEras ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 text-black border border-black">
                All Eras (70s to 2020s)
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

        <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-bold uppercase text-black">
          <span>{settings.roundCount} Rounds • {settings.clipSeconds}s Clip</span>
          {settings.chaosMode && (
            <span className="font-black text-black bg-neo-orange px-2 py-0.5 rounded border border-black flex items-center gap-1 shadow-neo-sm">
              <Flame className="w-3.5 h-3.5 fill-current" /> Chaos Active
            </span>
          )}
        </div>
      </div>
    );
  }

  // Interactive View for Host
  return (
    <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo space-y-5">
      {/* Header with Live Match Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-black">
        <div>
          <h3 className="font-black text-sm uppercase text-black flex items-center gap-2">
            <Film className="w-4 h-4 stroke-[2.5]" /> Song Style & Era Filters
          </h3>
          <p className="text-[11px] font-medium text-neutral-600 mt-0.5">
            Choose what type of music your players will guess.
          </p>
        </div>

        {/* Live track pool counter pill */}
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-black shadow-neo-sm transition-all ${
            matchingCount > 0
              ? 'bg-neo-green text-black'
              : 'bg-neo-pink text-white animate-pulse'
          }`}
          title="Number of catalog songs matching your selected filters"
        >
          {matchingCount > 0 ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{matchingCount} SONGS READY</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>0 MATCHES! BROADEN</span>
            </>
          )}
        </span>
      </div>

      {/* QUICK 1-CLICK PRESETS */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
          ⚡ Quick Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('all')}
            className={`p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all ${
              isPresetAll
                ? 'bg-neo-yellow text-black shadow-neo font-black'
                : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
            }`}
          >
            <span className="text-xs font-black flex items-center gap-1 uppercase">
              🌟 All-Time Mix
            </span>
            <span className="text-[10px] text-neutral-600 font-medium mt-0.5">
              Bollywood + Hollywood
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('bollywood')}
            className={`p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all ${
              isPresetBollywood
                ? 'bg-neo-yellow text-black shadow-neo font-black'
                : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
            }`}
          >
            <span className="text-xs font-black flex items-center gap-1 uppercase">
              🎬 Bollywood Hits
            </span>
            <span className="text-[10px] text-neutral-600 font-medium mt-0.5">
              Hindi Cinema Only
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('hollywood')}
            className={`p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all ${
              isPresetHollywood
                ? 'bg-neo-yellow text-black shadow-neo font-black'
                : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
            }`}
          >
            <span className="text-xs font-black flex items-center gap-1 uppercase">
              🌎 Hollywood Pop
            </span>
            <span className="text-[10px] text-neutral-600 font-medium mt-0.5">
              English Chartbusters
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('retro')}
            className={`p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all ${
              isPresetRetro
                ? 'bg-neo-orange text-black shadow-neo font-black'
                : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
            }`}
          >
            <span className="text-xs font-black flex items-center gap-1 uppercase">
              📻 Golden Retro
            </span>
            <span className="text-[10px] text-neutral-600 font-medium mt-0.5">
              70s, 80s & 90s Classics
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('modern')}
            className={`p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all ${
              isPresetModern
                ? 'bg-neo-cyan text-black shadow-neo font-black'
                : 'bg-white hover:bg-neutral-50 text-black shadow-neo-sm'
            }`}
          >
            <span className="text-xs font-black flex items-center gap-1 uppercase">
              🚀 2010s & 2020s
            </span>
            <span className="text-[10px] text-neutral-600 font-medium mt-0.5">
              Modern Streaming Hits
            </span>
          </button>
        </div>
      </div>

      {/* 1. MUSIC TYPE SELECTION */}
      <div className="pt-3 border-t-2 border-black">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 stroke-[2.5]" /> Industry / Category
          </label>
          <button
            type="button"
            onClick={() => onUpdateSetting('categories', [])}
            className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border border-black transition-colors ${
              isAllCategories
                ? 'bg-neo-yellow text-black font-black shadow-neo-sm'
                : 'bg-neutral-100 text-neutral-700 hover:text-black'
            }`}
          >
            All Types
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'Bollywood', label: '🎬 Bollywood', desc: 'Hindi cinema songs' },
            { id: 'Hollywood', label: '🌎 Hollywood', desc: 'Western hits & pop' },
            { id: 'Indie', label: '🎸 Indie / Alt', desc: 'Indie & rock' },
          ].map((cat) => {
            const isSelected = settings.categories?.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleArrayItem('categories', cat.id)}
                className={`p-2.5 rounded-xl border-2 border-black text-left transition-all ${
                  isSelected
                    ? 'bg-neo-yellow text-black font-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{cat.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3] shrink-0" />}
                </div>
                <span className="text-[10px] text-neutral-600 block mt-0.5">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. LANGUAGE SELECTION */}
      <div className="pt-3 border-t-2 border-black">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 stroke-[2.5]" /> Languages
          </label>
          <button
            type="button"
            onClick={() => onUpdateSetting('languages', [])}
            className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border border-black transition-colors ${
              isAllLanguages
                ? 'bg-neo-cyan text-black font-black shadow-neo-sm'
                : 'bg-neutral-100 text-neutral-700 hover:text-black'
            }`}
          >
            All Languages
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'Hindi', label: '🇮🇳 Hindi' },
            { id: 'English', label: '🇬🇧 English' },
            { id: 'Regional', label: '🌐 Regional / Other' },
          ].map((lang) => {
            const isSelected = settings.languages?.includes(lang.id);
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => toggleArrayItem('languages', lang.id)}
                className={`px-3.5 py-1.5 rounded-full border-2 border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isSelected
                    ? 'bg-neo-cyan text-black'
                    : 'bg-white hover:bg-neutral-50 text-black'
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && <Check className="w-3 h-3 text-black stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ERA / TIMELINE SELECTION */}
      <div className="pt-3 border-t-2 border-black">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 stroke-[2.5]" /> Era Timeline (Old vs New)
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateSetting('eras', ['1970s', '1980s', '1990s'])}
              className="text-[11px] font-bold uppercase text-black hover:bg-neo-yellow px-1.5 py-0.5 rounded border border-black"
            >
              Old (70s-90s)
            </button>
            <button
              type="button"
              onClick={() => onUpdateSetting('eras', ['2000s', '2010s', '2020s'])}
              className="text-[11px] font-bold uppercase text-black hover:bg-neo-cyan px-1.5 py-0.5 rounded border border-black"
            >
              New (2000s+)
            </button>
            <button
              type="button"
              onClick={() => onUpdateSetting('eras', [])}
              className={`text-[11px] font-black uppercase px-1.5 py-0.5 rounded border border-black ${
                isAllEras ? 'bg-neo-yellow text-black shadow-neo-sm' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                className={`p-2 rounded-xl border-2 border-black text-center transition-all ${
                  isSelected
                    ? 'bg-neo-orange text-black font-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black'
                }`}
              >
                <div className="text-xs font-black">{era.label}</div>
                <div className={`text-[9px] uppercase font-bold ${isSelected ? 'text-black' : 'text-neutral-500'}`}>
                  {era.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. GAMEPLAY SETTINGS: ROUNDS & CLIPS */}
      <div className="pt-3 border-t-2 border-black grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-black uppercase text-black mb-1.5">Number of Rounds</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[3, 5, 8, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => onUpdateSetting('roundCount', cnt)}
                className={`py-2 rounded-lg border-2 border-black text-xs font-black transition-all ${
                  settings.roundCount === cnt
                    ? 'bg-neo-yellow text-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-black uppercase text-black mb-1.5">Audio Clip Length</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { sec: 6, label: '6s (Fast)' },
              { sec: 8, label: '8s (Std)' },
              { sec: 10, label: '10s (Easy)' },
            ].map((dur) => (
              <button
                key={dur.sec}
                type="button"
                onClick={() => onUpdateSetting('clipSeconds', dur.sec)}
                className={`py-2 rounded-lg border-2 border-black text-xs font-black transition-all ${
                  settings.clipSeconds === dur.sec
                    ? 'bg-neo-yellow text-black shadow-neo-sm'
                    : 'bg-white hover:bg-neutral-50 text-black'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHAOS MODE TOGGLE */}
      <div className="pt-3 border-t-2 border-black flex items-center justify-between p-3.5 rounded-xl bg-neo-yellow-light/60 border-2 border-black shadow-neo-sm">
        <div>
          <span className="font-black text-xs uppercase text-black flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-neo-orange fill-current" /> Chaos Modifiers Active
          </span>
          <span className="text-[11px] font-medium text-neutral-700 block">
            Double points rounds, Lightning rounds, and Sudden Death showdown.
          </span>
        </div>
        <input
          type="checkbox"
          id="chaos-mode-toggle"
          checked={settings.chaosMode}
          onChange={(e) => onUpdateSetting('chaosMode', e.target.checked)}
          className="w-5 h-5 cursor-pointer accent-black"
        />
      </div>
    </div>
  );
};
