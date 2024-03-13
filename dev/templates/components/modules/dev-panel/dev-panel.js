;(function (window, document) {
  'use strict';

  function DevPanel (el, options) {
    this.el = el;

    this.options = options || {};

    this.settings = {
      optionExample: 'optionValue'
    };

    for (const option in this.settings) {
      if (typeof this.options[option] === 'undefined') {
        this.options[option] = this.settings[option];
      }
    }

    this.toggle = el.querySelector('.dev-panel__toggle');
    this.panel = el.querySelector('.dev-panel__panel');

    // initialize
    this.init();
  }

  DevPanel.prototype = {

    init: function () {
      const self = this;

      const dpAcns = document.querySelectorAll('.dp-acn');

      for (let i = 0; i < dpAcns.length; i++) {
        new DpAcn(dpAcns[i]);
      }

      self.getToC(
        'toc.json',
        {
          onSuccess: function (data) {
            self.createToC(data);
            self.getFeatures();
          }
        }
      );

      self.toggle.addEventListener('click', function () {
        if (self.el.classList.contains('dev-panel_active')) {
          self.close();
        } else {
          self.open();
        }
      });

      const closeIfNotTarget = function (event) {
        const isClickInside = self.el.contains(event.target);

        if (!isClickInside) {
          self.close();
        }
      };

      document.addEventListener('click', closeIfNotTarget);

      // let lock = document.querySelector('.dp-action_lock');
      // let actionActive = 'dp-action_active';

      // lock.addEventListener('click', function () {
      //   let self = this;

      //   if (self.classList.contains(actionActive)) {
      //     self.classList.remove(actionActive);
      //     lockListener('a', 'click');
      //     lockListener('form', 'submit');
      //   } else {
      //     self.classList.add(actionActive);
      //   }
      // });

      // function lockListener (tag, action) {
      //   let tags = document.querySelectorAll(tag);

      //   for (let i = 0; i < tags.length; i++) {
      //     tags[i].addEventListener(action, function (e) {
      //       e.preventDefault();
      //     });
      //   }
      // }
    },

    open: function () {
      const self = this;

      self.el.classList.add('dev-panel_active');
    },

    close: function () {
      const self = this;

      self.el.classList.remove('dev-panel_active');
    },

    getToC: function (filepath, params) {
      const array = [];
      const xhr = new XMLHttpRequest();

      xhr.open('GET', filepath, true);

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 400) {
          // Success!
          const data = JSON.parse(xhr.responseText);

          for (const key in data) {
            array.push(data[key]);
          }

          if (typeof params.onSuccess === 'function') {
            params.onSuccess(array);
          }
        } else {
          // We reached our target server, but it returned an error
          console.log('error');
        }
      };

      xhr.send();
    },

    createToC: function (pages) {
      const pagesWrap = document.querySelector('#dp-toc');
      const pagesList = document.createElement('ul');
      pagesList.className = 'dp-toc';

      pagesWrap.appendChild(pagesList);

      for (let i = 0; i < pages.length; i++) {
        const page = document.createElement('li');
        const pageUrl = `/${pages[i]}.html`;
        const isCurrentPage = (pageUrl === location.pathname);

        page.className = 'dp-toc__item ' + (isCurrentPage ? 'dp-toc__item_active' : '');
        page.innerHTML = `<a class="dp-toc__link dp-toc__link_has-hover" href="${pageUrl}">${pages[i]}</a>`;

        pagesList.appendChild(page);
      }
    },

    getFeatures: function () {
      const featuresWrap = document.querySelector('#dp-features');
      const featuresList = document.createElement('ul');
      const features = document.querySelector('html').classList;
      featuresList.className = 'dp-toc';

      featuresWrap.appendChild(featuresList);

      for (let i = 0; i < features.length; i++) {
        const item = document.createElement('li');

        item.className = 'dp-toc__item';
        item.innerHTML = `<span class="dp-toc__link">${features[i]}</span>`;

        featuresList.appendChild(item);
      }
    }
  };

  window.DevPanel = DevPanel;
})(window, document);

document.addEventListener('DOMContentLoaded', function () {
  const devPanel = new DevPanel(document.querySelector('.dev-panel'));
});

// Simple Toggle
(function (window, document) {
  'use strict';

  function DpAcn (el, options) {
    this.el = el;

    if (!this.el) {
      return false;
    }

    this.options = options || {};

    this.settings = {
      activeClass: 'dp-acn_active',
      toggleClass: 'dp-acn__toggle',
      iconClass: 'dp-acn__ico',
      headClass: 'dp-acn__head',
      bodyClass: 'dp-acn__content',
      initialState: 'closed'
    };

    for (const option in this.settings) {
      if (typeof this.options[option] === 'undefined') {
        this.options[option] = this.settings[option];
      }
    }

    for (const option in this.options) {
      const optionCode = `data-${camelCaseToDash(option)}`;
      const dataOption = el.getAttribute(optionCode);

      if (dataOption && dataOption !== option) {
        this.options[option] = dataOption;
      }
    }

    this.toggle = el.querySelector(`.${this.options.toggleClass}`);

    this.heading = el.querySelector(`.${this.options.headClass}`);
    this.content = el.querySelector(`.${this.options.bodyClass}`);

    this.init();
  };

  DpAcn.prototype = {
    init: function () {
      const self = this;

      this.toggle.addEventListener('click', function () {
        if (self.el.classList.contains(self.options.activeClass)) {
          self.toggleUp();
        } else {
          self.toggleDown();
        }
      });

      if (this.options.initialState === 'opened') {
        this.toggleDown();
      }
    },

    toggleDown: function () {
      this.el.classList.add(this.options.activeClass);
      this.toggle.setAttribute('aria-expanded', true);
    },

    toggleUp: function () {
      this.el.classList.remove(this.options.activeClass);
      this.toggle.setAttribute('aria-expanded', false);
    }
  };

  function camelCaseToDash (str) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
  }

  window.DpAcn = DpAcn;
})(window, document);
