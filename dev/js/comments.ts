import Loader from 'components/loaders/radial-loader/radial-loader';
import Catalog from 'components/catalogs/catalog-section/catalog-section';
import Select from 'components/controls/select/select';
import Unfold from 'components/controls/unfold/unfold';

import setResultMessage from "functions/requests/setResultMessage";
import submitAJAX from 'functions/requests/submitAJAX';
import fillFields from 'functions/utility/fillFields';
import getQueryParams from 'functions/requests/getQueryParams';

/**
 * Комментарии
 */

// Несмотря на то, что по дизайну тут многоуровневые комментарии, в плане функционала они не имеют вложенности. Кнопка "ответить" просто подставляет имя в текущую форму, а не клонирует ее, поэтому реализация самая базовая

document.addEventListener('DOMContentLoaded', function () {
  // прокрутка до записи в дневнике, должна срабатывать только в разделе дневников
  const url = window.location.href;
  const urlParams = getQueryParams(url);

  if (urlParams.ID && !urlParams.COMMENT_ID && url.includes('/personal/diary/')) {
    const recordId = parseInt(urlParams.ID);
    const target = document.querySelector(`[data-entity="blogpost_item"][data-id="${recordId}"]`) as HTMLElement;
    const header = document.querySelector('.c-header') as HTMLElement;
    const gap = 25;
    let top = 0;

    if (target) {
      top = $(target).offset().top - header.clientHeight - gap;

      $('html, body').stop().animate({
        scrollTop: top
      }, 500);
    }
  }

  // удаление комментариев
  $(document).on('click', '[data-action="delete_comment"]', function (e: Event) {
    e.preventDefault();

    let parent = $(this).closest('.comment-item').get(0);
    let id = parseInt(parent.getAttribute('data-id') || '');
    let data = {
      id: id,
    }

    $.ajax({
      method: 'POST',
      url: PATH_DELETE_COMMENT,
      data: data,
      dataType: 'json',
      success: function (response) {
        const commentItem = $(parent).closest('.comments-list__item').get(0);
        const tmpl = (document.querySelector('[id^="tmpl-comment-deleted"]') as Element).innerHTML;

        let data = {
          TEXT: response.NOTE,
        }

        parent.remove();
        commentItem.insertAdjacentHTML('beforeend', Mustache.render(tmpl, data, {}, ['<%', '%>']));
      },
      error: function (response) {
        console.log(response);
      }
    });
  });

  let list = document.querySelector('.blogposts-list') as HTMLElement;

  if (list) {
    initBlogpostsEvents(list);
  }

  function initBlogpostsEvents (el: HTMLElement) {
    let items = el.querySelectorAll('.blogpost-item') as NodeListOf<HTMLElement>;
    // счетчики постов
    let statBlocks = el.querySelectorAll('[data-stat]') as NodeListOf<HTMLElement>;
    let data = prepareStatData(statBlocks);

    sendStatRequest(data);

    // счетчики комментариев
    statBlocks = el.querySelectorAll('[data-post-stat]') as NodeListOf<HTMLElement>;
    data = preparePostStatData(statBlocks);

    sendPostStatRequest(data);

    for (let i = 0; i < items.length; i++) {
      if (items[i].hasAttribute('data-inited')) continue;
        let unfold = items[i].querySelector('.blogpost-unfold') as HTMLElement;

        new Unfold(unfold, {
          initialHeight: 84,
          step: 0,
          responsive: false,
        });

        items[i].setAttribute('data-inited', '');

        let container = items[i].querySelector('[data-comments]') as HTMLElement;
        let data = {
          entity_id: container.getAttribute('data-entity-id'), // для инфоблоков/highload-блоков id блока
          item_id: container.getAttribute('data-item-id'), // id летны комментариев
        }

        getComments(data, container, {url: '/ajax/comments/main.php', scrollToComment: true});
    }

    el.setAttribute('data-inited', '');

    let recordsTotal = document.querySelector('[data-records-count]');
    let recordsTotalTarget = document.querySelector('[data-records-count-target]');

    if (recordsTotal && recordsTotalTarget) {
      recordsTotalTarget.textContent = recordsTotal.textContent;
    }
  }

  global.initBlogpostsEvents = initBlogpostsEvents;

  let catalog = document.querySelector('[data-catalog]') as HTMLElement;

  if (catalog) {
    // поскольку у нас много вариантов перезагрузки списка, вешаем инциализацию динамически загруженных элементов на наблюдателя
    let observer = new MutationObserver(items => {
      let needsUpdate = false;

      for (let item of items) {
        for (let node of item.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (node.classList.contains('blogposts-list__item') || node.classList.contains('blogposts-list')) {
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        let list = document.querySelector('.blogposts-list') as HTMLElement;

        initBlogpostsEvents(list);
      }
    });

    observer.observe(catalog, {
      childList: true,
      subtree: true
    });

    new Catalog(catalog, {
      updateParams: true,
    });
  }

  // SELECTS
  let selects = document.querySelectorAll('[data-select-blogposts]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < selects.length; i++) {
    new Select(selects[i], {
      onClick: function (instance, item) {
        let parent = $(instance.el).closest('[data-catalog-form]').get(0) as HTMLFormElement;
        let orderInput = parent.querySelector('[name="ORDER"]') as HTMLInputElement;

        if (orderInput && item.hasAttribute('data-sort-order')) {
          orderInput.value = item.getAttribute('data-sort-order') || '';
        }

        if (['STEP_FROM', 'STEP_TO'].indexOf(instance.input.name) > -1) {
          handleStepsRange(instance, parent);
        }

        if (parent.requestSubmit) {
          parent.requestSubmit();
        } else {
          parent.dispatchEvent(new Event('submit'));
        }
      },
      onOpen: function (instance) {
        let parent = $(instance.el).closest('[data-catalog-form]').get(0) as HTMLFormElement;

        if (['STEP_FROM', 'STEP_TO'].indexOf(instance.input.name) > -1) {
          handleStepsRange(instance, parent, 'open');

          let top = instance.activeItems[0].offsetTop;
          let menu = instance.popup.querySelector('.c-select-custom__menu') as HTMLElement;

          menu.scrollTop = top;
        }
      }
    });
  }

  // управление пунктами меню диапазона в фильтре
  function handleStepsRange (obSelect: Select, form: HTMLFormElement, eventName: string = '') {
    let obSelectFrom = null;
    let obSelectTo = null;
    let select;
    let caller = obSelect.input.name;

    if (obSelect.input.name === 'STEP_FROM') {
      obSelectFrom = obSelect;
      select = form.querySelector('[data-select-filter-to]') as HTMLElement;
      obSelectTo = Select.instances.get(select);
    } else if (obSelect.input.name === 'STEP_TO') {
      obSelectTo = obSelect;
      select = form.querySelector('[data-select-filter-from]') as HTMLElement;
      obSelectFrom = Select.instances.get(select);
    }

    if (!obSelectFrom || !obSelectTo) return;

    let fromValue = parseInt(obSelectFrom.input.value);
    let toValue = parseInt(obSelectTo.input.value);

    // console.log(caller);

    if (caller === 'STEP_FROM') {
      console.log(1);
      let nextItem = null;

      for (let i = 0; i < obSelectTo.menuItems.length; i++) {
        let item = obSelectTo.menuItems[i];
        let value = parseInt(item.getAttribute('data-value') || '');

        if (value < fromValue) {
          item.classList.add('d-none');
        } else {
          item.classList.remove('d-none');

          if (!nextItem && fromValue > toValue) {
            nextItem = item;
            obSelectTo.setActive(nextItem, false, true);
          }
        }
      }
    } else if (caller === 'STEP_TO' && fromValue > toValue) {
      console.log(2);
      let nextItem = null;

      for (let i = 0; i < obSelectFrom.menuItems.length; i++) {
        let item = obSelectFrom.menuItems[i];
        let value = parseInt(item.getAttribute('data-value') || '');

        if (value < toValue) {
          // item.classList.add('d-none');
        } else {
          item.classList.remove('d-none');

          if (!nextItem) {
            nextItem = item;
            obSelectFrom.setActive(nextItem, false, true);
          }
        }
      }
    } else if (caller === 'STEP_TO' && eventName === 'open') {
      for (let i = 0; i < obSelectTo.menuItems.length; i++) {
        let item = obSelectTo.menuItems[i];
        let value = parseInt(item.getAttribute('data-value') || '');

        if (value < fromValue) {
          item.classList.add('d-none');
        } else {
          item.classList.remove('d-none');
        }
      }
    }
  }

  // статистика комментариев
  function preparePostStatData (els: NodeListOf<HTMLElement>) {
    let data = {
      post_id: []
    };

    for (let i = 0; i < els.length; i++) {
      let id = els[i].getAttribute('data-post-stat');

      data['post_id'].push(id);
    }

    return data;
  }

  function sendPostStatRequest (data: {}, root?: HTMLElement | null) {
    if (!root) {
      root = document.documentElement as HTMLElement;
    }

    $.ajax({
      type: 'POST',
      url: PATH_POSTS_STATS,
      data: data,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        for (let i in response.ITEMS) {
          let item = response.ITEMS[i];
          let els = root.querySelectorAll(`[data-post-stat="${item.ID}"]`);

          for (let k = 0; k < els.length; k++) {
            if (item.STATS) {
              for (let j in item.STATS) {
                let code = j.toLowerCase();
                let stat = els[k].querySelector(`[data-stat-code="${code}"]`);
                let value;

                if (!stat) continue;

                value = stat.querySelector('[data-stat-value]') as HTMLElement;
                value.textContent = item.STATS[j];

                if (code === 'likes' && item.IS_VOTED === 'like') {
                  stat.classList.add('active');
                } else if (code === 'dislikes' && item.IS_VOTED === 'dislike') {
                  stat.classList.add('active');
                }
              }
            }

            els[k].classList.remove('skeleton-loading-after');
          }
        }
      },
      error: function (response) {
        console.log(response);
      }
    });
  }

  // раскрытие формы
  $(document).on('focus', '[data-comment-input]', function () {
    let form = $(this).closest('.comment-form').get(0);

    form.classList.remove('comment-form_minimized');
    form.classList.add('comment-form_active');
  });

  // закрытие формы
  $(document).on('click', '[data-close-form]', function () {
    let form = $(this).closest('.comment-form').get(0);
    let formResult = form.querySelector('[data-form-result]');

    formResult.innerHTML = '';
    form.classList.remove('comment-form_active');
    form.classList.add('comment-form_minimized');
  });

  $(document).on('submit', '[data-ajax-form-comment]', function (this: HTMLFormElement, e: Event) {
    let self = this;

    submitAJAX(this, e, {
      onSuccess: function (form) {
        let container = $(form).closest('[data-comments]').get(0) as HTMLElement;
        let data = {
            entity_id: container.getAttribute('data-entity-id'), // для инфоблоков/highload-блоков id блока
            item_id: container.getAttribute('data-item-id'), // id летны комментариев
            comment_id: self.getAttribute('data-comment-id'), // id комментария, на который идет ответ, если есть
            action: 'update'
        }

        let parentIdInput = form.querySelector('[data-field="parent_id"]') as HTMLInputElement;

        if (parentIdInput) {
          parentIdInput.value = '';
        }

        getComments(data, container, {url: '/ajax/comments/main.php'});
      },
      onError: function (form) {
        setTimeout(function () {
          let formResult = form.querySelector('[data-form-result]') as HTMLElement;

          formResult.innerHTML = '';
        }, 5000);
      }
    });
  });

  $(document).on('click', '[data-reply]', function () {
    let self = this;
    let comment = $(this).closest('.comment-item').get(0);
    let userName = comment.querySelector('.comment-author__name');
    let commentsList = $(this).closest('.comments-list').get(0);
    let form = commentsList.querySelector('.comment-form');
    let textarea = form.querySelector('textarea.c-input');

    form.classList.remove('comment-form_minimized');
    form.classList.add('comment-form_active');
    fillFields(form, {parent_id: comment.getAttribute('data-id')});
    textarea.value = userName.textContent.trim() + ', ';
  });
});

function getComments (data: {}, el: HTMLElement, params: {} = {}) {
	let loader = new Loader(el);
  let anchor;

  if (el.hasAttribute('[data-comments-container]')) {
    anchor = el;
  } else {
    anchor = el.querySelector('[data-comments-container]') as HTMLElement;
  }

	$.ajax({
		method: 'POST',
		url: params.url,
		data: data,
		success: function (response) {
			$(anchor).replaceWith(response);

      el.classList.remove('d-none');

      // прокрутка до комментария
      if (params.scrollToComment) {
        const url = window.location.href;
        const urlParams = getQueryParams(url);

        if (urlParams.COMMENT_ID && url.includes('/personal/diary/')) {
          const recordId = parseInt(urlParams.COMMENT_ID);
          const target = document.querySelector(`[data-entity="comment_item"][data-id="${recordId}"]`) as HTMLElement;
          const header = document.querySelector('.c-header') as HTMLElement;
          const gap = 25;
          let top = 0;

          if (target) {
            top = $(target).offset().top - header.clientHeight - gap;

            $('html, body').stop().animate({
              scrollTop: top
            }, 500);
          }
        }
      }
		},
		error: function (response) {
			console.log(response);

			let errorMessage = 'Что-то пошло не так. Пожалуйста, попробуйте позже.';
	    let resultMessage = setResultMessage({
				status: 'error',
				responseText: errorMessage
	    });

			$(anchor).html(resultMessage);
		},
		complete: function () {
			loader.setState('hidden');
		}
	});
}

