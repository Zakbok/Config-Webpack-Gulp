export default function attributeToArray (value: string | null): [] {
  if (value === null || value.length === 0) return [];

  value = value.replace(/'/g, '"');

  let result = JSON.parse(value) || [];

  return result;
}
