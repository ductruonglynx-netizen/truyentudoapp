import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Download, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { runReleaseReadinessChecks, type ReleaseCheckReport } from './releaseChecks';

function exportReport(report: ReleaseCheckReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `phase5-release-report-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Phase5App() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<ReleaseCheckReport | null>(null);
  const [message, setMessage] = useState('Run a full release check to validate quality gates.');

  const summary = useMemo(() => {
    if (!report) return { pass: 0, fail: 0, percent: 0 };
    const pass = report.items.filter((item) => item.pass).length;
    const fail = report.items.length - pass;
    const percent = report.items.length ? Math.round((pass / report.items.length) * 100) : 0;
    return { pass, fail, percent };
  }, [report]);

  const runChecks = async () => {
    setRunning(true);
    setMessage('Running release readiness checks...');
    try {
      const next = await runReleaseReadinessChecks();
      setReport(next);
      const allPass = next.items.every((item) => item.pass);
      setMessage(allPass ? 'All quality gates passed.' : 'Some quality gates need attention before release.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] text-[#1F2933] p-4 md:p-6">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <header className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#52606D]">Phase 5 - Release Hardening</p>
              <h1 className="font-serif text-2xl font-bold">Code Health, KPI Gates, and Production Readiness</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={runChecks}
                disabled={running}
                className="rounded-lg bg-[#0F766E] px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {running ? <Loader2 className="mr-1 inline-block h-4 w-4 animate-spin" /> : <ClipboardList className="mr-1 inline-block h-4 w-4" />}
                Run checks
              </button>
              <button
                onClick={() => report && exportReport(report)}
                disabled={!report}
                className="rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                <Download className="mr-1 inline-block h-4 w-4" />
                Export report
              </button>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3 text-sm text-[#52606D]">
            {message}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#52606D]">Pass Rate</p>
            <p className="mt-2 text-3xl font-bold text-[#0F766E]">{summary.percent}%</p>
          </div>
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#52606D]">Pass Items</p>
            <p className="mt-2 text-3xl font-bold text-[#2F855A]">{summary.pass}</p>
          </div>
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#52606D]">Fail Items</p>
            <p className="mt-2 text-3xl font-bold text-[#B91C1C]">{summary.fail}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#52606D]">Checklist Results</h2>
          <div className="mt-3 space-y-2">
            {report?.items.map((item) => (
              <div key={item.key} className="rounded-xl border border-[#D9E2EC] bg-[#F6F7F4] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-[#2F855A]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#B91C1C]" />
                    )}
                    <p className="font-semibold">{item.label}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#52606D]">Target: {item.target}</p>
                <p className="mt-1 text-sm text-[#1F2933]">Measured: {item.value}</p>
              </div>
            ))}
            {!report && (
              <div className="rounded-xl border border-dashed border-[#D9E2EC] p-4 text-sm text-[#52606D]">
                No report yet. Run checks to generate readiness report.
              </div>
            )}
          </div>
        </section>

        {report?.notes?.length ? (
          <section className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#52606D]">Notes</h2>
            <div className="mt-3 rounded-xl border border-[#D9E2EC] bg-[#FFF4ED] p-3 text-sm text-[#C2410C]">
              <p className="mb-2 inline-flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" /> Attention points</p>
              {report.notes.map((note, idx) => (
                <p key={`note-${idx}`}>- {note}</p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

