import Acn from 'components/controls/acn/acn';
import Range from 'components/controls/range/range';
import Popup from 'components/controls/popup/popup';

import submitAJAX from 'functions/requests/submitAJAX';
import fillFields from 'functions/utility/fillFields';
import updateControlsList from 'functions/controls/updateControlsList';
import setControlState from 'functions/controls/setControlState';
import createModal from 'functions/controls/createModal';
import setResultMessage from 'functions/requests/setResultMessage';

document.addEventListener('DOMContentLoaded', function () {
  const fbDefaults = global.fbDefaults;
  // форма ступени
  // промежуточное сохранение пунктов
  $(document).on('change', '[data-ajax-form-step] input', function (e: Event) {
    let self = this;

    if (!self.type) return;

    let form = $(self).closest('[data-ajax-form-step]').get(0) as HTMLFormElement;
    let parent = $(form).closest('[data-step]').get(0) as HTMLElement;
    let siblings = form.querySelectorAll('.c-ctrl__input') as NodeListOf<HTMLInputElement>;
    let data = new FormData(form);

    data.append('step', parent.getAttribute('data-step') || '');
    data.append('action', 'save');

    $.ajax({
      method: 'POST',
      url: form.action,
      data: data,
      dataType: 'json',
      processData: false,
      contentType: false,
      success: function (response) {
        if (response.STATUS === 'success') {
          let totalCount = siblings.length;
          let checkedCount = 0;
          let formState = form.getAttribute('data-state');

          for (let i = 0; i < totalCount; i++) {
            if (siblings[i].checked) {
              checkedCount++;
            }
          }

          if (totalCount === checkedCount) {
            formState = 'ready';
          } else {
            formState = 'default';
          }

          form.setAttribute('data-state', formState);
          updateControlsList(form, form, 'd-none');

          // прокрутка до футера
          let footer = form.querySelector('#step_footer') as HTMLElement;

          if (formState === 'ready' && footer) {
            scrollToElement(footer);
          }
        } else if (response.STATUS === 'error') {
          self.checked = !self.checked;

          let formResult = form.querySelector('[data-form-result]') as HTMLElement;
          let resultMessage = setResultMessage({
            status: response.STATUS,
            responseText: response.ERRORS
          });

          $(formResult).html(resultMessage);
          scrollToElement(parent);
        }
      }
    });
  });

  // полноценное сохранение
  $(document).on('submit', '[data-ajax-form-step]', function (e: Event) {
    submitAJAX(this, e, {
      serialize: false,
      resetForm: false,
      onSuccess: function (form, response) {
        let quotePopup = document.querySelector('#quote-popup') as HTMLElement;

        $.fancybox.close();
        fillFields(quotePopup, {quote_text: response.DATA.QUOTE_TEXT, quote_author: response.DATA.QUOTE_AUTHOR});
        $.fancybox.open(
          quotePopup,
          $.extend({}, fbDefaults, {
            afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
              let content = current.$content.get(0);
              let fbContainer = $(content).closest('.fancybox-container').get(0);
              let canvas = document.createElement('canvas');

              canvas.className = 'fancybox-underlay';
              fbContainer.appendChild(canvas);

              let context = canvas.getContext("2d");
              let width = canvas.width = window.innerWidth;
              let height = canvas.height = window.innerHeight;
              let particles = [];
              let fireforks = [];
              let mouseX = 0;
              let mouseY = 0;
              let size = 3;
              let hue = 0;
              let count = 0;
              let dense = 2;

              window.setInterval(function () {
                var i;

                if (count % 2 === 0) {
                  for (i = 1; i <= dense; i++) {
                    createParticle()
                  }
                }

                if (count % 3 === 0) {
                  for (i = 1; i <= dense; i++) {
                    createParticle()
                  }
                }

                if (count % 5 === 0) {
                  for (i = 1; i <= dense; i++) {
                    createParticle()
                  }
                }

                count++;

              }, 200);

              update();

              function createParticle() {
                var p = new Particle(width / 2, height, 10 + 5 * Math.random(), (1.4 + Math.random() * 0.2) * Math.PI);
                p.size = size;
                p.hue = hue;
                p.lightness = 40 + 40 * Math.random();
                p.setGravity(0.1);
                p.setFriction(0.99);

                particles.push(p);
              }

              function createFirefork(x, y, _size, _hue) {
                var p = new Particle(x, y, 6 + 4 * Math.random(), Math.random() * 2 * Math.PI);
                p.size = _size / 2;
                p.hue = _hue;
                p.lightness = 40 + 40 * Math.random();
                p.setGravity(0.1);
                p.setFriction(0.95);

                fireforks.push(p);
              }

              function update() {
                context.clearRect(0, 0, canvas.width, canvas.height);

                var i, p, length, j, f, reducedParticles = [],
                  reducedFireworks = [];

                hue += 0.5;

                for (i = 0, length = particles.length; i < length; i++) {
                  p = particles[i];

                  p.update();

                  if (p.position.x > 0 && p.position.x < width && p.position.y < height && !p.explode) {
                    reducedParticles.push(p);
                  }
                }

                particles = reducedParticles;

                for (i = 0, length = particles.length; i < length; i++) {
                  p = particles[i];

                  p.size += 0.015;
                  p.lightness -= 0.3;
                  p.hue += 1;

                  if (Math.random() < 0.001 || Math.sqrt(Math.pow((mouseX - p.position.x), 2) + Math.pow(mouseY - p.position.y, 2)) < 3 * p.size) {
                    p.explode = true;

                    for (j = 0; j < 15; j++) {
                      createFirefork(p.position.x, p.position.y, p.size, p.hue);
                    }
                  }

                  context.beginPath();
                  context.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2, false);
                  context.fillStyle = 'hsl(' + p.hue + ',100%, ' + p.lightness + '%)';
                  context.fill();
                }

                for (i = 0; i < fireforks.length; i++) {
                  f = fireforks[i];

                  if (f.lightness > 0) {
                    reducedFireworks.push(f);
                  }
                }

                fireforks = reducedFireworks;

                for (i = 0; i < fireforks.length; i++) {
                  f = fireforks[i];

                  f.update();

                  f.lightness -= 0.5;

                  context.beginPath();
                  context.arc(f.position.x, f.position.y, f.size, 0, Math.PI * 2, false);
                  context.fillStyle = 'hsl(' + f.hue + ',100%, ' + f.lightness + '%)';
                  context.fill();
                }

                requestAnimationFrame(update);
              }
            }
          })
        );
      },
      onError: function (form, response) {
        let parent = $(form).closest('[data-step]').get(0) as HTMLElement;
        let formResult = form.querySelector('[data-form-result]') as HTMLElement;
        let resultMessage = setResultMessage({
          status: response.STATUS,
          responseText: response.ERRORS
        });

        $(formResult).html(resultMessage);
        scrollToElement(parent);
      }
    });
  });

  // обработчик формы теста
  $(document).on('submit', '[data-ajax-form-test]', function (e: Event) {
    let self = this;

    submitAJAX(self, e, {
      serialize: false,
      onSuccess: function (form, response) {
        let popup = document.querySelector('#test-results') as HTMLElement;
        let stepInput = self.querySelector('[name="step"]') as HTMLInputElement;
        let stepId = 0;

        if (stepInput) {
          stepId = parseInt(stepInput.value);
        }

        if (popup) {
          $.fancybox.open(
            popup,
            $.extend({}, fbDefaults, {
              afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
                initTestResultsChart('tests-container', {
                  categories: response.DATA.CATEGORIES,
                  data: response.DATA.DATA
                });
              },
              afterClose: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
                // возвращаемся на первую форму
                let trigger = document.querySelector(`[data-step-detail-modal][data-step-id="${stepId}"]`) as HTMLAnchorElement;

                if (trigger) {
                  trigger.click();
                }
              }
            })
          )
        }
      },
      onError: function (form, response) {
        let parent = $(form).closest('[data-step]').get(0) as HTMLElement;
        let formResult = form.querySelector('[data-form-result]') as HTMLElement;
        let resultMessage = setResultMessage({
          status: response.STATUS,
          responseText: response.ERRORS
        });

        $(formResult).html(resultMessage);
        scrollToElement(parent);
      }
    });
  });

  $(document).on('click', '[data-step-detail-modal]', function (e) {
    e.preventDefault();

    let self = this;
    let data = {};

    if (self.classList.contains('disabled')) return;

    setControlState(self, 'disabled', 'disabled');

    data.STEP_ID = self.getAttribute('data-step-id');

    $.ajax({
      method: 'POST',
      url: self.getAttribute('href'),
      data: data,
      success: function (response) {
        let popup = document.querySelector('#step-details') as HTMLElement;

        if (popup) {
          let needsUpdate = popup.getAttribute('data-step') !== data.STEP_ID; // проверка, чтобы не сбрасывалось состояние формы при повторном открытии
          let popupBody = popup.querySelector('.c-modal__body') as HTMLElement;

          if (needsUpdate) {
            $(popupBody).html(response);
          }

          $.fancybox.open(
            popup,
            $.extend({}, fbDefaults, {
              afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
                if (needsUpdate) {
                  popup.setAttribute('data-step', data.STEP_ID);

                  // ACN
                  let acnsStep = popupBody.querySelectorAll('.step-section_acn');

                  for (let i = 0; i < acnsStep.length; i++) {
                    new Acn(acnsStep[i], {
                      icons: false,
                      onOpen: function (instance: Acn) {
                        let btnText = instance.toggle.querySelector('.c-btn__text') as HTMLElement;

                        btnText.textContent = 'Свернуть';
                      },
                      onClose: function (instance: Acn) {
                        let btnText = instance.toggle.querySelector('.c-btn__text') as HTMLElement;

                        btnText.textContent = 'Развернуть';
                      },
                    });
                  }

                  // плдсказки
                  let popupsDefault = popupBody.querySelectorAll('[data-popup-toggle-default]');

                  for (let i = 0; i < popupsDefault.length; i++) {
                    new Popup(popupsDefault[i], {
                      onOpen: function (instance) {
                          instance.popup.setAttribute('data-show', '');
                      },
                      onClose: function (instance) {
                          instance.popup.removeAttribute('data-show');
                      }
                    });
                  }

                  // прокрутка до футера
                  let form = popup.querySelector('.step-details__form') as HTMLFormElement;
                  let footer = popup.querySelector('#step_footer') as HTMLElement;

                  if (form.getAttribute('data-state') === 'ready' && footer) {
                    scrollToElement(footer);
                  }
                }
              }
            })
          )
        }
      },
      error: function (response) {
        let popup = createModal({
          className: 'c-modal_default',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      },
      complete: function () {
        setControlState(self, 'default', 'disabled');
      }
    });
  });

  $(document).on('click', '[data-step-test-modal]', function (e: Event) {
    e.preventDefault();

    let self = this;
    let data = {};

    if (self.classList.contains('disabled')) return;

    setControlState(self, 'disabled', 'disabled');

    data.STEP_ID = self.getAttribute('data-step-id');

    $.ajax({
      method: 'POST',
      url: self.getAttribute('href'),
      data: data,
      success: function (response) {
        let popup = document.querySelector('#step-test') as HTMLElement;

        if (popup) {
          let needsUpdate = popup.getAttribute('data-step') !== data.STEP_ID; // проверка, чтобы не сбрасывалось состояние формы при повторном открытии
          let popupBody = popup.querySelector('.c-modal__body') as HTMLElement;

          if (needsUpdate) {
            $(popupBody).html(response);
          }

          $.fancybox.open(
            popup,
            $.extend({}, fbDefaults, {
              afterShow: function () {
                if (needsUpdate) {
                  popup.setAttribute('data-step', data.STEP_ID);

                  let rangeSliders = popup.querySelectorAll('.c-range') as NodeListOf<HTMLElement>;

                  for (let i = 0; i < rangeSliders.length; i++) {
                    new Range(rangeSliders[i]);
                  }
                }
              }
            })
          );
        }
      },
      error: function (response) {
        let popup = createModal({
          className: 'c-modal_default',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      },
      complete: function () {
        setControlState(self, 'default', 'disabled');
      }
    });
  });

  $(document).on('click', '[data-modal-test-results]', function (e) {
    e.preventDefault();

    let self = this;

    if (self.classList.contains('disabled')) return;

    setControlState(self, 'disabled', 'disabled');

    $.ajax({
      method: 'POST',
      url: self.getAttribute('href'),
      dataType: 'json',
      success: function (response) {
        let popup = document.querySelector('#test-results') as HTMLElement;

        if (popup) {
          $.fancybox.open(
            popup,
            $.extend({}, fbDefaults, {
              afterShow: function (instance: FancyBoxInstance, current: FancyBoxSlide) {
                initTestResultsChart('tests-container', {
                  categories: response.DATA.CATEGORIES,
                  data: response.DATA.DATA
                });
              }
            })
          )
        }
      },
      error: function (response) {
        let popup = createModal({
          className: 'c-modal_default',
          title: 'Ошибка',
          content: 'Пожалуйста, попробуйте позже'
        });

        $.fancybox.open(popup, fbDefaults);
      },
      complete: function () {
        setControlState(self, 'default', 'disabled');
      }
    });
  });
});

function formatChartData (data: []) {
  let result = [];

  for (let i = 0; i < data.length; i++) {
    result.push(parseFloat(data[i]));
  }

  return result;
}

function initTestResultsChart(selector: string, params: {}) {
  // для отрисовки графиков нужно чтобы числа имели соответствующий тип. Поскольку json все сводит в строку, требуется дополнительное форматирование
  let categories = formatChartData(params.categories);
  let data = formatChartData(params.data);

  Highcharts.chart('tests-container', {
    chart: {
      type: 'column',
      marginTop: 40,
      styledMode: true
    },
    title: {
      text: '',
    },
    tooltip: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        states: {
          hover: {
            enabled: false,
          }
        }
      }
    },
    xAxis: {
      min: 0,
      max: 12,
      title: {
        text: 'Ступени',
        align: 'high',
      },
      categories: categories,
    },
    yAxis: {
      min: 0,
      max: 100,
      tickInterval: 10,
      title: {
        text: 'Счастье',
        align: 'high',
        rotation: 0,
        offset: 0,
        y: -15,
      },
    },
    series: [{
      data: data
    }]
  });
}

