"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Maximize2,
  Trash2,
  Cpu,
  Layers,
  Sliders,
  Settings,
  Sparkles,
  Check,
  CheckSquare,
  Shield,
  HelpCircle,
  Menu,
  X,
  Search,
  BookOpen,
  FileText,
  Terminal,
  Grid
} from "lucide-react";

// Definitions of module types for ClassVault study deck
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
}

const STUDY_MODULES_CATALOG: Record<string, StudyModuleType> = {
  pyq: {
    id: "pyq",
    name: "PAST EXAM (PYQ)",
    studyTime: 3.5,
    fileSize: 4.2,
    coverage: 15,
    color: "#E03C31", // Cadmium Red
    bgColor: "bg-[#E03C31]",
    textColor: "text-white",
    description: "Solved previous-year exam papers with solutions.",
  },
  notes: {
    id: "notes",
    name: "HANDWRITTEN GUIDE",
    studyTime: 2.0,
    fileSize: 8.5,
    coverage: 12,
    color: "#FACC15", // Golden Yellow
    bgColor: "bg-[#FACC15]",
    textColor: "text-[#121212]",
    description: "Vetted peer handwritten unit notes.",
  },
  lab: {
    id: "lab",
    name: "LAB CODE MANUAL",
    studyTime: 2.5,
    fileSize: 12.0,
    coverage: 10,
    color: "#1D4ED8", // Cobalt Blue
    bgColor: "bg-[#1D4ED8]",
    textColor: "text-white",
    description: "Lab experiments, syntax guides, and wireframes.",
  },
  slides: {
    id: "slides",
    name: "LECTURE SLIDES",
    studyTime: 3.0,
    fileSize: 15.6,
    coverage: 8,
    color: "#78716c", // Stone
    bgColor: "bg-[#78716c]",
    textColor: "text-white",
    description: "Official slide decks trimmed for revision.",
  },
  cheatsheet: {
    id: "cheatsheet",
    name: "FORMULA SHEET",
    studyTime: 1.0,
    fileSize: 1.2,
    coverage: 5,
    color: "#121212", // Charcoal
    bgColor: "bg-[#121212]",
    textColor: "text-[#F5F4EF]",
    description: "1-page dense cheat sheet with core equations.",
  },
};

const PRESETS = [
  {
    name: "END-SEM SPRINT",
    description: "High-intensity cramming prep for final exam.",
    modules: ["pyq", "pyq", "notes", "notes", "cheatsheet", "cheatsheet", "", "", ""],
  },
  {
    name: "LAB VIVA READY",
    description: "Focused on experiment scripts and code blocks.",
    modules: ["lab", "lab", "lab", "notes", "cheatsheet", "", "", "", ""],
  },
  {
    name: "MID-SEM BRIEF",
    description: "Covers early units with slide reviews.",
    modules: ["notes", "notes", "slides", "slides", "pyq", "", "", "", ""],
  },
  {
    name: "COMPLETE VAULT",
    description: "Maximum coverage pack for complete confidence.",
    modules: ["pyq", "notes", "lab", "slides", "cheatsheet", "pyq", "notes", "lab", "slides"],
  },
];

