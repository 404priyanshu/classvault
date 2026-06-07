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
  X
} from "lucide-react";

// Definitions of module types
interface ModuleType {
  id: string;
  name: string;
  price: number;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}

const MODULES_CATALOG: Record<string, ModuleType> = {
  knob: {
    id: "knob",
    name: "ROTARY KNOB",
    price: 29,
    color: "#E03C31", // Cadmium Red
    bgColor: "bg-[#E03C31]",
    textColor: "text-white",
    description: "High-res optical encoder for precise adjustments.",
  },
  slider: {
    id: "slider",
    name: "LINEAR FADER",
    price: 35,
    color: "#1D4ED8", // Cobalt Blue
    bgColor: "bg-[#1D4ED8]",
    textColor: "text-white",
    description: "60mm smooth travel linear fader.",
  },
  keypad: {
    id: "keypad",
    name: "KEY CLUSTER",
    price: 39,
    color: "#121212", // Charcoal
    bgColor: "bg-[#121212]",
    textColor: "text-[#F5F4EF]",
    description: "4 mechanical switches with hot-swap sockets.",
  },
  display: {
    id: "display",
    name: "OLED SCREEN",
    price: 45,
    color: "#FACC15", // Golden Yellow
    bgColor: "bg-[#FACC15]",
    textColor: "text-[#121212]",
    description: "Monochrome status and parameter display.",
  },
  dial: {
    id: "dial",
    name: "JOG WHEEL",
    price: 49,
    color: "#78716c", // Stone / Silver
    bgColor: "bg-[#78716c]",
    textColor: "text-white",
    description: "Heavy aluminum flywheel for timeline control.",
  },
};

const PRESETS = [
  {
    name: "THE EDITOR",
    description: "Optimized for video editing and color grading.",
    modules: ["display", "knob", "knob", "slider", "slider", "dial", "", "", ""],
  },
  {
    name: "THE COMPOSER",
    description: "Built for synthesizer control and DAW modulation.",
    modules: ["knob", "knob", "knob", "slider", "slider", "slider", "keypad", "", ""],
  },
  {
    name: "THE CODER",
    description: "Programmable shortcuts and hotkeys for builders.",
    modules: ["display", "keypad", "keypad", "knob", "", "", "", "", ""],
  },
  {
    name: "THE MINIMALIST",
    description: "Pure focus on essential control channels.",
    modules: ["dial", "display", "", "knob", "", "", "", "", ""],
  },
];

