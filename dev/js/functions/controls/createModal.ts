interface Options {
  className?: string;
  title?: string;
  content?: string;
}

export default function createModal (params: Options) {
  let $el = $(`<div class="c-modal ${params.className}"></div>`);
  let $inner = $('<div class="c-modal__body c-form"></div>');

  if (params.title) {
    $inner.append(`<h2 class="c-title c-title_size_md">${params.title}</h2>`);
  }

  if (params.content) {
    $inner.append(`<div class="c-modal__inner">${params.content}</div>`);
  }

  $el.html($inner);
  $(document.body).append($el);

  return $el;
}
