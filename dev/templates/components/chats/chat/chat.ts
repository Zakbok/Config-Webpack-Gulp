import merge from 'functions/utility/merge';
import setResultMessage from 'functions/requests/setResultMessage';
import validateForm from 'functions/requests/validateForm';
import isVisible from 'functions/utility/isVisible';
import Loader from 'components/loaders/radial-loader/radial-loader';
import throttle from 'functions/utility/throttle';

interface Options {
  chats: string;
  messages: string;
  form: string;
  formResult: string;
  input: string;
  delayWatch: boolean;
  handlers: Handlers;
  onInit?: (instance: Chat) => void;
  onMessageRead?: (instance: Chat) => void;
}

interface Handlers {
  chats?: string;
  add_chat?: string;
  messages?: string;
  add_message?: string;
  set_activity?: string;
  mark_read?: string;
}

interface RequestParams {
  displayLoader?: boolean;
  clean?: boolean;
  chatRoom?: number;
  onSuccess?: (response: any) => void;
  onComplete?: (response: any) => void;
}

interface ChatUser {
  ID: string;
  NAME: string;
  IMG: string;
}

interface ChatRoom {
  ID: number;
  NEW: boolean;
  USERS: ChatUser[];
}

class Chat {
  el: HTMLElement;
  options: Options;
  chats: HTMLElement;
  messages: HTMLElement;
  form: HTMLFormElement;
  formResult: HTMLElement;
  input: HTMLTextAreaElement;
  chatRooms: Record<ChatRoom['ID'], ChatRoom>;
  activeChatRoom: number;
  timestamp: number;
  history: [];
  timeout: ReturnType<typeof setTimeout> | null;
  scrollFunction: null | (() => void);

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      chats: '[data-chat-container]',
      messages: '[data-messages-container]',
      form: '.chat-form',
      formResult: '[data-result]',
      input: '[data-chat-textarea]',
      delayWatch: false,
      handlers: {
        chats: '/ajax/handleChat.php',
        add_chat: '/ajax/handleChat.php',
        messages: '/ajax/handleChat.php',
        add_message: '/ajax/handleChat.php',
        set_activity: '/ajax/handleChat.php',
        mark_read: '/ajax/handleChat.php',
      },
      onInit: function (instance: Chat) {},
      onMessageRead: function (instance: Chat) {},
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.el = el;
    this.chats = this.el.querySelector(this.options.chats) as HTMLElement;
    this.messages = this.el.querySelector(this.options.messages) as HTMLElement;
    this.form = this.el.querySelector(this.options.form) as HTMLFormElement;
    this.formResult = this.form.querySelector(this.options.formResult) as HTMLElement;
    this.input = this.form.querySelector(this.options.input) as HTMLTextAreaElement;
    this.chatRooms = {
      0: {
        ID: 0,
        NEW: true,
        USERS: [],
      }
    };
    this.activeChatRoom = 0;
    this.timestamp = 0;
    this.history = [];
    this.timeout = null;
    this.scrollFunction = null;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Chat.instances.set(self.el, self);

    self.form.addEventListener('submit', self.handleSubmit);

    self.scrollFunction = throttle(function () {
      self.handleMessagesScroll();
    }, 500);

    self.messages.addEventListener('scroll', self.scrollFunction);

    if (!self.options.delayWatch) {
      self.handleWatch();
    }

    $(document).on('click', '[data-activity-toggle]', function (e) {
      e.preventDefault();

      self.sendRequest('set_activity');
    });

    if (self.input) {
      self.input.addEventListener('keydown', self.handleInputKeyDown);
    }