export function ClassVaultLanding() {
  const BASE_PRICE = 79; // Price for the base frame
  const [grid, setGrid] = useState<string[]>(Array(9).fill("")); // 3x3 grid
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hoveredCatalog, setHoveredCatalog] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute stats
  const activeModulesCount = useMemo(() => grid.filter(Boolean).length, [grid]);
  const totalPrice = useMemo(() => {
    return BASE_PRICE + grid.reduce((sum, item) => sum + (MODULES_CATALOG[item]?.price || 0), 0);
  }, [grid]);

  const powerConsumption = useMemo(() => {
    // base consumes 20mA, knob 15mA, slider 10mA, keypad 5mA, display 45mA, dial 25mA
    const consumptionMap: Record<string, number> = {
      knob: 15,
      slider: 10,
      keypad: 5,
      display: 45,
      dial: 25,
    };
    return 20 + grid.reduce((sum, item) => sum + (consumptionMap[item] || 0), 0);
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
      {/* 2PX CHARCOAL BORDERS GLOBALLY DEFINE BAUHAUS STRUCTURE */}
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b-2 border-[#121212] bg-[#F5F4EF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:grid md:grid-cols-3 md:px-8">
          
          {/* LOGO COLUMN */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-[#E03C31] text-lg font-black text-[#F5F4EF]" aria-hidden="true">
              E
            </div>
            <span className="text-lg font-black tracking-tighter">ELEMENTAR</span>
          </div>

          {/* NAV LINKS COLUMN */}
          <nav className="hidden items-center justify-center gap-8 text-xs font-bold tracking-widest md:flex">
            <a href="#grid-builder" className="hover:text-[#E03C31] hover:underline hover:underline-offset-4">01/BUILD</a>
            <a href="#specs" className="hover:text-[#1D4ED8] hover:underline hover:underline-offset-4">02/SPECS</a>
            <a href="#principles" className="hover:text-[#FACC15] hover:underline hover:underline-offset-4">03/VALUES</a>
            <a href="#gallery" className="hover:text-[#78716c] hover:underline hover:underline-offset-4">04/USE CASES</a>
          </nav>

          {/* CTA / MOBILE COLUMN */}
          <div className="flex items-center justify-end gap-4">
            <a
              href="#reserve"
              className="hidden bg-[#121212] px-5 py-2.5 text-xs font-bold tracking-widest text-[#F5F4EF] hover:bg-[#E03C31] hover:text-white transition-colors duration-200 md:block"
            >
              ORDER KIT / ${totalPrice}
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
              <a href="#grid-builder" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#E03C31]">01/BUILD</a>
              <a href="#specs" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#1D4ED8]">02/SPECS</a>
              <a href="#principles" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FACC15]">03/VALUES</a>
              <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#78716c]">04/USE CASES</a>
              <a
                href="#reserve"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 block w-full bg-[#121212] py-3 text-center text-xs font-bold text-[#F5F4EF]"
              >
                ORDER KIT / ${totalPrice}
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
                MAGNETIC TACTILE INTERFACE
              </div>
              
              <h1 className="text-5xl font-black leading-[0.9] tracking-tighter text-[#121212] sm:text-7xl lg:text-8xl">
                FORM<br />
                FOLLOWS<br />
                WORK.
              </h1>

              <p className="mt-8 max-w-xl text-base font-medium leading-relaxed text-[#121212]/80">
                Modern computers forced all human expression through a flat glass sheet. 
                Elementar breaks the boundary. Assemble knobs, faders, display blocks, 
                and key clusters magnetically onto a modular hardware grid that fits your workflow.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#grid-builder"
                  className="bg-[#E03C31] text-[#F5F4EF] font-bold text-sm tracking-widest px-8 py-4 border-2 border-[#121212] hover:bg-[#F5F4EF] hover:text-[#121212] transition-all duration-200"
                >
                  ASSEMBLE GRID
                </a>
                <a
                  href="#specs"
                  className="bg-transparent text-[#121212] font-bold text-sm tracking-widest px-8 py-4 border-2 border-[#121212] hover:bg-[#121212] hover:text-[#F5F4EF] transition-all duration-200"
                >
                  SPECIFICATIONS
                </a>
              </div>
            </div>

            {/* HERO RIGHT COLUMN (CSS SCULPTURE / BLUEPRINT) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px] aspect-square border-2 border-[#121212] bg-[#F5F4EF] p-4 flex flex-col justify-between">
                
                {/* GRID DECORATIVE BACKGROUND */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-[0.03]">
                  {Array(16).fill(null).map((_, i) => (
                    <div key={i} className="border border-[#121212]"></div>
                  ))}
                </div>

                <div className="flex justify-between border-b-2 border-[#121212] pb-3 text-xs font-bold tracking-widest text-[#121212]/60">
                  <span>ELEMENTAR MODEL 01</span>
                  <span>1:1 SCALE</span>
                </div>

                {/* SCULPTURAL BLOCKS ARRANGEMENT */}
                <div className="relative flex-1 flex items-center justify-center">
                  
                  {/* BASEPLATE SCHEMATIC OUTLINE */}
                  <div className="w-64 h-64 border-2 border-dashed border-[#121212]/40 relative flex items-center justify-center">
                    
                    {/* RED BLOCK */}
                    <div className="absolute top-4 left-4 w-24 h-24 bg-[#E03C31] border-2 border-[#121212] flex flex-col justify-between p-2 transform -translate-x-2 translate-y-1 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <div className="h-10 w-10 rounded-full border-2 border-[#121212] bg-[#F5F4EF]/20 flex items-center justify-center">
                        <div className="h-1 w-4 bg-[#121212] origin-left rotate-45"></div>
                      </div>
                      <span className="text-[10px] font-black text-[#F5F4EF]">MOD-01 [KNOB]</span>
                    </div>

                    {/* BLUE BLOCK */}
                    <div className="absolute bottom-4 left-4 w-24 h-36 bg-[#1D4ED8] border-2 border-[#121212] flex flex-col justify-between p-2 transform translate-x-1 translate-y-3 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] font-black text-[#F5F4EF] tracking-wider uppercase">FADER</span>
                      <div className="h-20 w-3 bg-[#121212] mx-auto relative flex items-center justify-center">
                        <div className="absolute w-6 h-3 bg-[#F5F4EF] border border-[#121212] top-8"></div>
                      </div>
                      <span className="text-[8px] font-bold text-[#F5F4EF]/60 text-right">MOD-02</span>
                    </div>

                    {/* YELLOW BLOCK */}
                    <div className="absolute top-4 right-4 w-24 h-24 bg-[#FACC15] border-2 border-[#121212] flex flex-col justify-between p-2 transform translate-x-3 -translate-y-2 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[8px] font-black text-[#121212]">OLED / STATE</span>
                      <div className="h-6 w-full bg-[#121212] text-[8px] flex items-center justify-center text-green-400 font-mono">
                        MODULUS_OK
                      </div>
                      <span className="text-[8px] font-bold text-[#121212]/50">MOD-04</span>
                    </div>

                    {/* CHARCOAL KEYBLOCK */}
                    <div className="absolute bottom-4 right-4 w-24 h-24 bg-[#121212] border-2 border-[#121212] flex flex-wrap gap-1 p-2 transform -translate-x-1 -translate-y-1 hover:translate-x-0 hover:translate-y-0 transition-transform duration-300">
                      {Array(4).fill(null).map((_, i) => (
                        <div key={i} className="w-[42%] aspect-square bg-[#78716c]/30 border border-[#F5F4EF]/20 flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#F5F4EF]">{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t-2 border-[#121212] pt-3 text-[10px] font-black text-[#121212]">
                  <span>FORM: GRID CORE v01</span>
                  <span>© 2026</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE BUILDER SECTION */}
      <section id="grid-builder" className="border-b-2 border-[#121212]">
        
        {/* INTERACTIVE BUILDER HEADER */}
        <div className="grid border-b-2 border-[#121212] lg:grid-cols-12">
          
          <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between border-b-2 border-[#121212] lg:border-b-0 lg:border-r-2 lg:border-[#121212]">
            <span className="text-xs font-bold tracking-widest text-[#E03C31] mb-2">INTERFACE CONFIGURATOR</span>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
              01 / ASSEMBLE YOUR CONTROLLER
            </h2>
            <p className="mt-4 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/70">
              Select module presets below or click modules from the catalog to populate your 3x3 grid core. Click placed modules in the grid to extract them. Watch price and specs update live.
            </p>
          </div>

          <div className="lg:col-span-4 bg-[#121212] text-[#F5F4EF] p-6 md:p-8 flex flex-col justify-between">
            <span className="text-xs font-bold tracking-widest text-[#FACC15] mb-2">LIVE ESTIMATE</span>
            <div>
              <div className="flex items-baseline justify-between border-b border-[#F5F4EF]/20 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F5F4EF]/60">Total Cost</span>
                <span className="text-4xl font-black">${totalPrice}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#F5F4EF]/72">
                <span>Core baseplate: $79</span>
                <span>Active modules: {activeModulesCount} / 9</span>
              </div>
            </div>
            <a
              href="#reserve"
              className="mt-6 flex h-12 items-center justify-center bg-[#E03C31] text-[#F5F4EF] text-xs font-bold tracking-widest hover:bg-[#F5F4EF] hover:text-[#121212] hover:border hover:border-[#121212] transition-all duration-200"
            >
              RESERVE CONFIGURATION <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>

        </div>

        {/* BUILDER WORKSPACE */}
        <div className="grid lg:grid-cols-12">
          
          {/* PRESETS & CATALOG SIDEBAR */}
          <div className="lg:col-span-4 border-b-2 border-[#121212] lg:border-b-0 lg:border-r-2 lg:border-[#121212] p-6 md:p-8 flex flex-col gap-8 bg-[#F0EEE6]">
            
            {/* PRESETS LIST */}
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-4">A. PRESET CONFIGURATIONS</span>
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
                <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50">B. MODULE CATALOG</span>
                <span className="text-[10px] font-bold text-[#E03C31]">CLICK TO ADD</span>
              </div>
              <div className="flex flex-col gap-3">
                {Object.values(MODULES_CATALOG).map((module) => (
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
                      <span className="text-xs font-black">+${module.price}</span>
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
            <span className="text-xs font-bold tracking-widest text-[#121212]/50 mb-6">THE 3X3 ACTIVE DOCK</span>
            
            {/* GRID FRAME */}
            <div className="w-full max-w-[340px] aspect-square border-4 border-[#121212] bg-[#121212] grid grid-cols-3 grid-rows-3 gap-1 shadow-[8px_8px_0px_#121212]">
              {grid.map((moduleId, index) => {
                const module = MODULES_CATALOG[moduleId];
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
                          <span className="text-[7px] opacity-70">S-{index + 1}</span>
                        </div>

                        {/* MODULE SPECIFIC VISUALS */}
                        <div className="flex-1 flex items-center justify-center">
                          {module.id === "knob" && (
                            <div className="h-10 w-10 rounded-full border-2 border-[#121212] bg-white/20 flex items-center justify-center">
                              <div className="h-1 w-4 bg-[#121212] origin-left rotate-[60deg]"></div>
                            </div>
                          )}
                          {module.id === "slider" && (
                            <div className="h-12 w-2.5 bg-[#121212] relative flex items-center justify-center">
                              <div className="absolute w-5 h-2 bg-[#F5F4EF] border border-[#121212] top-4"></div>
                            </div>
                          )}
                          {module.id === "keypad" && (
                            <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-10 h-10">
                              {Array(4).fill(null).map((_, i) => (
                                <div key={i} className="bg-[#78716c] border border-white/25 flex items-center justify-center">
                                  <span className="text-[6px] text-white font-black">{i+1}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {module.id === "display" && (
                            <div className="w-12 h-6 bg-[#121212] border border-[#F5F4EF]/20 flex flex-col justify-center px-1 font-mono text-green-400 text-[6px] leading-tight">
                              <span>STATE_ON</span>
                              <span className="opacity-70">VAL: 104</span>
                            </div>
                          )}
                          {module.id === "dial" && (
                            <div className="h-12 w-12 rounded-full border-2 border-[#121212] bg-[#F5F4EF]/10 flex items-center justify-center">
                              <div className="h-8 w-8 rounded-full border border-dashed border-[#121212] flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-[#121212]"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-end">
                          <span className="text-[7px] font-bold">${module.price}</span>
                          <span className="text-[8px] font-black bg-black/10 hover:bg-black/25 px-1">EXTRACT</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] font-bold text-[#121212]/30 uppercase tracking-widest">EMPTY</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Bus Link State: Active</span>
            </div>
          </div>

          {/* TELEMETRY & SPECS PANEL */}
          <div className="lg:col-span-3 border-t-2 border-[#121212] lg:border-t-0 p-6 md:p-8 flex flex-col gap-6 bg-[#F5F4EF]">
            
            {/* BUS TELEMETRY */}
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-4">C. DYNAMIC SPECS</span>
              <div className="flex flex-col border-2 border-[#121212] bg-[#F0EEE6]">
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Power Budget</span>
                  <span className="text-xs font-black text-[#121212]">{powerConsumption}mA / 500mA</span>
                </div>
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">USB Endpoints</span>
                  <span className="text-xs font-black text-[#121212]">{grid.filter(item => item === "knob" || item === "slider" || item === "dial").length + 1} / 8</span>
                </div>
                
                <div className="flex justify-between border-b border-[#121212] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Active Profiles</span>
                  <span className="text-xs font-black text-[#121212]">{activeModulesCount > 0 ? "Default Profile 1" : "Standby Mode"}</span>
                </div>
                
                <div className="flex justify-between p-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/60">Firmware Build</span>
                  <span className="text-xs font-black text-[#E03C31]">QMK v0.24-EL</span>
                </div>

              </div>
            </div>

            {/* LIVE MODULE CHECKS */}
            <div className="flex-1 flex flex-col justify-end">
              <span className="text-xs font-black tracking-wider uppercase text-[#121212]/50 block mb-3">SYSTEM PROTOCOLS</span>
              <div className="space-y-2 text-[10px] font-medium leading-relaxed text-[#121212]/70">
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>I2C Magnetic hot-swapping bus validated.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Automatic profile mappings enabled.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Anti-ghosting and noise filtration active.</span>
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
          <span className="text-xs font-bold tracking-widest text-[#1D4ED8] mb-2">DESIGN SYSTEM VALUES</span>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
            02 / THE PRINCIPLES OF MODULARITY
          </h2>
        </div>

        {/* THREE COLUMNS GRID */}
        <div className="grid md:grid-cols-3 border-t border-[#121212]">
          
          <div className="p-8 border-b-2 border-[#121212] md:border-b-0 md:border-r-2 md:border-[#121212] flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#E03C31]">01 / PURITY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">NO DECORATION.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                Every line is a division. Every shape is an interface. We stripped away the fake leather, the RGB gradients, and the smooth curves. Elementar is built for work—pure aluminum, solid mechanical switches, and high-contrast color.
              </p>
            </div>
            <div className="h-8 w-8 bg-[#E03C31] mt-8 border border-[#121212]"></div>
          </div>

          <div className="p-8 border-b-2 border-[#121212] md:border-b-0 md:border-r-2 md:border-[#121212] flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#1D4ED8]">02 / MODULARITY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">YOUR ARCHITECTURE.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                A video editor requires Jog wheels and faders. A music composer needs sliders and keypads. A developer wants shortcodes. Swap and snap modules to construct a custom physical controller that behaves exactly as you think.
              </p>
            </div>
            <div className="h-8 w-8 bg-[#1D4ED8] mt-8 border border-[#121212]"></div>
          </div>

          <div className="p-8 flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-sm font-black text-[#FACC15]">03 / UTILITY</span>
              <h3 className="text-3xl font-black mt-8 mb-4">TACTILE FEEDBACK.</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/80">
                Mechanical keycaps give structural clicks. Flywheel jog dials slide through frames. Linear faders respond to absolute physical position. Work with your fingers, not just your eyes. The screen disappears; task focus returns.
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
                <span className="text-xs font-bold tracking-widest text-[#78716c] mb-2">TECHNICAL HARDWARE PROTOCOLS</span>
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase leading-none">
                  03 / SPECIFICATIONS
                </h2>
                <p className="mt-6 text-xs sm:text-sm font-medium leading-relaxed text-[#121212]/85">
                  Designed for integration, built with open-source firmware. The mechanical baseplate and custom components use standard I2C links and mechanical sockets.
                </p>
              </div>
              <div className="mt-8 border-2 border-[#121212] bg-[#E03C31] text-[#F5F4EF] p-4 font-bold text-xs tracking-wider">
                COMPATIBLE WITH WINDOWS, MACOS, AND LINUX. NO DRIVERS REQUIRED.
              </div>
            </div>

            {/* SPECS GRID RIGHT */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              
              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#E03C31] block mb-2">INTERFACE ARCHITECTURE</span>
                <h4 className="text-lg font-black uppercase mb-3">Grid Backplane</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Gold-plated spring-loaded pogo pins. Magnetic snap alignments with 1.2kg pull-force magnets per dock slot.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#1D4ED8] block mb-2">FIRMWARE PROTOCOL</span>
                <h4 className="text-lg font-black uppercase mb-3">QMK / VIAL Compatible</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Fully open-source keymaps. Changes are saved on the controller's internal EEPROM directly. No cloud sync required.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#FACC15] block mb-2">MATERIALS & SWITCHES</span>
                <h4 className="text-lg font-black uppercase mb-3">Anodized Aluminum</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  Solid metal frames machined in Germany. MX mechanical switch hot-swap sockets with standard stem keycap support.
                </p>
              </div>

              <div className="border-2 border-[#121212] p-5">
                <span className="text-[10px] font-black text-[#78716c] block mb-2">POWER & CONNECTIVITY</span>
                <h4 className="text-lg font-black uppercase mb-3">USB-C Core Bus</h4>
                <p className="text-xs leading-relaxed text-[#121212]/70">
                  USB-C connection, drawing max 500mA. Onboard hardware protection prevents short-circuits during module swapping.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* GALLERY / CREATOR CONFIGS */}
      <section id="gallery" className="border-b-2 border-[#121212] bg-[#F5F4EF]">
        
        {/* HEADER AREA */}
        <div className="border-b-2 border-[#121212] p-6 md:p-8 flex flex-col justify-between max-w-7xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-[#78716c] mb-2">CREATOR RECIPES</span>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl uppercase">
            04 / MODULE COMBINATIONS
          </h2>
        </div>

        {/* COMBINATIONS CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[#121212]">
          
          <div className="border-b-2 border-[#121212] sm:border-b-0 sm:border-r-2 sm:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#E03C31] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">VIDEO EDITOR</div>
              <h4 className="text-xl font-black uppercase mb-2">The Colorist</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Featuring a central Jog Wheel, dual linear faders, and three rotary knobs. Instant controls for timeline scrub, gain, and color channels.
              </p>
            </div>
            <span className="text-xs font-black text-[#E03C31] block mt-6">5 ACTIVE MODULES · $261</span>
          </div>

          <div className="border-b-2 border-[#121212] sm:border-b-0 lg:border-r-2 lg:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#1D4ED8] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">SOUND DESIGNER</div>
              <h4 className="text-xl font-black uppercase mb-2">The Composer</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Three rotary knobs, three linear faders, and one mechanical key-cluster. Maps key filters, synth resonance, and trigger pads.
              </p>
            </div>
            <span className="text-xs font-black text-[#1D4ED8] block mt-6">7 ACTIVE MODULES · $291</span>
          </div>

          <div className="border-b-2 border-[#121212] sm:border-b-0 sm:border-r-2 sm:border-[#121212] p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#121212] text-white px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">DEVELOPER</div>
              <h4 className="text-xl font-black uppercase mb-2">The Coder</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                One status OLED screen and two mechanical key clusters. Bind code compile commands, macro scripts, and server status.
              </p>
            </div>
            <span className="text-xs font-black text-[#121212] block mt-6">3 ACTIVE MODULES · $202</span>
          </div>

          <div className="p-6 flex flex-col justify-between min-h-[300px] hover:bg-[#F0EEE6] transition-colors duration-200">
            <div>
              <div className="bg-[#FACC15] text-[#121212] px-2 py-0.5 text-[9px] font-bold tracking-widest w-fit mb-4">STREAMER</div>
              <h4 className="text-xl font-black uppercase mb-2">The Broadcaster</h4>
              <p className="text-xs text-[#121212]/70 leading-relaxed">
                Two mechanical key clusters, one status display screen, and two rotary knobs. Swap audio sources and launch media overlays instantly.
              </p>
            </div>
            <span className="text-xs font-black text-[#E03C31] block mt-6">5 ACTIVE MODULES · $281</span>
          </div>

        </div>

      </section>

      {/* RESERVE SYSTEM CTA / NEWSLETTER */}
      <section id="reserve" className="bg-[#E03C31] border-b-2 border-[#121212] text-[#F5F4EF]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 md:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            
            {/* CTA LEFT */}
            <div className="lg:col-span-8">
              <span className="text-xs font-bold tracking-widest text-[#FACC15] mb-2 uppercase">RESERVE BATCH 01</span>
              <h2 className="text-4xl font-black tracking-tight sm:text-6xl uppercase leading-none">
                BUILD WITH STARK UTILITY.
              </h2>
              <p className="mt-6 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-white/80">
                Reserve the Elementar Grid Baseplate and custom module configuration today. 
                Batch 01 units ship in Autumn 2026. Custom specifications are saved automatically to your reservation key.
              </p>
            </div>

            {/* CTA FORM RIGHT */}
            <div className="lg:col-span-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Configuration reserved successfully! Check email for receipt details.");
                }} 
                className="flex flex-col gap-4 border-2 border-[#121212] bg-[#F5F4EF] p-6 text-[#121212]"
              >
                <div>
                  <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider block mb-2">ENTER RESERVATION EMAIL</label>
                  <input
                    type="email"
                    id="email"
                    required
                    placeholder="architect@bauhaus.org"
                    className="w-full bg-[#F0EEE6] border-2 border-[#121212] px-4 py-3 text-xs font-bold outline-none focus:border-[#E03C31] transition-colors"
                  />
                </div>
                
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block mb-1">SELECTED SETUP</span>
                  <div className="text-xs font-bold text-[#E03C31]">
                    BASE GRID + {activeModulesCount} MODULES (${totalPrice})
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E03C31] text-white font-bold text-xs tracking-widest py-3 hover:bg-[#121212] transition-colors duration-200"
                >
                  RESERVE SYSTEM
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
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">PRODUCTS</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="#grid-builder" className="hover:text-white">Grid Core Base</a></li>
                <li><a href="#grid-builder" className="hover:text-white">Rotary Encoder MOD-01</a></li>
                <li><a href="#grid-builder" className="hover:text-white">Linear Fader MOD-02</a></li>
                <li><a href="#grid-builder" className="hover:text-white">Key Cluster MOD-03</a></li>
                <li><a href="#grid-builder" className="hover:text-white">OLED Screen MOD-04</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">RESOURCES</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="#specs" className="hover:text-white">QMK Firmware Guide</a></li>
                <li><a href="#specs" className="hover:text-white">VIAL Setup Tool</a></li>
                <li><a href="#specs" className="hover:text-white">Hardware API Spec</a></li>
                <li><a href="#specs" className="hover:text-white">3D CAD Base Outlines</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">DOCUMENTATION</span>
              <ul className="space-y-2 text-xs font-bold text-[#F5F4EF]/72">
                <li><a href="#principles" className="hover:text-white">Modernist Design Spec</a></li>
                <li><a href="#principles" className="hover:text-white">Form-Follows-Function</a></li>
                <li><a href="#principles" className="hover:text-white">Modularity Guidelines</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest text-[#F5F4EF]/40 block mb-4">ELEMENTAR CORP</span>
              <p className="text-xs text-[#F5F4EF]/60 leading-relaxed font-medium">
                Designing mechanical tools for digital craft. Formulated in Weimar, manufactured globally.
              </p>
            </div>

          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[10px] font-black tracking-widest text-[#F5F4EF]/40 uppercase">
            <span>© 2026 ELEMENTAR CONTROLLERS INC.</span>
            <span>NEXT.JS · TYPESCRIPT · TAILWIND CSS · GEIST SANS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
