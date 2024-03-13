interface Options {
  onSuccess?: (field: HTMLElement) => void;
}

export default function fillFields (el: HTMLElement, arValues: [], params: Options = {}) {
  for (let key in arValues) {
    let fields = el.querySelectorAll(`[data-field="${key.toLowerCase()}"]`) as NodeListOf<HTMLElement>;
    let nodeName;
    let field;

    for (let i = 0; i < fields.length; i++) {
      field = fields[i];
      nodeName = field.nodeName.toLowerCase();

      switch (nodeName) {
        case 'img':
          (field as HTMLImageElement).src = arValues[key];

          break;

        case 'input':
          (field as HTMLInputElement).value = arValues[key];

          break;

        default:
          field.innerHTML = arValues[key];

          break;
      }

      if (typeof params.onSuccess === 'function') {
        params.onSuccess(field);
      }
    }
  }
}
