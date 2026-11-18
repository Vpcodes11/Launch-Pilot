"use client";

import { useState } from "react";
import { Check, Copy, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const samples = [
  {
    platform: "Product Hunt",
    format: "Product tagline",
    draft: "Turn Git commits into customer-facing changelogs",
    guidance: "Lead with what makers get. Keep the tagline under 60 characters.",
  },
  {
    platform: "Show HN",
    format: "Technical introduction",
    draft: "Show HN: DevScribe turns Git commits into changelogs\n\nDevScribe groups commit and pull-request diffs into user-facing changes. I’d love feedback on how well it separates refactors from changes worth announcing.",
    guidance: "Explain how it works and give readers something specific to try or critique.",
  },
  {
    platform: "Reddit",
    format: "Founder discussion",
    draft: "I kept putting off release notes, so I built a tool that drafts them from commits. What would make an automatically drafted changelog worth reviewing for your project?",
    guidance: "Share why you built it and ask a genuine question. Check each subreddit’s rules before posting.",
  },
];

export function LaunchPreview() {
  const [selected, setSelected] = useState(0);
  const [copyResult, setCopyResult] = useState<{ index: number; success: boolean } | null>(null);
  const sample = samples[selected];
  const copyState = copyResult?.index === selected ? copyResult.success : null;

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(sample.draft);
      setCopyResult({ index: selected, success: true });
    } catch {
      setCopyResult({ index: selected, success: false });
    }
  }

  return (
    <section aria-labelledby="launch-preview-title" className="min-w-0 overflow-hidden rounded-2xl border border-indigo-300/20 bg-slate-950/75 shadow-2xl shadow-indigo-950/60">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-400/15 text-indigo-200">
            <Layers3 aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="launch-preview-title" className="font-semibold text-white">Launch kit preview</h2>
            <p className="text-xs text-slate-400">DevScribe · Git changelogs</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-300/25 px-2.5 py-1 text-xs text-emerald-200">Sample</span>
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <div role="group" aria-label="Select a sample platform" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          {samples.map(({ platform }, index) => (
            <button
              key={platform}
              type="button"
              aria-pressed={selected === index}
              onClick={() => {
                setSelected(index);
                setCopyResult(null);
              }}
              className={selected === index
                ? "rounded-lg bg-indigo-300 px-1 py-2 text-xs font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:text-sm"
                : "rounded-lg px-1 py-2 text-xs text-slate-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300 sm:text-sm"}
            >
              {platform}
            </button>
          ))}
        </div>
        <div className="min-h-48 rounded-xl border border-white/10 bg-slate-900/80 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-200">{sample.format}</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-100">{sample.draft}</p>
          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-300">{sample.guidance}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyDraft} className="gap-2">
            {copyState ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            {copyState ? "Copied" : "Copy draft"}
          </Button>
          <span role="status" className="text-xs text-slate-300">{copyState === true ? "Draft copied." : copyState === false ? "Clipboard unavailable. Select the draft to copy it." : ""}</span>
        </div>
      </div>
    </section>
  );
}

