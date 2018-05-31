(function game() {
  let level = 1,
    lives = 3,
    completedLevels = [],
    storage = Boolean('localStorage' in window),
    context,
    sounds = {
      'correct1': {
        'src': 'sounds/correct1.m4a'
      },
      'correct2': {
        'src': 'sounds/correct2.m4a'
      },
      'wrong': {
        'src': 'sounds/wrong.m4a'
      },
      'newlevel': {
        'src': 'sounds/newlevel.m4a'
      },
      'gameover': {
        'src': 'sounds/gameover.m4a'
      }
    },
    saveState = (currentSvg, guessedColors, completed) => {
      if (storage) {
        localStorage.setItem('gamestate', JSON.stringify(
          {
            'level': level,
            'lives': lives,
            'guessedColors': guessedColors,
            'completedLevels': completedLevels,
            'currentSvg': currentSvg.innerHTML,
            'completed': completed
          }
        ));
      }
    },
    restoreState = () => {
      if (storage) {
        let gamestate = JSON.parse(localStorage.getItem('gamestate'));
        if (gamestate) {
          level = gamestate.level;
          lives = gamestate.lives;
          completedLevels = gamestate.completedLevels;
          if (gamestate.completedLevels) {
            gamestate.completedLevels.forEach(val => {
              svgs.splice(val, 1);
            });
          }
          return gamestate;
        }
      }
      return false;
    },
    resetState = () => {
      if (storage) {
        localStorage.removeItem('gamestate');
      }
    },
    playSound = buffer => {
      let source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    },
    loadSoundObj = obj => {
      let request = new XMLHttpRequest();
      request.open('GET', obj.src, true);
      request.responseType = 'arraybuffer';

      request.onload = function onload() {
        context.decodeAudioData(request.response, function reqload(buffer) {
          obj.buffer = buffer;
        }, function reqerr(err) {
          throw new Error(err);
        });
      };
      request.send();
    },
    restoredState = restoreState();

  const status = document.querySelector('[role="status"]');
  const main = document.querySelector('main');
  const colorButtons = document.querySelectorAll('nav a');

  const displayLives = () => {
    return `<button aria-disabled="true">${lives} &#x2764;&#xFE0F;</button>`;
  };

  const colorClick = e => {
    if (e.target.getAttribute('aria-hidden') === 'true' || status.classList.contains('next') || status.classList.contains('gameover')) {
      if (status.classList.contains('next') || status.classList.contains('gameover')) {
        status.querySelector('button').focus();
      }
      return false;
    }
    e.preventDefault();
    let color = e.target.className,
      currentSvg = document.querySelector('.current.svg'),
      correct = false;
    if (color && currentSvg) {
      status.className = '';

      // hide selected color
      e.target.setAttribute('aria-disabled', 'true');

      // add color class to fill color in svg
      currentSvg.classList.add(color);

      // remove .color class for selected color. No color = nothing left to guess
      Array.prototype.forEach.call(document.querySelectorAll('.current.svg .color.' + color), item => {
        item.classList.remove('color');
        correct = true;
      });
      setTimeout(() => {
        if (!document.querySelectorAll('.current.svg .color').length) {
          lives += 1;
          status.innerHTML = `<div><h1>Level ${level}</h1><p>Correct! +1 &#x2764;&#xFE0F;</p></div><button class="nextlevel">Next level &#x27A1;&#xFE0F;</button>`;
          status.className = 'correct next';
          playSound(sounds.correct2.buffer);
          saveState(currentSvg, currentSvg.className, true);
        } else {
          if (correct) {
            status.innerHTML = `<div><h1>Level ${level}</h1><p>Correct! Keep guessing!</p></div>${displayLives()}`;
            status.className = 'correct';
            playSound(sounds.correct1.buffer);
            saveState(currentSvg, currentSvg.className);
          } else {
            lives -= 1;
            if (lives <= 0) {
              status.innerHTML = `<div><h1>Game over!</h1><p>Level ${level}</div><button class="playagain">Play again &#x1F504;</button>`;
              status.className = 'wrong gameover';
              playSound(sounds.wrong.buffer);
              setTimeout(() => {
                playSound(sounds.gameover.buffer);
              }, 100);
              resetState();
            } else {
              status.innerHTML = `<div><h1>Level ${level}</h1><p>Wrong! Try again!</p></div>${displayLives()}`;
              status.className = 'wrong';
              playSound(sounds.wrong.buffer);
              saveState(currentSvg, currentSvg.className);
            }
          }
        }
      }, 100);
    }
    return true;
  };

  const nextSvg = previousState => {
    let randomChoice = Math.floor(Math.random() * svgs.length),
      randomSvg = previousState ? previousState.currentSvg : svgs[randomChoice];
    if (randomSvg) {
      let newSvg = document.createElement('div'),
        currentSvg = document.querySelector('.svg.current');
      newSvg.className = 'svg new';
      newSvg.innerHTML = randomSvg;
      main.appendChild(newSvg);
      if (!previousState) {
        completedLevels.push(randomChoice);
        svgs.splice(randomChoice, 1);
      }
      if (currentSvg) {
        currentSvg.classList.remove('current');
        currentSvg.classList.add('done');
        setTimeout(() => {
          main.removeChild(currentSvg);
        }, 600);
      }
      setTimeout(() => {
        newSvg.classList.remove('new');
        newSvg.classList.add('current');
        if (previousState && previousState.guessedColors) {
          newSvg.className = previousState.guessedColors;
        }
        saveState(newSvg, newSvg.className);
      }, 500);
      Array.prototype.forEach.call(colorButtons, (button, i) => {
        setTimeout(() => {
          button.setAttribute('aria-disabled', 'false');
          if (previousState && previousState.guessedColors) {
            if (previousState.guessedColors.indexOf(button.className) > -1) {
              button.setAttribute('aria-disabled', 'true');
            }
          }
        }, i * 50);
      });
      status.className = '';
      setTimeout(() => {
        if (previousState && previousState.completed) {
          let lastClass = previousState.guessedColors.split(' ')[previousState.guessedColors.split(' ').length - 1];
          setTimeout(() => {
            colorClick({
              'target': document.querySelector(`nav.colors .${lastClass}`),
              'preventDefault': () => {
                lives -= 1;
              }
            }, true);
          }, 600);
        } else {
          status.className = 'status';
          status.innerHTML = `<div><h1>Level ${level}</h1><p>Start guessing!</p></div>${displayLives()}`;
          playSound(sounds.newlevel.buffer);
        }
      }, 100);
    }
  };

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch (e) {
    throw new Error('Sound loading failed');
  }

  Array.prototype.forEach.call(colorButtons, button => {
    button.addEventListener('click', colorClick, false);
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('playagain')) {
      document.location.reload();
    }
    if (e.target.classList.contains('nextlevel')) {
      if (svgs && svgs.length) {
        level += 1;
        nextSvg();
      } else {
        status.innerHTML = '<div><h1>You made it!</h1><p>Good job!</p></div><button class="playagain">Play again &#x1F504;</button>';
        status.className = 'correct gameover';
        resetState();
      }
    }
  });

  loadSoundObj(sounds.correct1);
  loadSoundObj(sounds.correct2);
  loadSoundObj(sounds.wrong);
  loadSoundObj(sounds.newlevel);
  loadSoundObj(sounds.gameover);

  if (svgs && svgs.length) {
    nextSvg(restoredState);
  } else {
    status.innerHTML = '<div><h1>Something went wrong!</h1></div><button class="playagain">Play again &#x1F504;</button>';
    status.className = 'wrong gameover';
  }
})();
