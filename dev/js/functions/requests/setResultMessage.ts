import formatResult from 'functions/requests/formatResult';

interface Options {
  status: string;
  responseText: string | object;
  bare?: boolean;
}

export default function setResultMessage (params: Options): HTMLElement {
  let el = document.createElement('div');
  let classes: {[index: string]: any} = {
      success: 'success',
      error: 'error'
  }

  if (params.bare) {
    el.className = 'c-alert c-alert_style_bare u-color-' + classes[params.status];
  } else {
    el.className = 'c-alert c-alert_style_default c-badge c-badge_color_' + classes[params.status];
  }

  if (typeof params.responseText === 'object' || typeof params.responseText === 'string') {
    el.innerHTML = formatResult({
      responseText: params.responseText
    });
  }

  return el;
}
