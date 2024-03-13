export default function getQueryParams (url: string) {
  if (!url) url = window.location.href;

  let params = {};
  let parser = document.createElement('a');
  let query;
  let vars;

  parser.href = url;
  query = parser.search.substring(1);
  vars = query.split('&');

  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split('=');

    params[pair[0]] = decodeURIComponent(pair[1]);
  }

  return params;
};
