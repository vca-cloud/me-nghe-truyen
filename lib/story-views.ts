const toNumber = (value: unknown) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

export function realViewsFor(story: { real_views?: unknown }) {
  return toNumber(story.real_views)
}

export function fakeViewsFor(story: { base_fake_views?: unknown }) {
  return toNumber(story.base_fake_views)
}

export function totalViewsFor(story: { real_views?: unknown; base_fake_views?: unknown }) {
  return realViewsFor(story) + fakeViewsFor(story)
}
