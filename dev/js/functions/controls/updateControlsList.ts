import hasValueInAttribute from 'functions/utility/hasValueInAttribute';

export default function updateControlsList (el: HTMLElement, list: HTMLElement, hiddenClass: string) {
  let state = el.getAttribute('data-state') || '';
  let controls = list.querySelectorAll('[data-display-state]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < controls.length; i++) {
    if (hasValueInAttribute(controls[i], state, 'data-display-state')) {
      controls[i].classList.remove(hiddenClass);
    } else {
      controls[i].classList.add(hiddenClass);
    }
  }
}
