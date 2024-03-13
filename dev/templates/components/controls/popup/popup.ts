import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';
import throttle from 'functions/utility/throttle';

interface Options {
  activeClass: string;
  // toggle: string;
  popup: string;
  widthRef: string;
  usePopper: boolean;
  popperOptions: object;
  onInit: (instance: Popup) => void;
  onOpen: (instance: Popup) => void;
  onClose: (instance: Popup) => void;
  beforeAction: (instance: Popup) => void;
  // onPosition: (instance: Popup) => void;
  onResize: (instance: Popup) => void;
}

class Popup {
  el: HTMLElement;
  options: Options;
  id: string;
  // toggle: HTMLElement;
  popup: HTMLElement;
  // widthRef: HTMLElement;
  isOpened: Boolean;
  popperInstance: any | null;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      activeClass: 'c-popup_active',
      // toggle: '.c-popup__toggle',
      // popup: '[data-popup="#ID#"]',
      // widthRef: 'c-popup',
      usePopper: true,
      popperOptions: {
        placement: 'bottom-start',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 6]
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
      onInit: function (instance: Popup) {},
      onOpen: function (instance: Popup) {},
      onClose: function (instance: Popup) {},
      beforeAction: function (instance: Popup) {},
      // onPosition: function (instance: Popup) {},
      onResize: function (instance: Popup) {}
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);
    this.el = el;
    // this.toggle = this.el.querySelector(this.options.toggle) as HTMLElement;
    this.id = this.el.getAttribute('data-popup-toggle') || '';
    this.popup = document.querySelector(`[data-popup="${this.id}"]`) as HTMLElement;
    // this.widthRef = this.options.widthRef ? document.querySelector(this.options.widthRef) as HTMLElement : document.documentElement;
    this.isOpened = false;
    this.popperInstance = null;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Popup.instances.set(self.el, self);

    if (self.options.usePopper) {
      self.popperInstance = Popper.createPopper(
        self.el,
        self.popup,
        self.options.popperOptions
      );
    }

    self.el.addEventListener('click', function () {
      if (typeof self.options.beforeAction === 'function') {
        self.options.beforeAction(self);
      }

      self.isOpened ? self.close() : self.open();
    });

    document.addEventListener('click', self.handleClickOutside);
    window.addEventListener('resize', throttle(function () {
      self.close();
    }, 500));

    if (typeof this.options.onInit === 'function') {
      this.options.onInit(self);
    }
  }

  open = () => {
    let self = this;

    self.el.classList.add(self.options.activeClass);
    self.isOpened = true;

    if (self.options.usePopper) {
      self.popperInstance.update();
    }

    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(self);
    }
  }

  close = () => {
    let self = this;

    self.el.classList.remove(self.options.activeClass);
    self.isOpened = false;

    if (typeof this.options.onClose === 'function') {
      this.options.onClose(self);
    }
  }

  handleClickOutside = (e: Event) => {
    let self = this;
    let target = e.target as HTMLElement;

    if (self.isOpened && !self.el.contains(target) && !self.popup.contains(target)) {
      self.close();
    }
  }
}

if (!(window as any).Popup) {
  (window as any).Popup = Popup;
}

export default Popup;
