export default function camelCaseToDash (string: string) {
  let ret = '';
  let prevLowercase = false;

  for (let i = 0; i < string.length; i++) {
    let s = '';
    s = string.charAt(i);

    const isUppercase = s.toUpperCase() === s;

    if (isUppercase && prevLowercase) {
      ret += '-';
    }

    ret += s;
    prevLowercase = !isUppercase;
  }

  return ret.replace(/-+/g, '-').toLowerCase();
}