    if (typeof this.options.onInit === 'function') {
      this.options.onInit(self);
    }
  }

  destroy = () => {
    let self = this;

    self.stopWatch();
    self.form.removeEventListener('submit', self.handleSubmit);

    if (self.scrollFunction) {
      self.messages.removeEventListener('scroll', self.scrollFunction);
    }

    if (self.input) {
      self.input.removeEventListener('keydown', self.handleInputKeyDown);
    }
  }

  setChatRooms = (data: ChatRoom[]) => {
    let self = this;

    self.chatRooms = data;
  }

  handleInputKeyDown = (e: KeyboardEvent) => {
    let self = this;

    if (e.key === 'Enter' && e.shiftKey) {
      self.handleSubmit(e);
    }
  }

  handleMessagesScroll = () => {
    let self = this;
    let messages = self.messages.querySelectorAll('.c-message_incoming:not(.c-message_read), .c-message_system:not(.c-message_read)') as NodeListOf<HTMLElement>;

    for (let i = 0; i < messages.length; i++) {
      self.handleMessageRead(messages[i]);
    }
  }

  handleMessageRead = (message: HTMLElement) => {
    let self = this;
    let isRead = isVisible(message, self.messages);
    let data = {};
    let dialogueItem = self.el.querySelector('.dialogue-item_active') as HTMLElement;

    if (isRead) {
      data.ID = message.getAttribute('data-id') || '';
      message.classList.add('c-message_read');
      dialogueItem.classList.add('dialogue-item_read');
      self.sendRequest('mark_read', {
        data: data,
        onSuccess: function () {
          if (typeof self.options.onMessageRead === 'function') {
            self.options.onMessageRead(self);
          }
        }
      });
    }
  }

  closeChat = () => {
    let self = this;

    self.stopWatch();
    self.activeChatRoom = 0;
    self.timestamp = 0;
    self.history = [];
    self.timeout = null;
    self.scrollFunction = null;
  }

  handleWatch = () => {
    let self = this;

    let watch = function () {
      self.sendRequest('get_messages', {
        displayLoader: false,
        onComplete: function () {
          self.timeout = setTimeout(watch, 5000);
        }
      })
    }

    watch();
  }

  stopWatch = () => {
    let self = this;

    if (self.timeout) {
      clearTimeout(self.timeout);
    }
  }

  handleSubmit = (e: Event) => {
    let self = this;

    e.preventDefault();

    const isValid = validateForm({
      form: self.form,
      errorClass: 'c-input_error'
    });

    if (!isValid) {
      let firstError = self.form.querySelector('.c-input_error') as HTMLInputElement;

      firstError.focus();

      return false;
    };

    self.sendRequest('add_message');
  }

  markAsRead = (timestamp: number = 0) => {
    let self = this;
    let obLatestMessage = self.history[self.history.length - 1];

    for (let i in self.history) {
      let obMessage = self.history[i];

      if (obMessage) {
        // по умолчанию берем поле READ из объекта сообщения. Если последнее сообщение исходящее, все входящие отмечаем прочитанным, если входящее - ве исходящие
        let isRead = (timestamp > 0 && timestamp > obMessage.TIMESTAMP && (obMessage.TYPE === 'incoming' && obLatestMessage.TYPE === 'outcoming' || obMessage.TYPE === 'outcoming' && obLatestMessage.TYPE === 'incoming')) ? true : obMessage.READ;
        let message;
        // let check;

        if (!isRead) continue;

        message = self.messages.querySelector(`[data-id="${obMessage.ID}"]`);

        if (!message) continue;

        message.classList.add('c-message_read');
        // check = message.querySelector('.c-message__state-check');

        // if (!check) continue;

        // check.classList.remove('d-none');
      }
    }
  }

  sendRequest = (action: string, params: RequestParams = {}) => {
    let self = this;
    let loader: Loader;
    let data;
    let chatRoom = 0;
    // let chatRoom = params.chatRoom && params.chatRoom > 0 ? params.chatRoom : self.chatRooms[self.activeChatRoom].ID;
    let chatType = self.form.getAttribute('data-chat-type') || '';
    let userId = self.form.getAttribute('data-user-id') || '';

    if (params.chatRoom && params.chatRoom > 0) {
      chatRoom = params.chatRoom;
    } else if (self.activeChatRoom > 0) {
      chatRoom = self.chatRooms[self.activeChatRoom].ID;
    }

    switch (action) {
      case 'set_activity':
        data = {
          CHAT_ROOM: chatRoom,
        }

        $.ajax({
          method: 'POST',
          url: self.options.handlers.set_activity,
          data: data,
          dataType: 'json',
          success: function (response) {
            console.log(response);
          },
          error: function (response) {
            console.log(response);
          }
        });

        break;

      case 'add_message':
        data = $(self.form).serializeArray();

        if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
          loader = new Loader(self.form);
        }

        data.push({name: 'CHAT_ROOM', value: chatRoom.toString()});
        data.push({name: 'USER_ID', value: userId});
        // data.push({name: 'CHAT_TYPE', value: chatType});

        $.ajax({
          method: 'POST',
          url: self.options.handlers.add_message,
          data: data,
          dataType: 'json',
          success: function (response) {
            // console.log(response);

            if (response.STATUS === 'success') {
              let responseEl = document.createElement('div');
              let templates = {
                outcoming: (document.querySelector('[id^="tmpl-message-outcoming"]') as Element).innerHTML,
              }

              responseEl.insertAdjacentHTML('beforeend', Mustache.render(templates.outcoming, response.MESSAGE, {}, ['<%', '%>']));

              self.form.reset();
              self.formResult.innerHTML = '';
              self.messages.insertAdjacentHTML('beforeend', responseEl.innerHTML);
              // $(self.messages).append(response);
              self.messages.scrollTop = self.messages.scrollHeight;
              self.timestamp = response.MESSAGE.TIMESTAMP;

              // если чат пользователь отправил сообщение в еще не существующий чат, ему вернется id чата
              if (response.CHAT_ROOM) {

                self.chatRooms[response.CHAT_ROOM] = {...self.chatRooms[0]}
                self.chatRooms[response.CHAT_ROOM].ID = response.CHAT_ROOM;
                self.chatRooms[response.CHAT_ROOM].NEW = false;
                self.activeChatRoom = response.CHAT_ROOM;
                // self.form.setAttribute('data-chat-room', response.CHAT_ROOM);
                // self.setChatRoom(response.CHAT_ROOM);

                let dialogueItem = self.el.querySelector('.dialogue-item_active') as HTMLElement;

                if (dialogueItem.getAttribute('data-id') === '0') {
                  dialogueItem.setAttribute('data-id', response.CHAT_ROOM);
                }

                dialogueItem.classList.remove('dialogue-item_read');

                let message = dialogueItem.querySelector('.dialogue-item__message') as HTMLElement;
                let time = dialogueItem.querySelector('.dialogue-item__time') as HTMLElement;
                let stateCheck = dialogueItem.querySelector('.dialogue-item__state-check') as HTMLElement;

                if (response.MESSAGE.TEXT) {
                  message.textContent = 'Вы: ' + response.MESSAGE.TEXT;
                } else if (response.MESSAGE.MEDIA) {
                  message.textContent = 'Вы: ' + response.MESSAGE.MEDIA;
                }

                if (response.MESSAGE.DATE) {
                  time.textContent = response.MESSAGE.DATE;
                }

                // размещаем после timestamp, чтобы не задваивались сообщения
                // деактивировано, потому что таймер стартует при открытии чата
                // self.handleWatch();
              }

              // сброс поля для ввода
              if (self.input) {
                self.input.style.height= '';
              }

              self.history.push(response.MESSAGE);

              // предыдущие прочитаны
              self.markAsRead(self.timestamp);
            } else {
              let resultMessage = setResultMessage({
                status: 'error',
                responseText: response.ERRORS,
                bare: true
              });

              $(self.formResult).html(resultMessage);
            }
          },
          error: function (response) {
            console.log(response);

            let resultMessage = setResultMessage({
              status: 'error',
              responseText: 'Неизвестная ошибка. Пожалуйста, попробуйте позже',
              bare: true
            });

            $(self.formResult).html(resultMessage);
          },
          complete: function (response) {
            if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
              loader.setState('hidden');
            }
          }
        })

        break;

      case 'get_chats':
        data = {};

        if (params.data) {
          data = merge(params.data, data);
        }

        console.log(data, params.data);


        if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
          loader = new Loader(self.el);
        }

        $.ajax({
          method: 'POST',
          url: self.options.handlers.chats,
          data: data,
          dataType: 'json',
          success: function (response) {
            // console.log(response);

            if (typeof params.onSuccess === 'function') {
              params.onSuccess(response);
            }
          },
          error: function (response) {
            console.log(response);
          },
          complete: function (response) {
            if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
              loader.setState('hidden');
            }

            if (typeof params.onComplete === 'function') {
              params.onComplete(response);
            }
          }
        });

        break;

      case 'mark_read':
        data = {}

        if (params.data) {
          data = merge(params.data, data);
        }

        data.CHAT_ROOM = chatRoom;

        if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
          loader = new Loader(self.messages);
        }

        $.ajax({
          method: 'POST',
          url: self.options.handlers.mark_read,
          data: data,
          dataType: 'json',
          success: function (response) {
            if (typeof params.onSuccess === 'function') {
              params.onSuccess(response);
            }
          },
          error: function (response) {
            if (typeof params.onError === 'function') {
              params.onError(response);
            }
          },
          complete: function (response) {
            if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
              loader.setState('hidden');
            }

            if (typeof params.onComplete === 'function') {
              params.onComplete(response);
            }
          }
        })

        break;

      case 'get_messages':
      default:
        data = {
          CHAT_ROOM: chatRoom,
          TIMESTAMP: self.timestamp,
        };

        if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
          loader = new Loader(self.messages);
        }

        $.ajax({
          method: 'POST',
          url: self.options.handlers.messages,
          data: data,
          dataType: 'json',
          success: function (response) {
            // console.log(response);

            let responseEl = document.createElement('div');
            let timestamp = 0;

            if (response.MESSAGES) {
              let templates = {
                incoming: (document.querySelector('[id^="tmpl-message-incoming"]') as Element).innerHTML,
                outcoming: (document.querySelector('[id^="tmpl-message-outcoming"]') as Element).innerHTML,
                system: (document.querySelector('[id^="tmpl-message-system"]') as Element).innerHTML,
              }

              for (let i in response.MESSAGES) {
                let message = response.MESSAGES[i];

                responseEl.insertAdjacentHTML('beforeend', Mustache.render(templates[message.TYPE], message, {}, ['<%', '%>']));
                timestamp = message.TIMESTAMP;
                self.history.push(message);
              }

              let keys = Object.keys(response.MESSAGES);
              let lastMessage = keys[keys.length - 1];
              let dialogueItem = self.el.querySelector('.dialogue-item_active') as HTMLElement;

              if (response.MESSAGES[lastMessage]) {
                let message = dialogueItem.querySelector('.dialogue-item__message') as HTMLElement;
                let time = dialogueItem.querySelector('.dialogue-item__time') as HTMLElement;

                if (response.MESSAGES[lastMessage].TEXT || response.MESSAGES[lastMessage].MEDIA) {
                  let text = '';

                  if (response.MESSAGES[lastMessage].TEXT) {
                    text = response.MESSAGES[lastMessage].TEXT;
                  } else {
                    text = response.MESSAGES[lastMessage].MEDIA;
                  }

                  if (response.MESSAGES[lastMessage].TYPE === 'outcoming') {
                    text = 'Вы: ' + text;
                  }

                  message.textContent = text;
                }

                if (response.MESSAGES[lastMessage].DATE) {
                  time.textContent = response.MESSAGES[lastMessage].DATE;
                }

                if (response.MESSAGES[lastMessage].READ) {
                  dialogueItem.classList.add('dialogue-item_read');
                } else {
                  dialogueItem.classList.remove('dialogue-item_read');
                }
              }

              let marker = dialogueItem.querySelector('.dialogue-item__unread') as HTMLElement;
              let markerValue = marker.querySelector('[data-chat-marker-value]') as HTMLElement;

              if (response.UNREAD_MESSAGES > 0) {
                markerValue.textContent = response.UNREAD_MESSAGES;
                marker.classList.remove('d-none');
              } else {
                markerValue.textContent = response.UNREAD_MESSAGES;
                marker.classList.add('d-none');
              }
            }

            self.activeChatRoom = parseInt(response.CHAT_ROOM);

            if (params.clean) {
              self.messages.innerHTML = '';
            }

            $(self.messages).append(responseEl.innerHTML);

            let messages = self.messages.querySelectorAll('.c-message_incoming:not(.c-message_read)') as NodeListOf<HTMLElement>;

            for (let i = 0; i < messages.length; i++) {
              self.handleMessageRead(messages[i]);
            }

            if (self.timestamp === 0) {
              self.messages.scrollTop = self.messages.scrollHeight;
            }

            if (timestamp > self.timestamp) {
              self.timestamp = timestamp;
            }

            self.markAsRead(self.timestamp);

            if (typeof params.onSuccess === 'function') {
              params.onSuccess(response);
            }
          },
          error: function (response) {
            console.log(response);
          },
          complete: function (response) {
            if (!params.hasOwnProperty('displayLoader') || params.displayLoader) {
              loader.setState('hidden');
            }

            if (typeof params.onComplete === 'function') {
              params.onComplete(response);
            }
          }
        });

        break;
    }
  }
}

if (!(window as any).Chat) {
  (window as any).Chat = Chat;
}

export default Chat;