export function ClassVaultLanding() {
  const BASE_COVERAGE = 15; // Base coverage from memory
  const BASE_TIME = 2; // Base setup time (hours)
  const [grid, setGrid] = useState<string[]>(Array(9).fill("")); // 3x3 grid
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hoveredCatalog, setHoveredCatalog] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F4EF] font-mono text-[#121212] antialiased selection:bg-[#E03C31] selection:text-white">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b-2 border-[#121212] bg-[#F5F4EF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:grid md:grid-cols-3 md:px-8">
          
          {/* LOGO COLUMN */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-[#E03C31] text-lg font-black text-[#F5F4EF]" aria-hidden="true">
              C
            </div>
            <span className="text-lg font-black tracking-tighter">CLASSVAULT</span>
          </div>

          {/* NAV LINKS COLUMN */}
          <nav className="hidden items-center justify-center gap-8 text-xs font-bold tracking-widest md:flex">
            <a href="#deck-builder" className="hover:text-[#E03C31] hover:underline hover:underline-offset-4">01/BUILD</a>
            <a href="#specs" className="hover:text-[#1D4ED8] hover:underline hover:underline-offset-4">02/SPECS</a>
            <a href="#principles" className="hover:text-[#FACC15] hover:underline hover:underline-offset-4">03/VALUES</a>
            <a href="#examples" className="hover:text-[#78716c] hover:underline hover:underline-offset-4">04/SUBJECTS</a>
          </nav>

          {/* CTA / MOBILE COLUMN */}
          <div className="flex items-center justify-end gap-4">
            <a
              href="/app"
              className="hidden bg-[#121212] px-5 py-2.5 text-xs font-bold tracking-widest text-[#F5F4EF] hover:bg-[#E03C31] hover:text-white transition-colors duration-200 md:block"
            >
              OPEN APP / FREE
            </a>

            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="block p-1 text-[#121212] md:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-t-2 border-[#121212] bg-[#F5F4EF] p-6 md:hidden">
            <nav className="flex flex-col gap-4 text-sm font-bold tracking-widest">
              <a href="#deck-builder" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#E03C31]">01/BUILD</a>
              <a href="#specs" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1D4ED8]">02/SPECS</a>
              <a href="#principles" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FACC15]">03/VALUES</a>
              <a href="#examples" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#78716c]">04/SUBJECTS</a>
              <a
                href="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 block w-full bg-[#121212] py-3 text-center text-xs font-bold text-[#F5F4EF]"
              >
                OPEN APP / FREE
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative border-b-2 border-[#121212] bg-[#F5F4EF]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* HERO LEFT COLUMN */}
            <div className="lg:col-span-7">
              <div className="inline-block bg-[#1D4ED8] px-3 py-1 text-xs font-bold tracking-widest text-white mb-6">
                ACADEMIC RESOURCE HUB
              </div>
              
              <h1 className="text-5xl font-black leading-[0.9] tracking-tighter text-[#121212] sm:text-7xl lg:text-8xl">
                STUDY<br />
                IS<br />
                STRUCTURE.
              </h1>

              <p className="mt-8 max-w-xl text-base font-medium leading-relaxed text-[#121212]/80">
                Stop chasing broken links in group chats. ClassVault consolidates previous-year papers, 
                lab files, slides, and peer study guides into a single search grid. 
                Zero nested folder fatigue. Form follows function.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#deck-builder"
                  className="bg-[#E03C31] text-[#F5F4EF] font-bold text-sm tracking-widest px-8 py-4 border-2 border-[#121212] hover:bg-[#F5F4EF] hover:text-[#121212] transition-all duration-200"
                >
                  ASSEMBLE STUDY DECK
                </a>
                <a
                  href="/app"
                  className="bg-transparent text-[#121212] font-bold text-sm tracking-widest px-8 py-4 border-2 border-[#121212] hover:bg-[#121212] hover:text-[#F5F4EF] transition-all duration-200"
                >
                  OPEN LIBRARY
                </a>
              </div>
            </div>

            {/* HERO RIGHT COLUMN (CSS DESIGN SCHEMATIC) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px] aspect-square border-2 border-[#121212] bg-[#F5F4EF] p-4 flex flex-col justify-between">
                
                {/* DECORATIVE GRID LINES */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-[0.03]">
                  {Array(16).fill(null).map((_, i) => (
                    <div key={i} className="border border-[#121212]"></div>
                  ))}
                </div>

                <div className="flex justify-between border-b-2 border-[#121212] pb-3 text-xs font-bold tracking-widest text-[#121212]/60">
                  <span>CLASSVAULT CORE INDEX</span>
                  <span>v1.0.0原型</span>
                </div>

                {/* GRAPHIC BLOCKS FOR EXAM STUDY TOPICS */}
                <div className="relative flex-1 flex items-center justify-center">
                  
                  <div className="w-64 h-64 border-2 border-dashed border-[#121212]/40 relative flex items-center justify-center">
                    
                    {/* RED BLOCK (PYQ) */}
                    <div className="absolute top-4 left-4 w-24 h-24 bg-[#E03C31] border-2 border-[#121212] flex flex-col justify-between p-2 transform -translate-x-2 translate-y-1 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <div className="h-10 w-10 border-2 border-[#121212] bg-[#F5F4EF]/20 flex items-center justify-center">
                        <span className="text-xs font-black text-[#121212]">Q</span>
                      </div>
                      <span className="text-[10px] font-black text-[#F5F4EF]">MOD-01 [PYQ]</span>
                    </div>

                    {/* BLUE BLOCK (LAB CODE) */}
                    <div className="absolute bottom-4 left-4 w-24 h-36 bg-[#1D4ED8] border-2 border-[#121212] flex flex-col justify-between p-2 transform translate-x-1 translate-y-3 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] font-black text-[#F5F4EF] tracking-wider uppercase">LAB CODE</span>
                      <div className="h-20 w-3 bg-[#121212] mx-auto relative flex items-center justify-center">
                        <div className="absolute w-6 h-3 bg-[#F5F4EF] border border-[#121212] top-6"></div>
                      </div>
                      <span className="text-[8px] font-bold text-[#F5F4EF]/60 text-right">MOD-03</span>
                    </div>

                    {/* YELLOW BLOCK (LECTURE NOTES) */}
                    <div className="absolute top-4 right-4 w-24 h-24 bg-[#FACC15] border-2 border-[#121212] flex flex-col justify-between p-2 transform translate-x-3 -translate-y-2 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[8px] font-black text-[#121212]">NOTES</span>
                      <div className="h-6 w-full bg-[#121212] text-[8px] flex items-center justify-center text-green-400 font-mono">
                        UNIT_1_VETTED
                      </div>
                      <span className="text-[8px] font-bold text-[#121212]/50">MOD-02</span>
                    </div>

                    {/* CHARCOAL KEYBLOCK (CHEAT SHEET) */}
                    <div className="absolute bottom-4 right-4 w-24 h-24 bg-[#121212] border-2 border-[#121212] flex flex-wrap gap-1 p-2 transform -translate-x-1 -translate-y-1 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      {Array(4).fill(null).map((_, i) => (
                        <div key={i} className="w-[42%] aspect-square bg-[#78716c]/30 border border-[#F5F4EF]/20 flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#F5F4EF]">F-{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t-2 border-[#121212] pt-3 text-[10px] font-black text-[#121212]">
                  <span>FORM: ACADEMIC CORE</span>
                  <span>© 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE BUILDER SECTION */}
      <section id="deck-builder" className="border-b-2 border-[#121212]">
        
        {/* INTERACTIVE BUILDER HEADER */}
        <div className="grid border-b-2 border-[#121212] lg:grid-cols-12">
          
          <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between border-b-2 border-[#121212] lg:border-b-0 lg:border-r-2 lg:border-[#121212]">
            <span className="text-xs font-bold tracking-widest text-[#E03C31] mb-2">REVISION DECK CONFIGURATOR</span>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
              01 / ASSEMBLE STUDY DECK
            </h2>
            <p className="mt-4 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/70">
              Pick a syllabus preset or add individual study modules from the catalog to populate your 3x3 study baseplate. Click items inside the grid to extract/remove them. Watch coverage and time calculations adapt instantly.
            </p>
          </div>

          <div className="lg:col-span-4 bg-[#121212] text-[#F5F4EF] p-6 md:p-8 flex flex-col justify-between">
            <span className="text-xs font-bold tracking-widest text-[#FACC15] mb-2">PREP METRICS</span>
            <div>
              <div className="flex items-baseline justify-between border-b border-[#F5F4EF]/20 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F5F4EF]/60">Syllabus Coverage</span>
                <span className="text-4xl font-black">{syllabusCoverage}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#F5F4EF]/72">
                <span>Active study items: {activeModulesCount} / 9</span>
                <span>Estimate load: {totalFileSize.toFixed(1)} MB</span>
              </div>
            </div>
            <a
              href="/app"
              className="mt-6 flex h-12 items-center justify-center bg-[#E03C31] text-[#F5F4EF] text-xs font-bold tracking-widest hover:bg-[#F5F4EF] hover:text-[#121212] hover:border hover:border-[#121212] transition-all duration-200"
            >
              LAUNCH WITH THIS DECK <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>

        </div>

        {/* BUILDER WORKSPACE */}
        <div className="grid lg:grid-cols-12">
          
          {/* PRESETS & CATALOG SIDEBAR */}
          <div className="lg:col-span-4 border-b-2 border-[#121212] lg:border-b-0 lg:border-r-2 lg:border-[#121212] p-6 md:p-8 flex flex-col gap-8 bg-[#F0EEE6]">
            
            {/* PRESETS LIST */}
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-4">A. STUDY SYLLABUS PRESETS</span>
              <div className="grid gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset.modules, preset.name)}
                    className={`text-left p-3 border-2 transition-all duration-200 ${
                      activePreset === preset.name
                        ? "bg-[#121212] text-[#F5F4EF] border-[#121212]"
                        : "bg-[#F5F4EF] text-[#121212] border-[#121212] hover:bg-[#121212]/5"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold tracking-wider">{preset.name}</span>
                      <span className="text-[9px] font-medium tracking-tight bg-[#E03C31] text-white px-1.5 py-0.5">LOAD</span>
                    </div>
                    <p className={`mt-1 text-[10px] ${activePreset === preset.name ? "text-[#F5F4EF]/70" : "text-[#121212]/60"}`}>
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* MODULE CATALOG */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50">B. STUDY MODULE CATALOG</span>
                <span className="text-[10px] font-bold text-[#E03C31]">CLICK TO ADD</span>
              </div>
              <div className="flex flex-col gap-3">
                {Object.values(STUDY_MODULES_CATALOG).map((module) => (
                  <button
                    key={module.id}
                    onClick={() => addModuleToNextEmpty(module.id)}
                    onMouseEnter={() => setHoveredCatalog(module.id)}
                    onMouseLeave={() => setHoveredCatalog(null)}
                    disabled={activeModulesCount >= 9}
                    className={`flex items-center justify-between p-3 border-2 border-[#121212] text-left transition-all duration-200 ${
                      activeModulesCount >= 9
                        ? "opacity-50 cursor-not-allowed bg-transparent"
                        : "bg-[#F5F4EF] hover:border-[#121212] hover:bg-[#121212]/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-4 w-4 border border-[#121212] ${module.bgColor}`}></span>
                      <div>
                        <span className="text-xs font-bold tracking-wider block leading-none">{module.name}</span>
                        <span className="text-[9px] text-[#121212]/60 mt-1 block font-medium">{module.description}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black">+{module.coverage}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* RESET BUTTON */}
            {activeModulesCount > 0 && (
              <button
                onClick={clearGrid}
                className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#E03C31] text-[#E03C31] text-xs font-bold py-3 hover:bg-[#E03C31]/5 transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" /> CLEAR ALL MODULES
              </button>
            )}

          </div>

          {/* ACTIVE GRID CANVAS */}
          <div className="lg:col-span-5 p-6 md:p-12 flex flex-col justify-center items-center bg-[#F5F4EF] border-b-2 border-[#121212] lg:border-b-0">
            <span className="text-xs font-bold tracking-widest text-[#121212]/50 mb-6">STUDY BOARD (3X3 COHORT)</span>
            
            {/* GRID FRAME */}
            <div className="w-full max-w-[340px] aspect-square border-4 border-[#121212] bg-[#121212] grid grid-cols-3 grid-rows-3 gap-1 shadow-[8px_8px_0px_#121212]">
              {grid.map((moduleId, index) => {
                const module = STUDY_MODULES_CATALOG[moduleId];
                return (
                  <div
                    key={index}
                    onClick={() => module && removeModuleAt(index)}
                    className={`relative aspect-square flex flex-col justify-between p-2 select-none transition-all duration-150 ${
                      module 
                        ? `${module.bgColor} ${module.textColor} border border-[#121212] cursor-pointer hover:scale-[0.97]` 
                        : "bg-[#F5F4EF] border border-[#121212]/20 border-dashed"
                    }`}
                  >
                    {module ? (
                      // RENDER DETAILED GEOMETRIC BAUHAUS LAYOUT SCHEMATIC
                      <>
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black tracking-widest">{module.id.toUpperCase()}</span>
                          <span className="text-[7px] opacity-70">U-{index + 1}</span>
                        </div>

                        {/* MODULE SPECIFIC VISUALS */}
                        <div className="flex-1 flex items-center justify-center">
                          {module.id === "pyq" && (
                            <div className="h-10 w-10 rounded-full border-2 border-[#121212] bg-white/20 flex items-center justify-center">
                              <span className="text-xs font-black text-[#121212]">?</span>
                            </div>
                          )}
                          {module.id === "notes" && (
                            <div className="w-10 h-10 border border-[#121212] bg-white/25 flex flex-col gap-1 p-1">
                              <div className="h-1 w-full bg-[#121212]/40"></div>
                              <div className="h-1 w-4/5 bg-[#121212]/40"></div>
                              <div className="h-1 w-full bg-[#121212]/40"></div>
                            </div>
                          )}
                          {module.id === "lab" && (
                            <div className="h-10 w-10 border-2 border-[#121212] bg-[#121212]/25 flex items-center justify-center font-mono font-black text-xs">
                              &gt;_
                            </div>
                          )}
                          {module.id === "slides" && (
                            <div className="w-12 h-6 border-2 border-[#121212] bg-white/10 flex items-center justify-center relative">
                              <div className="h-1 w-3 bg-[#121212]"></div>
                            </div>
                          )}
                          {module.id === "cheatsheet" && (
                            <div className="h-12 w-8 border border-white/50 bg-black/10 flex flex-wrap content-start p-1 gap-0.5">
                              {Array(6).fill(null).map((_, i) => (
                                <div key={i} className="h-1 w-1.5 bg-[#F5F4EF]/60"></div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-end">
                          <span className="text-[7px] font-bold">+{module.coverage}%</span>
                          <span className="text-[8px] font-black bg-black/10 hover:bg-black/25 px-1">REMOVE</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-bold text-[#121212]/30 uppercase tracking-widest">SLOT</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Index Sync: Active</span>
            </div>
          </div>

          {/* TELEMETRY & METRICS PANEL */}
          <div className="lg:col-span-3 border-t-2 border-[#121212] lg:border-t-0 p-6 md:p-8 flex flex-col gap-6 bg-[#F5F4EF]">
            
            {/* BUS TELEMETRY */}
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-4">C. REVISION TELEMETRY</span>
              <div className="flex flex-col border-2 border-[#121212] bg-[#F0EEE6]">
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Study Duration</span>
                  <span className="text-xs font-black text-[#121212]">{totalStudyTime.toFixed(1)} hrs</span>
                </div>
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Payload Size</span>
                  <span className="text-xs font-black text-[#121212]">{totalFileSize.toFixed(1)} MB</span>
                </div>
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Syllabus Covered</span>
                  <span className="text-xs font-black text-[#121212]">{syllabusCoverage}% / 100%</span>
                </div>
                
                <div className="flex justify-between p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Revision Index</span>
                  <span className="text-xs font-black text-[#E03C31]">{activeModulesCount > 0 ? `CLASS_OK_${activeModulesCount}x` : "STANDBY"}</span>
                </div>

              </div>
            </div>

            {/* LIVE CHECKS */}
            <div className="flex-1 flex flex-col justify-end">
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-3">INTEGRATION COMPATIBILITY</span>
              <div className="space-y-2 text-[10px] font-medium leading-relaxed text-[#121212]/70">
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Verified by peer-review cohort.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Standardized metadata tags enabled.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Indexed search and direct download active.</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* THE THREE CORE VALUES */}
      <section id="principles" className="border-b-2 border-[#121212] bg-[#F5F4EF]">
        
        {/* HEADER AREA */}
        <div className="border-b-2 border-[#121212] p-6 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-[#1D4ED8] mb-2">SYSTEM VALUES</span>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
            02 / THE PRINCIPLES OF REVISION
          </h2>
        </div>

        {/* THREE COLUMNS GRID */}
        <div className="grid md:grid-cols-3 border-t border-[#121212]">
          
          <div className="p-8 border-b-2 border-[#121212] md:border-b-0 md:border-r-2 md:border-[#121212] flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#E03C31]">01 / CLARITY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">FLAT SEARCH.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                We believe folder structures are where study guides go to die. ClassVault indexes every PDF, code file, and slide by course code, unit, and semester. Find what you need in one search command.
              </p>
            </div>
            <div className="h-8 w-8 bg-[#E03C31] mt-8 border border-[#121212]"></div>
          </div>

          <div className="p-8 border-b-2 border-[#121212] md:border-b-0 md:border-r-2 md:border-[#121212] flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#1D4ED8]">02 / MODULARITY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">CUSTOM DECKS.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                Every course is different. Assemble notes, laboratory wireframes, and formula sheets dynamically into your own quick-reference view. Download as a single package or study them directly on-screen.
              </p>
            </div>
            <div className="h-8 w-8 bg-[#1D4ED8] mt-8 border border-[#121212]"></div>
          </div>

          <div className="p-8 flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#FACC15]">03 / HONESTY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">STUDENT VETTED.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                All uploaded materials are rated, bookmarked, and peer-reviewed by active students. No paywalls, no distracting ads, no bloated PDF files. Just structural utility when the exam clock starts.
              </p>
            </div>
            <div className="h-8 w-8 bg-[#FACC15] mt-8 border border-[#121212]"></div>
          </div>

        </div>

      </section>

      {/* TECH SPECS BLUEPRINT */}
      <section id="specs" className="border-b-2 border-[#121212] bg-[#F5F4EF]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            
            {/* SPECS TEXT LEFT */}
            <div className="lg:col-span-4 flex flex-col justify-between border-b-2 border-[#121212] lg:border-b-0 lg:border-r-2 lg:border-[#121212] pb-8 lg:pb-0 lg:pr-8">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#78716c] mb-2">TECHNICAL INDEX STRUCTURE</span>
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase leading-none">
                  03 / SPECIFICATIONS
                </h2>
                <p className="mt-6 text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/85">
                  ClassVault is built around standard database architecture and dynamic routing filters. Every resource is mapped securely to guarantee quick access.
                </p>
              </div>
              <div className="mt-8 border-2 border-[#121212] bg-[#E03C31] text-[#F5F4EF] p-4 font-bold text-xs tracking-wider">
                SUPABASE AUTH, POSTGRESQL DATABASES, PRISMA CLIENT READY.
              </div>
            </div>

            {/* SPECS GRID RIGHT */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              
              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#E03C31] block mb-2">METADATA SCHEMA</span>
                <h4 className="text-lg font-black uppercase mb-3">Structured Keys</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Every asset contains tags for Semester, Course Code, Topic Unit, and File Type. Avoid directory searching entirely.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#1D4ED8] block mb-2">INDEX PIPELINE</span>
                <h4 className="text-lg font-black uppercase mb-3">Fuzzy Search Bus</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Filters elements in real-time as you type, matching partial titles, course codes, or unit tags with negligible lag.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#FACC15] block mb-2">CONTRIBUTION RULES</span>
                <h4 className="text-lg font-black uppercase mb-3">Moderated Uploads</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Hot-swap drafts are parsed directly in-browser before submission to keep files compact, annotated, and clean.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#78716c] block mb-2">STORAGE ENGINE</span>
                <h4 className="text-lg font-black uppercase mb-3">Optimized CDN Delivery</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Resources download instantly with single-click actions, preserving correct naming conventions across systems.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* GALLERY / COHORT EXAMPLES */}
      <section id="examples" className="border-b-2 border-[#121212] bg-[#F5F4EF]">
        
        {/* HEADER AREA */}
        <div className="border-b-2 border-[#121212] p-6 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-[#78716c] mb-2">SUBJECT RECIPES</span>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
            04 / TYPICAL SUBJECT VAULTS
          </h2>
        </div>

        {/* COMBINATIONS CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[#121212]">
          
          <div className="border-b-2 border-[#121212] sm:border-b-0 sm:border-r-2 sm:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#E03C31] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">CS302 / NETWORKS</div>
              <h4 className="text-xl font-black uppercase mb-2">Computer Networks</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Includes sliding window diagrams, TCP/UDP headers, IP subnetting cheatsheets, and solved mid-sem papers.
              </p>
            </div>
            <span className="text-xs font-black text-[#E03C31] block mt-6">5 STUDY ITEMS · 42.1 MB</span>
          </div>

          <div className="border-b-2 border-[#121212] sm:border-b-0 lg:border-r-2 lg:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#1D4ED8] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">CS304 / DATABASES</div>
              <h4 className="text-xl font-black uppercase mb-2">Database Systems</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Contains normal form cheatsheets, ER diagrams, sample SQL laboratory commands, and handwritten transaction guides.
              </p>
            </div>
            <span className="text-xs font-black text-[#1D4ED8] block mt-6">7 STUDY ITEMS · 68.3 MB</span>
          </div>

          <div className="border-b-2 border-[#121212] sm:border-b-0 sm:border-r-2 sm:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#121212] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">CS301 / SYSTEMS</div>
              <h4 className="text-xl font-black uppercase mb-2">Operating Systems</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Scheduling algorithms cheat sheets, page replacement code templates, and past end-sem exam question banks.
              </p>
            </div>
            <span className="text-xs font-black text-[#121212] block mt-6">4 STUDY ITEMS · 32.8 MB</span>
          </div>

          <div className="p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#FACC15] text-[#121212] px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">CS303 / ALGORITHMS</div>
              <h4 className="text-xl font-black uppercase mb-2">Design & Analysis</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Asymptotic notations guides, dynamic programming paradigms, algorithm templates, and handwritten complexity notes.
              </p>
            </div>
            <span className="text-xs font-black text-[#E03C31] block mt-6">6 STUDY ITEMS · 49.5 MB</span>
          </div>

        </div>

      </section>

      {/* RESERVE SYSTEM CTA / NEWSLETTER */}
      <section id="reserve" className="bg-[#E03C31] border-b-2 border-[#121212] text-[#F5F4EF]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            
            {/* CTA LEFT */}
            <div className="lg:col-span-8">
              <span className="text-xs font-bold tracking-widest text-[#FACC15] mb-2 uppercase">JOIN THE COHORT</span>
              <h2 className="text-4xl font-black tracking-tight sm:text-6xl uppercase leading-none">
                REVAMP YOUR REVISION.
              </h2>
              <p className="mt-6 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-white/80">
                Get access to the student study repository. Download verified notes, upload resources, 
                and help the college build a structured, centralized knowledge base.
              </p>
            </div>

            {/* CTA FORM RIGHT */}
            <div className="lg:col-span-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Access request submitted! Check email for activation details.");
                }} 
                className="flex flex-col gap-4 border-2 border-[#121212] bg-[#F5F4EF] p-6 text-[#121212]"
              >
                <div>
                  <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider block mb-2">ENTER STUDENT EMAIL</label>
                  <input
                    type="email"
                    id="email"
                    required
                    placeholder="student@university.edu"
                    className="w-full bg-[#F0EEE6] border-2 border-[#121212] px-4 py-3 text-xs font-bold outline-none focus:border-[#E03C31] transition-colors"
                  />
                </div>
                
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block mb-1">PROPOSED SETUP</span>
                  <div className="text-xs font-bold text-[#E03C31]">
                    VAULT ACCESS + {activeModulesCount} MAPPED RESOURCES
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E03C31] text-white font-bold text-xs tracking-widest py-3 hover:bg-[#121212] transition-colors duration-200"
                >
                  GET FREE ACCESS
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#121212] text-[#F5F4EF]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#F5F4EF]/10 pb-12">
            
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">RESOURCES</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="/app" className="hover:text-white">All Notes Library</a></li>
                <li><a href="/app" className="hover:text-white">Exam Papers (PYQ)</a></li>
                <li><a href="/app" className="hover:text-white">Lab Experiments</a></li>
                <li><a href="/app" className="hover:text-white">Lecture Slide Decks</a></li>
                <li><a href="/app" className="hover:text-white">Syllabus Outlines</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">STUDENT TOOLS</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="#deck-builder" className="hover:text-white">Revision Deck Builder</a></li>
                <li><a href="/app" className="hover:text-white">My Bookmarks</a></li>
                <li><a href="/app" className="hover:text-white">Personal Uploads</a></li>
                <li><a href="/app" className="hover:text-white">Checklists & Tasks</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">DOCUMENTATION</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="#principles" className="hover:text-white">Index Hierarchy</a></li>
                <li><a href="#principles" className="hover:text-white">Contribution Standards</a></li>
                <li><a href="#principles" className="hover:text-white">Peer-Review Guidelines</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">CLASSVAULT TEAM</span>
              <p className="text-xs text-[#F5F4EF]/60 leading-relaxed font-medium">
                centralizing scattered student assets into clean, functional academic study grids.
              </p>
            </div>

          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[10px] font-black tracking-widest text-[#F5F4EF]/40 uppercase">
            <span>© 2026 CLASSVAULT STUDY SYSTEMS.</span>
            <span>NEXT.JS · TYPESCRIPT · TAILWIND CSS · GEIST SANS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
