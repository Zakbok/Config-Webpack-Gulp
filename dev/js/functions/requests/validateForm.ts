export interface Options {
  form: HTMLFormElement;
  errorClass: string;
  onSuccess?: (control: HTMLInputElement | HTMLSelectElement) => void;
  onError?: (control: HTMLInputElement | HTMLSelectElement) => void;
}

export function validateForm (params: Options) {
  let isValid = true;
  let controls = params.form.querySelectorAll('input[required], input[data-required], textarea[required], textarea[data-required]') as NodeListOf<HTMLInputElement | HTMLSelectElement>;

  for (let i = 0; i < controls.length; i++) {
    let control = controls[i];

    if (control.value) {
      control.classList.remove(params.errorClass);

      if (typeof params.onSuccess === 'function') {
        params.onSuccess(control);
      }
    } else {
      isValid = false;

      control.classList.add(params.errorClass);

      if (typeof params.onError === 'function') {
        params.onError(control);
      }
    }
  }

  return isValid;
}

export default validateForm;
