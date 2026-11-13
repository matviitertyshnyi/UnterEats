import { z } from 'zod';
import { buildDispatchSystemPrompt } from '../prompts/dispatchPrompt.js';
import { CourierRepository } from '../repositories/courierRepo.js';
import type {
  Courier,
  DispatchAdvice,
  PackageType,
  UrgencyLevel,
  VehicleType,
  WeatherCondition,
} from '../types/domain.js';
import { calculateCo2SavedGrams, estimateEtaMinutes, pickBestVehicle } from './deliveryService.js';

const llmResponseSchema = z.object({
  recommendedVehicle: z.enum(['foot', 'ebike', 'cargo_bike', 'scooter', 'car']),
  matchedCourierId: z.number().nullable(),
  matchedCourierName: z.string().nullable(),
  etaMinutes: z.number().positive(),
  co2SavedGrams: z.number().nonnegative(),
  reasoning: z.string().min(1),
  suggestedOrder: z.object({
    packageType: z.enum(['hot_food', 'fragile_flowers', 'bakery', 'pharmacy', 'general']),
    urgency: z.enum(['standard', 'express']),
    weather: z.enum(['clear', 'rain', 'snow']),
    distanceKm: z.number().positive(),
    notes: z.string(),
  }),
});

function parsePromptSignals(prompt: string): {
  packageType: PackageType;
  urgency: UrgencyLevel;
  weather: WeatherCondition;
  distanceKm: number;
  notes: string;
} {
  const lower = prompt.toLowerCase();

  let packageType: PackageType = 'general';
  if (/flower|bouquet|rose|plant|florist/.test(lower)) packageType = 'fragile_flowers';
  else if (/pizza|burger|hot|soup|meal|pasta|taco/.test(lower)) packageType = 'hot_food';
  else if (/bread|pastry|cake|croissant|bakery|sourdough/.test(lower)) packageType = 'bakery';
  else if (/pharmacy|medicine|prescription|pills/.test(lower)) packageType = 'pharmacy';

  const urgency: UrgencyLevel = /urgent|asap|express|fast|quick|rush|min\b/.test(lower)
    ? 'express'
    : 'standard';

  let weather: WeatherCondition = 'clear';
  if (/snow|icy|blizzard|sleet/.test(lower)) weather = 'snow';
  else if (/rain|storm|wet|drizzle/.test(lower)) weather = 'rain';

  const distMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometer)/);
  const distanceKm = distMatch ? Math.min(25, Math.max(0.3, parseFloat(distMatch[1]))) : 2.5;

  const notes: string[] = [];
  if (packageType === 'fragile_flowers') notes.push('Keep upright & handle gently');
  if (packageType === 'hot_food') notes.push('Use insulated thermal bag');
  if (weather !== 'clear') notes.push(`Protect from ${weather}`);

  return {
    packageType,
    urgency,
    weather,
    distanceKm,
    notes: notes.join('; ') || 'Standard local handoff',
  };
}

function findMatchingCourier(
  couriers: Courier[],
  preferredVehicle: VehicleType,
  harshWeather: boolean,
): Courier | null {
  const exact = couriers.find((c) => c.vehicle_type === preferredVehicle);
  if (exact) return exact;

  if (harshWeather) {
    const covered = couriers.find((c) => c.weather_protected);
    if (covered) return covered;
  }

  return couriers[0] ?? null;
}

export class DispatchService {
  constructor(private courierRepo: CourierRepository) {}

  async advise(prompt: string): Promise<DispatchAdvice> {
    const availableCouriers = this.courierRepo.findAvailable();
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (apiKey) {
      const llmResult = await this.tryOpenAi(prompt, availableCouriers, apiKey);
      if (llmResult) return llmResult;
    }

    return this.buildFallbackAdvice(prompt, availableCouriers);
  }

  private async tryOpenAi(
    prompt: string,
    availableCouriers: Courier[],
    apiKey: string,
  ): Promise<DispatchAdvice | null> {
    try {
      const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildDispatchSystemPrompt(availableCouriers) },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) return null;

      const parsed = llmResponseSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return null;

      // Ensure matchedCourierId actually exists in availableCouriers
      const validCourier = availableCouriers.find((c) => c.id === parsed.data.matchedCourierId);
      return {
        ...parsed.data,
        matchedCourierId: validCourier ? validCourier.id : null,
        matchedCourierName: validCourier ? validCourier.name : null,
        mode: 'llm',
      };
    } catch {
      return null;
    }
  }

  private buildFallbackAdvice(prompt: string, availableCouriers: Courier[]): DispatchAdvice {
    const signals = parsePromptSignals(prompt);
    const recommendedVehicle = pickBestVehicle(signals);
    const harshWeather = signals.weather !== 'clear';
    const matched = findMatchingCourier(availableCouriers, recommendedVehicle, harshWeather);

    const effectiveVehicle = matched?.vehicle_type ?? recommendedVehicle;
    const etaMinutes = estimateEtaMinutes(
      signals.distanceKm,
      effectiveVehicle,
      signals.urgency,
      signals.weather,
    );
    const co2SavedGrams = calculateCo2SavedGrams(signals.distanceKm, effectiveVehicle);

    const weatherNote = harshWeather ? ` during ${signals.weather}` : '';
    const courierNote = matched
      ? `Matched with ${matched.name} (${matched.vehicle_type.replace('_', ' ')}).`
      : 'No courier currently online — queued for next available rider.';

    return {
      recommendedVehicle: effectiveVehicle,
      matchedCourierId: matched?.id ?? null,
      matchedCourierName: matched?.name ?? null,
      etaMinutes,
      co2SavedGrams,
      reasoning: `Selected ${effectiveVehicle.replace('_', ' ')} for ${signals.distanceKm} km ${signals.packageType.replace('_', ' ')} delivery${weatherNote}, saving ${co2SavedGrams}g CO₂ vs. a car. ${courierNote}`,
      suggestedOrder: signals,
      mode: 'fallback',
    };
  }
}
