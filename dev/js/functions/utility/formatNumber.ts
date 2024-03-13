export default function formatNumber (char: number): string {
  return char < 10 ? `0${char}` : char.toString();
}
