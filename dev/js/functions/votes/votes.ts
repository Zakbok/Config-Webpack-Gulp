export interface VoteResponse {
  COUNT_LIKE?: string;
  COUNT_DISLIKE?: string;
  IS_VOTED?: null | string;
}

export function setVotes (el: HTMLElement, data: VoteResponse | null) {
  let actions = el.querySelectorAll('[data-action="like"], [data-action="dislike"]') as NodeListOf<HTMLElement>;
  let activeClass = 'active';
  // let activeIndex = 0;

  for (let i = 0; i < actions.length; i++) {
    let action = actions[i].getAttribute('data-action');
    let valueEl = actions[i].querySelector('[data-action-value]') as HTMLElement;
    let behavior = actions[i].getAttribute('data-behavior');
    let value;

    actions[i].classList.remove(activeClass);

    if (data !== null) {
      if (data.IS_VOTED && action === data.IS_VOTED.toLowerCase()) {
        // activeIndex = i;
        actions[i].classList.add(activeClass);
      }
    }

    if (valueEl && action === 'like') {
      value = data && data.COUNT_LIKE ? data.COUNT_LIKE : 0;
      valueEl.textContent = value.toString();

      if (behavior === 'reveal') {
        valueEl.classList.remove('d-none');
      }
    } else if (valueEl) {
      value = data && data.COUNT_DISLIKE ? data.COUNT_DISLIKE : 0;
      valueEl.textContent = value.toString();

      if (behavior === 'reveal') {
        valueEl.classList.remove('d-none');
      }
    }
  }

  // actions[activeIndex].classList.add(activeClass);
}
