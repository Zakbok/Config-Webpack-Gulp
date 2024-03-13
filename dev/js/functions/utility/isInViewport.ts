import getViewport from 'functions/utility/getViewport';

export default function isInViewport (elem: HTMLElement) {
  var elRect = elem.getBoundingClientRect();
  var viewport = getViewport();

  return (
      elRect.top >= 0 &&
      elRect.left >= 0 &&
      elRect.bottom <= viewport.height &&
      elRect.right <= viewport.width
  );
};
