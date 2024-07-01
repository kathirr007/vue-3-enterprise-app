export function createToneObjects<T extends string>(
  values: T[]
): { name: string; value: T }[] {
  return values.map((value) => ({
    name: value.charAt(0).toUpperCase() + value.slice(1),
    value: value as T, // Type assertion for type safety
  }));
}
