import merge from 'functions/utility/merge';

interface Options {
  range: string,
  handle: string,
  [key: string]: Options[keyof Options];
}

class Range {
  el: HTMLElement;
  options: Options;
  range: HTMLInputElement;
  handle: HTMLElement | null;
  tooltip: HTMLElement | null;
  icon: HTMLElement | null;
  min: number;
  max: number;
  step: number;

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      range: '.c-range__input',
      handle: '.c-range__handle'
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.el = el;
    this.range = this.el.querySelector(this.options.range) as HTMLInputElement;
    this.handle = null;
    this.tooltip = null;
    this.icon = null;
    this.min = this.range.min ? parseInt(this.range.min) : 0;
    this.max = this.range.max ? parseInt(this.range.max) : 100;
    this.step = this.range.step ? parseInt(this.range.step) : 1;

    this.init();
  }

  init = () => {
    let self = this;

    $(self.range).rangeslider({
      polyfill: false,
      rangeClass: 'c-range',
      disabledClass: 'c-range_disabled',
      horizontalClass: 'c-range_horizontal',
      verticalClass: 'c-range_vertical',
      fillClass: 'c-range__fill',
      handleClass: 'c-range__handle',
      activeClass: 'c-range_active'
    });
  }
}

if (!(window as any).Range) {
  (window as any).Range = Range;
}

export default Range;
