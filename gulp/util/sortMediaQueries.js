'use strict';

function isMax (mq) {
  return /max-width/.test(mq);
}

function isMin (mq) {
  return /min-width/.test(mq);
}

module.exports = function (a, b) {
  var A = a.replace(/\D/g, '');
  var B = b.replace(/\D/g, '');

  if (isMax(a) && isMax(b)) {
    return B - A;
  } else if (isMin(a) && isMin(b)) {
    return A - B;
  } else if (isMax(a) && isMin(b)) {
    return 1;
  } else if (isMin(a) && isMax(b)) {
    return -1;
  }

  return 1;
};
