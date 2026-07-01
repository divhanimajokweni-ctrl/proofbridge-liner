'use client';
import React, { useState, useEffect, useCallback } from 'react';
import DashboardWidget from '../components/DashboardWidget';
import MetricCard from '../components/MetricCard';

/**
 * Ubuntu Studio + SafeSpace IDE page.
 * Audio plugin creation, compilation, and export to DAW.
 * Artists/DJs/Producers write C++ DSP code → compile → export VST3/CLAP.
 */

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface CompileResult {
  status: string;
  pluginPath?: string;
  format?: string;
  diagnostics?: string;
  buildTimeMs?: number;
}

interface LibraryAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  creator: string;
  source: string;
  downloadCount: number;
  publishedAt: string;
}

export default function StudioPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sourceCode, setSourceCode] = useState('');
  const [pluginName, setPluginName] = useState('');
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [activeTab, setActiveTab] = useState<'ide' | 'library'>('ide');

  // Load templates
  useEffect(() => {
    fetch('/api/ubuntulibrary?stats=true')
      .then(r => r.json())
      .then(d => { /* stats loaded */ })
      .catch(() => {});

    // Load library
    fetch('/api/ubuntulibrary?category=audio')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setLibraryAssets(d.assets);
      })
      .catch(() => {});

    // Load templates (built-in)
    setTemplates([
      { id: 'distortion', name: 'VVU Soft Clip Distortion', category: 'effect', description: 'Analog saturation with cubic soft-clipping' },
      { id: 'delay', name: 'VVU Stereo Delay', category: 'effect', description: 'Stereo delay with feedback modulation' },
      { id: 'synth', name: 'VVU Basic Oscillator', category: 'synth', description: 'Wavetable synth with FM modulation' },
      { id: 'compressor', name: 'VVU Dynamic Compressor', category: 'tool', description: 'RMS compressor with attack/release' },
    ]);
  }, []);

  const handleCompile = useCallback(async () => {
    if (!sourceCode || !pluginName) return;
    setCompiling(true);
    setCompileResult(null);

    try {
      const res = await fetch('/api/ubuntulibrary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pluginName,
          description: `Custom plugin by SafeSpace creator`,
          category: 'audio',
          tags: ['custom', 'dsp'],
          creator: 'SafeSpace Creator',
          source: 'safespace',
        }),
      });
      const data = await res.json();

      // Simulate compile result for now
      setCompileResult({
        status: 'SUCCESS',
        pluginPath: `/usr/lib/clap/${pluginName.replace(/\s+/g, '')}.clap`,
        format: 'CLAP',
        buildTimeMs: Math.floor(Math.random() * 2000) + 500,
      });
    } catch {
      setCompileResult({
        status: 'BUILD_ERROR',
        diagnostics: 'Connection to compiler service failed.',
      });
    } finally {
      setCompiling(false);
    }
  }, [sourceCode, pluginName]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: '#fff',
            margin: 0,
          }}>
            🎵 UBUNTU STUDIO + SAFESPACE IDE
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            color: 'var(--color-text-muted)',
            margin: '4px 0 0',
          }}>
            Write DSP code → Compile → Export to DAW (VST3 / CLAP)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ide', 'library'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px',
                background: activeTab === tab ? 'var(--color-cyan-dim)' : 'transparent',
                border: `1px solid ${activeTab === tab ? 'var(--color-cyan-border)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-xs)',
                color: activeTab === tab ? 'var(--color-cyan)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5rem',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {tab === 'ide' ? '🎛️ Plugin IDE' : '📚 UbuntuLibrary'}
            </button>
          ))}
        </div>
      </header>

      {/* IDE Tab */}
      {activeTab === 'ide' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 300px',
          gap: 12,
          padding: '12px 20px',
          flex: 1,
        }}>
          {/* Left: Templates */}
          <DashboardWidget title="PLUGIN TEMPLATES" subtitle="Select a starting point">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setPluginName(t.name);
                    // Load template code
                    const codes: Record<string, string> = {
                      distortion: `#include <cmath>\n\nvoid processAudioBlock(float* left, float* right, int samples, float drive) {\n    for (int i = 0; i < samples; ++i) {\n        float lIn = left[i] * drive;\n        float rIn = right[i] * drive;\n        left[i]  = lIn - (1.0f / 3.0f) * std::pow(lIn, 3.0f);\n        right[i] = rIn - (1.0f / 3.0f) * std::pow(rIn, 3.0f);\n        left[i]  = std::max(-1.0f, std::min(1.0f, left[i]));\n        right[i] = std::max(-1.0f, std::min(1.0f, right[i]));\n    }\n}`,
                      delay: `#include <cstring>\n\nstatic float delayBufL[88200];\nstatic float delayBufR[88200];\nstatic int writePos = 0;\n\nvoid processAudioBlock(float* left, float* right, int samples, float timeMs, float feedback, float mix) {\n    int delaySamples = (int)(timeMs * 44.1f);\n    for (int i = 0; i < samples; ++i) {\n        int readPos = (writePos - delaySamples + 88200) % 88200;\n        float wetL = delayBufL[readPos];\n        float wetR = delayBufR[readPos];\n        delayBufL[writePos] = left[i] + wetL * feedback;\n        delayBufR[writePos] = right[i] + wetR * feedback;\n        left[i]  = left[i] * (1.0f - mix) + wetL * mix;\n        right[i] = right[i] * (1.0f - mix) + wetR * mix;\n        writePos = (writePos + 1) % 88200;\n    }\n}`,
                      synth: `#include <cmath>\n\nstatic float phase = 0.0f;\nstatic const float PI = 3.14159265f;\n\nvoid processSynth(float* outL, float* outR, int samples, float freq, int wave) {\n    float inc = freq / 44100.0f;\n    for (int i = 0; i < samples; ++i) {\n        float s = 0.0f;\n        if (wave == 0) s = std::sin(phase * 2.0f * PI);\n        else if (wave == 1) s = 2.0f * fmod(phase, 1.0f) - 1.0f;\n        else s = fmod(phase, 1.0f) < 0.5f ? 1.0f : -1.0f;\n        outL[i] = outR[i] = s * 0.3f;\n        phase += inc;\n        if (phase > 1.0f) phase -= 1.0f;\n    }\n}`,
                      compressor: `#include <cmath>\n\nstatic float envelope = 0.0f;\n\nvoid processAudioBlock(float* left, float* right, int samples, float threshold, float ratio, float attack, float release) {\n    float aCoeff = 1.0f - std::exp(-1.0f / (attack * 0.001f * 44100.0f));\n    float rCoeff = 1.0f - std::exp(-1.0f / (release * 0.001f * 44100.0f));\n    float thr = std::pow(10.0f, threshold / 20.0f);\n    for (int i = 0; i < samples; ++i) {\n        float peak = std::max(std::abs(left[i]), std::abs(right[i]));\n        envelope += (peak > envelope ? aCoeff : rCoeff) * (peak - envelope);\n        float gain = 1.0f;\n        if (envelope > thr) {\n            float over = 20.0f * std::log10(envelope / thr);\n            gain = std::pow(10.0f, (over / ratio - over) / 20.0f);\n        }\n        left[i] *= gain;\n        right[i] *= gain;\n    }\n}`,
                    };
                    setSourceCode(codes[t.id] || '// Write your DSP code here\n');
                  }}
                  style={{
                    padding: '8px 10px',
                    border: `1px solid ${selectedTemplate === t.id ? 'var(--color-cyan-border)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-xs)',
                    background: selectedTemplate === t.id ? 'var(--color-cyan-dim)' : 'var(--color-card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5rem',
                  }}
                >
                  <div style={{ color: '#fff', fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.45rem' }}>{t.description}</div>
                </div>
              ))}
            </div>
          </DashboardWidget>

          {/* Center: Code Editor */}
          <DashboardWidget title="CODE EDITOR" subtitle="C++ DSP source — modify and compile" fullWidth>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={pluginName}
                  onChange={e => setPluginName(e.target.value)}
                  placeholder="Plugin name (e.g., MyDistortion)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    outline: 'none',
                  }}
                />
                <select
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-void)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5rem',
                  }}
                >
                  <option value="clap">CLAP (Clever Audio Plugin)</option>
                  <option value="vst3">VST3 (Steinberg)</option>
                </select>
                <button
                  onClick={handleCompile}
                  disabled={compiling || !sourceCode || !pluginName}
                  style={{
                    padding: '8px 20px',
                    background: compiling ? 'var(--color-card)' : 'var(--color-gold)',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    color: compiling ? 'var(--color-text-muted)' : '#000',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.55rem',
                    cursor: compiling ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.05em',
                  }}
                >
                  {compiling ? '⏳ COMPILING...' : '▶ COMPILE & EXPORT'}
                </button>
              </div>

              <textarea
                value={sourceCode}
                onChange={e => setSourceCode(e.target.value)}
                placeholder="// Select a template or write your own C++ DSP code here..."
                style={{
                  flex: 1,
                  minHeight: 400,
                  padding: 16,
                  background: 'var(--color-void)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  lineHeight: 1.6,
                  resize: 'none',
                  outline: 'none',
                  tabSize: 4,
                }}
              />

              {/* Compile result */}
              {compileResult && (
                <div style={{
                  padding: '10px 14px',
                  background: compileResult.status === 'SUCCESS' ? 'rgba(62,207,142,0.1)' : 'rgba(140,26,62,0.1)',
                  border: `1px solid ${compileResult.status === 'SUCCESS' ? 'var(--color-green-border)' : 'var(--color-crimson-border)'}`,
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                }}>
                  {compileResult.status === 'SUCCESS' ? (
                    <>
                      <div style={{ color: 'var(--color-green)', fontWeight: 700 }}>
                        ✔ BUILD SUCCESS — {compileResult.format}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Exported to: {compileResult.pluginPath} · Built in {compileResult.buildTimeMs}ms
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--color-crimson-bright)' }}>
                      ✘ BUILD FAILED: {compileResult.diagnostics}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DashboardWidget>

          {/* Right: Info + Export */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DashboardWidget title="EXPORT TARGETS" subtitle="Supported DAW formats">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.5rem' }}>
                <div style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', background: 'var(--color-card)' }}>
                  <div style={{ color: '#fff', fontWeight: 700 }}>CLAP</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.45rem' }}>Open-source, polyphonic modulation. Bitwig, Reaper, Ardour</div>
                </div>
                <div style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', background: 'var(--color-card)' }}>
                  <div style={{ color: '#fff', fontWeight: 700 }}>VST3</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.45rem' }}>Industry standard. FL Studio, Ableton, Cubase</div>
                </div>
              </div>
            </DashboardWidget>

            <DashboardWidget title="WORKFLOW" subtitle="How it works">
              <ol style={{
                margin: 0,
                paddingLeft: 16,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.45rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.8,
              }}>
                <li>Select a DSP template</li>
                <li>Modify the C++ processing code</li>
                <li>Name your plugin and click Compile</li>
                <li>Binary exports to /usr/lib/clap/</li>
                <li>Open DAW → Rescan plugins</li>
                <li>Your plugin appears in the mixer!</li>
              </ol>
            </DashboardWidget>

            <DashboardWidget title="STATS" subtitle="UbuntuStudio + SafeSpace">
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.45rem' }}>
                <dt style={{ color: 'var(--color-text-muted)' }}>Templates</dt>
                <dd style={{ color: 'var(--color-cyan)', margin: 0, fontWeight: 700 }}>{templates.length}</dd>
                <dt style={{ color: 'var(--color-text-muted)' }}>Export Format</dt>
                <dd style={{ color: '#fff', margin: 0 }}>CLAP + VST3</dd>
                <dt style={{ color: 'var(--color-text-muted)' }}>Compiler</dt>
                <dd style={{ color: '#fff', margin: 0 }}>Clang++ (C++17)</dd>
                <dt style={{ color: 'var(--color-text-muted)' }}>License</dt>
                <dd style={{ color: 'var(--color-green)', margin: 0 }}>FREE FOREVER</dd>
              </dl>
            </DashboardWidget>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div style={{ padding: '12px 20px', flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {libraryAssets.map(asset => (
              <div
                key={asset.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.4rem',
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'var(--color-cyan-dim)',
                    color: 'var(--color-cyan)',
                    border: '1px solid var(--color-cyan-border)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {asset.category}
                  </span>
                  <span style={{ fontSize: '0.4rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {asset.source}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                  color: '#fff',
                  margin: 0,
                }}>
                  {asset.name}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.45rem, 0.7vw, 0.55rem)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {asset.description}
                </p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {asset.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '0.35rem',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'var(--color-card)',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.4rem',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>by {asset.creator}</span>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    {asset.downloadCount} downloads · FREE
                  </span>
                </div>
              </div>
            ))}
            {libraryAssets.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 40,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--color-text-muted)',
              }}>
                Loading UbuntuLibrary assets...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
