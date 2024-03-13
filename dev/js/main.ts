import PrivacyCheck from 'components/controls/privacy-check/privacy-check';
import ProgressBar from 'components/controls/progressbar/progressbar';
import Tabs from 'components/controls/tabs/tabs';
import AJAXPag from 'components/nav/ajax-pag/ajax-pag';
import Select from 'components/controls/select/select';
import Popup from 'components/controls/popup/popup';
import Acn from 'components/controls/acn/acn';

import submitAJAX from 'functions/requests/submitAJAX';
import fillFields from 'functions/utility/fillFields';
import setControlState from 'functions/controls/setControlState';
import getViewport from 'functions/utility/getViewport';
import updateControlsList from 'functions/controls/updateControlsList';
import {setVotes} from 'functions/votes/votes';
import createModal from 'functions/controls/createModal';
import formatResult from 'functions/requests/formatResult';
import setResultMessage from 'functions/requests/setResultMessage';
import isInViewport from 'functions/utility/isInViewport';

document.addEventListener('DOMContentLoaded', function () {
  let acnsDefault = document.querySelectorAll('[data-acn-default]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < acnsDefault.length; i++) {
    new Acn(acnsDefault[i], {
      icons: false,
      onTransitionEnd: function (instance, event) {
        // дожидаемся конца анимации раскрытия аккордеона
        if (instance.el.classList.contains(instance.options.activeClass) && event.propertyName === 'height') {
          let isVisible = isInViewport(instance.el);

          if (!isVisible) {
            let header = document.querySelector('.c-header') as HTMLElement
            let offset = (header.offsetHeight || 0) + 20;

            let distance = instance.el.getBoundingClientRect().top + window.scrollY - offset;
            // используем вместо scrollIntoView, чтобы точно спозиционировать
            window.scrollTo({top: distance, behavior: 'smooth'});
          }
        }
      }
    });
  }

  let friendsLists = document.querySelectorAll('.friends-list') as NodeListOf<HTMLElement>;

  for (let i = 0; i < friendsLists.length; i++) {
    let friendsList = friendsLists[i];

    // поскольку у нас много вариантов перезагрузки списка, вешаем инциализацию динамически загруженных элементов на наблюдателя
    let observer = new MutationObserver(items => {
      let needsUpdate = false;

      for (let item of items) {
        for (let node of item.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (node.classList.contains('friends-list__item') || node.classList.contains('friends-list')) {
            needsUpdate = true;
          }
        }
      }

      // console.log(needs)

      if (needsUpdate) {
        let list = friendsList.querySelector('.friends-list__list') as HTMLElement;

        // user stats
        let statBlocks = list.querySelectorAll('.skeleton-loading-after[data-stat]') as NodeListOf<HTMLElement>;
        let data = prepareStatData(statBlocks);

        sendStatRequest(data);
      }
    });

    observer.observe(friendsList, {
      childList: true,
      subtree: true
    });
  }

  // кастомный placeholder, потому что Safari не поддерживает переносы строки
  $(document).on('input', '[data-placeholder-custom]', function () {
    let field = $(this).closest('.form-field').get(0);
    let pl = field.querySelector('.form-field__placeholder');

    if (this.value.length) {
      pl.classList.add('d-none');
    } else {
      pl.classList.remove('d-none');
    }
  });

  // DATA PASSWORD
  $(document).on('click', '[data-field-toggle]', function (this: HTMLElement) {
    let self = this;
    let field = $(self).closest('.c-field').get(0);
    let input = field.querySelector('.c-input') as HTMLInputElement;
    let icon = field.querySelector('use') as SVGUseElement;
    let states = {
      default: {
        type: 'password',
        icon: 'eye-crossed',
        title: 'Показать пароль'
      },
      active: {
        type: 'text',
        icon: 'eye',
        title: 'Скрыть пароль'
      }
    }
    let state = input.type === 'password' ? 'active' : 'default';

    input.type = states[state].type;
    self.title = states[state].title;
    icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + states[state].icon);
  });

  $('.c-header').sticky({
    zIndex: 99
  });

  // user stats
  let statBlocks = document.querySelectorAll('[data-stat]') as NodeListOf<HTMLElement>;
  let data = prepareStatData(statBlocks);

  sendStatRequest(data);

  function prepareStatData (els: NodeListOf<HTMLElement>) {
    let data = {
      user_id: []
    };

    for (let i = 0; i < els.length; i++) {
      let id = els[i].getAttribute('data-stat');

      data['user_id'].push(id);
    }

    return data;
  }

  global.prepareStatData = prepareStatData;

  function sendStatRequest (data: {}, root?: HTMLElement | null) {
    if (!root) {
      root = document.documentElement as HTMLElement;
    }

    $.ajax({
      type: 'POST',
      url: PATH_STATS,
      data: data,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        for (let i in response.ITEMS) {
          let item = response.ITEMS[i];
          let els = root.querySelectorAll(`[data-stat="${item.ID}"]`);

          for (let k = 0; k < els.length; k++) {
            if (item.ENLIGHTENED) {
              els[k].setAttribute('data-state', 'status');
              updateControlsList(els[k], els[k], 'd-none');
            }

            if (item.STATS) {
              for (let j in item.STATS) {
                let stat = els[k].querySelector(`[data-stat-code="${j.toLowerCase()}"]`);
                let icon;
                let value;

                if (!stat) continue;

                icon = stat.querySelector('[data-stat-icon]') as HTMLImageElement;
                value = stat.querySelector('[data-stat-value]') as HTMLElement;

                if (value) {
                  value.textContent = item.STATS[j];
                }

                if (j === 'INACTIVITY' && item.SUSPENDED) {
                  if (item.INSURANCE && response.INSURANCE_ICON) {
                    icon.src = response.INSURANCE_ICON;
                  } else if (!item.INSURANCE) {
                    stat.classList.add('u-color-error');
                  }
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

  global.sendStatRequest = sendStatRequest;

  $(document).on('click', '[data-insurance-btn]', function (e) {
    let self = this;

    if (self.classList.contains('c-btn_disabled')) return;

    setControlState(self, 'disabled', 'c-btn_disabled');

    $.ajax({
      method: 'POST',
      url: PATH_INSURANCE_NOTE,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        if (response.STATUS === 'success') {
          if (response.REDIRECT) {
            window.location.href = response.REDIRECT;
          }
        }
      },
      error: function (response) {
        console.log(response);
      },
      complete: function () {
        setControlState(self, 'default', 'c-btn_disabled');
      }
    })
  });

  $(document).on('click', '[data-access-confirm-btn]', function (e) {
    let self = this;

    if (self.classList.contains('c-btn_disabled')) return;

    setControlState(self, 'disabled', 'c-btn_disabled');

    $.ajax({
      method: 'POST',
      url: PATH_ACCESS_CONFIRM,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        if (response.STATUS === 'success') {
          if (response.REDIRECT) {
            window.location.href = response.REDIRECT;
          }
        } else {
          let popup = createModal({
            className: 'c-modal_style_default c-modal_width_md',
            title: 'Ошибка',
            content: formatResult({responseText: response.ERRORS})
          });

          $.fancybox.open(popup, fbDefaults);
        }
      },
      error: function (response) {
        console.log(response);

        let popup = createModal({
          className: 'c-modal_style_default c-modal_width_md',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      },
      complete: function () {
        setControlState(self, 'default', 'c-btn_disabled');
      }
    })
  });

  $(document).on('click', '[data-checkout-btn]', function (e) {
    let self = this;

    if (self.classList.contains('c-btn_disabled')) return;

    let data = {
      product_id: self.getAttribute('data-product-id'),
    }

    setControlState(self, 'disabled', 'c-btn_disabled');

    $.ajax({
      method: 'POST',
      url: PATH_CART,
      data: data,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        if (response.STATUS === 'success') {
          if (response.REDIRECT) {
            window.location.href = response.REDIRECT;
          }
        } else {
          let popup = createModal({
            className: 'c-modal_style_default c-modal_width_md',
            title: 'Ошибка',
            content: formatResult({responseText: response.ERRORS})
          });

          $.fancybox.open(popup, fbDefaults);
        }
      },
      error: function (response) {
        console.log(response);

        let popup = createModal({
          className: 'c-modal_style_default c-modal_width_md',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      },
      complete: function () {
        setControlState(self, 'default', 'c-btn_disabled');
      }
    })
  });

  // плдсказки
  let popupsDefault = document.querySelectorAll('[data-popup-toggle-default]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < popupsDefault.length; i++) {
    // let placement = popupsDefault[i].getAttribute('data-placement');

    new Popup(popupsDefault[i], {
      // popperOptions: {
      //   placement: popupsDefault[i].getAttribute('data-placement') || 'bottom-end',
      // },
      onOpen: function (instance) {
        instance.popup.setAttribute('data-show', '');

        if (instance.el.getAttribute('data-popup-toggle') === 'filter') {
          document.body.classList.add('overlay-active');
        }

        if (instance.el.getAttribute('data-popup-toggle') === 'notifications') {
          $.ajax({
            method: 'POST',
            url: PATH_NOTIFICATIONS,
            success: function (response) {
              $(instance.popup).html(response);
            },
            error: function (response) {
              console.log(response);

              let resultMessage = setResultMessage({
                status: 'error',
                responseText: 'Ошибка! Попробуйте позже'
              });

              $(instance.popup).html(resultMessage);
            }
          });
        }

        if (instance.el.getAttribute('data-popup-toggle') === 'main_menu') {
          setMenuToggleState(instance.el, 'active');
        }

        if (instance.el.getAttribute('data-popup-toggle') === 'fixed_menu' || instance.el.getAttribute('data-popup-toggle') === 'fixed_menu_top') {
          setMobileMenuToggleState(instance.el, 'active');
          positionMobileMenu(instance.popup, 'active');
        }
      },
      onClose: function (instance) {
        instance.popup.removeAttribute('data-show');

        if (instance.el.getAttribute('data-popup-toggle') === 'filter') {
          document.body.classList.remove('overlay-active');
        }

        if (instance.el.getAttribute('data-popup-toggle') === 'main_menu') {
          setMenuToggleState(instance.el, 'default');
        }

        if (instance.el.getAttribute('data-popup-toggle') === 'fixed_menu' || instance.el.getAttribute('data-popup-toggle') === 'fixed_menu_top') {
          setMobileMenuToggleState(instance.el, 'default');
          positionMobileMenu(instance.popup, 'default');
        }
      }
    });
  }

  // прочитанными уведомления становятся по клику на саму ссылку
  $(document).on('click', '.notification-item_events', function (e: Event) {
    const self = this;
    const readClass = 'notification-item_read';

    // Делаем preventDefault, чтобы запрос точно завершился. Js функционал типа вызова чата все равно не перебьем, но он и со страницы не уводит...
    if (!self.classList.contains(readClass)) {
      e.preventDefault();

      const id = self.getAttribute('data-id');

      $.ajax({
        method: 'POST',
        url: PATH_NOTIFICATIONS,
        data: {id: id, action: 'mark_read'},
        dataType: 'json',
        success: function (response) {
          if (response.STATUS === 'success') {
            self.classList.add(readClass);
            self.click();
            sendNotificationStatRequest();
          }
        }
      });
    }
  });

  sendNotificationStatRequest();

  function sendNotificationStatRequest () {
    $.ajax({
      method: 'POST',
      url: PATH_NOTIFICATIONS,
      data: {action: 'get_stat'},
      dataType: 'json',
      success: function (response) {
        let containers = document.querySelectorAll('[data-notification-container]');
        let classEmpty = 'tab-marker_empty';

        for (let i = 0; i < containers.length; i++) {
          let marker = containers[i].querySelector('[data-notification-marker]') as HTMLElement;
          let markerValue = marker.querySelector('[data-notification-marker-value]') as HTMLElement;

          markerValue.textContent = response.TOTAL;

          if (response.TOTAL > 0) {
            marker.classList.remove(classEmpty);
          } else {
            marker.classList.add(classEmpty);
          }
        }
      }
    });
  }

  global.sendNotificationStatRequest = sendNotificationStatRequest;

  let popupsStat = document.querySelectorAll('[data-popup-toggle-stat]');

  for (let i = 0; i < popupsStat.length; i++) {
    new Popup(popupsStat[i], {
      popperOptions: {
        placement: 'bottom-end',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 10]
            }
          },
          {
            name: 'preventOverflow',
            options: {
              altAxis: true,
              padding: 10
            }
          }
        ]
      },
      onOpen: function (instance) {
        instance.popup.setAttribute('data-show', '');

        let viewport = getViewport();

        if (viewport.width >= 1366) {
          instance.popperInstance.setOptions({
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [108, 10]
                }
              }
            ]
          });
        }
      },
      onClose: function (instance) {
        instance.popup.removeAttribute('data-show');
      }
    });
  }

  $(document).on('click', '[data-popup-close]', function () {
    let popup = $(this).closest('[data-popup]').get(0);
    let popupId = popup.getAttribute('data-popup');
    let popupToggles = document.querySelectorAll(`[data-popup-toggle="${popupId}"]`);

    for (let i = 0; i < popupToggles.length; i++) {
      let obPopup = Popup.instances.get(popupToggles[i]);

      if (!obPopup || obPopup && !obPopup.isOpened) continue;

      obPopup.close();
    }
  });

  // CLICK VOTES
  $(document).on('click', '[data-action="like"], [data-action="dislike"]', function (this: HTMLElement, e: Event) {
    e.preventDefault();

    let self = this;
    let el = $(self).closest('[data-actions-container]').get(0);
    let action = this.getAttribute('data-action');

    $.ajax({
      method: 'POST',
      url: '/ajax/votes/setLike.php',
      data: {
        entity: self.getAttribute('data-entity'),
        item_id: self.getAttribute('data-item-id'),
        action: action,
      },
      dataType: 'json',
      success: function (response) {
        if (response.STATUS === 'success') {
          setVotes(el, response.STAT);
        } else if (response.STATUS === 'error') {
          let resultMessage = formatResult({
            responseText: response.ERRORS
          });

          let popup = createModal({
            className: 'c-modal_style_default c-modal_width_sm',
            title: 'Ошибка',
            content: resultMessage
          });

          $.fancybox.open(popup, fbDefaults);
        }
      },
      error: function (response) {
        console.log(response);

        let popup = createModal({
          className: 'c-modal_default c-modal_width_md',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      }
    });

    // if (action === 'like') {
    //   $.ajax({
    //     method: 'POST',
    //     url: '/ajax/votes/setLike.php',
    //     data: {
    //       entity: self.getAttribute('data-entity'),
    //       item_id: self.getAttribute('data-item-id'),
    //       action: 'like',
    //     },
    //     dataType: 'json',
    //     success: function (response) {
    //       console.log(response);

    //       if (response.STATUS === 'success') {
    //         setVotes(self, response.STAT);
    //       }
    //     },
    //     error: function (response) {
    //       console.log(response);
    //     }
    //   });
    // } else if (action === 'dislike') {
    //   $.ajax({
    //     method: 'POST',
    //     url: '/ajax/votes/setDislike.php',
    //     data: {
    //       entity: self.getAttribute('data-entity'),
    //       item_id: self.getAttribute('data-item-id'),
    //       action: 'dislike',
    //     },
    //     dataType: 'json',
    //     success: function (response) {
    //       console.log(response);

    //       if (response.STATUS === 'success') {
    //         setVotes(self, response.STAT);
    //       }
    //     },
    //     error: function (response) {
    //       console.log(response);
    //     }
    //   });
    // }
  });

  // DATEPICKER INPUTS
  let datepickerInputs = document.querySelectorAll('.datepicker-input') as NodeListOf<HTMLElement>;

  for (let i = 0; i < datepickerInputs.length; i++) {
    $(datepickerInputs[i]).datepicker();
  }

  // отправка формы при изменении галочки
  $(document).on('change', '[data-instant-form] .c-ctrl__input', function () {
    let parent = $(this).closest('form').get(0);

    if (parent.requestSubmit) {
      parent.requestSubmit();
    } else {
      parent.dispatchEvent(new Event('submit'));
    }
  });

  let ajaxPags = document.querySelectorAll('.ajax-pag') as NodeListOf<HTMLElement>;

  for (let i = 0; i < ajaxPags.length; i++) {
    new AJAXPag(ajaxPags[i]);
  }

  let tabsDefault = document.querySelectorAll('[data-tabs-default]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < tabsDefault.length; i++) {
    new Tabs(tabsDefault[i]);
  }

  // PRIVACY
  let privacyChecks = document.querySelectorAll('.privacy-check') as NodeListOf<HTMLElement>;

  for (let i = 0; i < privacyChecks.length; i++) {
    new PrivacyCheck(privacyChecks[i]);
  }

  // SELECTS
  let selects = document.querySelectorAll('[data-select]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < selects.length; i++) {
    new Select(selects[i]);
  }

  // AJAX FORMS
  // обработчик кода авторизации
  let ajaxFormsCode = document.querySelectorAll('[data-ajax-form-code]') as NodeListOf<HTMLFormElement>;

  for (let i = 0; i < ajaxFormsCode.length; i++) {
    ajaxFormsCode[i].addEventListener('submit', function (e: Event) {
      submitAJAX(this, e, {
        serialize: false,
        resultMessage: 'none',
        onSuccess: function (form, response) {
          // по факту у нас здесь два возможных сценария: повторная отправка кода и регистрация
          if (response.EVENT_TYPE === 'REGISTRATION') {
            let parent = $(form).closest('[data-role]').get(0);
            let role = parent ? parent.getAttribute('data-role') : '';

            // открыть следующую форму
            let nextRole = form.getAttribute('data-next');
            let nextPopup = document.querySelector(`[data-role="${nextRole}"]`) as HTMLElement;

            if (nextPopup) {
              $.fancybox.open(
                nextPopup,
                fbDefaults
              )
            }
          }
        },
        onError: function (form, response) {
          let codeInput = form.querySelector('.code-input');

          if (codeInput) {
            codeInput.classList.add('code-input_error');
          }
        }
      });
    });
  }

  $(document).on('submit', '[data-ajax-form]', function (e: Event) {
    submitAJAX(this, e, {
      serialize: false,
      onSuccess: function (form, response) {
        let parent = $(form).closest('[data-role]').get(0);
        let role = parent ? parent.getAttribute('data-role') : '';
        // открыть следующую форму
        let nextRole = form.getAttribute('data-next');
        let nextPopup = document.querySelector(`[data-role="${nextRole}"]`) as HTMLElement;
        // следующее действие
        let nextAction = form.getAttribute('data-next-action');

        if (nextPopup) {
          // для формы с кодом заполняем телефон и запускаем счетчик
          if (role === 'register' || role === 'password') {
            fillFields(nextPopup, {phone: response.DATA.PHONE, email: response.DATA.EMAIL});

            // переключим текст описания
            if (nextRole === 'confirm_reg_soft') {
              let state = 'phone';

              if (response.DATA.EMAIL) {
                state = 'email';
              }

              nextPopup.setAttribute('data-state', state);
              updateControlsList(nextPopup, nextPopup, 'd-none');
            }

            let submitBtn = nextPopup.querySelector('.c-form__submit') as HTMLElement;

            if (submitBtn) {
              let obProgressBar = ProgressBar.instances.get(submitBtn);
              let timerText = submitBtn.querySelector('[data-timer-text]') as HTMLElement;

              submitBtn.addEventListener('click', function (e) {
                if (obProgressBar.state.stopped) {
                  // поскольку после иницилизации таймера кнопка по какой-то причине прекращает отправлять форму, делаем это программно
                  let parent = $(this).closest('form').get(0) as HTMLFormElement;

                  if (parent.requestSubmit) {
                    parent.requestSubmit(submitBtn);
                  } else {
                    parent.dispatchEvent(new Event('submit'));
                  }
                  // и перезапускаем счечтик
                  setControlState(submitBtn, 'disabled', 'c-btn_disabled');
                  timerText.style.display = '';
                  obProgressBar.start();
                }
              });

              if (obProgressBar) {
                if (obProgressBar.state.stopped) {
                  timerText.style.display = '';
                  obProgressBar.start();
                  setControlState(submitBtn, 'disabled', 'c-btn_disabled');
                }
              } else {
                setControlState(submitBtn, 'disabled', 'c-btn_disabled');
                obProgressBar = new ProgressBar(submitBtn, {
                  current: 60,
                  limit: 60,
                  direction: 'decrease',
                  timeFormat: 'sFull',
                  formatTime: false,
                  onTick: function (instance) {
                    if (instance.state.current < 0 && !instance.state.stopped) {
                      instance.stop();
                      timerText.style.display = 'none';
                      setControlState(submitBtn, 'default', 'c-btn_disabled');
                    }
                  }
                });
              }
            }
          }

          $.fancybox.open(
            nextPopup,
            fbDefaults
          )
        }

        if (form.hasAttribute('data-state')) {
          form.setAttribute('data-state', 'success');

          let title = form.querySelector('[data-note-title]');
          let text = form.querySelector('[data-note-text]');

          if (title && response.TITLE) {
            title.innerHTML = response.TITLE;
          }

          if (text && response.NOTE) {
            text.innerHTML = response.NOTE;
          }

          updateControlsList(form, form, 'd-none');
        }

        if (nextAction === 'start_order') {
          let productField = form.querySelector('[data-field="product_id"]') as HTMLInputElement;
          let data = {
            product_id: productField ? parseInt(productField.value) : 0,
          };

          $.ajax({
            method: 'POST',
            url: PATH_CART,
            data: data,
            dataType: 'json',
            success: function (response) {
              if (response.REDIRECT) {
                window.location.href = response.REDIRECT;
              }
            },
            error: function (response) {
              console.log(response);

              let popup = createModal({
                className: 'c-modal_style_default c-modal_width_md',
                title: 'Ошибка',
                content: formatResult({responseText: 'Неизвестная ошибка. Пожалуйста, попробуйте позже'})
              });

              $.fancybox.open(popup, (window as any).fbDefaults);
            }
          });
        }
      }
    });
  });

  // благодарности
  let ajaxFormsThanks = document.querySelectorAll('[data-ajax-form-thanks]') as NodeListOf<HTMLFormElement>;

  for (let i = 0; i < ajaxFormsThanks.length; i++) {
    ajaxFormsThanks[i].addEventListener('submit', function (e: Event) {
      submitAJAX(this, e, {
        serialize: false,
        onSuccess: function (form, response) {
          let fieldId = form.querySelector('[data-field="ID"]') as HTMLInputElement;
          let fieldMessage = form.querySelector('[data-field="MESSAGE"]');
          let submit = form.querySelector('[type="submit"]');
          let messages = {
            edit: 'Сохранить изменения',
            saved: 'Сохранено...',
          }

          if (fieldId && response.DATA && response.DATA.ID) {
            fieldId.value = response.DATA.ID;
          }

          if (fieldMessage) {
            $(fieldMessage).addClass('c-input_border c-input_lined_secondary');
          }

          if (submit) {
            let text = submit.querySelector('.c-btn__text') as HTMLElement;

            // setControlState(submit, 'disabled', 'c-btn_disabled');
            text.textContent = messages.saved;

            setTimeout(() => {
              submit.classList.remove('c-btn_width_sm');
              submit.classList.add('c-btn_width_md');
              text.textContent = messages.edit;
              // setControlState(submit, 'default', 'c-btn_disabled');
            }, 2000);
          }
        }
      });
    });
  }

  $(document).on('change', '[data-toggle-journal-visibility]', function () {
    let self = this;
    let parent = $(this).closest('.btn-input-container').get(0);
    let icon = parent.querySelector('use');
    let text = parent.querySelector('[data-text]');
    let iconHref = '#';
    let icons = {
      active: 'eye',
      inactive: 'eye-crossed',
    }
    let data = {
      ID: this.value
    };

    if (this.checked) {
      data.ACTION = 'show';
      iconHref += icons.active;
    } else {
      data.ACTION = 'hide';
      iconHref += icons.inactive;
    }

    $.ajax({
      method: 'POST',
      data: data,
      url: self.getAttribute('data-src'),
      dataType: 'json',
      success: function (response) {
        console.log(response);

        if (response.STATUS === 'success') {
          icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref);
          text.textContent = response.NOTE;
        } else {
          self.checked = !self.checked;
        }
      },
      error: function (response) {
        console.log(response);
      }
    })
  });

  $(document).on('change', '[data-field="VISIBILITY"]', function () {
    let parent = $(this).closest('.btn-input-container').get(0);
    let icon = parent.querySelector('use');
    let iconHref = '#';
    let icons = {
      active: 'eye',
      inactive: 'eye-crossed',
    }

    if (this.checked) {
      iconHref += icons.active;
    } else {
      iconHref += icons.inactive;
    }

    icon.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconHref);
  });

  $(document).on('click', '[data-reset-form-state]', function () {
    let form = $(this).closest('[data-state]').get(0) as HTMLElement;

    form.setAttribute('data-state', 'default');
    updateControlsList(form, form, 'd-none');
  });

  $(document).on('input', '.code-input__input', function (e: Event) {
    let parent = $(this).closest('.code-input').get(0);
    let hiddenInput = parent.querySelector('.code-input__value');
    let inputs = parent.querySelectorAll('.code-input__input');
    let index = Array.prototype.indexOf.call(inputs, this);
    let maxLength = this.maxLength || 1;
    let val = '';

    this.value = this.value.replace(/[^0-9]/g, '');

    for (let i = 0; i < inputs.length; i++) {
      val += inputs[i].value;
    }

    hiddenInput.value = val;

    if (this.value.length >= maxLength) {
      let nextInput = inputs[index + 1];

      if (nextInput) {
        nextInput.focus();
      } else {
        let form = $(this).closest('form').get(0);

        if (form) {
          form.dispatchEvent(new Event('submit'));
        }
      }
    }
  });

  // fancybox
  let fbDefaults: FancyBoxOptions = {
    btnTpl: {
      smallBtn: `
        <button data-fancybox-close class="modal-close c-btn c-btn_underline c-btn_quarternary c-btn_sm c-btn_no-text" title="{{CLOSE}}">
          <svg xmlns="http://www.w3.org/2000/svg" class="c-btn__icon svg-ico svg-ico_no_fill">
              <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#times"></use>
          </svg>
        </button>`
    },
    touch: false,
    animationEffect: false,
    closeExisting: true,
    autoFocus: false,
    lang: document.documentElement.lang,
    i18n: {
      ru: {
        CLOSE: 'Закрыть',
        NEXT: 'Далее',
        PREV: 'Назад',
        ERROR: 'При загрузке запрошенного контента возникла ошибка.<br/>Пожалуйста, попробойте позже.',
        PLAY_START: 'Начать показ слайд-шоу',
        PLAY_STOP: 'Поставить на паузу',
        FULL_SCREEN: 'Полноэкранный режим',
        THUMBS: 'Миниатюры',
        DOWNLOAD: 'Скачать',
        SHARE: 'Поделиться',
        ZOOM: 'Увеличить'
      }
    }
  };

  (window as any).fbDefaults = fbDefaults;

  $(document).on('click', '[data-modal]', function () {
    $.fancybox.open(
      this,
      $.extend({} , {
        afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
          let content = typeof current.$content !== 'undefined' ? current.$content.get(0) : null;

          if (content) {
            let els = content.querySelectorAll('.scrollbar-container');

            for (let i = 0; i < els.length; i++) {
              if (els[i].classList.contains('mb-container')) continue;

              let item = new MiniBar(els[i], {
                minBarSize: 6,
                alwaysShowBars: true
              });
            }

            let $bg = instance.$refs.bg;
            let gradientClass = 'fancybox-bg_gradient';

            if (content.hasAttribute('data-gradient')) {
              $bg.addClass(gradientClass);
            } else {
              $bg.removeClass(gradientClass);
            }
          }
        }
      }, fbDefaults)
    );
  });

  $(document).on('click', '[data-modal-notifications]', function () {
    $.fancybox.open(
      this,
      $.extend({}, {
        afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
          let content = typeof current.$content !== 'undefined' ? current.$content.get(0) : null;

          if (content) {
            let notifBody = content.querySelector('.popup-notifications') as HTMLElement;

            $.ajax({
              method: 'POST',
              url: PATH_NOTIFICATIONS,
              success: function (response) {
                $(notifBody).html(response);
              },
              error: function (response) {
                let resultMessage = setResultMessage({
                  status: 'error',
                  responseText: 'Ошибка! Попробуйте позже'
                });

                $(notifBody).html(resultMessage);
              }
            });
          }
        }
      }, fbDefaults)
    );
  });

  // маска
  const phoneMaskOptions = {
    translation: {
      r: {
        pattern: /[+]/,
        optional: true
      }
    }
  };

  (window as any).phoneMaskOptions = phoneMaskOptions;

  $('input[type="tel"], [data-phone]').mask('r0 (000) 000-00-00', phoneMaskOptions);
});

