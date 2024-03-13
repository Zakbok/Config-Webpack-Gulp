import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';
import findAncestor from 'functions/utility/findAncestor';

interface Options {
  activeClass: string;
  toggleClass: string;
  toggleContent: string;
  toggleContentDisabledClass: string;
  titleClass: string;
  popupClass: string;
  itemClass: string;
  itemActiveClass: string;
  itemDisabledClass: string;
  inputClass: string;
  toggleMultiple: boolean;
  allowNoSelected: boolean;
  detachPopup: boolean;
  onInit: (instance: Select) => void;
  onOpen: (instance: Select) => void;
  onClose: (instance: Select) => void;
  onClick: (instance: Select, target: HTMLElement) => void;
}

class Select {
  el: HTMLElement;
  options: Options;
  toggle: HTMLElement;
  toggleText: HTMLElement;
  popup: HTMLElement;
  menuItems: NodeListOf<HTMLElement>;
  title: HTMLElement;
  input: HTMLInputElement;
  listLength: number;
  firstItem: HTMLElement;
  lastItem: HTMLElement;
  activeItems: HTMLElement[];
  isOpened: boolean;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      activeClass: 'c-select-custom_expanded',
      toggleClass: 'c-select-custom__toggle',
      toggleContent: 'c-select-custom__text',
      toggleContentDisabledClass: 'c-select-custom__text_disabled',
      titleClass: 'c-select-custom__text',
      popupClass: 'c-select-custom__popup',
      itemClass: 'c-select-custom__item',
      itemActiveClass: 'c-select-custom__item_active',
      itemDisabledClass: 'c-select-custom__item_disabled',
      inputClass: 'c-select-custom__control',
      toggleMultiple: false,
      allowNoSelected: false,
      detachPopup: false,
      onInit: function (instance: Select) {},
      onOpen: function (instance: Select) {},
      onClose: function (instance: Select) {},
      onClick: function (instance: Select, target: HTMLElement) {}
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);
    this.el = el;
    this.toggle = this.el.querySelector(`.${this.options.toggleClass}`) as HTMLElement;
    this.toggleText = this.el.querySelector(`.${this.options.toggleContent}`) as HTMLElement;
    this.popup = this.el.querySelector(`.${this.options.popupClass}`) as HTMLElement;
    this.menuItems = this.popup.querySelectorAll(`.${this.options.itemClass}`) as NodeListOf<HTMLElement>;
    this.title = this.el.querySelector(`.${this.options.titleClass}`) as HTMLElement;
    this.input = this.el.querySelector(`.${this.options.inputClass}`) as HTMLInputElement;

    this.listLength = this.menuItems.length;
    this.firstItem = this.menuItems[0];
    this.lastItem = this.menuItems[this.listLength - 1];
    this.activeItems = [];

    this.isOpened = false;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Select.instances.set(self.el, self);

    self.activeItems = self.getActiveItems();

    document.addEventListener('click', this.handleClickOutside);
    this.toggle.addEventListener('click', this.toggleState);
    this.toggle.addEventListener('keydown', this.handleKeyDown);
    this.toggleText.addEventListener('click', function (e) {
      let badgeAction = e.target.classList.contains('badge-item__action') ? e.target : findAncestor(e.target, '.badge-item__action') as HTMLElement;
      let badge;
      let item;
      let badgesList;

      if (badgeAction) {
        e.stopPropagation();
        badge = findAncestor(badgeAction, '.badge-item');
        badgesList = findAncestor(badgeAction, '.badges-list');
        item = self.popup.querySelector(`#${badge.getAttribute('data-id')}`) as HTMLElement;
        item.classList.remove(self.options.itemActiveClass);
        item.setAttribute('aria-checked', 'false');
        badgesList.removeChild(badge.parentElement);
        self.activeItems = self.getActiveItems();

        self.input.value = self.getValue();

        // если нет активных пунктов, делаем активным первый
        if (self.activeItems.length === 0 && self.options.allowNoSelected !== true) {
          self.setActive(self.menuItems[0], true);
        }
      }
    });
    this.el.addEventListener('click', this.handleClick);
    this.input.onchange = function () {
      let item = self.popup.querySelector('[data-value="' + self.input.value + '"]') as HTMLElement;

      if (item) {
        self.setActive(item);
      }
    }

    if (self.options.detachPopup) {
      self.popup.addEventListener('click', self.handleClick);
    }

    if (typeof this.options.onInit === 'function') {
      this.options.onInit(self);
    }
  }

  updateItems = () => {
    let self = this;

    self.menuItems = self.popup.querySelectorAll(`.${self.options.itemClass}`);
    self.listLength = self.menuItems.length;
    self.firstItem = self.menuItems[0];
    self.lastItem = self.menuItems[self.listLength - 1];

    self.activeItems = self.getActiveItems();
  }

  getActiveItems = (): HTMLElement[] => {
    let self = this;
    let result: HTMLElement[] = [];
    let items = self.popup.querySelectorAll(`.${this.options.itemActiveClass}`) as NodeListOf<HTMLElement>;

    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);
    }

    return result;
  }

  getValue = (): string => {
    let self = this;
    let result = '';

    if (self.options.toggleMultiple) {
      let values = [];

      for (let i = 0; i < self.activeItems.length; i++) {
        values.push(self.activeItems[i].getAttribute('data-value') || self.activeItems[i].innerText);
      }
      result = JSON.stringify(values);
    } else {
      let firstItem = self.activeItems[0];

      if (firstItem.classList.contains(self.options.itemDisabledClass)) {
        result = '';
      } else {
        result = firstItem.getAttribute('data-value') || firstItem.innerText || '';
      }
    }

    return result;
  }

  handleClick = (e: Event) => {
    let self = this;
    let target = e.target as HTMLElement;

    target = findAncestor(target, `.${this.options.itemClass}`);

    if (Array.prototype.indexOf.call(self.menuItems, target) < 0) return;

    self.setActive(target);

    if (!target.classList.contains(self.options.itemDisabledClass)) {
      self.close();
    }
  }

  handleClickOutside = (e: Event) => {
    let self = this;
    let target = e.target as HTMLElement;

    if (self.isOpened && !self.el.contains(target)) {
      self.close();
    }
  };

  handleKeyDown = (e: KeyboardEvent) => {
    let self = this;

    // Esc key
    if (e.keyCode === 27) {
      self.close();
    }

    // Arrow keys
    if (e.keyCode === 38 || e.keyCode === 40) {
      self.changeMenuItem(e, e.keyCode);
    }
  };

  changeMenuItem = (e: Event, keyCode: number) => {
    let self = this;
    let index;

    e.preventDefault();

    switch (keyCode) {
      case 38:
        index = Array.prototype.indexOf.call(self.menuItems, self.activeItem);

        while (index > -1) {
          if (index > 0) {
            index--;

            if (self.menuItems[index].classList.contains(self.options.itemDisabledClass)) continue;

            break;
          } else {
            index = self.listLength - 1;

            if (self.menuItems[index].classList.contains(self.options.itemDisabledClass)) continue;

            break;
          }
        }

        self.setActive(self.menuItems[index]);

        break;

      case 40:
        index = Array.prototype.indexOf.call(self.menuItems, self.activeItem);

        while (index > -1) {
          if (index < self.listLength - 1) {
            index++;

            if (self.menuItems[index].classList.contains(self.options.itemDisabledClass)) continue;

            break;
          } else {
            index = 0;

            if (self.menuItems[index].classList.contains(self.options.itemDisabledClass)) continue;

            break;
          }
        }

        self.setActive(self.menuItems[index]);

        break;
    }
  };

  toggleState = () => {
    this.isOpened ? this.close() : this.open();
  };

  destroy = () => {
    let self = this;

    document.removeEventListener('click', self.handleClickOutside);
    self.toggle.removeEventListener('click', self.toggleState);
    self.toggle.removeEventListener('keydown', self.handleKeyDown);
    self.el.removeEventListener('click', self.handleClick);
  };

  open = () => {
    let self = this;

    if (self.options.detachPopup) {
      let ref = document.body;

      ref.appendChild(self.popup);
      self.popup.classList.add('c-select-custom__popup_active');
      self.positionPopup('active');
    }

    self.el.classList.add(self.options.activeClass);
    self.popup.setAttribute('aria-hidden', 'false');

    self.isOpened = true;

    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(self);
    }
  };

  close = () => {
    let self = this;

    if (!self.el.classList.contains(self.options.activeClass)) {
      return;
    }

    if (self.options.detachPopup) {
      self.el.appendChild(self.popup);
      self.popup.classList.remove('c-select-custom__popup_active');
      self.positionPopup('default');
    }

    self.el.classList.remove(self.options.activeClass);
    self.popup.setAttribute('aria-hidden', 'true');

    self.isOpened = false;

    if (typeof this.options.onClose === 'function') {
      this.options.onClose(self);
    }
  };

  setActive = (item: HTMLElement, ignoreDisabled: boolean = false, ignoreCallback: boolean = false) => {
    let self = this;

    if (!ignoreDisabled) {
      if (item.classList.contains(self.options.itemDisabledClass)) return false;
    }

    for (let i = 0; i < self.menuItems.length; i++) {
      if (self.options.toggleMultiple === false || self.menuItems[i].classList.contains(self.options.itemDisabledClass)) {
        self.menuItems[i].classList.remove(self.options.itemActiveClass);
        self.menuItems[i].setAttribute('aria-checked', 'false');
      }
    }

    item.classList.add(self.options.itemActiveClass);
    item.setAttribute('aria-checked', 'true');
    self.activeItems = self.getActiveItems();

    if (self.options.toggleMultiple) {
      let value = [];
      let badges = [];

      for (let i = 0; i < self.activeItems.length; i++) {
        value.push(self.activeItems[i].getAttribute('data-value') || self.activeItems[i].innerText);
        badges.push({
          id: self.activeItems[i].id,
          title: self.activeItems[i].innerText
        });
      }

      if (ignoreDisabled) {
        self.toggleText.classList.add(self.options.toggleContentDisabledClass);
        self.toggleText.innerHTML = item.innerText;
        self.input.value = '';
      } else {
        self.toggleText.classList.remove(self.options.toggleContentDisabledClass);
        self.toggleText.innerHTML = '';
        self.toggleText.appendChild(self.renderBadges(badges));
        self.input.value = JSON.stringify(value);
      }
    } else {
      let value = item.getAttribute('data-value');

      self.toggleText.innerHTML = item.innerText;
      self.toggleText.classList.remove(self.options.toggleContentDisabledClass);
      self.input.value = value || item.innerText;
    }

    if (typeof this.options.onClick === 'function' && !ignoreCallback) {
      this.options.onClick(self, item);
    }
  };

  renderBadges = (items: {id: string, title: string}[] = []): HTMLElement => {
    let result = document.createElement('ul');

    result.className = 'badges-list row';

    items.forEach(function (item: {id: string, title: string}) {
      let badge = `
        <li class="badges-list__item col-auto">
            <div class="badge-item c-badge c-badge_primary c-badge_xs d-inline-flex align-items-center" data-id="${item.id}">${item.title}<span class="badge-item__action" tabIndex="0"><i class="fas fa-times"></i></span></div>
        </li>
      `;

      result.insertAdjacentHTML('beforeend', badge);
    });

    return result;
  }

  positionPopup = (state: string) => {
    let self = this;
    let elDims = self.el.getBoundingClientRect();
    let scrollingEl = document.scrollingElement || document.documentElement;

    if (state === 'active') {
      self.popup.style.left = `${elDims.left + scrollingEl.scrollLeft}px`;
      self.popup.style.top = `${elDims.top + elDims.height + scrollingEl.scrollTop}px`;
      self.popup.style.width = `${elDims.width}px`;
    } else if (state === 'default') {
      self.popup.style.left = '';
      self.popup.style.top = '';
      self.popup.style.width = '';
    }
  }
}

if (!(window as any).Select) {
  (window as any).Select = Select;
}

export default Select;
