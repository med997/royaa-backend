export type Stage = 'confirmed' | 'preparing' | 'shipped' | 'delivered';

const HOURS_TO_STAGE: Record<'standard' | 'express', Record<'preparing' | 'shipped' | 'delivered', number>> = {
  standard: { preparing: 6, shipped: 24, delivered: 72 },
  express: { preparing: 2, shipped: 10, delivered: 24 },
};

const STAGE_LABELS: Record<Stage, string> = {
  confirmed: 'Order confirmed',
  preparing: 'Preparing your order',
  shipped: 'Order shipped',
  delivered: 'Delivered',
};

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3600 * 1000);
}

export function computeTimeline(createdAt: Date, deliveryMethod: string, now: Date = new Date()) {
  const offsets = HOURS_TO_STAGE[deliveryMethod as 'standard' | 'express'] ?? HOURS_TO_STAGE.standard;
  const stages: { stage: Stage; label: string; at: Date }[] = [
    { stage: 'confirmed', label: STAGE_LABELS.confirmed, at: createdAt },
    { stage: 'preparing', label: STAGE_LABELS.preparing, at: addHours(createdAt, offsets.preparing) },
    { stage: 'shipped', label: STAGE_LABELS.shipped, at: addHours(createdAt, offsets.shipped) },
    { stage: 'delivered', label: STAGE_LABELS.delivered, at: addHours(createdAt, offsets.delivered) },
  ];

  let currentStage: Stage = 'confirmed';
  for (const s of stages) if (now.getTime() >= s.at.getTime()) currentStage = s.stage;

  return { currentStage, stages: stages.map((s) => ({ ...s, done: now.getTime() >= s.at.getTime() })) };
}
