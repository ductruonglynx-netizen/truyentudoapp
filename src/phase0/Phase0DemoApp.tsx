import { useMemo, useState } from 'react';
import { Bot, Languages, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  type GlossaryTerm,
  findGlossaryViolations,
  translateSegment,
} from './aiGateway';

const DEFAULT_SOURCE = `Thanh Long truoc khi xuat chien da de lai mat lenh cho Ly Nhi.`;

export default function Phase0DemoApp() {
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE);
  const [targetText, setTargetText] = useState('');
  const [tone, setTone] = useState('natural, literary');
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([
    { source: 'Thanh Long', target: 'Rong Xanh' },
    { source: 'Ly Nhi', target: 'Ly Nhi' },
  ]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [provider, setProvider] = useState('N/A');
  const [isTranslating, setIsTranslating] = useState(false);

  const violations = useMemo(
    () => findGlossaryViolations(sourceText, targetText, glossary),
    [sourceText, targetText, glossary],
  );

  const updateGlossary = (index: number, key: keyof GlossaryTerm, value: string) => {
    setGlossary((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addGlossaryRow = () => {
    setGlossary((prev) => [...prev, { source: '', target: '' }]);
  };

  const removeGlossaryRow = (index: number) => {
    setGlossary((prev) => prev.filter((_, i) => i !== index));
  };

  const onTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      const response = await translateSegment({
        sourceText,
        sourceLang: 'zh-CN',
        targetLang: 'vi-VN',
        glossary,
        tone,
      });
      setProvider(response.provider);
      setAlternatives(response.alternatives);
      if (response.alternatives[0]) {
        setTargetText(response.alternatives[0]);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="phase0-shell min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="phase0-card mb-4 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="phase0-eyebrow">Phase 0 Demo</p>
            <h1 className="phase0-title">Translator Workspace (Split-screen + Glossary Lock)</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="phase0-pill">
              <Languages className="h-4 w-4" />
              zh-CN -&gt; vi-VN
            </span>
            <span className="phase0-pill">
              <Bot className="h-4 w-4" />
              Provider: {provider}
            </span>
          </div>
        </header>

        <section className="phase0-grid mb-4">
          <article className="phase0-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Source</h2>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="phase0-textarea"
              placeholder="Paste source segment..."
            />
          </article>

          <article className="phase0-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Target</h2>
            <textarea
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              className="phase0-textarea"
              placeholder="AI translation output..."
            />
          </article>
        </section>

        <section className="phase0-card mb-4 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Glossary (hard lock validation)</h2>
            <button className="phase0-ghost-btn" onClick={addGlossaryRow}>
              <Plus className="h-4 w-4" /> Add term
            </button>
          </div>

          <div className="space-y-2">
            {glossary.map((row, index) => (
              <div key={`term-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={row.source}
                  onChange={(e) => updateGlossary(index, 'source', e.target.value)}
                  className="phase0-input"
                  placeholder="Source term"
                />
                <input
                  value={row.target}
                  onChange={(e) => updateGlossary(index, 'target', e.target.value)}
                  className="phase0-input"
                  placeholder="Forced target term"
                />
                <button className="phase0-danger-btn" onClick={() => removeGlossaryRow(index)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {violations.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="mb-2 font-semibold">Glossary violations detected:</p>
              <ul className="list-disc pl-5">
                {violations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Glossary check passed.
            </div>
          )}
        </section>

        <section className="phase0-card p-4">
          <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="phase0-input"
              placeholder="Tone instruction"
            />
            <button className="phase0-primary-btn" onClick={onTranslate} disabled={isTranslating}>
              <Sparkles className="h-4 w-4" />
              {isTranslating ? 'Translating...' : 'Translate Segment'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((item, idx) => (
              <button
                key={`alt-${idx}`}
                className="phase0-alt"
                onClick={() => setTargetText(item)}
                title="Click to apply"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Option {idx + 1}</p>
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
