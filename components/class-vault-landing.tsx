"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Trash2,
  BookOpen,
  FileText,
  Check,
  Menu,
  X,
  Compass,
  Cpu,
  Layers,
  Award
} from "lucide-react";

// Definitions of module types for ClassVault study deck (Japanese Minimalism color theme)
interface StudyModuleType {
  id: string;
  name: string;
  studyTime: number; // hours of prep
  fileSize: number; // MB
  coverage: number; // % syllabus covered
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  jpName: string;
}

const STUDY_MODULES_CATALOG: Record<string, StudyModuleType> = {
  pyq: {
    id: "pyq",
    name: "PAST EXAMS (PYQ)",
    studyTime: 3.5,
    fileSize: 4.2,
    coverage: 15,
    color: "#E5A99E", // Sakura Pink / Soft Clay
    bgColor: "bg-[#E5A99E]",
    textColor: "text-[#2C2B29]",
    description: "Previous-year solved papers with model answers.",
    jpName: "過去問",
  },
  notes: {
    id: "notes",
    name: "PEER STUDY GUIDE",
    studyTime: 2.0,
    fileSize: 8.5,
    coverage: 12,
    color: "#D5C0A0", // Linen / Sand Oak
    bgColor: "bg-[#D5C0A0]",
    textColor: "text-[#2C2B29]",
    description: "Vetted peer-annotated chapter summaries.",
    jpName: "手引き",
  },
  lab: {
    id: "lab",
    name: "LAB CODE MANUAL",
    studyTime: 2.5,
    fileSize: 12.0,
    coverage: 10,
    color: "#A3B4A2", // Moss Matcha Green
    bgColor: "bg-[#A3B4A2]",
    textColor: "text-[#2C2B29]",
    description: "Lab manual codes, syntax trees, and test specs.",
    jpName: "実験書",
  },
  slides: {
    id: "slides",
    name: "LECTURE SLIDES",
    studyTime: 3.0,
    fileSize: 15.6,
    coverage: 8,
    color: "#B8C5D0", // Slate Sky Blue
    bgColor: "bg-[#B8C5D0]",
    textColor: "text-[#2C2B29]",
    description: "Official slide decks stripped for quick reading.",
    jpName: "講義録",
  },
  cheatsheet: {
    id: "cheatsheet",
    name: "ZEN CHEAT SHEET",
    studyTime: 1.0,
    fileSize: 1.2,
    coverage: 5,
    color: "#9D9795", // Pebble Gray
    bgColor: "bg-[#9D9795]",
    textColor: "text-[#FAF8F5]",
    description: "1-page compressed cheatsheet with core formulas.",
    jpName: "要約紙",
  },
};

