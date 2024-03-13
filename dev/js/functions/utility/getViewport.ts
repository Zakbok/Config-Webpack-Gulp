export default function getViewport () {
  let viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  let viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  return {
    width: viewportWidth,
    height: viewportHeight
  };
}
