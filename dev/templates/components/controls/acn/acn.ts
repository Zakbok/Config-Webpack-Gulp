import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';
import getHeight from 'functions/utility/getHeight';

interface Icons {
  default?: string;
  active?: string;
}

interface Options {
  activeClass: string;
  toggle: string;
  button: string;
  icon: string;
  head: string;
  body: string;
  container: string;
  icons: Icons | false;
  group: boolean;
  animation: string;
  onBeforeOpen: (instance: Acn) => void,
  onOpen: (instance: Acn) => void,
  onClose: (instance: Acn) => void;
  onTransitionEnd: (instance: Acn, event: TransitionEvent) => void;
  [key: string]: Options[keyof Options];
}

class Acn {
  el: HTMLElement;
  options: Options;
  toggle: HTMLElement;
  button: HTMLElement;
  icon: HTMLElement | null;
  iconUse: SVGUseElement | null;
  heading: HTMLElement;
  content: HTMLElement;
  container: HTMLElement;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults: Options = {
      activeClass: 'c-acn_active',
      toggle: '.c-acn__toggle',
      button: '.c-acn__button',
      icon: '.c-acn__icon',
      head: '.c-acn__head',
      body: '.c-acn__content',
      container: '.c-acn__inner',
      icons: {
        default: '#plus',
        active: '#minus'
      },
      animation: 'toggle',
      group: false,
      onBeforeOpen: function (instance: Acn) {},
      onOpen: function (instance: Acn) {},
      onClose: function (instance: Acn) {},
      onTransitionEnd: function (instance: Acn, event: TransitionEvent) {}
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);
    this.el = el;
    this.toggle = this.el.querySelector(this.options.toggle) as HTMLElement;
    this.button = this.el.querySelector(this.options.button) as HTMLElement;
    this.icon = this.el.querySelector(this.options.icon) as HTMLElement;
    this.iconUse = this.icon ? this.icon.querySelector('use') as SVGUseElement : null;
    this.heading = this.el.querySelector(this.options.head) as HTMLElement;
    this.content = this.el.querySelector(this.options.body) as HTMLElement;
    this.container = this.el.querySelector(this.options.container) as HTMLElement;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Acn.instances.set(self.el, self);

    if (this.options.animation === 'dropdown') {
      this.el.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => this.toggleUp());
    }

    this.toggle.addEventListener('click', this.handleClick);
    this.content.addEventListener('transitionend', function (event: TransitionEvent) {
      if (typeof self.options.onTransitionEnd === 'function') {
        self.options.onTransitionEnd(self, event);
      }
    })
  }

  setHeight = () => {
    this.content.style.height = `${getHeight(this.content)}px`;
  }

  handleClick = (e: Event) => {
    if (this.el.classList.contains(this.options.activeClass)) {
      this.toggleUp();
    } else {
      this.toggleDown();
    }
  }

  toggleDown = () => {
    let self = this;

    if (typeof this.options.onBeforeOpen === 'function') {
      this.options.onBeforeOpen(this);
    }

    let height = getHeight(this.content);

    self.el.classList.add(this.options.activeClass);
    self.toggle.setAttribute('aria-expanded', 'true');
    self.content.style.height = `${height}px`;

    window.addEventListener('transitionend', function removeHeight (event: TransitionEvent) {
      if (event.propertyName !== 'height') return;

      self.content.style.height = '';
      self.content.style.overflow = '';
      window.removeEventListener('transitionend', removeHeight);
    });

    if (this.iconUse && this.options.icons !== false && this.options.icons.active && this.options.icons.default !== this.options.icons.active) {
      this.iconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.options.icons.active);
    }

    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this);
    }
  }

  toggleUp = () => {
    let self = this;

    self.toggle.setAttribute('aria-expanded', 'false');
    self.content.style.overflow = 'hidden';
    self.content.style.height = self.content.scrollHeight + 'px';

    window.setTimeout(function () {
      self.content.style.height = '0';
    }, 1);

    window.addEventListener('transitionend', function removeVisibility (event: TransitionEvent) {
      if (event.propertyName !== 'height') return;

      self.el.classList.remove(self.options.activeClass);
      window.removeEventListener('transitionend', removeVisibility);
    });

    if (this.iconUse && this.options.icons !== false && this.options.icons.default && this.options.icons.default !== this.options.icons.active) {
      this.iconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.options.icons.default);
    }

    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this);
    }
  }
}

export default Acn;
