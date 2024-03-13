export default function hasValueInAttribute (el: HTMLElement, action: string, attribute: string) {
  let actions = el.getAttribute(attribute);
  let actionsArr: string[] = [];

  if (actions) {
    actionsArr = actions.split(',');
  }

  let actionArr = action.split(',');

  if (actionArr.length > 1) {
    let intersection = actionsArr.filter(x => actionArr.includes(x));

    return intersection.length > 0;
  } else {
    return actionsArr.indexOf(action) !== -1;
  }
}
