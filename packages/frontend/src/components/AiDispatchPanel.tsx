import { useState } from 'react';
import { ArrowRight, Leaf, Sparkles, Timer, Truck } from 'lucide-react';
import { api } from '../api/client';
import type { DispatchAdvice } from '../types';

interface AiDispatchPanelProps {
  onApplyAdvice: (advice: DispatchAdvice) => void;
}

const PRESETS = [
  '2 fragile flower bouquets, 3.2 km, heavy rain',
  'Hot margherita pizzas, 1.8 km, express',
  'Sourdough bread box, 0.7 km, clear weather',
];

const VEHICLE_LABELS: Record<string, string> = {
  foot: 'On Foot',
  ebike: 'E-Bike',
  cargo_bike: 'Covered Cargo Bike',
  scooter: 'Scooter',
  car: 'Car',
};

export function AiDispatchPanel({ onApplyAdvice }: AiDispatchPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<DispatchAdvice | null>(null);

  async function runAdvise(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.adviseDispatch(trimmed);
      setAdvice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach AI dispatcher');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runAdvise(prompt);
  }

  return (
    <section
      aria-label="AI Dispatch Assistant"
      className="rounded-xl border border-[#E7E2DA] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C2410C]" aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight text-[#1C1917]">
            AI Dispatch Assistant
          </h2>
        </div>
        {advice && (
          <span className="rounded-full bg-[#F3EFE8] px-2.5 py-0.5 font-mono-data text-[11px] font-medium text-[#57534E]">
            {advice.mode === 'llm' ? 'LLM' : 'Smart Fallback'}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-sm text-[#57534E]">
        Describe the delivery in plain English to match the right vehicle and courier.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="e.g. 2 fragile flower bouquets, 3.2 km in rain, express"
          className="w-full resize-none rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#C2410C] focus:bg-white focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setPrompt(preset);
                void runAdvise(preset);
              }}
              className="rounded-md border border-[#E7E2DA] bg-[#FAF8F4] px-2 py-1 text-xs text-[#57534E] transition-colors hover:border-[#D6CFC4] hover:text-[#1C1917]"
            >
              {preset}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || prompt.trim().length < 3}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Analyzing route & fleet...' : 'Recommend Dispatch'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      )}

      {advice && (
        <div className="mt-4 space-y-3 border-t border-[#E7E2DA] pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[#FAF8F4] px-2 py-2">
              <div className="flex items-center justify-center gap-1 text-xs text-[#57534E]">
                <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mode</span>
              </div>
              <div className="mt-0.5 text-xs font-semibold text-[#1C1917]">
                {VEHICLE_LABELS[advice.recommendedVehicle] ?? advice.recommendedVehicle}
              </div>
            </div>
            <div className="rounded-lg bg-[#FAF8F4] px-2 py-2">
              <div className="flex items-center justify-center gap-1 text-xs text-[#57534E]">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ETA</span>
              </div>
              <div className="mt-0.5 font-mono-data text-xs font-semibold text-[#1C1917]">
                {advice.etaMinutes} min
              </div>
            </div>
            <div className="rounded-lg bg-[#FAF8F4] px-2 py-2">
              <div className="flex items-center justify-center gap-1 text-xs text-[#15803D]">
                <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                <span>CO₂ Saved</span>
              </div>
              <div className="mt-0.5 font-mono-data text-xs font-semibold text-[#15803D]">
                {advice.co2SavedGrams} g
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[#44403C]">{advice.reasoning}</p>

          <button
            type="button"
            onClick={() => onApplyAdvice(advice)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#C2410C] bg-[#FFF7ED] px-3 py-1.5 text-xs font-semibold text-[#9A3412] transition-colors hover:bg-[#FFEDD5]"
          >
            <span>Apply to New Order Form</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
