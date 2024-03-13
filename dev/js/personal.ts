import FileInput from 'components/controls/file/file';

document.addEventListener('DOMContentLoaded', function () {
  // редактирование настроек
  let profileDetailSettings = document.querySelector('.profile-detail_settings');

  if (profileDetailSettings) {
    let avatar = profileDetailSettings.querySelector('.c-avatar') as HTMLElement;

    if (avatar) {
      new FileInput(avatar, {
        caption: '.c-avatar__status',
        input: '.c-avatar__input',
        onChange: function (instance) {
          handleAvatarChange(instance, {
            showCaption: true
          });
        }
      });
    }
  }

  // черный список
  $(document).on('change', '[data-blacklist-toggle]', function () {
    let data = {
      id: this.value,
      action: this.checked ? 'add' : 'delete',
    }

    $.ajax({
      method: 'POST',
      url: PATH_BLACKLIST,
      data: data,
      success: function (response) {
      }
    });
  });

  // учитель
  $(document).on('change', '[data-subscribe-toggle]', function () {
    let self = this;
    let btn = $(self).closest('.c-btn').get(0);
    let text = btn.querySelector('.c-btn__text');
    let data = {
      id: this.value,
      action: this.checked ? 'add' : 'delete',
    }

    $.ajax({
      method: 'POST',
      url: PATH_MENTORS,
      data: data,
      success: function (response) {
        if (self.checked) {
          $(btn).removeClass('c-btn_style_default c-btn_color_primary c-btn_accent');
          $(btn).addClass('c-btn_style_ghost c-btn_color_quarternary');
          text.textContent = btn.getAttribute('data-active-text');
        } else {
          $(btn).removeClass('c-btn_style_ghost c-btn_color_quarternary');
          $(btn).addClass('c-btn_style_default c-btn_color_primary c-btn_accent');
          text.textContent = btn.getAttribute('data-text');
        }
      }
    });
  });

  // удаление отовсюду
  $(document).on('click', '[data-favorites-remove]', function () {
    let self = this;
    let id = self.getAttribute('data-id');
    let entity = self.getAttribute('data-entity');
    let path = '';
    let data = {
      id: id,
      action: 'delete'
    }

    switch (entity) {
      case 'teachers':
        path = PATH_MENTORS;

        break;

      case 'students':
        path = PATH_STUDENTS;

        break;

      case 'blacklist':
        path = PATH_BLACKLIST;

        break;

      case 'others':
        path = PATH_OTHERS;

        break;
    }

    if (!path.length) return;

    $.ajax({
      method: 'POST',
      url: path,
      data: data,
      success: function (response) {
        let item = $(self).closest('[entity-list-item]').get(0);

        if (item) {
          item.remove(item);
        }
      }
    });
  });
});

function handleAvatarChange (instance: FileInput, params = {}) {
  let img = instance.el.querySelector('.avatar-card__img') as HTMLElement;
  let hiddenClass = 'd-none';

  if (instance.input.files) {
    let file = instance.input.files[0];
    let fr = new FileReader();

    fr.readAsDataURL(file);
    fr.addEventListener('load', function (e: Event) {
      if (e.target && e.target.result) {
        img.style.backgroundImage = `url('${e.target.result}')`;
      }
    });
    if (params.showCaption) {
      instance.caption.classList.remove(hiddenClass);
    }
  } else {
    img.style.backgroundImage = '';
    if (params.showCaption) {
      instance.caption.classList.add(hiddenClass);
    }
  }
}
