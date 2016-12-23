class BulwarkUI {

  constructor() {
    const that = this;
    this.settings = {};

    this.open_modals = {};

    this.sounds = {
      'btn-mouseover': new Audio('assets/audio/sfx-btn-hover.wav'),
      'btn-click': new Audio('assets/audio/sfx-btn-click.wav'),
      'btn-submit': new Audio('assets/audio/sfx-btn-submit.wav'),
      'chat-new': new Audio('assets/audio/sfx-chat-new.wav'),
      'intro': new Audio('assets/audio/music-intro.m4a')
    };

    this.modals = {
      main_lobby: function() {
        return {
          'html':
            `<div class="overlay__rooms-holder">
            <div class="title">Rooms</div>
            <div class="rooms-content"></div>
            <input type='button' class="button create_room_button" value="Create room">
            </div>
            <div class="overlay__chat-holder">
              <div class="chat-content"></div>
              <input type="text" class="chat_input" placeholder="Message"><input type='submit' class="chat_button" value="Chat">
            </div>
            <div class="overlay__clients-holder">
            <div class="title">Players</div>
              <div class="clients-content clients-list"></div>
            </div>`,
          'binds':
          function(modal) {
            const chat_input = modal.querySelectorAll("input.chat_input[type=text]")[0];
            const chat_button = modal.querySelectorAll("input.chat_button[type=submit]")[0];

            const chat_function = function() {
              let input_value = chat_input.value.trim().substring(0, 100);

              if (input_value.length > 0) {
                that.playSound('btn-click');
                that.settings.bPubSub.publish("send-chat-message", {
                  message: input_value
                });
              }

              chat_input.value = "";
              chat_input.focus();
            };

            chat_button.addEventListener("click", function() {
              chat_function();
            });
            chat_input.addEventListener("keydown", function(event) {
              if (event.keyCode == 13) {
                event.preventDefault();
                chat_function();
              }
            });
          }
        };
      },

      signin: function() {
        return {
          'html':
            `<div class='bulwark-logo'></div><p class='clients-count-signin'>Retrieving players list...</p><p>Enter a nickname to start playing</p><input type='text' placeholder='Nickname'><input type='submit' class="login-button" value='Login'>`,
          'binds':
          function(modal) {
            const submit_button = modal.querySelectorAll("input[type=submit]")[0];
            const signin_nickname = modal.querySelectorAll("input[type=text]")[0];

            submit_button.addEventListener("click", function() {
              that.settings.bPubSub.publish("signin", {
                nickname: signin_nickname.value
              });
            });

            signin_nickname.addEventListener("keydown", function(event) {
              if (event.keyCode == 13) {
                event.preventDefault();
                that.playSound('btn-submit');
                that.settings.bPubSub.publish("signin", {
                  nickname: signin_nickname.value
                });
              }
            });
          }
        };
      },

      offline: function() {
        return {
          'html':
            `<div class='icon icon--disconnected'></div><p>Could not reach server...</p><input type='submit' class='centered' value='Try again'>`,
          'binds':
          function(modal) {
            const submit_button = modal.querySelectorAll("input[type=submit]")[0];

            submit_button.addEventListener("click", function() {
              that.settings.bPubSub.publish("refresh");
            })
          }
        };
      },

      disconnected: function() {
        return {
          'html': `<div class='icon icon--disconnected'></div><p>Disconnected from server</p><input type='submit' class='centered' value='Reconnect'>`,
          'binds':
          function(modal) {
            const submit_button = modal.querySelectorAll("input[type=submit]")[0];

            submit_button.addEventListener("click", function() {
              that.settings.bPubSub.publish("reconnect");
            })
          }
        };
      }
    }

    return {
      settings:       this.settings,
      createModal:    this.createModal.bind(this),
      playSound:      this.playSound.bind(this),
      removeModal:    this.removeModal.bind(this),
      addChatMessage: this.addChatMessage.bind(this),
      init:           this.init.bind(this)
    }
  }

  addChatMessage(data, style = "client-message") {
    let chat_content = document.getElementsByClassName("chat-content");

    for (var i = 0; i < chat_content.length; i++) {
      const node = chat_content[i];

      const message_block = document.createElement("div");
      message_block.innerHTML = data.message;
      message_block.classList.add(style);
      node.appendChild(message_block);

      node.scrollTop = node.scrollHeight;

      if (data.nickname !== bClient.settings.current_client.nickname) {
        this.playSound('chat-new');
      }
    };
  }

  playSound(sfx_index) {
    this.sounds[sfx_index].play();
  }

  bindSFXUI(event_listener, sfx_index, selector, container = document.body) {
    let buttons = container.querySelectorAll(selector);
    let that = this;

    buttons.forEach(function(element) {
      element.setAttribute("data-sfx-mouseover", sfx_index);
      element.addEventListener(event_listener, function() {
        that.playSound(sfx_index);
      });
    })
  }

  init(bRender, bGame, bInput, bClient, bUI, bPubSub) {
    this.settings.bRender = bRender;
    this.settings.bGame   = bGame;
    this.settings.bInput  = bInput;
    this.settings.bClient = bClient;
    this.settings.bUI     = bUI;
    this.settings.bPubSub = bPubSub;

    this.modal_overlay = document.createElement("div");
    this.modal_holder = document.createElement("div");

    this.modal_overlay.classList.add("modal-overlay");
    this.modal_holder.classList.add("modal-holder");

    this.modal_overlay.appendChild(this.modal_holder);

    document.body.appendChild(this.modal_overlay);
  }

  createModal(modal_index) {
    this.modal_holder.style.width = "auto";
    this.modal_holder.style.height = "auto";

    const modal = document.createElement("div");
    const modal_id = this.genID();

    modal.classList.add("modal");
    modal.classList.add(`modal-${modal_id}`);
    modal.classList.add(`modal-${modal_index}`);

    const modal_function = this.modals[modal_index].bind(this);
    const modal_content = modal_function();

    modal.innerHTML = modal_content.html;

    modal_content.binds(modal);

    this.open_modals[modal_index] = this.open_modals[modal_index] || [];
    this.open_modals[modal_index].push(modal);

    this.modal_holder.appendChild(modal);

    this.modal_holder.style.width = modal.offsetWidth + "px";
    this.modal_holder.style.height = modal.offsetHeight + "px";

    modal.style.animation = "scale_up_choppy 500ms linear";

    this.bindSFXUI('mouseover', 'btn-mouseover', '[type=submit], .button', modal);
    this.bindSFXUI('click', 'btn-click', '.button', modal);
    this.bindSFXUI('click', 'btn-click', '[type=submit]', modal);
  }

  removeModal(modal_index) {
    if (this.open_modals[modal_index]) {
      for (let i = 0, modal_index_length = this.open_modals[modal_index].length; i < modal_index_length; i++) {
        let modal = this.open_modals[modal_index][i];

        let parent = modal.parentNode;

        parent.removeChild(modal);
      }

      this.open_modals[modal_index] = null;
    }
  }

  genID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
  }

}