function setMenuToggleState (el: Element, state: 'active' | 'default' = 'default') {
  let icon = el.querySelector('svg') as SVGElement;
  let iconUse = icon.querySelector('use') as SVGUseElement;
  let iconsMap = {
    default: '#bars-secondary',
    active: '#times',
  }

  switch (state) {
    case 'active':
      icon.classList.remove('svg-ico_no_stroke');
      icon.classList.add('svg-ico_no_fill');

      break;

    case 'default':
      icon.classList.add('svg-ico_no_stroke');
      icon.classList.remove('svg-ico_no_fill');

      break;
  }

  iconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconsMap[state]);
}

function setMobileMenuToggleState (el: Element, state: 'active' | 'default' = 'default') {
  let icon = el.querySelector('svg') as SVGElement;
  let iconUse = icon.querySelector('use') as SVGUseElement;
  let iconsMap = {
    default: '#bars',
    active: '#times',
  }

  switch (state) {
    case 'active':
      icon.classList.remove('svg-ico_no_stroke');
      icon.classList.add('svg-ico_no_fill');

      break;

    case 'default':
      icon.classList.add('svg-ico_no_stroke');
      icon.classList.remove('svg-ico_no_fill');

      break;
  }

  iconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconsMap[state]);
}

function positionMobileMenu (el: HTMLElement, state: 'active' | 'default' = 'default') {
  let id = el.getAttribute('data-popup');

  switch (state) {
    case 'active':
      if (id === 'fixed_menu_top') {
        // верхнее меню
        let ref = document.querySelector('.c-header') as HTMLElement;
        let refDims = ref.getBoundingClientRect();
        let elDims = el.getBoundingClientRect();
        let paddingTop = 17;

        el.style.width = `${ref.offsetWidth}px`;
        el.style.top = `${paddingTop * -1}px`;
        el.style.left = `${elDims.left * -1}px`;
      } else if (id === 'fixed_menu') {
        // нижнее меню
        let ref = document.querySelector('.fixed-menu') as HTMLElement;
        let refDims = ref.getBoundingClientRect();
        let elDims = el.getBoundingClientRect();
        let paddingTop = 14;

        el.style.width = `${ref.offsetWidth}px`;
        el.style.top = `${(el.offsetHeight + paddingTop - ref.offsetHeight) * -1}px`;
        el.style.left = `${elDims.left * -1}px`;
      }

      break;

    case 'default':
      el.style.top = '';
      el.style.left = '';

      break;
  }
}
