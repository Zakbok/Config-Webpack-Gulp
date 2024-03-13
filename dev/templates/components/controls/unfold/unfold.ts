import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';
import throttle from 'functions/utility/throttle';
import getViewport from 'functions/utility/getViewport';
import updateControlsList from 'functions/controls/updateControlsList';
import getHeight from 'functions/utility/getHeight';

interface Options {
  initialHeight: number;
  step: number;
  progressClass: string;
  hiddenClass: string;
  body: string;
  inner: string;
  footer: string;
  btn: string;
  responsive: {
    breakpoint: number;
    throttleInterval: number;
  };
  onInit: (instance: Unfold) => void;
  onClick: (instance: Unfold) => void;
  onOpen: (instance: Unfold) => void;
  onClose: (instance: Unfold) => void;
  onResize: (instance: Unfold) => void;
}

class Unfold {
  el: HTMLElement;
  options: Options;
  body: HTMLElement;
  inner: HTMLElement;
  footer: HTMLElement;
  btns: NodeListOf<HTMLElement>;
  hasOverflow: boolean;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      initialHeight: 300,
      step: 600,
      progressClass: 'c-unfold_rolling',
      hiddenClass: 'd-none',
      body: '.c-unfold__body',
      inner: '.c-unfold__inner',
      footer: '.c-unfold__footer',
      btn: '.c-unfold__btn',
      responsive: {
        breakpoint: 768,
        throttleInterval: 500
      },
      onInit: function (instance: Unfold) {},
      onClick: function (instance: Unfold) {},
      onOpen: function (instance: Unfold) {},
      onClose: function (instance: Unfold) {},
      onResize: function (instance: Unfold) {},
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);
    this.el = el;
    this.body = this.el.querySelector(this.options.body) as HTMLElement;
    this.inner = this.el.querySelector(this.options.inner) as HTMLElement;
    this.footer = this.el.querySelector(this.options.footer) as HTMLElement;
    this.btns = this.el.querySelectorAll(this.options.btn) as NodeListOf<HTMLElement>;

    this.hasOverflow = true;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Unfold.instances.set(self.el, self);

    self.hasOverflow = self.checkOverflow();

    if (self.hasOverflow) {
      self.footer.classList.remove(self.options.hiddenClass);
    } else {
      self.close();
    };

    for (let i = 0; i < self.btns.length; i++) {
      self.btns[i].addEventListener('click', self.handleClick);
    }

    self.checkState();

    let handleResize = throttle(function () {
      self.handleResize();
    }, self.options.responsive.throttleInterval);

    window.addEventListener('resize', handleResize);

    if (typeof self.options.onInit === 'function') {
      self.options.onInit(self);
    }
  }

  checkState = () => {
    let self = this;
    let viewport = getViewport();

    if (self.options.responsive.breakpoint > 0 && viewport.width >= self.options.responsive.breakpoint) {
      self.close();
      self.body.style.maxHeight = '';
      self.footer.classList.add(self.options.hiddenClass);
    } else {
      self.hasOverflow = self.checkOverflow();

      if (self.hasOverflow) {
        self.el.classList.add(self.options.progressClass);
        self.footer.classList.remove(self.options.hiddenClass);
        self.el.setAttribute('data-state', 'folded');
        updateControlsList(self.el, self.footer, self.options.hiddenClass);
      } else {
        self.el.setAttribute('data-state', 'unfolded');
        updateControlsList(self.el, self.footer, self.options.hiddenClass);
      }
    }
  }

  handleResize = () => {
    let self = this;

    self.checkState();

    if (typeof self.options.onResize === 'function') {
      self.options.onResize(self);
    }
  }

  handleClick = (e: Event) => {
    let self = this;
    let action = (e.target as HTMLElement).getAttribute('data-action');

    switch (action) {
      case 'unfold':
        self.open();

        break;

      case 'fold':
        self.el.classList.add(self.options.progressClass);
        self.el.setAttribute('data-state', 'folded');
        self.body.style.maxHeight = self.options.initialHeight + 'px';
        updateControlsList(self.el, self.footer, self.options.hiddenClass);

        window.addEventListener('transitionend', function handleUnfold (event: TransitionEvent) {
          if (event.propertyName !== 'max-height') return;

          self.body.style.maxHeight = '';

          window.removeEventListener('transitionend', handleUnfold);
        });

        break;
    }
  }

  checkOverflow = () => {
    return this.body.clientHeight < this.inner.clientHeight;
  }

  open = () => {
    let self = this;

    self.hasOverflow = self.checkOverflow();

    if (!self.hasOverflow) return;

    if (self.hasOverflow) {
      if (self.options.step > 0) {
        self.body.style.maxHeight = `${self.body.clientHeight + self.options.step}px`;
      } else {
        let contentHeight = getHeight(self.inner);

        self.body.style.maxHeight = `${contentHeight}px`;
      }
    } else {
      self.close();
    }

    window.addEventListener('transitionend', function handleUnfold (event: TransitionEvent) {
      if (event.propertyName !== 'max-height') return;

      self.hasOverflow = self.checkOverflow();

      if (!self.hasOverflow) {
        self.close();
      }

      if (typeof self.options.onClick === 'function') {
        self.options.onClick(self);
      }

      window.removeEventListener('transitionend', handleUnfold);
    });
  }

  close = () => {
    let self = this;

    self.el.classList.remove(self.options.progressClass);
    self.el.setAttribute('data-state', 'unfolded');
    updateControlsList(self.el, self.footer, self.options.hiddenClass);

    if (typeof self.options.onClose === 'function') {
      self.options.onClose(self);
    }
  }
}

if (!(window as any).Unfold) {
  (window as any).Unfold = Unfold;
}

export default Unfold;
