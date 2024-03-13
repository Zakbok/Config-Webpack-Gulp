import merge from 'functions/utility/merge';

interface Options {
  caption: string;
  input: string;
  highlightedClass: string;
  drag: boolean;
  onInit: (instance: FileInput) => void;
  onChange: (instance: FileInput) => void;
  onSetCaption: (instance: FileInput) => void;
}

class FileInput {
  el: HTMLElement;
  options: Options;
  caption: HTMLElement;
  input: HTMLInputElement;
  state: {
    defaultMessage: string;
  }

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      caption: '.c-file__caption',
      input: '.c-file__input',
      highlightedClass: 'c-file_highlight',
      drag: true,
      onChange: function (instance: FileInput) {},
      onSetCaption: function (instance: FileInput) {},
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.el = el;
    this.caption = this.el.querySelector(this.options.caption) as HTMLElement;
    this.input = this.el.querySelector(this.options.input) as HTMLInputElement;

    this.state = {
      defaultMessage: ''
    }

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    FileInput.instances.set(self.el, self);

    self.state.defaultMessage = self.getDefaultMessage();
    self.input.addEventListener('change', self.handleChange);

    if (self.options.drag) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        self.caption.addEventListener(eventName, self.preventDefaults, false);
        document.body.addEventListener(eventName, self.preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        self.caption.addEventListener(eventName, self.highlight, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        self.caption.addEventListener(eventName, self.unhighlight, false);
      });

      self.caption.addEventListener('drop', self.handleDrop, false);
    }

    if (typeof this.options.onInit === 'function') {
      this.options.onInit(self);
    }
  }

  getDefaultMessage = () => {
    let self = this;
    let result = '';

    if (self.caption && self.caption.textContent) {
      result = self.caption.textContent.trim();
    }

    return result;
  }

  handleChange = (e: Event) => {
    let self = this;

    self.setCaption();

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(self);
    }
  }

  setCaption = () => {
    let self = this;
    let names = [];
    let fileName = '';

    if (self.input.files) {
      for (let i = 0; i < self.input.files.length; i++) {
        let name = self.input.files[i].name;

        names.push(name);
      }
    }

    fileName = names.join(', ');

    if (fileName) {
      self.caption.innerHTML = fileName;
      self.el.setAttribute('title', fileName);
    } else {
      self.caption.innerHTML = self.state.defaultMessage;
      self.el.removeAttribute('title');
    }

    if (typeof this.options.onSetCaption === 'function') {
      this.options.onSetCaption(self);
    }
  }

  preventDefaults = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  highlight = (e: Event) => {
    this.el.classList.add(this.options.highlightedClass);
  }

  unhighlight = (e: Event) => {
    this.el.classList.remove(this.options.highlightedClass);
  }

  handleDrop = (e: DragEvent) => {
    let self = this;
    let dt = e.dataTransfer;
    let files = dt ? dt.files : null;

    self.input.files = files;
    self.setCaption();
  }
}

if (!(window as any).FileInput) {
  (window as any).FileInput = FileInput;
}

export default FileInput;
