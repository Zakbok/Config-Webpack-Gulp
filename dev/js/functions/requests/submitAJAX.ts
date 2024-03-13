import {Options as validateFormOptions, validateForm} from "functions/requests/validateForm";
import setControlState from "functions/controls/setControlState";
import setResultMessage from "functions/requests/setResultMessage";
import createModal from "functions/controls/createModal";
import formatResult from 'functions/requests/formatResult';
import merge from 'functions/utility/merge';
import setDataOptions from "functions/utility/setDataOptions";

interface Options {
  validationConfig?: validateFormOptions;
  resultMessage?: 'inline' | 'popup' | 'custom' | 'none';
  popupOptions?: object;
  resetForm?: boolean;
  redirect?: string | boolean;
  redirectDelay?: number;
  serialize?: boolean;
  beforeSubmit?: (form: HTMLFormElement, formData: object) => void | boolean;
  onSuccess?: (form: HTMLFormElement, response: {}) => void;
  onError?: (form: HTMLFormElement, response: {}) => void;
  onComplete?: (form: HTMLFormElement, response: {}) => void;
}

export default function submitAJAX (form: HTMLFormElement, e: SubmitEvent, params: Options = {}) {
  e.preventDefault();

  const defaults: Options = {
    validationConfig: {
      form: form,
      errorClass: 'c-input_error'
    },
    resultMessage: 'inline',
    popupOptions: {},
    resetForm: true,
    redirect: false,
    redirectDelay: 500,
    serialize: true
  }

  params = merge(defaults, params);
  params = setDataOptions(params, form);

  const isValid = validateForm(params.validationConfig);

  if (!isValid) {
    let firstError = form.querySelector(`.${params.validationConfig.errorClass}`) as HTMLInputElement;

    firstError.focus();

    return false;
  };

  let $form = $(form);
  let formResult = form.querySelector('[data-form-result]') as HTMLElement;
  let popup;
  let submitInput = form.querySelector('[type=submit]') as HTMLInputElement | HTMLButtonElement;
  let formData;

  if (params.serialize) {
    formData = $form.serializeArray();
  } else {
    formData = new FormData(form);
  }

  let popupParent = false as FancyBoxSlide | boolean;

  if (params.serialize) {
    formData.push({name: 'is_ajax', value: 'Y'}, {name: 'id', value: form.id});
  } else {
    formData.append('is_ajax', 'Y');
    formData.append('id', form.id);
  }

  if (submitInput) {
    setControlState(submitInput, 'disabled', 'c-btn_disabled');
  }

  if (typeof params.beforeSubmit === 'function') {
    let cbResult = params.beforeSubmit(form, formData);

    if (cbResult === false) {
      return false;
    }
  }

  // адрес отправки формы может перезаписываться атрибутом formaction
  let url = form.action;

  if (e.submitter && e.submitter.hasAttribute('formaction')) {
    url = e.submitter.getAttribute('formaction');
  }

  $.ajax({
    type: 'POST',
    url: url,
    data: formData,
    dataType: 'json',
    processData: params.serialize ? true : false,
    contentType: params.serialize ? 'application/x-www-form-urlencoded; charset=UTF-8' : false,
    success: function (response) {
      console.log(response);
      let resultMessage = setResultMessage({
        status: response.STATUS,
        responseText: response.STATUS === 'success' ? response.NOTE : response.ERRORS
      });

      if (params.resultMessage === 'inline' && formResult || ['popup', 'custom'].indexOf(params.resultMessage) > -1 && formResult && response.STATUS === 'error') {
        $(formResult).html(resultMessage);
      } else if (params.resultMessage === 'popup' && response.STATUS === 'success') {
        popup = createModal({
          className: 'c-modal_default',
          title: response.TITLE,
          content: response.NOTE
        });

        $.fancybox.open(popup, params.popupOptions);

        popupParent = $.fancybox.getInstance().current;
      }

      if (response.STATUS === 'success') {
        if (params.resetForm) {
          form.reset();
        }

        if (params.resultMessage === 'inline' && formResult) {
            setTimeout(function () {
              formResult.innerHTML = '';
            }, 5000);
        } else if (params.resultMessage === 'popup' && formResult) {
          formResult.innerHTML = '';
        }

        if (typeof params.onSuccess === 'function') {
          params.onSuccess(form, response);
        }

        let redirect = '';

        if (params.redirect && typeof params.redirect === 'string') {
          redirect = params.redirect;
        } else if (response.REDIRECT) {
          redirect = response.REDIRECT;
        }

        if (redirect) {
          setTimeout(function () {
            window.location.href = redirect;
          }, params.redirectDelay);
        }
      } else if (response.STATUS === 'error') {
        if (typeof params.onError === 'function') {
          params.onError(form, response);
        }
      }

      if (typeof params.onComplete === 'function') {
        params.onComplete(form, response);
      }
    },
    error: function (response) {
      // console.log(response);
      if (formResult) {
        let resultMessage = setResultMessage({
          status: 'error',
          responseText: 'При отправке формы произошла ошибка'
        });

        $(formResult).html(resultMessage);
      }
    },
    complete: function () {
      if (submitInput) {
        setControlState(submitInput, 'default', 'c-btn_disabled');
      }
    }
  });
}
