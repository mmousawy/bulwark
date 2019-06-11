class BulwarkUI {

  constructor() {
    const that = this;
    this.settings = {};

    this.open_modals = {};

    this.sounds = {
      'btn-mouseover': new Howl({ src: ['assets/audio/sfx-btn-hover.wav'] }),
      'btn-click': new Howl({ src: ['assets/audio/sfx-btn-click.wav'] }),
      'btn-submit': new Howl({ src: ['assets/audio/sfx-btn-submit.wav'] }),
      'chat-new': new Howl({ src: ['assets/audio/sfx-chat-new.wav'] }),
      'intro': new Howl({ src: ['assets/audio/music-intro.m4a'] }),
      'shot1': new Howl({ src: ['assets/audio/sfx-shot1.wav'] }),
      'new-wave': new Howl({ src: ['assets/audio/sfx-new-wave.wav'] }),
      'no-impact': new Howl({ src: ['assets/audio/sfx-no-impact.wav'] }),
      'impact': new Howl({ src: ['assets/audio/sfx-impact.wav'] }),
    };

    this.sounds.shot1.volume(.5);

    this.modals = {

      room: function() {
        return {
          'html': `
          <div class="overlay__chat-holder">
            <div class="title title--room">Room</div>
            <div class="chat-content chat-content--room"></div>
            <input type="text" class="chat_input" placeholder="Message"><input type='submit' class="chat_button" value="Chat">
          </div>
          <div class="overlay__clients-holder">
          <div class="title">Players</div>
            <div class="clients-content clients-list"></div>
            <input type='submit' class="room_start_button" value="Start">
            <input type='submit' class="room_leave_button" value="">
          </div>
            </div>`,
          'binds':
          function(modal) {
            const room_leave_button = modal.querySelector("input.room_leave_button[type=submit]");
            const room_start_button = modal.querySelector("input.room_start_button[type=submit]");
            const chat_input = modal.querySelector("input.chat_input[type=text]");
            const room_title = modal.querySelector(".title--room");

            room_title.innerHTML += `: ${that.settings.bClient.settings.current_client.location}`;

            room_leave_button.addEventListener("click", function() {
              that.settings.bClient.leaveRoom();
            });

            room_start_button.addEventListener("click", function() {
              that.settings.bClient.startGame();
            });

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

            chat_input.addEventListener("keydown", function(event) {
              if (event.keyCode == 13) {
                event.preventDefault();
                chat_function();
              }
            });
          }
        };
      },

      create_room: function() {
        return {
          'html': `
              <div class="title">Create room</div>
              <input type="text" class="create_room_input" placeholder="Room name"><input type='button' class="cancel_room_button" value=""><input type='submit' class="create_room_button" value="Create">
            </div>`,
          'binds':
          function(modal) {
            const create_room_input = modal.querySelector("input.create_room_input[type=text]");
            const create_room_button = modal.querySelector("input.create_room_button[type=submit]");
            const cancel_room_button = modal.querySelector("input.cancel_room_button[type=button]");

            create_room_button.addEventListener("click", function() {
              let input_value = create_room_input.value.trim().substring(0, 100);

              let data = {
                name: input_value
              };

              that.createRoom(data);
            });

            cancel_room_button.addEventListener("click", function() {
              that.showLobby();
            });

            create_room_input.addEventListener("keydown", function(event) {

              let input_value = create_room_input.value.trim().substring(0, 100);

              let data = {
                name: input_value
              };

              if (event.keyCode == 13) {
                event.preventDefault();
                that.createRoom(data);
              }
            });
          }
        };
      },

      main_lobby: function() {
        return {
          'html':
            `<div class="overlay__rooms-holder">
            <div class="title">Rooms</div>
            <div class="rooms-content rooms-list"></div>
            <input type='button' class="button show_create_room_button" value="Create room">
            </div>
            <div class="overlay__chat-holder">
              <div class="bulwark-logo"></div>
              <div class="chat-content"></div>
              <input type="text" class="chat_input" placeholder="Message"><input type='submit' class="chat_button" value="Chat">
            </div>
            <div class="overlay__clients-holder">
            <div class="title">Players</div>
              <div class="clients-content clients-list"></div>
            </div>`,
          'binds':
          function(modal) {
            const chat_input = modal.querySelector("input.chat_input[type=text]");
            const chat_button = modal.querySelector("input.chat_button[type=submit]");
            const show_create_room_button = modal.querySelector("input.show_create_room_button[type=button]");

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

            show_create_room_button.addEventListener("click", function() {
              that.showCreateRoom();
            });
          }
        };
      },

      signin: function() {
        return {
          'html':
            `<div class='bulwark-logo'></div><p class='clients-count-signin'>Retrieving players list...</p><p>Enter a nickname to start playing</p><input type='text' placeholder='Nickname'><input type='submit' class="login-button" value='Enter'>`,
          'binds':
          function(modal) {
            const submit_button = modal.querySelector("input[type=submit]");
            const signin_nickname = modal.querySelector("input[type=text]");

            submit_button.addEventListener("click", function() {
              that.settings.bPubSub.publish("signin", {
                nickname: signin_nickname.value.trim().substring(0, 50)
              });
            });

            signin_nickname.addEventListener("keydown", function(event) {
              if (event.keyCode == 13) {
                event.preventDefault();
                that.playSound('btn-click');
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
            const submit_button = modal.querySelector("input[type='submit']");

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
            const submit_button = modal.querySelector("input[type=submit]");

            submit_button.addEventListener("click", function() {
              that.settings.bPubSub.publish("reconnect");
            })
          }
        };
      }
    }

    return {
      settings:       this.settings,
      sounds:         this.sounds,
      createModal:    this.createModal.bind(this),
      showLobby:      this.showLobby.bind(this),
      showRoom:       this.showRoom.bind(this),
      playSound:      this.playSound.bind(this),
      removeModal:    this.removeModal.bind(this),
      addChatMessage: this.addChatMessage.bind(this),
      init:           this.init.bind(this),
      hide:           this.hide.bind(this)
    }
  }

  showRoom(data) {
    this.removeModal('main_lobby');
    this.removeModal('create_room');
    this.createModal('room');
    this.settings.bClient.refreshClients();
  }

  showCreateRoom() {
    this.removeModal('main_lobby');
    this.createModal('create_room');
  }

  hide() {
    this.modal_overlay.classList.add('is-hidden');
  }

  createRoom(data) {
    this.settings.bClient.createRoom(data);
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
    return this.sounds[sfx_index].play();
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

    modal.style.animation = "scale_up_choppy 400ms linear";

    this.bindSFXUI('mouseover', 'btn-mouseover', '[type=submit], [type=button], .button', modal);
    this.bindSFXUI('click', 'btn-click', '.button, [type=button]', modal);
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

  showLobby() {
    this.settings.bUI.removeModal("signin");
    this.settings.bUI.removeModal("room");
    this.settings.bUI.removeModal("create_room");
    this.settings.bUI.createModal('main_lobby');
    this.settings.bClient.refreshClients();
    this.settings.bClient.refreshRooms();
  }

  genID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
  }

}
