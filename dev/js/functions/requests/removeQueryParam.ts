export default function removeQueryParam(key: string, url: string) {
  if (!url) url = window.location.href;

  let rtn = url.split('?')[0];
  let param;
  let paramArr = [];
  let queryString = (url.indexOf('?') !== -1) ? url.split('?')[1] : '';

  if (queryString !== '') {
      paramArr = queryString.split('&');
      for (var i = paramArr.length - 1; i >= 0; i -= 1) {
          param = paramArr[i].split('=')[0];
          if (param === key) {
              paramArr.splice(i, 1);
          }
      }

      if (paramArr.length) {
        rtn = rtn + '?' + paramArr.join('&');
      }
  }

  return rtn;
}
