import findAncestor from 'functions/utility/findAncestor';
import merge from 'functions/utility/merge';
import setControlState from 'functions/controls/setControlState';

interface Options {
  input: string;
  form: string;
  submitBtn: string;
  disabledClass: string;
}

class PrivacyCheck {
  el: HTMLElement;
  options: Options;
  input: HTMLInputElement;
  form: HTMLFormElement;
  submitBtn: NodeListOf<HTMLInputElement> | NodeListOf<HTMLButtonElement>;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      input: 'input[type="checkbox"]',
      form: '.c-form',
      submitBtn: '[type="submit"]',
      disabledClass: 'c-btn_disabled'
    }

    this.options = merge(defaults, options);
    this.el = el;
    this.input = el.querySelector(this.options.input) as HTMLInputElement;
    this.form = findAncestor(el, this.options.form) as HTMLFormElement;
    this.submitBtn = this.form.querySelectorAll(this.options.submitBtn) as NodeListOf<HTMLInputElement> | NodeListOf<HTMLButtonElement>;

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    PrivacyCheck.instances.set(this.el, self);

    this.input.addEventListener('change', this.handleChange);
  }

  handleChange = () => {
    let state = this.input.checked ? 'default' : 'disabled';

    for (let i = 0; i < this.submitBtn.length; i++) {
      this.setInputState(this.submitBtn[i], state);
    }
  }

  setInputState (input: HTMLButtonElement | HTMLInputElement, state: string = 'default') {
    setControlState(input, state, this.options.disabledClass);
  }
}

if (!(window as any).PrivacyCheck) {
  (window as any).PrivacyCheck = PrivacyCheck;
}

export default PrivacyCheck;
