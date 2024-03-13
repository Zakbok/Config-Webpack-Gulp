export default function setControlState (control: HTMLInputElement|HTMLButtonElement|HTMLElement, state: string, disabledClass: string) {
  let inputsArray = ['button', 'input'];

  switch (state) {
    case 'default':
      control.classList.remove(disabledClass);
      if (inputsArray.indexOf(control.nodeName.toLowerCase()) > -1) {
        (control as HTMLButtonElement | HTMLInputElement).disabled = false;
      }
      break;

    case 'disabled':
      control.classList.add(disabledClass);

      if (inputsArray.indexOf(control.nodeName.toLowerCase()) > -1) {
        (control as HTMLButtonElement | HTMLInputElement).disabled = true;
      }
      break;
  }
}
