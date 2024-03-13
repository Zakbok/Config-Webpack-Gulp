import getViewport from 'functions/utility/getViewport';
import throttle from 'functions/utility/throttle';
import updateControlsList from 'functions/controls/updateControlsList';
import fillFields from 'functions/utility/fillFields';
import Chat from 'components/chats/chat/chat';
import FileInput from 'components/controls/file/file';
import submitAJAX from 'functions/requests/submitAJAX';
import createModal from 'functions/controls/createModal';
import formatResult from 'functions/requests/formatResult';

document.addEventListener('DOMContentLoaded', function () {
  window.addEventListener('resize', appHeight);
  appHeight();

  sendChatStatRequest();

  function sendChatStatRequest () {
    $.ajax({
      method: 'POST',
      url: PATH_UNREAD_CHATS,
      dataType: 'json',
      success: function (response) {
        console.log(response);

        let containers = document.querySelectorAll('[data-chat-container]');
        let classHidden = 'd-none';
        let users = {};

        for (let j in response.CHATS) {
          let chat = response.CHATS[j];

          for (let k in chat.USERS) {
            users[chat.USERS[k]] = chat.TOTAL;
          }
        }

        for (let i = 0; i < containers.length; i++) {
          let marker = containers[i].querySelector('[data-chat-marker]') as HTMLElement;
          let markerValue = marker.querySelector('[data-chat-marker-value]') as HTMLElement;
          let chatId = parseInt(containers[i].getAttribute('data-chat-id') || '');
          let userId = parseInt(containers[i].getAttribute('data-user-id') || '');
          let category = marker.getAttribute('data-chat-marker') || '';
          let isCategory = category.length;

          if (isCategory) {
            let key = category.toUpperCase();

            markerValue.textContent = response[key];

            if (response[key] > 0) {
              marker.classList.remove(classHidden);
            } else {
              marker.classList.add(classHidden);
            }
          } else if (userId > 0) {
            if (users.hasOwnProperty(userId)) {
              markerValue.textContent = users[userId];

              if (users[userId] > 0) {
                marker.classList.remove(classHidden);
              } else {
                marker.classList.add(classHidden);
              }
            } else {
              markerValue.textContent = '0';
              marker.classList.add(classHidden);
            }
          }
        }
      },
      error: function (response) {
        console.log(response);
      }
    });
  }

  global.sendChatStatRequest = sendChatStatRequest;

  $(document).on('click', '[data-modal-chat-inner]', function () {
    let self = this;

    $.fancybox.open(
      self,
      // fbDefaults
      $.extend({}, fbDefaults, {
        closeExisting: false,
        afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
          let content = typeof current.$content !== 'undefined' ? current.$content.get(0) : null;
          let obChat = Chat.instances.get(document.querySelector('.c-chat') as HTMLElement);
          let form = content.querySelector('form') as HTMLFormElement;

          fillFields(
            form,
            {
              chat: obChat.activeChatRoom,
              user: obChat.form.getAttribute('data-user-id'),
            }
          );
        }
      })
    )
  });

  let fileInputs = document.querySelectorAll('[data-file-default]') as NodeListOf<HTMLElement>;

  for (let i = 0; i < fileInputs.length; i++) {
    new FileInput(fileInputs[i]);
  }

  $(document).on('submit', '[data-ajax-chat-form]', function (e: Event) {
    submitAJAX(this, e, {
      serialize: false,
      resultMessage: 'none',
      onSuccess: function () {
        parent.$.fancybox.close();
      }
    });
  });

  $(document).on('input', '[data-chat-search-input]', function () {
    let value = this.value;
    let obChat = Chat.instances.get(document.querySelector('.c-chat') as HTMLElement);
    let data = {};
    let name = this.name;

    value = value.trim();

    if (value.length > 0) {
      data[name] = this.value;

      obChat.sendRequest('get_chats', {
        displayLoader: false,
        data: data,
        onSuccess: function (response) {
          let list = obChat.el.querySelector('.dialogues-list__list') as HTMLElement;
          let tmpl = (document.querySelector('[id^="tmpl-chat-item"]') as Element).innerHTML;

          list.innerHTML = '';

          if (response.CHATS.length === 0) {
            list.insertAdjacentHTML('beforeend', '<div class="dialogue-note">Сообщения не найдены</div>');
          }

          for (let i in response.CHATS) {
            let chat = response.CHATS[i];
            let user = chat.USERS[Object.keys(chat.USERS)[0]];
            let data = {
              CHAT_ID: chat.ID,
              ID: user.ID,
              NAME: user.USERNAME,
              IMG: user.IMG,
              LATEST_MESSAGE: chat.LATEST_MESSAGE,
              LATEST_MESSAGE_DATETIME: chat.LATEST_MESSAGE_DATETIME,
              LATEST_MESSAGE_ID: chat.LATEST_MESSAGE_ID,
              READ: chat.LATEST_MESSAGE_READ == 1,
              NEW: chat.NEW,
              UNREAD_MESSAGES: chat.UNREAD_MESSAGES,
            };

            list.insertAdjacentHTML('beforeend', Mustache.render(tmpl, data, {}, ['<%', '%>']));
          }

          let dialogueItem = obChat.el.querySelector(`.dialogue-item[data-id="${obChat.activeChatRoom}"]`);

          if (dialogueItem) {
            dialogueItem.classList.add('dialogue-item_active');
          }
        }
      });
    } else {
      obChat.sendRequest('get_chats', {
        onSuccess: function (response) {
          let list = obChat.el.querySelector('.dialogues-list__list') as HTMLElement;

          // if (activeIndex !== null) {
          let tmpl = (document.querySelector('[id^="tmpl-chat-item"]') as Element).innerHTML;

          list.innerHTML = '';

          for (let i in response.CHATS) {
            let chat = response.CHATS[i];
            let user = chat.USERS[Object.keys(chat.USERS)[0]];
            let data = {
              CHAT_ID: chat.ID,
              ID: user.ID,
              NAME: user.USERNAME,
              IMG: user.IMG,
              LATEST_MESSAGE: chat.LATEST_MESSAGE,
              LATEST_MESSAGE_DATETIME: chat.LATEST_MESSAGE_DATETIME,
              // LATEST_MESSAGE_ID: chat.LATEST_MESSAGE_ID,
              READ: chat.LATEST_MESSAGE_READ == 1,
              NEW: chat.NEW,
              UNREAD_MESSAGES: chat.UNREAD_MESSAGES,
            };

            list.insertAdjacentHTML('beforeend', Mustache.render(tmpl, data, {}, ['<%', '%>']));
          }

          let dialogueItem = obChat.el.querySelector(`.dialogue-item[data-id="${obChat.activeChatRoom}"]`);

          if (dialogueItem) {
            dialogueItem.classList.add('dialogue-item_active');
          }
        }
      });
    }
  });

  $(document).on('submit', '[data-chat-search]', function (e) {
    e.preventDefault();
  });

  $(document).on('click', '[data-modal-chat]', function (e) {
    let self = this;
    let disabledClass = 'c-btn_disabled';
    let referrer = self.getAttribute('data-referrer');

    // поскольку некоторые статусы пользователя закрывают возможность использования чата, получим информацию о правах перед открытием
    if (self.classList.contains(disabledClass)) return false;

    self.classList.add(disabledClass);

    $.ajax({
      method: 'POST',
      url: PATH_CHAT_ACCESS,
      dataType: 'json',
      success: function (response) {
        if (response.STATUS === 'success') {
          $.fancybox.open(
            self,
            $.extend({}, fbDefaults, {
              baseTpl: '<div class="fancybox-container fancybox-container_chat" role="dialog" tabindex="-1">' +
                '<div class="fancybox-inner">' +
                '<div class="fancybox-infobar"><span data-fancybox-index></span>&nbsp;/&nbsp;<span data-fancybox-count></span></div>' +
                '<div class="fancybox-toolbar">{{buttons}}</div>' +
                '<div class="fancybox-navigation">{{arrows}}</div>' +
                '<div class="fancybox-stage fancybox-stage_chat"></div>' +
                '<div class="fancybox-caption"><div class="fancybox-caption__body"></div></div>' +
                "</div>" +
                "</div>",
              smallBtn: false,
              buttons: [],
              hideScrollbar: true,
              afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
                // let content = typeof current.$content !== 'undefined' ? current.$content.get(0) : null;
                // let trigger = typeof instance.$trigger !== 'undefined' ? instance.$trigger.get(0) : null;
                let userId = self.getAttribute('data-user-id');
                let viewport = getViewport();

                if (viewport.width < 1024) {
                  $('body').addClass('fancybox_chat');
                }

                let chat = document.querySelector('.c-chat') as HTMLElement;

                if (chat) {
                  new Chat(chat, {
                    handlers: {
                      chats: '/ajax/chat/getChats.php',
                      add_chat: '/ajax/chat/addChat.php',
                      messages: '/ajax/chat/getMessages.php',
                      add_message: '/ajax/chat/addMessage.php',
                      set_activity: '/ajax/chat/setActivity.php',
                      mark_read: '/ajax/chat/markAsRead.php',
                    },
                    delayWatch: true,
                    onInit: function (instance) {
                      instance.sendRequest('get_chats', {
                        data: {
                          USER_ID: userId,
                        },
                        onSuccess: function (response) {
                          let activeIndex = null;
                          let list = instance.el.querySelector('.dialogues-list__list') as HTMLElement;

                          if (userId && response.CHATS) {
                            for (let i in response.CHATS) {
                              if (response.CHATS[i].USERS.hasOwnProperty(userId)) {
                                activeIndex = i;
                              }
                            }
                          }

                          // if (activeIndex !== null) {
                          if (true) {
                            let tmpl = (document.querySelector('[id^="tmpl-chat-item"]') as Element).innerHTML;

                            list.innerHTML = '';

                            for (let i in response.CHATS) {
                              let chat = response.CHATS[i];
                              let user = i === activeIndex ? chat.USERS[userId] : chat.USERS[Object.keys(chat.USERS)[0]];
                              let data = {
                                CHAT_ID: chat.ID,
                                ID: user.ID,
                                NAME: user.USERNAME,
                                IMG: user.IMG,
                                LATEST_MESSAGE: chat.LATEST_MESSAGE,
                                LATEST_MESSAGE_DATETIME: chat.LATEST_MESSAGE_DATETIME,
                                READ: chat.LATEST_MESSAGE_READ == 1,
                                NEW: chat.NEW,
                                UNREAD_MESSAGES: chat.UNREAD_MESSAGES,
                              };

                              list.insertAdjacentHTML('beforeend', Mustache.render(tmpl, data, {}, ['<%', '%>']));
                            }

                            instance.setChatRooms(response.CHATS);
                          }

                          if (activeIndex !== null) {
                            let item = list.querySelector(`.dialogue-item[data-user-id="${userId}"]`) as HTMLElement;

                            item.click();
                          }
                        }
                      });
                    },
                    onMessageRead: function (instance) {
                      sendChatStatRequest();
                    }
                  });
                }
              },
              afterClose: function () {
                let chat = document.querySelector('.c-chat') as HTMLElement;

                chat.setAttribute('data-state', 'dialogues');
                updateControlsList(chat, chat, 'd-none');

                $('body').removeClass('fancybox_chat');

                let obChat = Chat.instances.get(chat);

                if (obChat) {
                  obChat.destroy();
                }
              }
            })
          );
        } else {
          // заказчик не хочет показывать сообщение об ошибке при открытии из уведомлений, но вообще его выключать плохая идея
          if (referrer !== 'notification') {
            let popup = createModal({
              className: 'c-modal_style_default c-modal_width_md',
              title: 'Ошибка',
              content: formatResult({responseText: response.ERRORS})
            });

            $.fancybox.open(popup, (window as any).fbDefaults);
          }
        }
      },
      error: function (response) {
        let popup = createModal({
          className: 'c-modal_style_default c-modal_width_md',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, (window as any).fbDefaults);
      },
      complete: function () {
        self.classList.remove(disabledClass);
      }
    });
  });

  setChatState();

  let handleChatResize = throttle(function () {
    setChatState();
  }, 500);

  function setChatState() {
    let viewport = getViewport();
    let chat = document.querySelector('.c-chat') as HTMLElement;

    if (!chat) return;

    let chatPanels = chat.querySelectorAll('.c-chat__panel');

    if (viewport.width < 1024) {
      for (let i = 0; i < chatPanels.length; i++) {
        let role = chatPanels[i].getAttribute('data-role') || '';

        chatPanels[i].setAttribute('data-display-state', role);
      }
    } else {
      for (let i = 0; i < chatPanels.length; i++) {
        chatPanels[i].setAttribute('data-display-state', 'dialogues,chat');
      }
    }

    updateControlsList(chat, chat, 'd-none');
  }

  $(document).on('click', '[data-modal-chat-confirm]', function () {
    let self = this;

    $.fancybox.open(
      self,
      $.extend({}, fbDefaults, {
        closeExisting: false,
        afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
          let content = typeof current.$content !== 'undefined' ? current.$content.get(0) : null;
          let obChat = Chat.instances.get(document.querySelector('.c-chat') as HTMLElement);
          let form = content.querySelector('form') as HTMLFormElement;

          fillFields(
            form,
            {
              chat: obChat.activeChatRoom
            }
          );
        }
      })
    )
  });

  $(document).on('submit', '[data-chat-delete-confirm]', function (e: Event) {
    submitAJAX(this, e, {
      serialize: false,
      onSuccess: function (form, response) {
        let chat = document.querySelector('.c-chat') as HTMLElement;
        let obChat = Chat.instances.get(chat);
        let chatItem = chat.querySelector(`.dialogue-item[data-id="${response.DATA.ID}"]`) as HTMLElement;

        if (obChat) {
          // кнопка удаления переписки есть только в активном чате, поэтому другие случаи не рассматриваем
          chat.setAttribute('data-state', 'dialogues');
          setChatState();
          obChat.closeChat();
          updateControlsList(chat, chat, 'd-none');

          let chatContent = chat.querySelector('.chat-contact') as HTMLElement;

          chatContent.classList.add('d-none')
          obChat.form.classList.add('d-none');
          obChat.messages.innerHTML = '';
          obChat.messages.insertAdjacentHTML('beforeend', '<div class="c-chat__blank text-center" data-role="message_default">Выберите пользователя для начала диалога</div>');
        }

        if (chatItem) {
          chatItem.remove();
        }

        $.fancybox.close();
      }
    });
  });

  $(document).on('click', '.chat-toggle_inner', function () {
    let chat = document.querySelector('.c-chat') as HTMLElement;

    if (!chat) return;

    let chatPanels = chat.querySelectorAll('.c-chat__panel');
    let obChat = Chat.instances.get(chat);

    chat.setAttribute('data-state', 'dialogues');

    for (let i = 0; i < chatPanels.length; i++) {
      let role = chatPanels[i].getAttribute('data-role') || '';

      chatPanels[i].setAttribute('data-display-state', role);

      if (role === 'dialogues') {
        let item = chatPanels[i].querySelector('.dialogue-item_active');

        if (item) {
          item.classList.remove('dialogue-item_active');
        }
      }
    }

    obChat.closeChat();
    updateControlsList(chat, chat, 'd-none');
  });

  window.addEventListener('resize', handleChatResize);

  $(document).on('click', '.dialogue-item', function () {
    let self = this;
    let chat = $(this).closest('.c-chat').get(0);
    let obChat = Chat.instances.get(chat);
    let siblings = chat.querySelectorAll('.dialogue-item_active');
    let viewport = getViewport();

    if (self.classList.contains('dialogue-item_active')) return;

    if (viewport.width < 1024) {
      chat.setAttribute('data-state', 'chat');
      updateControlsList(chat, chat, 'd-none');
    }

    for (let i = 0; i < siblings.length; i++) {
      siblings[i].classList.remove('dialogue-item_active');
    }

    self.classList.add('dialogue-item_active');

    let chatId = parseInt(self.getAttribute('data-id'));
    let userId = parseInt(self.getAttribute('data-user-id'));

    obChat.stopWatch();
    obChat.form.setAttribute('data-user-id', userId);
    obChat.activeChatRoom = chatId;

    let chatContent = chat.querySelector('.chat-contact') as HTMLElement;

    chatContent.classList.remove('d-none')
    obChat.form.classList.remove('d-none');

    let chatData = obChat.chatRooms[obChat.activeChatRoom];
    let userData = chatData.USERS[userId];

    let img = chatContent.querySelector('[data-field="img"]') as HTMLElement;

    img.style.backgroundImage = `url('${userData.IMG}')`;
    img.classList.remove('skeleton-loading-after');

    fillFields(
      chatContent,
      {
        name: userData.USERNAME,
        role: userData.ROLE,
      },
      {
        onSuccess: function (field) {
          field.classList.remove('skeleton-loading-after');
        }
      }
    );

    obChat.timestamp = 0;
    obChat.history = [];

    if (userId > 0 && chatId === 0) {
      // новый чат
      obChat.messages.innerHTML = '';
    } else {
      // существующий чат
      obChat.messages.innerHTML = '';
      obChat.handleWatch();
    }

    let messageId = parseInt(self.getAttribute('data-latest-message-id') || '');

    if (messageId > 0) {
      setTimeout(function () {
        let message = obChat.messages.querySelector(`.c-message[data-id="${messageId}"]`);
        let scrollAmount = $(message).offset().top - 100;

        $(obChat.messages).animate({
          scrollTop: scrollAmount
        }, 300);
      }, 500);
    }

    // чистим результаты валидации
    obChat.formResult.innerHTML = '';

    // AUTOSIZE FOR TEXTAREA
    let autoTa = document.querySelectorAll('textarea.c-input_autosize');

    for (let i = 0; i < autoTa.length; i++) {
      if (!autoTa[i].classList.contains('u-inited')) {
        autoTa[i].setAttribute('style', 'height:' + (autoTa[i].scrollHeight) + 'px;overflow-y:hidden;');
        autoTa[i].addEventListener('input', updateInputHeight, false);
        autoTa[i].classList.add('u-inited');
      }
    }

    let deleteBtn = document.querySelector('[data-modal-chat-confirm]');

    if (deleteBtn && chatData.NEW) {
      deleteBtn.classList.add('d-none');
    } else if (deleteBtn) {
      deleteBtn.classList.remove('d-none');
    }
  });
});

// функция изменения vh, чтобы побороть влияние адресной панели в мобильных браузерах
function appHeight() {
  const doc = document.documentElement;

  doc.style.setProperty('--vh', (window.innerHeight * .01) + 'px');
}

function updateInputHeight() {
  let height;

  this.style.height = 'auto';
  height = this.parentElement.offsetHeight > this.scrollHeight ? this.parentElement.offsetHeight : this.scrollHeight;
  this.style.height = this.value.length > 0 ? height + 'px' : '';
}

function scrollToElement (el: HTMLElement) {
  let popupInstance = $.fancybox.getInstance();
  let scrolledEl;
  let scrollAmount;

  if (popupInstance) {
    scrolledEl = popupInstance.current.$slide.get(0);
    scrollAmount = $(el).position().top;
  } else {
    scrolledEl = 'html, body';
    scrollAmount = $(el).offset().top;
  }

  $(scrolledEl).animate({
    scrollTop: scrollAmount
  }, 300);
}
