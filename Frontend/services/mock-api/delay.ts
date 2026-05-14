export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const randomDelay = (min = 200, max = 800) =>
  delay(Math.floor(Math.random() * (max - min + 1) + min))

export const simulateFailure = (failRate = 0.1): boolean => Math.random() < failRate

export async function withSimulatedLatency<T>(
  fn: () => T | Promise<T>,
  options: { minMs?: number; maxMs?: number; failRate?: number; failMessage?: string } = {}
): Promise<T> {
  const { minMs = 200, maxMs = 700, failRate = 0, failMessage = "Simulated server error" } = options
  await randomDelay(minMs, maxMs)
  if (simulateFailure(failRate)) {
    throw new Error(failMessage)
  }
  return fn()
}
