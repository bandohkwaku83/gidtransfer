/** Strip letters from phone/contact input; digits and symbols are kept. */
export function sanitizeContactNumberInput(value: string): string {
  return value.replace(/[a-zA-Z]/g, "");
}

export function hasContactNumberLetters(value: string): boolean {
  return /[a-zA-Z]/.test(value);
}
