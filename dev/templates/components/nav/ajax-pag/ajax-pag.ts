import findAncestor from 'functions/utility/findAncestor';
import updateQueryString from 'functions/requests/updateQueryString';
import setControlState from 'functions/controls/setControlState';
import merge from 'functions/utility/merge';

interface Options {
  block: string;
  container: string;
  control: string;
  controlDisabledClass: string;
  onSuccess: (instance: object) => void;
}

interface Pagen {
  id: string;
  page: string;
  param: string;
}

class AJAXPag {
  el: HTMLElement;
  options: Options;
  block: HTMLElement;
  container: HTMLElement;
  control: HTMLElement;
  pagen: Pagen;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      block: '[data-ajax-block]',
      container: '[data-ajax-container]',
      control: '[data-ajax-toggle]',
      controlDisabledClass: 'c-btn_disabled',
      onSuccess: function (instance: AJAXPag) {}
    }

    this.options = merge(defaults, options);
    this.el = el;
    this.block = findAncestor(this.el, this.options.block) as HTMLElement;
    this.container = this.block.querySelector(this.options.container) as HTMLElement;
    this.control = this.el.querySelector(this.options.control) as HTMLElement;
    this.pagen = {
      id: '1',
      page: '2',
      param: 'PAGEN_1'
    };

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    AJAXPag.instances.set(this.el, self);

    if (!this.control) return;

    this.control.addEventListener('click', this.handleClick);
  }

  destroy = () => {
    if (!this.control) return;

    this.control.removeEventListener('click', this.handleClick);
  }

  handleClick = (e: Event) => {
    if (!this.control || this.control.classList.contains(this.options.controlDisabledClass)) return false;

    this.getPagData();
    let url = this.getUrl();

    this.getData('GET', url);

    e.preventDefault();
  }

  getUrl = () => {
    let url = window.location.href;

    url = updateQueryString(this.pagen.param, this.pagen.page, url);

    return url;
  }

  getPagData = () => {
    this.pagen.id = this.control.getAttribute('data-nav-id') || this.pagen.id;
    this.pagen.page = this.control.getAttribute('data-nav-page') || this.pagen.page;
    this.pagen.param = `PAGEN_${this.pagen.id}`;
  }

  getData = (method: string, url: string) => {
    let self = this;

    setControlState(self.control, 'disabled', self.options.controlDisabledClass);

    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        // Success
        let response = xhr.responseText;
        let responseHTML = document.createElement('html');
        responseHTML.innerHTML = response;

        let block = responseHTML.querySelector(`[data-ajax-block="${self.block.getAttribute('data-ajax-block')}"]`) as HTMLElement;
        let content = block.querySelector(self.options.container) as HTMLElement;

        self.container.insertAdjacentHTML('beforeend', content.innerHTML);

        window.history.pushState({ path: url }, '', url);

        let newControl = responseHTML.querySelector(`${self.options.control}[data-nav-id="${self.pagen.id}"]`);

        if (!newControl) {
          let parent = self.el.parentNode;

          if (parent) {
            parent.removeChild(self.el);
          }

          self.destroy();
        } else {
          let newPage = newControl.getAttribute('data-nav-page') as string;

          self.control.setAttribute('data-nav-page', newPage);
          setControlState(self.control, 'default', self.options.controlDisabledClass);
        }

        if (typeof self.options.onSuccess === 'function') {
          self.options.onSuccess(self);
        }
      } else {
        // We reached our target server, but it returned an error
        console.log('Server returned an error');
      }
    };

    xhr.onerror = function () {
      // There was a connection error of some sort
      console.log('There was a connection error');
    };

    xhr.send();
  }
}

if (!(window as any).AJAXPag) {
  (window as any).AJAXPag = AJAXPag;
}

export default AJAXPag;
