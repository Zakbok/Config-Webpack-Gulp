export default function getHeight (el: HTMLElement): number {
  let height = 0;

  el.style.display = 'block';
  height = el.scrollHeight;
  el.style.display = '';

  return height;
}
