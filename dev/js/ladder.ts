import getViewport from 'functions/utility/getViewport';

document.addEventListener('DOMContentLoaded', function () {
  // ladder
  let ladder = document.querySelector('[data-ladder]');
  let scrolling = false;

  if (ladder) {
    // прокрутим до конца
    let top = $(document.documentElement).offset().top || 0;
    let delta = 3;
    let scrollSpeed = 0;
    let closestLabel = ladder.querySelector('.ladder-label_available');
    let viewport = getViewport();

    window.scrollTo(0, 0);

    if (ladder.classList.contains('ladder_index')) {
      // главная страниц
      closestLabel = ladder.querySelector('.ladder-anchor');

      if (closestLabel) {
        top += closestLabel.getBoundingClientRect().top + closestLabel.clientHeight;
      }
    } else if (ladder.classList.contains('ladder_inner')) {
      // основные ступени
      // если человек уже закончил сегодня ступень, доступных ступеней у него не будет. Тогда скроллим до той, что будет открыта следующей
      if (!closestLabel) {
        closestLabel = ladder.querySelector('.ladder-label_closed_next');
      }

      if (closestLabel) {
        top += closestLabel.getBoundingClientRect().top - (viewport.height / 2) + closestLabel.clientHeight;
      }
    }

    scrollSpeed = top / delta;

    $('html, body').stop().animate({
      scrollTop: top
    }, scrollSpeed);
  }

  $(document).on('click', '[data-ladder-scroll]', function (e: Event) {
    e.preventDefault();
    let sectionId = this.getAttribute('data-section');

    if (!sectionId) return;

    let target = document.querySelector(`[data-section-separator="${sectionId}"]`) as HTMLElement;

    // пользуемся промисами, чтобы избежать проблемы с ранним срабатыванием колбека
    if (target) {
      scrolling = true;

      $('html, body').stop().animate({scrollTop: target.offsetTop - getViewport().height + target.clientHeight}, 500)
        .promise()
        .then(function () {
          scrolling = false;
        });
    }
  });
});
