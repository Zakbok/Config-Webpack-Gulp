import merge from 'functions/utility/merge';

type LoaderState = 'visible' | 'hidden';

interface Options {
  states: {
    [key: string]: string;
  },
  colors: {
    [key: string]: string;
  };
  animatedClassName: string;
  refClassName: string;
  fixedClassName: string;
  timeout: number;
  overlay: boolean;
  fixed: boolean;
}

class Loader {
  el: HTMLElement | null;
  parent: HTMLElement;
  options: Options;
  state: string;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      states: {
        visible: 'loader_active',
        hidden: 'loader_hidden'
      },
      colors: {
        primary: '#21458c',
        secondary: '#dfdfdf'
      },
      animatedClassName: 'loader_animated',
      fixedClassName: 'loader_fixed',
      refClassName: 'loader-ref',
      timeout: 800,
      overlay: true,
      fixed: false,
    }

    this.options = merge(defaults, options);
    this.parent = el;
    this.el = null;
    this.state = 'hidden';

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    Loader.instances.set(this.parent, this);

    this.el = this.render(this.parent);
    this.setState('visible');
  }

  render = (el: HTMLElement) => {
    let div = document.createElement('div');

    div.className = 'loader';
    if (this.options.overlay === true) {
      div.classList.add('loader_has-overlay');
    }
    if (this.options.fixed === true) {
      div.classList.add(this.options.fixedClassName)
    }

    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="loader__icon" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" fill="none">
        <circle class="loader__outer" cx="50" cy="50" r="30" stroke="${this.options.colors.secondary}" stroke-width="4">
        </circle>
        <circle class="loader__inner" cx="50" cy="50" r="30" stroke="${this.options.colors.primary}" stroke-width="4" stroke-dasharray="20 180">
        </circle>
      </svg>
    `;
    el.appendChild(div);
    el.classList.add(this.options.refClassName);

    return div;
  }

  destroy = () => {
    Loader.instances.delete(this.parent);

    if (this.el === null) return;

    this.parent.removeChild(this.el);
    this.parent.classList.remove(this.options.refClassName);
    this.el = null;
  }

  setState = (state: LoaderState) => {
    let self = this;

    if (self.el === null) return;

    if (state === 'visible') {
      self.el.classList.add(self.options.animatedClassName);
    }

    self.el.classList.remove(self.options.states[self.state]);
    self.state = state;
    self.el.classList.add(self.options.states[state]);

    if (state === 'hidden') {
      setTimeout(() => {
        if (self.el) {
          self.el.classList.remove(self.options.animatedClassName);
        }
        self.destroy();
      }, self.options.timeout);
    }
  }
}

if (!(window as any).Loader) {
  (window as any).Loader = Loader;
}

export default Loader;
