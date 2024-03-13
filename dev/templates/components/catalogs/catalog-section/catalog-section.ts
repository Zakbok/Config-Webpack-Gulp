import merge from 'functions/utility/merge';
import updateQueryString from 'functions/requests/updateQueryString';
// import removeQueryParam from 'utility/removeQueryParam';
import getQueryParams from 'functions/requests/getQueryParams';
import throttle from 'functions/utility/throttle';
import AJAXPag from 'components/nav/ajax-pag/ajax-pag';
import Loader from 'components/loaders/radial-loader/radial-loader';

interface Options {
  form: string;
  body: string;
  search: string;
  updateParams: boolean;
  onInit: (instance: Catalog) => void;
  onSuccess?: (instance: Catalog) => void;
}

interface RequestParams {
  count?: string;
  onSuccess?: (instance: Catalog, data?: {}, response?: any) => void;
}

class Catalog {
  el: HTMLElement;
  options: Options;
  form: HTMLFormElement;
  body: HTMLElement;
  search: HTMLInputElement;
  state: {};

  constructor(el: HTMLElement, options: Partial<Options> = {}) {
    const defaults = {
      form: '[data-catalog-form]',
      body: '[data-catalog-body]',
      search: '[data-catalog-search]',
      updateParams: false
    }

    if (!el) {
      throw new Error('No element passed');
    };

    this.options = merge(defaults, options);
    this.el = el;
    this.form = this.el.querySelector(this.options.form) as HTMLFormElement;
    this.body = this.el.querySelector(this.options.body) as HTMLFormElement;
    this.search = this.form.querySelector(this.options.search) as HTMLInputElement;

    this.state = {
      loading: false
    }

    this.init();
  }

  static instances = new WeakMap();

  init = () => {
    let self = this;

    Catalog.instances.set(self.el, self);

    self.el.addEventListener('click', self.handleClick);
    self.form.addEventListener('submit', self.handleSubmit);

    if (self.search) {
      let handleSearch = throttle(self.handleSubmit, 500);

      self.search.addEventListener('input', handleSearch);
    }

    if (typeof this.options.onInit === 'function') {
      this.options.onInit(self);
    }
  }

  handleClick = (e: Event) => {
    let self = this;
    let target = e.target as HTMLElement;
    // выключено из-за проблем с куки
    // let countCtrl = $(target).closest('.links-list__link').get(0);

    // if (countCtrl) {
    //   let count = countCtrl.getAttribute('data-value');

    //   self.sendRequest('submit_form', {
    //     count: count,
    //     onSuccess: function () {
    //       let list = $(countCtrl).closest('.links-list').get(0);
    //       let items = list.querySelectorAll('.links-list__item');
    //       let activeClass = 'links-list__item_active';

    //       for (let i = 0; i < items.length; i++) {
    //         items[i].classList.remove(activeClass);
    //       }

    //       countCtrl.parentElement.classList.add(activeClass);
    //     }
    //   });
    // }
  }

  handleSubmit = (e: Event) => {
    let self = this;

    e.preventDefault();

    if (self.state.loading) return;

    self.sendRequest('submit_form');
  }

  sendRequest = (action: string, params: RequestParams = {}) => {
    let self = this;
    let loader;
    let url;

    switch (action) {
      case 'submit_form':
        let formData = $(self.form).serializeArray();
        loader = new Loader(self.el, {
          fixed: true
        });

        formData.push({name: 'action', value: 'submit_form'})

        if (self.form.id) {
          formData.push({name: 'form_id', value: self.form.id});
        }

        if (params.count) {
          formData.push({name: 'count', value: params.count});
        }

        self.state.loading = true;

        let action = self.el.action;
        let queryParams = getQueryParams(action);

        if (!action) {
          action = window.location.href;
        }

        // сбрасываем пагинацию на 1 страницу
        for (let param in queryParams) {
          if (param.indexOf('PAGEN_') > -1) {
            action = updateQueryString(param, '1', action);
          }
        }

        // управление параметрами
        url = window.location.href.split(/[?#]/)[0];

        console.log(formData);

        $.ajax({
          method: self.form.method,
          url: url,
          data: formData,
          success: function (response) {
            // console.log(response);
            $(self.body).html(response);

            // управление параметрами
            let url = window.location.href.split(/[?#]/)[0];
            let queryParams = getQueryParams(url);
            let utilityFields = [
              'is_ajax',
              'count',
              'form_id',
              'action',
            ];
            let queryArray = [];

            if (self.options.updateParams) {
              $.each(formData, function (index: number, field: {name: string, value: string}) {
                if (utilityFields.indexOf(field.name) === -1 && ['all', ''].indexOf(field.value) === -1) {
                  queryArray.push({name: field.name, value: field.value});
                }
              });
            }

            let queryStr = $.param(queryArray);

            url = url + '?' + queryStr;

            if (url !== window.location.href) {
              window.history.pushState({path: url}, '', url);
            }

            let pag = document.querySelector('[data-ajax-pag]') as HTMLElement;

            if (pag) {
              new AJAXPag(pag);
            }

            if (typeof params.onSuccess === 'function') {
              params.onSuccess(self);
            }

            if (typeof self.options.onSuccess === 'function') {
              self.options.onSuccess(self);
            }
          },
          error: function (response) {
            console.log(response);
          },
          complete: function () {
            loader.setState('hidden');
            self.state.loading = false;
          }
        });

        break;

      // case 'get_prop':
      //   let el = params.el;
      //   let data = {
      //     action: action,
      //     code: params.el.getAttribute('data-prop'),
      //     filter: params.filter,
      //   }

      //   loader = new Loader(params.el, {
      //     fixed: false
      //   });

      //   if (self.form.id) {
      //     data.form_id = self.form.id;
      //   }

      //   self.state.loading = true;

      //   url = window.location.href.split(/[?#]/)[0];

      //   $.ajax({
      //     method: 'POST',
      //     url: url,
      //     data: data,
      //     success: function (response) {
      //       console.log(response)

      //       if (typeof params.onSuccess === 'function') {
      //         params.onSuccess(self, data, response);
      //       }
      //     },
      //     error: function (response) {
      //       console.log(response);
      //     },
      //     complete: function () {
      //       loader.setState('hidden');
      //       self.state.loading = false;
      //     }
      //   });

      //   break;
    }
  }
}

if (!(window as any).Catalog) {
  (window as any).Catalog = Catalog;
}

export default Catalog;
