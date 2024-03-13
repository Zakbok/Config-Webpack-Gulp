import merge from 'functions/utility/merge';
import setDataOptions from 'functions/utility/setDataOptions';

interface Options {
  tablistClass: string;
  contentClass: string;
  tabClass: string;
  linkClass: string;
  linkActiveClass: string;
  panelClass: string;
  inactiveClass: string;
  changeURL: boolean;
  onChange: (instance: Tabs) => void;
  [key: string]: Options[keyof Options];
}

class Tabs {
  options: Options;
  el: HTMLElement;
  tablist: HTMLElement;
  tabs: NodeListOf<HTMLElement>;
  tabItems: NodeListOf<HTMLElement>;
  contents: HTMLElement;
  panels: NodeListOf<HTMLElement>;
  state: {
    activeTab: number
  }

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults: Options = {
      tablistClass: 'c-tablist',
      contentClass: 'c-tabs__contents',
      tabClass: 'c-tablist__item',
      linkClass: 'c-tab',
      linkActiveClass: 'c-tab_active',
      panelClass: 'c-tabs__section',
      inactiveClass: 'd-none',
      changeURL: false,
      onChange: function (instance: Tabs) {}
    };

    this.options = merge(defaults, options);
    this.options = setDataOptions(this.options, el);

    this.el = el;
    this.tablist = this.el.querySelector(`.${this.options.tablistClass}`) as HTMLElement;
    this.tabs = this.tablist.querySelectorAll(`.${this.options.linkClass}`) as NodeListOf<HTMLElement>;
    this.tabItems = this.tablist.querySelectorAll(`.${this.options.tabClass}`) as NodeListOf<HTMLElement>;
    this.contents = this.el.querySelector(`.${this.options.contentClass}`) as HTMLElement;
    this.panels = this.contents.querySelectorAll(`.${this.options.panelClass}`) as NodeListOf<HTMLElement>;

    this.state = {
      activeTab: 0
    }

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Tabs.instances.set(self.el, self);

    self.state.activeTab = self.getActiveTab();

    if (self.options.changeURL === true) {
      let targetID = window.location.hash.substr(1) as string;
      let targetTab = targetID ? this.tablist.querySelector(`#${targetID}`) as HTMLElement : this.tabs[0] as HTMLElement;
      let targetIndex = Array.prototype.indexOf.call(this.tabs, targetTab);

      self.switchTab(targetIndex);
    }

    Array.prototype.forEach.call(this.tabs, (tab, i) => {
      tab.addEventListener('click', this.handleClick);
      tab.addEventListener('keydown', this.handleKeyPress);
    });
  }

  getActiveTab = () => {
    let activeTab = this.tablist.querySelector('[aria-selected="true"]') as HTMLElement;
    let tabIndex = Array.prototype.indexOf.call(this.tabs, activeTab);

    return tabIndex;
  }

  handleClick = (e: MouseEvent) => {
    let self = this;
    let target = e.currentTarget as HTMLElement;
    let index = Array.prototype.indexOf.call(self.tabs, target);

    self.switchTab(index);

    e.preventDefault();
  }

  handleKeyPress = (e: KeyboardEvent) => {
    let self = this;
    let target = e.currentTarget as HTMLElement;
    // Get the index of the current tab in the tabs node list
    let index = Array.prototype.indexOf.call(this.tabs, target);
    // Work out which key the user is pressing and
    // Calculate the new tab's index where appropriate
    let dir = e.which === 37 ? index - 1 : e.which === 39 ? index + 1 : e.which === 40 ? 'down' : null as number | null;

    if (dir !== null) {
      e.preventDefault();
      // If the down key is pressed, move focus to the open panel,
      // otherwise switch to the adjacent tab
      dir === 'down' ? this.panels[index].focus() : this.tabs[dir] ? self.switchTab(dir) : void 0;
    }
  }

  switchTab = (newTab: number = 0) => {
    let self = this;
    let oldTab = self.state.activeTab;

    if (oldTab === newTab) return;

    self.tabs[oldTab].setAttribute('tabindex', '-1');
    self.tabs[oldTab].setAttribute('aria-selected', 'false');
    self.tabs[oldTab].classList.remove(self.options.linkActiveClass);
    self.panels[oldTab].classList.add(self.options.inactiveClass);

    self.tabs[newTab].focus();
    self.tabs[newTab].removeAttribute('tabindex');
    self.tabs[newTab].setAttribute('aria-selected', 'true');
    self.tabs[newTab].classList.add(self.options.linkActiveClass);
    self.panels[newTab].classList.remove(self.options.inactiveClass);

    if (self.options.changeURL === true) {
      history.pushState(null, '', '#' + self.tabs[newTab].getAttribute('id'));
    }

    self.state.activeTab = newTab;

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(self);
    }
  }
}

if (!(window as any).Tabs) {
  (window as any).Tabs = Tabs;
}

export default Tabs;
