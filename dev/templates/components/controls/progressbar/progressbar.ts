import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';
import formatNumber from 'functions/utility/formatNumber';

interface Options {
  bar: string;
  timer: string;
  start: number;
  current: number;
  limit: number;
  timeFormat: string;
  stop: boolean;
  direction: 'increase' | 'decrease';
  formatTime: boolean;
  onInit: (instance: ProgressBar) => void;
  onTick: (instance: ProgressBar) => void;
}

interface TimeObject {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  [key: string]: number;
}

class ProgressBar {
  el: HTMLElement;
  options: Options;
  bar: HTMLElement;
  timer: HTMLElement;
  interval: number;
  state: {
    current: number;
    stopped: boolean;
  }

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      bar: '[data-bar]',
      timer: '[data-timer]',
      start: 0,
      current: 0,
      limit: 10000,
      timeFormat: 'days:hours:minutes:seconds',
      stop: false,
      direction: 'increase',
      formatTime: true,
      onInit: function (instance: ProgressBar) {},
      onTick: function (instance: ProgressBar) {}
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);
    this.el = el;
    this.bar = this.el.querySelector(this.options.bar) as HTMLElement;
    this.timer = this.el.querySelector(this.options.timer) as HTMLElement;
    this.interval = 0;
    this.state = {
      current: parseInt(this.options.current.toString()),
      stopped: this.options.stop
    }

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    ProgressBar.instances.set(self.el, self);
    self.start();

    if (typeof self.options.onInit === 'function') {
      self.options.onInit(self);
    }
  }

  stop = () => {
    let self = this;

    if (!self.interval) return;

    self.resetInterval();
    self.state.stopped = true;
  }

  start = () => {
    let self = this;

    self.state.current = self.options.current;
    self.state.stopped = false;
    self.setState();
    self.el.setAttribute('data-init', 'true');
    self.resetInterval();

    if (!this.state.stopped) {
      this.interval = window.setInterval(function () {
        self.setState();
      }, 1000);
    }
  }

  resetInterval = () => {
    let self = this;

    if (self.interval <= 0) return;

    clearInterval(self.interval);
    self.interval = 0;
  }

  setState = () => {
    let self = this;

    if (self.bar) {
      let currentWidth = (self.state.current / self.options.limit) * 100;
      let maxWidth = 100;

      self.bar.style.width = `${currentWidth > maxWidth ? maxWidth : currentWidth}%`;
    }

    if (self.timer) {
      let time = self.getTime(self.state.current);

      self.timer.innerHTML = self.formatTime(time, self.options.timeFormat);
    }

    self.state.current = self.options.direction === 'increase' ? self.state.current + 1 : self.state.current - 1;

    if (typeof self.options.onTick === 'function') {
      self.options.onTick(self);
    }
  }

  getTime = (seconds: number): TimeObject => {
    let secondsFull = seconds;
    let days = Math.floor(seconds / (3600*24));
    seconds -= days * 3600 * 24;
    let hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      sFull: secondsFull
    }
  }

  formatTime = (timeObj: TimeObject, format: string): string => {
    let result = format;

    for (let key in timeObj) {
      result = result.replace(key, formatNumber(timeObj[key]));
    }

    return result;
  }
}

if (!(window as any).ProgressBar) {
  (window as any).ProgressBar = ProgressBar;
}

export default ProgressBar;
