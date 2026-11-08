/** Quita tildes y pasa a minúsculas para que "bateria" encuentre "Batería". */
export const normalize = (s?: string | null) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** ¿Alguno de los campos contiene todas las palabras de la búsqueda? */
export const matches = (query: string, ...fields: (string | number | null | undefined)[]) => {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalize(fields.filter((f) => f !== null && f !== undefined).join(' '));
  return words.every((w) => hay.includes(w));
};