(window as any).initTestResultsChart = initTestResultsChart;

function scrollToElement (el: HTMLElement) {
  let popupInstance = $.fancybox.getInstance();
  let scrolledEl;
  let scrollAmount;

  if (popupInstance) {
    scrolledEl = popupInstance.current.$slide.get(0);
    scrollAmount = $(el).position().top;
  } else {
    scrolledEl = 'html, body';
    scrollAmount = $(el).offset().top;
  }

  $(scrolledEl).animate({
    scrollTop: scrollAmount
  }, 300);
}

// анимация конфетти с codepen
(function (window) {
  "use strict";

  var Particle, p;

  Particle = function (x, y, speed, direction) {
    this.initialize(x, y, speed, direction);
  };

  p = Particle.prototype;

  p.initialize = function (x, y, speed, direction) {
    this.position = new Vector(x, y);

    this.velocity = new Vector(0, 0);
    this.velocity.set(speed, direction);

    this.gravity = new Vector(0, 0);

    this.friction = 1;

    return this;
  };

  p.setGravity = function (gravity) {
    this.gravity = new Vector(0, gravity);
  };

  p.setFriction = function (friction) {
    this.friction = friction;
  };

  p.accelerate = function (accel) {
    this.velocity.add(accel);
  };

  p.update = function () {
    // add gravity
    this.velocity.add(this.gravity);

    // multiply friction
    this.velocity.multiply(this.friction);

    // position
    this.position.add(this.velocity);
  };

  window.Particle = Particle;
}(window));

(function (window) {
  "use strict";

  var Vector, p;

  Vector = function (x, y) {
    this.initialize(x, y);
  };

  p = Vector.prototype;

  p.initialize = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;

    return this;
  };

  p.set = function (length, angle) {
    this.x = length * Math.cos(angle);
    this.y = length * Math.sin(angle);
  };

  p.set2 = function (x, y) {
    this.x = x;
    this.y = y;
  };

  p.getAngle = function () {
    return Math.atan2(this.y, this.x);
  };

  p.getLength = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  p.add = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
  };

  p.multiply = function (value) {
    this.x *= value;
    this.y *= value;
  };

  window.Vector = Vector;
}(window));
