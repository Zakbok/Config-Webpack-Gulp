interface Options {
  responseText: string | object;
}

export default function formatResult (params: Options) {
  let result = '';

  if (typeof params.responseText === 'object') {
    let responseArray = $.map(params.responseText, function (value: string) {
      return value;
    });

    for (let i = 0; i < responseArray.length; i++) {
        result += responseArray[i].replace('Не заполнены следующие обязательные поля', 'Не заполнено поле') + '<br>';
    }
  } else if (typeof params.responseText === 'string') {
    result = params.responseText;
  }

  return result;
}