const PRESETS = [
  {
    name: "END-SEM SPRINT",
    jpName: "期末の追い込み",
    description: "High-coverage prep focusing on PYQs and formula sheets.",
    modules: ["pyq", "pyq", "notes", "notes", "cheatsheet", "cheatsheet", "", "", ""],
  },
  {
    name: "LAB VIVA READY",
    jpName: "実験の準備",
    description: "Matcha-themed prep covering code files and guides.",
    modules: ["lab", "lab", "lab", "notes", "cheatsheet", "", "", "", ""],
  },
  {
    name: "MID-SEM BRIEF",
    jpName: "中間の復習",
    description: "Lightweight slide review and handwritten summaries.",
    modules: ["notes", "notes", "slides", "slides", "pyq", "", "", "", ""],
  },
  {
    name: "ZEN HARMONY",
    jpName: "調和の束",
    description: "Symmetrical coverage across all resource formats.",
    modules: ["pyq", "notes", "lab", "slides", "cheatsheet", "pyq", "notes", "lab", "slides"],
  },
];

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function ClassVaultLanding() {
  const BASE_COVERAGE = 15;
  const BASE_TIME = 2;
  const [grid, setGrid] = useState<string[]>(Array(9).fill("")); // 3x3 tray
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Compute stats
  const activeModulesCount = useMemo(() => grid.filter(Boolean).length, [grid]);
  
  const totalStudyTime = useMemo(() => {
    return BASE_TIME + grid.reduce((sum, item) => sum + (STUDY_MODULES_CATALOG[item]?.studyTime || 0), 0);
  }, [grid]);

  const totalFileSize = useMemo(() => {
    return grid.reduce((sum, item) => sum + (STUDY_MODULES_CATALOG[item]?.fileSize || 0), 0);
  }, [grid]);

  const syllabusCoverage = useMemo(() => {
    const raw = BASE_COVERAGE + grid.reduce((sum, item) => sum + (STUDY_MODULES_CATALOG[item]?.coverage || 0), 0);
    return Math.min(raw, 100);
  }, [grid]);

  // Actions
  const addModuleToNextEmpty = useCallback((type: string) => {
    setGrid((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((item) => item === "");
      if (emptyIndex !== -1) {
        next[emptyIndex] = type;
        setActivePreset(null);
      }
      return next;
    });
  }, []);

  const removeModuleAt = useCallback((index: number) => {
    setGrid((prev) => {
      const next = [...prev];
      next[index] = "";
      setActivePreset(null);
      return next;
    });
  }, []);

  const loadPreset = useCallback((presetModules: string[], name: string) => {
    setGrid([...presetModules]);
    setActivePreset(name);
  }, []);

  const clearGrid = useCallback(() => {
    setGrid(Array(9).fill(""));
    setActivePreset(null);
  }, []);

  // Handle water ripple click
  const handleGardenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1800);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF8F5] font-sans text-[#2C2B29] antialiased selection:bg-[#A3B4A2]/40">
      
      {/* FLOATING HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#2C2B29]/5 bg-[#FAF8F5]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-8">
          
          {/* Logo badge */}
          <div className="flex items-center gap-3 select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8F9779] text-xs font-black text-[#FAF8F5]" aria-hidden="true">
              蔵
            </div>
            <span className="text-base font-extrabold tracking-widest text-[#2C2B29] uppercase">CLASSVAULT</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center justify-center gap-10 text-[11px] font-bold tracking-widest text-[#2C2B29]/60 md:flex">
            <a href="#tray" className="hover:text-[#8F9779] transition-colors duration-300">01 / TRAY</a>
            <a href="#philosophy" className="hover:text-[#8F9779] transition-colors duration-300">02 / PHILOSOPHY</a>
            <a href="#specs" className="hover:text-[#8F9779] transition-colors duration-300">03 / BLUEPRINT</a>
            <a href="#examples" className="hover:text-[#8F9779] transition-colors duration-300">04 / ARCHIVE</a>
          </nav>

          {/* CTA / Open App */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/app"
              className="rounded-full bg-[#2C2B29] px-6 py-2.5 text-xs font-bold tracking-wider text-[#FAF8F5] hover:bg-[#8F9779] hover:text-[#FAF8F5] transition-all duration-500 ease-out shadow-sm"
            >
              ENTER VAULT
            </Link>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2C2B29]/10 text-[#2C2B29] hover:bg-stone-100 transition-colors md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="border-t border-[#2C2B29]/5 bg-[#FAF8F5] px-6 py-6 md:hidden">
            <nav className="flex flex-col gap-5 text-xs font-bold tracking-widest text-[#2C2B29]/70">
              <a href="#tray" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8F9779]">01 / TRAY</a>
              <a href="#philosophy" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8F9779]">02 / PHILOSOPHY</a>
              <a href="#specs" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8F9779]">03 / BLUEPRINT</a>
              <a href="#examples" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8F9779]">04 / ARCHIVE</a>
              <Link
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 w-fit rounded-full bg-[#8F9779] px-6 py-3 text-center text-xs font-bold tracking-wider text-[#FAF8F5]"
              >
                ENTER VAULT
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ZEN HERO SECTION */}
      <section className="relative px-6 py-24 sm:py-32 md:px-8 max-w-6xl mx-auto">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8F9779]/20 bg-[#8F9779]/10 px-4 py-1 text-[10px] font-bold tracking-widest text-[#8F9779] uppercase mb-8">
              <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '8s' }} />
              A sanctuary for studies
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-[#2C2B29] sm:text-6xl lg:text-7xl leading-tight">
              Knowledge flows<br />
              like water<span className="text-[#8F9779]">.</span>
            </h1>
            <p className="mt-2 text-sm italic font-medium text-stone-400 select-none">
              静かな心、深まる学び — Quiet mind, deep learning.
            </p>

            <p className="mt-8 max-w-xl text-[14px] leading-relaxed text-[#2C2B29]/70 font-medium">
              Stop chasing broken links and messy zip files. ClassVault brings previous exams, 
              handwritten notes, slide decks, and code manuals into a single, clean workspace. 
              Eliminate digital noise. Study in absolute peace.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#tray"
                className="rounded-full bg-[#2C2B29] text-[#FAF8F5] font-bold text-xs tracking-wider px-8 py-3.5 hover:bg-[#8F9779] hover:text-[#FAF8F5] transition-all duration-500 ease-out shadow-sm"
              >
                RAKE REVISION DECK
              </a>
              <Link
                href="/app"
                className="rounded-full border border-[#2C2B29]/10 bg-transparent text-[#2C2B29] font-bold text-xs tracking-wider px-8 py-3.5 hover:bg-[#2C2B29] hover:text-[#FAF8F5] hover:border-[#2C2B29] transition-all duration-500 ease-out"
              >
                OPEN ARCHIVE
              </Link>
            </div>
          </div>

          {/* Hero interactive Zen garden box */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              onClick={handleGardenClick}
              className="raked-sand-bg relative w-full max-w-[360px] aspect-square rounded-[2rem] border border-[#2C2B29]/10 p-6 flex flex-col justify-between cursor-pointer select-none animate-zen-float shadow-sm overflow-hidden"
              title="Click to ripple the raked sand"
            >
              {/* Animated Ripples */}
              {ripples.map((ripple) => (
                <div
                  key={ripple.id}
                  className="animate-zen-ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: 12,
                    height: 12,
                    marginLeft: -6,
                    marginTop: -6,
                  }}
                />
              ))}

              <div className="flex justify-between border-b border-[#2C2B29]/10 pb-4 text-[9px] font-bold tracking-widest text-[#2C2B29]/40">
                <span>ZEN GARDEN MODEL</span>
                <span>蔵 ARCHIVE v1</span>
              </div>

              {/* Graphic Stones inside Garden */}
              <div className="relative flex-1 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full border border-dashed border-[#2C2B29]/15 relative flex items-center justify-center animate-zen-pulse">
                  
                  {/* Sakura Stone */}
                  <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-[#E5A99E]/90 border border-[#2C2B29]/10 flex flex-col justify-center items-center p-2 transform -translate-x-1 translate-y-1 hover:scale-105 transition-all duration-500">
                    <span className="text-[7px] font-black text-[#2C2B29]/40 tracking-wider">PYQ</span>
                    <span className="text-[9px] font-extrabold text-[#2C2B29] mt-0.5">過去問</span>
                  </div>

                  {/* Matcha Stone */}
                  <div className="absolute bottom-6 right-6 w-24 h-24 rounded-[3rem] bg-[#A3B4A2]/90 border border-[#2C2B29]/10 flex flex-col justify-center items-center p-2 transform translate-x-2 -translate-y-1 hover:scale-105 transition-all duration-500">
                    <span className="text-[7px] font-black text-[#2C2B29]/40 tracking-wider">LAB MANUAL</span>
                    <span className="text-[10px] font-extrabold text-[#2C2B29] mt-0.5">実験書</span>
                  </div>

                  {/* Center focus pebble */}
                  <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#2C2B29]/15 flex items-center justify-center shadow-inner">
                    <div className="h-2 w-2 rounded-full bg-[#8F9779] animate-ping"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#2C2B29]/10 pt-4 text-[9px] font-bold text-[#2C2B29]/40">
                <span>CLICK TO INTERACT</span>
                <span>MA (NEGATIVE SPACE)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ZEN CONFIGURATOR SECTION */}
      <section id="tray" className="border-t border-[#2C2B29]/5 bg-[#FAF8F5] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          
          {/* Header intro */}
          <div className="max-w-2xl mb-16">
            <span className="text-[10px] font-bold tracking-widest text-[#8F9779] uppercase block mb-3">Interactive Workspace</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#2C2B29] sm:text-4xl uppercase">
              The Revision Tray
            </h2>
            <p className="mt-4 text-xs sm:text-sm font-medium leading-relaxed text-[#2C2B29]/60">
              Select study presets or manually gather resources into your tray. Watch the stats flow smoothly into a state of structural balance.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-12">
            
            {/* Catalog & Presets */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* Presets */}
              <div>
                <span className="text-[9px] font-extrabold tracking-widest text-[#2C2B29]/40 uppercase block mb-3">Syllabus Presets</span>
                <div className="grid gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => loadPreset(preset.modules, preset.name)}
                      className={`text-left px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        activePreset === preset.name
                          ? "bg-[#2C2B29] border-[#2C2B29] text-[#FAF8F5]"
                          : "bg-[#FAF8F5] border-[#2C2B29]/10 text-[#2C2B29] hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold tracking-wider">{preset.name}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                          activePreset === preset.name ? "bg-[#FAF8F5]/10 text-white" : "bg-[#8F9779]/10 text-[#8F9779]"
                        }`}>{preset.jpName}</span>
                      </div>
                      <p className={`mt-1.5 text-[9px] ${activePreset === preset.name ? "text-[#FAF8F5]/60" : "text-[#2C2B29]/50"}`}>
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* River Stones Catalog */}
              <div>
                <span className="text-[9px] font-extrabold tracking-widest text-[#2C2B29]/40 uppercase block mb-3">Study Stones (Click to add)</span>
                <div className="flex flex-col gap-2">
                  {Object.values(STUDY_MODULES_CATALOG).map((module) => (
                    <button
                      key={module.id}
                      onClick={() => addModuleToNextEmpty(module.id)}
                      disabled={activeModulesCount >= 9}
                      className={`flex items-center justify-between px-4 py-3 rounded-full border border-[#2C2B29]/10 text-left transition-all duration-300 ${
                        activeModulesCount >= 9
                          ? "opacity-40 cursor-not-allowed"
                          : "bg-[#FAF8F5] hover:bg-stone-50 hover:border-[#2C2B29]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-3.5 w-3.5 rounded-full ${module.bgColor}`}></span>
                        <div>
                          <span className="text-xs font-bold tracking-wider block leading-none">{module.name}</span>
                          <span className="text-[9px] text-stone-400 mt-1 block font-medium">{module.jpName} · {module.description}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#8F9779]">+{module.coverage}%</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear tray button */}
              {activeModulesCount > 0 && (
                <button
                  onClick={clearGrid}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-dashed border-[#E03C31]/40 text-[#E03C31] text-xs font-bold py-3 hover:bg-[#E03C31]/5 transition-colors duration-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> CLEAR WORKSPACE
                </button>
              )}
            </div>

            {/* Configurator 3x3 tray */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center bg-stone-50/50 rounded-3xl border border-[#2C2B29]/5 p-8 sm:p-12 relative overflow-hidden">
              <span className="text-[10px] font-extrabold tracking-widest text-[#2C2B29]/40 mb-6">STUDY TRAY (調和)</span>
              
              {/* Tray frame container */}
              <div className="raked-sand-bg w-full max-w-[280px] aspect-square rounded-[2rem] border-2 border-[#2C2B29]/10 p-4 grid grid-cols-3 grid-rows-3 gap-3 shadow-sm relative">
                {grid.map((moduleId, index) => {
                  const module = STUDY_MODULES_CATALOG[moduleId];
                  return (
                    <div
                      key={index}
                      onClick={() => module && removeModuleAt(index)}
                      className={`relative aspect-square rounded-full flex flex-col justify-center items-center select-none transition-all duration-300 ${
                        module 
                          ? `${module.bgColor} ${module.textColor} border border-[#2C2B29]/10 cursor-pointer hover:scale-105 active:scale-95 shadow-sm` 
                          : "bg-[#FAF8F5]/80 border border-[#2C2B29]/5 border-dashed"
                      }`}
                      title={module ? `Click to remove ${module.name}` : undefined}
                    >
                      {module ? (
                        <>
                          <span className="text-[7px] opacity-65 font-black uppercase tracking-widest">{module.id}</span>
                          <span className="text-[8px] font-bold leading-none mt-0.5">{module.jpName}</span>
                        </>
                      ) : (
                        <span className="text-[8px] text-stone-300 font-bold">{index + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-[10px] text-[#2C2B29]/40 font-bold uppercase tracking-wider text-center">
                {activeModulesCount} of 9 tray slots active
              </p>
            </div>

            {/* Stats list panel */}
            <div className="lg:col-span-3 flex flex-col justify-between rounded-3xl border border-[#2C2B29]/10 bg-[#2C2B29] text-[#FAF8F5] p-6 md:p-8">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8F9779] uppercase block mb-4">Mindfulness Specs</span>
                
                <div className="space-y-6">
                  {/* Syllabus coverage */}
                  <div className="border-b border-[#FAF8F5]/10 pb-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-[#FAF8F5]/60 uppercase tracking-widest">Syllabus Covered</span>
                      <span className="text-2xl font-black">{syllabusCoverage}%</span>
                    </div>
                    <div className="mt-2.5 w-full h-[3px] rounded-full bg-[#FAF8F5]/10 overflow-hidden">
                      <div className="h-full bg-[#A3B4A2] transition-all duration-700 ease-out" style={{ width: `${syllabusCoverage}%` }}></div>
                    </div>
                  </div>

                  {/* Study Time */}
                  <div className="border-b border-[#FAF8F5]/10 pb-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-[#FAF8F5]/60 uppercase tracking-widest">Est. Prep Time</span>
                      <span className="text-2xl font-black">{totalStudyTime.toFixed(1)} hrs</span>
                    </div>
                    <div className="mt-2.5 w-full h-[3px] rounded-full bg-[#FAF8F5]/10 overflow-hidden">
                      <div className="h-full bg-[#D5C0A0] transition-all duration-700 ease-out" style={{ width: `${Math.min((totalStudyTime / 30) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* File sizes */}
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-[#FAF8F5]/60 uppercase tracking-widest">Deck Volume</span>
                      <span className="text-2xl font-black">{totalFileSize.toFixed(1)} MB</span>
                    </div>
                    <p className="mt-1 text-[9px] text-[#FAF8F5]/40 font-bold uppercase tracking-wider">
                      Optimized by ClassVault CDN
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/app"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#FAF8F5] text-[#2C2B29] text-xs font-bold py-3.5 hover:bg-[#8F9779] hover:text-[#FAF8F5] transition-colors duration-300"
                >
                  SAVE DECK & ENTER
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ZEN PRINCIPLES (WABI-SABI, MA, KANSO) */}
      <section id="philosophy" className="border-t border-[#2C2B29]/5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          
          <div className="grid gap-16 md:grid-cols-3">
            
            {/* Ma (Negative space) */}
            <div className="flex flex-col justify-between min-h-[260px] p-6 rounded-3xl bg-stone-50 border border-[#2C2B29]/5">
              <div>
                <span className="text-xs font-extrabold text-[#8F9779] block mb-6">間 / MA</span>
                <h3 className="text-2xl font-extrabold tracking-tight">Negative Space.</h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#2C2B29]/60 mt-4">
                  Zero banners, zero ads, zero distraction. ClassVault removes digital noise to help you find pure mental clarity during intensive revision sessions.
                </p>
              </div>
              <div className="h-6 w-6 rounded-full bg-[#FAF8F5] border border-[#2C2B29]/10 mt-6 shadow-inner flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#8F9779]"></div>
              </div>
            </div>

            {/* Kanso (Simplicity) */}
            <div className="flex flex-col justify-between min-h-[260px] p-6 rounded-3xl bg-stone-50 border border-[#2C2B29]/5">
              <div>
                <span className="text-xs font-extrabold text-[#D5C0A0] block mb-6">簡素 / KANSO</span>
                <h3 className="text-2xl font-extrabold tracking-tight">Pure Simplification.</h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#2C2B29]/60 mt-4">
                  Flat structural navigation. Skip directory drills. Search parameters allow you to call up PYQs, cheat sheets, and codes instantly in a single grid layout.
                </p>
              </div>
              <div className="h-6 w-6 rounded-full bg-[#FAF8F5] border border-[#2C2B29]/10 mt-6 shadow-inner flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D5C0A0]"></div>
              </div>
            </div>

            {/* Wabi-Sabi */}
            <div className="flex flex-col justify-between min-h-[260px] p-6 rounded-3xl bg-stone-50 border border-[#2C2B29]/5">
              <div>
                <span className="text-xs font-extrabold text-[#E5A99E] block mb-6">侘寂 / WABI-SABI</span>
                <h3 className="text-2xl font-extrabold tracking-tight">Peer Annotation.</h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#2C2B29]/60 mt-4">
                  Beautifully organic. ClassVault operates on student-moderated updates. Vetted peer ratings, handwritten annotations, and notes adapt over time.
                </p>
              </div>
              <div className="h-6 w-6 rounded-full bg-[#FAF8F5] border border-[#2C2B29]/10 mt-6 shadow-inner flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#E5A99E]"></div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* TECH BLUEPRINT SECTION */}
      <section id="specs" className="border-t border-[#2C2B29]/5 bg-stone-50/50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            
            {/* Tech details intro */}
            <div className="lg:col-span-4 flex flex-col justify-between pr-8 border-b border-[#2C2B29]/10 lg:border-b-0 lg:border-r border-[#2C2B29]/10 pb-8 lg:pb-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-stone-400 block mb-3 uppercase">Architecture Specs</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#2C2B29] sm:text-4xl uppercase">
                  Technical Architecture
                </h2>
                <p className="mt-4 text-xs sm:text-sm font-medium leading-relaxed text-[#2C2B29]/60">
                  Built on structured key-value index catalogs, delivering high-speed search responses for database operations.
                </p>
              </div>
              <div className="mt-8 rounded-2xl border border-[#2C2B29]/10 bg-[#FAF8F5] p-5 font-mono text-[10px] text-stone-400 leading-normal">
                INDEX SYSTEM: PostgreSQL DB<br />
                AUTHENTICATION: Supabase Auth<br />
                QUERY ENGINE: Prisma Client
              </div>
            </div>

            {/* Specifications Details Grid */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-8">
              
              <div>
                <span className="text-[10px] font-bold text-[#E5A99E] block mb-2 uppercase">METADATA SCHEMA</span>
                <h4 className="text-base font-bold uppercase mb-2">Structured Indexing</h4>
                <p className="text-xs leading-relaxed text-[#2C2B29]/60">
                  Every study guide and exam manual is indexed using attributes for Semester, Course Code, Topic Unit, and File Type.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8F9779] block mb-2 uppercase">INDEX PIPELINE</span>
                <h4 className="text-base font-bold uppercase mb-2">Fuzzy Filtering</h4>
                <p className="text-xs leading-relaxed text-[#2C2B29]/60">
                  A high-speed filtering bus matches partial query parameters (e.g. course code or topic tags) dynamically in-browser.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#D5C0A0] block mb-2 uppercase">CONTRIBUTION SYSTEM</span>
                <h4 className="text-base font-bold uppercase mb-2">Moderated Updates</h4>
                <p className="text-xs leading-relaxed text-[#2C2B29]/60">
                  Draft uploads undergo local validations and client parsing before publication to prevent broken indexing.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#B8C5D0] block mb-2 uppercase">DELIVERY EDGE</span>
                <h4 className="text-base font-bold uppercase mb-2">Instant Fetch CDN</h4>
                <p className="text-xs leading-relaxed text-[#2C2B29]/60">
                  Resources download directly with clean standardized naming schemas, ensuring file preservation across systems.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* TYPICAL VAULTS / DIRECTORY */}
      <section id="examples" className="border-t border-[#2C2B29]/5 py-24 sm:py-32">
        
        {/* Header Title */}
        <div className="mx-auto max-w-6xl px-6 md:px-8 border-b border-[#2C2B29]/10 pb-8 mb-12">
          <span className="text-[10px] font-bold tracking-widest text-[#8F9779] uppercase block mb-3">Syllabus Categories</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#2C2B29] sm:text-4xl uppercase">
            Typical Course Archives
          </h2>
        </div>

        {/* Directory cards */}
        <div className="mx-auto max-w-6xl px-6 md:px-8 grid gap-6 sm:grid-cols-3">
          
          <div className="zen-card p-6 flex flex-col justify-between min-h-[240px] hover:bg-stone-50">
            <div>
              <div className="rounded-full bg-[#E5A99E]/10 border border-[#E5A99E]/20 text-[#2C2B29] px-3.5 py-1 text-[9px] font-bold tracking-wider w-fit mb-6">CS303 / ALGORITHMS</div>
              <h4 className="text-lg font-bold uppercase mb-2 leading-snug">Design & Analysis</h4>
              <p className="text-xs text-[#2C2B29]/60 leading-relaxed">
                Asymptotic complexity sheets, DP paradigms, algorithm templates, and handwritten exam solutions.
              </p>
            </div>
            <Link href="/app" className="mt-6 flex items-center text-xs font-bold text-[#8F9779] gap-1 hover:underline">
              Enter Vault <Check className="h-3 w-3" />
            </Link>
          </div>

          <div className="zen-card p-6 flex flex-col justify-between min-h-[240px] hover:bg-stone-50">
            <div>
              <div className="rounded-full bg-[#A3B4A2]/10 border border-[#A3B4A2]/20 text-[#2C2B29] px-3.5 py-1 text-[9px] font-bold tracking-wider w-fit mb-6">CS304 / DATABASES</div>
              <h4 className="text-lg font-bold uppercase mb-2 leading-snug">Database Management</h4>
              <p className="text-xs text-[#2C2B29]/60 leading-relaxed">
                Normalization cheatsheets, SQL transaction logs, ER diagrams, and previous semester viva prep manuals.
              </p>
            </div>
            <Link href="/app" className="mt-6 flex items-center text-xs font-bold text-[#8F9779] gap-1 hover:underline">
              Enter Vault <Check className="h-3 w-3" />
            </Link>
          </div>

          <div className="zen-card p-6 flex flex-col justify-between min-h-[240px] hover:bg-stone-50">
            <div>
              <div className="rounded-full bg-[#B8C5D0]/10 border border-[#B8C5D0]/20 text-[#2C2B29] px-3.5 py-1 text-[9px] font-bold tracking-wider w-fit mb-6">CS305 / NETWORKS</div>
              <h4 className="text-lg font-bold uppercase mb-2 leading-snug">Computer Networks</h4>
              <p className="text-xs text-[#2C2B29]/60 leading-relaxed">
                OSI layer guides, socket programming files, subnetting numerical sheets, and peer-written lecture review slides.
              </p>
            </div>
            <Link href="/app" className="mt-6 flex items-center text-xs font-bold text-[#8F9779] gap-1 hover:underline">
              Enter Vault <Check className="h-3 w-3" />
            </Link>
          </div>

        </div>
      </section>

      {/* ZEN CALL TO ACTION */}
      <section className="border-t border-[#2C2B29]/5 bg-stone-50 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 md:px-8 text-center flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-widest text-[#8F9779] uppercase block mb-3">Join the sanctuary</span>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl uppercase leading-none">
            Find peace in prep.
          </h2>
          <p className="mt-6 max-w-lg text-[13px] leading-relaxed text-[#2C2B29]/60 font-medium">
            Register your university email to claim your digital revision desk. Contributed study decks, zero-distraction layout, and peer support.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="mt-10 w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="e.g. arjun@university.edu"
              required
              className="flex-1 rounded-full border border-[#2C2B29]/10 bg-[#FAF8F5] px-5 py-3.5 text-xs font-medium text-[#2C2B29] placeholder-stone-400 outline-none focus:border-[#8F9779] transition-all duration-300"
            />
            <button
              type="submit"
              className="rounded-full bg-[#2C2B29] px-8 py-3.5 text-xs font-bold tracking-wider text-[#FAF8F5] hover:bg-[#8F9779] transition-all duration-500 ease-out shadow-sm"
            >
              CREATE FREE DESK
            </button>
          </form>

          <p className="mt-4 text-[9px] text-stone-400 font-bold uppercase tracking-wider select-none">
            NO ADVERTISEMENTS · NO FEES · PEER ARCHIVED
          </p>
        </div>
      </section>

      {/* ZEN FOOTER */}
      <footer className="border-t border-[#2C2B29]/5 bg-[#FAF8F5] py-12 text-center text-[10px] text-stone-400 font-bold tracking-widest uppercase select-none">
        <div className="mx-auto max-w-6xl px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>© 2026 CLASSVAULT INC. ALL RIGHTS PRESERVED.</span>
          <div className="flex gap-6">
            <a href="#tray" className="hover:text-[#2C2B29]">WORKSPACE</a>
            <a href="#philosophy" className="hover:text-[#2C2B29]">ZEN PHILOSOPHY</a>
            <a href="#specs" className="hover:text-[#2C2B29]">SPECS</a>
            <a href="/app" className="hover:text-[#2C2B29]">DASHBOARD</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
