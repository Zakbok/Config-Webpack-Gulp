import camelCaseToDash from 'functions/utility/camelCaseToDash';
import merge from 'functions/utility/merge';

interface Options {
  [key: string]: any;
}

export default function setDataOptions (options: Options, elem: HTMLElement) {
  let newOptions: Options = {};

  for (let option in options) {
    let dataOption = elem.getAttribute(`data-${camelCaseToDash(option)}`) as string | boolean;

    if (!dataOption) continue;

    if (dataOption === 'true' || dataOption === 'false') {
      dataOption = dataOption === 'true';
    }

    newOptions[option] = dataOption;
  }

  return merge(options, newOptions);
}
