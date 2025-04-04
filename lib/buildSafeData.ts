// lib/buildSafeData.ts
export async function useBuildSafeData<T>(
  fetchFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  // Skip API calls during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return fallback;
  }

  try {
    return await fetchFn() || fallback;
  } catch (error) {
    console.error('Data fetch error:', error);
    return fallback;
  }
}