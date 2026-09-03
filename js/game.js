/**
 * MOTOR PRINCIPAL DE CORRIDA: RALLY TRANSAMAZÔNICA (BR-230)
 * Controla o Game Loop de Corrida, IA dos 4 Rivais, Grid de Largada com Semáforo,
 * Sistema de Vácuo (Slipstream), Posições em Tempo Real, Colisões e Pódio.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.previewCanvas = document.getElementById('vehiclePreviewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');

    // Dimensões do Canvas
    this.width = 800;
    this.height = 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Estados do Jogo
    this.STATE = { MENU: 0, COUNTDOWN: 1, PLAYING: 2, PAUSED: 3, GAMEOVER: 4, VICTORY: 5 };
    this.currentState = this.STATE.MENU;

    // Gerenciador de Obstáculos
    this.obstacleManager = new ObstacleManager(400);

    // Lista de Veículos
    this.vehicleKeys = Object.keys(window.VEHICLES);
    this.selectedCarIndex = 0;
    this.currentCarData = window.VEHICLES[this.vehicleKeys[this.selectedCarIndex]];

    // Jogador
    this.player = {
      x: 350,
      y: 480,
      vx: 0,
      speed: 0,
      targetSpeed: 0,
      health: 100,
      maxHealth: 100,
      fuel: 100,
      distanceKm: 0,
      isBraking: false,
      isBoosting: false,
      boostTimer: 0,
      plankTimer: 0,
      isInMud: false,
      inBridgeZone: false,
      slipstream: false
    };

    // Adversários IA na Corrida
    this.opponents = [];

    // Estatísticas da Corrida
    this.raceConfig = {
      targetDistanceKm: 6.0, // 6 km de Rally Intenso
      raceTime: 0,
      currentRank: 5,
      prevRank: 5
    };

    this.stats = {
      seedsCollected: 0,
      faunaRespected: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('transamazonica_highscore') || '0', 10)
    };

    // Semáforo de Largada
    this.countdownTimer = 3.5;

    // Clima Dinâmico (sun, rain, fog)
    this.weather = 'sun';
    this.weatherTimer = 0;
    this.lightningTimer = 0;

    // Pista e Cenário
    this.roadScrollY = 0;
    this.roadCurvature = 0;
    this.targetCurvature = 0;
    this.trees = [];
    this.initTrees();

    // Partículas de poeira e corrida
    this.dustParticles = [];

    // Controle de Teclas e Toque
    this.keys = {};
    this.touchInputs = { left: false, right: false, gas: false, brake: false };

    // Timing
    this.lastTime = performance.now();
    this.cameraShake = 0;

    // Inicialização
    this.initDOM();
    this.initInputs();
    this.updateGarageUI();
    this.renderGaragePreview();

    // Iniciar Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  initTrees() {
    this.trees = [];
    for (let i = 0; i < 28; i++) {
      const isLeft = Math.random() < 0.5;
      this.trees.push({
        x: isLeft ? 30 + Math.random() * 130 : 640 + Math.random() * 130,
        y: Math.random() * this.height,
        size: 28 + Math.random() * 24,
        type: Math.random() < 0.6 ? 'castanheira' : 'palmeira',
        color: Math.random() < 0.5 ? '#1b4d3e' : '#143d2b'
      });
    }
  }

  initDOM() {
    this.dom = {
      hud: document.getElementById('game-hud'),
      menuScreen: document.getElementById('menu-screen'),
      pauseScreen: document.getElementById('pause-screen'),
      gameoverScreen: document.getElementById('gameover-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      infoModal: document.getElementById('info-modal'),
      touchControls: document.getElementById('touch-controls'),
      startLights: document.getElementById('start-lights'),
      countdownText: document.getElementById('countdown-text'),
      light1: document.getElementById('light-1'),
      light2: document.getElementById('light-2'),
      light3: document.getElementById('light-3'),
      mudSplatter: document.getElementById('mud-splatter'),
      rainOverlay: document.getElementById('rain-overlay'),
      flashOverlay: document.getElementById('flash-overlay'),
      speedVal: document.getElementById('speed-val'),
      posVal: document.getElementById('pos-val'),
      tractionWarning: document.getElementById('traction-warning'),
      fuelVal: document.getElementById('fuel-val'),
      fuelBarFill: document.getElementById('fuel-bar-fill'),
      healthVal: document.getElementById('health-val'),
      healthBarFill: document.getElementById('health-bar-fill'),
      checkpointText: document.getElementById('checkpoint-text'),
      seedCounter: document.getElementById('seed-counter'),
      floatingAlert: document.getElementById('floating-alert'),
      // Minimap dots
      dotPlayer: document.getElementById('car-dot-player'),
      dotAI: [
        document.getElementById('car-dot-1'),
        document.getElementById('car-dot-2'),
        document.getElementById('car-dot-3'),
        document.getElementById('car-dot-4')
      ],
      // Garage DOM
      carName: document.getElementById('car-name'),
      carTag: document.getElementById('car-tag'),
      carDesc: document.getElementById('car-desc'),
      carAbility: document.getElementById('car-ability'),
      attrSpeed: document.getElementById('attr-speed'),
      attrTraction: document.getElementById('attr-traction'),
      attrDurability: document.getElementById('attr-durability'),
      attrFuel: document.getElementById('attr-fuel'),
      // Game Over DOM
      statDist: document.getElementById('stat-dist'),
      statSeeds: document.getElementById('stat-seeds'),
      statFauna: document.getElementById('stat-fauna'),
      statScore: document.getElementById('stat-score'),
      statRecord: document.getElementById('stat-record'),
      gameoverReason: document.getElementById('gameover-reason'),
      // Victory DOM
      vicTitle: document.getElementById('vic-title'),
      vicSubtitle: document.getElementById('vic-subtitle'),
      vicBadge: document.getElementById('vic-badge'),
      vicTrophy: document.getElementById('vic-trophy'),
      vicTime: document.getElementById('vic-time'),
      vicSeeds: document.getElementById('vic-seeds'),
      vicFauna: document.getElementById('vic-fauna'),
      vicScore: document.getElementById('vic-score')
    };

    // Botões
    document.getElementById('btn-sound').addEventListener('click', () => {
      const active = window.gameAudio.toggle();
      document.getElementById('btn-sound').innerText = active ? '🔊' : '🔇';
    });

    document.getElementById('btn-info').addEventListener('click', () => {
      this.dom.infoModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-info').addEventListener('click', () => {
      this.dom.infoModal.classList.add('hidden');
    });

    document.getElementById('btn-prev-car').addEventListener('click', () => {
      this.selectedCarIndex = (this.selectedCarIndex - 1 + this.vehicleKeys.length) % this.vehicleKeys.length;
      this.currentCarData = window.VEHICLES[this.vehicleKeys[this.selectedCarIndex]];
      this.updateGarageUI();
      this.renderGaragePreview();
      window.gameAudio.playHorn(this.currentCarData.id);
    });

    document.getElementById('btn-next-car').addEventListener('click', () => {
      this.selectedCarIndex = (this.selectedCarIndex + 1) % this.vehicleKeys.length;
      this.currentCarData = window.VEHICLES[this.vehicleKeys[this.selectedCarIndex]];
      this.updateGarageUI();
      this.renderGaragePreview();
      window.gameAudio.playHorn(this.currentCarData.id);
    });

    document.getElementById('btn-start').addEventListener('click', () => this.startRaceCountdown());
    document.getElementById('btn-retry').addEventListener('click', () => this.startRaceCountdown());
    document.getElementById('btn-play-again').addEventListener('click', () => this.startRaceCountdown());

    document.getElementById('btn-garage-return').addEventListener('click', () => this.returnToGarage());
    document.getElementById('btn-vic-garage').addEventListener('click', () => this.returnToGarage());
    document.getElementById('btn-quit').addEventListener('click', () => this.returnToGarage());
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());

    // Suporte a mobile touch buttons
    this.setupTouchButton('btn-left', 'left');
    this.setupTouchButton('btn-right', 'right');
    this.setupTouchButton('btn-gas', 'gas');
    this.setupTouchButton('btn-brake', 'brake');
    document.getElementById('btn-horn').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.triggerHornOrAbility();
    });
    document.getElementById('btn-horn').addEventListener('mousedown', () => {
      this.triggerHornOrAbility();
    });
  }

  setupTouchButton(id, inputKey) {
    const el = document.getElementById(id);
    if (!el) return;
    const activate = (e) => { e.preventDefault(); this.touchInputs[inputKey] = true; };
    const deactivate = (e) => { e.preventDefault(); this.touchInputs[inputKey] = false; };
    el.addEventListener('touchstart', activate);
    el.addEventListener('touchend', deactivate);
    el.addEventListener('mousedown', activate);
    el.addEventListener('mouseup', deactivate);
    el.addEventListener('mouseleave', deactivate);
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && this.currentState === this.STATE.PLAYING) {
        this.pauseGame();
      }

      if (e.code === 'Space' && (this.currentState === this.STATE.PLAYING || this.currentState === this.STATE.COUNTDOWN)) {
        e.preventDefault();
        this.triggerHornOrAbility();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.dom.touchControls.classList.remove('hidden');
    }
  }

  updateGarageUI() {
    const car = this.currentCarData;
    this.dom.carName.innerText = car.name;
    this.dom.carTag.innerText = car.tag;
    this.dom.carDesc.innerText = car.desc;
    this.dom.carAbility.innerText = car.ability;

    this.dom.attrSpeed.style.width = `${(car.maxSpeed / 140) * 100}%`;
    this.dom.attrTraction.style.width = `${car.mudTraction * 100}%`;
    this.dom.attrDurability.style.width = `${(car.durability / 240) * 100}%`;
    this.dom.attrFuel.style.width = `${car.fuelEfficiency * 100}%`;
  }

  renderGaragePreview() {
    const ctx = this.previewCtx;
    ctx.clearRect(0, 0, 220, 150);

    ctx.fillStyle = '#9e2a0b';
    ctx.fillRect(0, 0, 220, 150);
    ctx.fillStyle = '#6e1d08';
    ctx.beginPath();
    ctx.ellipse(110, 85, 80, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    this.currentCarData.draw(ctx, 110, 75, this.currentCarData.width * 1.3, this.currentCarData.height * 1.3, false, false);
  }

  // ==========================================
  // INÍCIO DA CORRIDA & GRID DE LARGADA
  // ==========================================
  startRaceCountdown() {
    this.currentCarData = window.VEHICLES[this.vehicleKeys[this.selectedCarIndex]];
    
    // Configura o Jogador na 5ª posição do grid de largada
    this.player = {
      x: 350,
      y: 470,
      vx: 0,
      speed: 0,
      targetSpeed: 0,
      health: this.currentCarData.durability,
      maxHealth: this.currentCarData.durability,
      fuel: 100,
      distanceKm: 0,
      isBraking: false,
      isBoosting: false,
      boostTimer: 0,
      plankTimer: 0,
      isInMud: false,
      inBridgeZone: false,
      slipstream: false
    };

    // Cria os outros 4 veículos como Rivais IA
    this.opponents = [];
    const otherKeys = this.vehicleKeys.filter(k => k !== this.currentCarData.id);
    
    const startGridPositions = [
      { x: 260, y: 310, distOffset: 0.05 }, // 1º do grid
      { x: 500, y: 340, distOffset: 0.04 }, // 2º do grid
      { x: 290, y: 390, distOffset: 0.025 },// 3º do grid
      { x: 480, y: 430, distOffset: 0.015 } // 4º do grid
    ];

    otherKeys.forEach((key, idx) => {
      const vData = window.VEHICLES[key];
      const pos = startGridPositions[idx];
      this.opponents.push({
        id: vData.id,
        carData: vData,
        x: pos.x,
        y: pos.y,
        vx: 0,
        speed: 0,
        distanceKm: pos.distOffset,
        targetLane: pos.x,
        laneTimer: Math.random() * 2,
        isInMud: false,
        name: vData.name,
        colorDot: idx
      });
    });

    this.raceConfig.raceTime = 0;
    this.raceConfig.currentRank = 5;
    this.raceConfig.prevRank = 5;

    this.stats.seedsCollected = 0;
    this.stats.faunaRespected = 0;
    this.stats.score = 0;

    this.weather = 'sun';
    this.weatherTimer = 0;
    this.obstacleManager.reset();
    this.dustParticles = [];

    // Ocultar telas de menu/game over e exibir HUD + Semáforo
    this.dom.menuScreen.classList.add('hidden');
    this.dom.pauseScreen.classList.add('hidden');
    this.dom.gameoverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');

    this.countdownTimer = 3.6;
    this.currentState = this.STATE.COUNTDOWN;
    this.dom.startLights.classList.remove('hidden');
    this.lastBeepCount = 4;

    window.gameAudio.startEngine(this.currentCarData.id);
  }

  // Atualiza a contagem regressiva 3, 2, 1, VAI!
  updateCountdown(delta) {
    this.countdownTimer -= delta;

    const countInt = Math.ceil(this.countdownTimer);

    if (countInt === 3) {
      this.dom.light1.className = 'light light-red active';
      this.dom.light2.className = 'light light-yellow';
      this.dom.light3.className = 'light light-green';
      this.dom.countdownText.innerText = '3';
      if (this.lastBeepCount !== 3) {
        window.gameAudio.playCountdownBeep(false);
        this.lastBeepCount = 3;
      }
    } else if (countInt === 2) {
      this.dom.light1.className = 'light light-red active';
      this.dom.light2.className = 'light light-yellow active';
      this.dom.light3.className = 'light light-green';
      this.dom.countdownText.innerText = '2';
      if (this.lastBeepCount !== 2) {
        window.gameAudio.playCountdownBeep(false);
        this.lastBeepCount = 2;
      }
    } else if (countInt === 1) {
      this.dom.light1.className = 'light light-red active';
      this.dom.light2.className = 'light light-yellow active';
      this.dom.light3.className = 'light light-green active';
      this.dom.countdownText.innerText = '1';
      if (this.lastBeepCount !== 1) {
        window.gameAudio.playCountdownBeep(false);
        this.lastBeepCount = 1;
      }
    } else if (this.countdownTimer <= 0) {
      // LARGADA!
      this.dom.countdownText.innerText = 'LARGADA! 🏁';
      if (this.lastBeepCount !== 0) {
        window.gameAudio.playCountdownBeep(true);
        this.lastBeepCount = 0;
      }
      setTimeout(() => {
        this.dom.startLights.classList.add('hidden');
      }, 700);

      this.currentState = this.STATE.PLAYING;
      this.showAlert("🚦 LARGADA AUTORIZADA! PISA FUNDO!");
    }
  }

  pauseGame() {
    if (this.currentState === this.STATE.PLAYING) {
      this.currentState = this.STATE.PAUSED;
      this.dom.pauseScreen.classList.remove('hidden');
      window.gameAudio.stopEngine();
    }
  }

  resumeGame() {
    if (this.currentState === this.STATE.PAUSED) {
      this.currentState = this.STATE.PLAYING;
      this.dom.pauseScreen.classList.add('hidden');
      window.gameAudio.startEngine(this.currentCarData.id);
    }
  }

  returnToGarage() {
    this.currentState = this.STATE.MENU;
    window.gameAudio.stopEngine();
    window.gameAudio.stopRain();

    this.dom.startLights.classList.add('hidden');
    this.dom.hud.classList.add('hidden');
    this.dom.pauseScreen.classList.add('hidden');
    this.dom.gameoverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');
    this.dom.menuScreen.classList.remove('hidden');
    this.updateGarageUI();
    this.renderGaragePreview();
  }

  gameOver(reason) {
    this.currentState = this.STATE.GAMEOVER;
    window.gameAudio.playGameOver();

    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('transamazonica_highscore', this.stats.highScore.toString());
    }

    this.dom.gameoverReason.innerText = reason;
    this.dom.statDist.innerText = `${this.player.distanceKm.toFixed(1)} km`;
    this.dom.statSeeds.innerText = this.stats.seedsCollected;
    this.dom.statFauna.innerText = this.stats.faunaRespected;
    this.dom.statScore.innerText = Math.floor(this.stats.score);
    this.dom.statRecord.innerText = `${this.stats.highScore} pts`;

    this.dom.hud.classList.add('hidden');
    this.dom.gameoverScreen.classList.remove('hidden');
  }

  finishRace() {
    this.currentState = this.STATE.VICTORY;
    window.gameAudio.playVictory();

    // Posição final conquistada
    const rank = this.raceConfig.currentRank;
    const minutes = Math.floor(this.raceConfig.raceTime / 60);
    const seconds = Math.floor(this.raceConfig.raceTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let rankBonus = 0;
    if (rank === 1) {
      this.dom.vicTrophy.innerText = '🏆';
      this.dom.vicTitle.innerText = 'CHEGADA EM 1º LUGAR! CAMPEÃO!';
      this.dom.vicSubtitle.innerText = `Você dominou a Transamazônica com seu ${this.currentCarData.name}!`;
      this.dom.vicBadge.innerText = '🥇 CAMPEÃO DA BR-230';
      this.dom.vicBadge.style.background = 'linear-gradient(135deg, #f1c40f, #d35400)';
      rankBonus = 4000;
    } else if (rank === 2) {
      this.dom.vicTrophy.innerText = '🥈';
      this.dom.vicTitle.innerText = 'CHEGADA EM 2º LUGAR! PÓDIO!';
      this.dom.vicSubtitle.innerText = 'Excelente corrida pelas trilhas de terra vermelha da Amazônia!';
      this.dom.vicBadge.innerText = '🥈 VICE-CAMPEÃO (2º LUGAR)';
      this.dom.vicBadge.style.background = 'linear-gradient(135deg, #bdc3c7, #7f8c8d)';
      rankBonus = 2500;
    } else if (rank === 3) {
      this.dom.vicTrophy.innerText = '🥉';
      this.dom.vicTitle.innerText = 'CHEGADA EM 3º LUGAR! PÓDIO!';
      this.dom.vicSubtitle.innerText = 'Conquistou o pódio na rodovia mais desafiadora do Brasil!';
      this.dom.vicBadge.innerText = '🥉 3º LUGAR NO PÓDIO';
      this.dom.vicBadge.style.background = 'linear-gradient(135deg, #e67e22, #a04000)';
      rankBonus = 1500;
    } else {
      this.dom.vicTrophy.innerText = '🏁';
      this.dom.vicTitle.innerText = `CHEGADA EM ${rank}º LUGAR!`;
      this.dom.vicSubtitle.innerText = 'Você completou os 6 km da BR-230 e entregou as mudas com segurança!';
      this.dom.vicBadge.innerText = `🏁 ${rank}º LUGAR CONCLUÍDO`;
      this.dom.vicBadge.style.background = 'linear-gradient(135deg, #27ae60, #145a32)';
      rankBonus = 800;
    }

    this.stats.score += rankBonus;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('transamazonica_highscore', this.stats.highScore.toString());
    }

    this.dom.vicTime.innerText = timeStr;
    this.dom.vicSeeds.innerText = this.stats.seedsCollected;
    this.dom.vicFauna.innerText = this.stats.faunaRespected;
    this.dom.vicScore.innerText = Math.floor(this.stats.score);

    this.dom.hud.classList.add('hidden');
    this.dom.victoryScreen.classList.remove('hidden');
  }

  // ==========================================
  // HABILIDADES & BUZINA DE CORRIDA
  // ==========================================
  triggerHornOrAbility() {
    if (this.currentState !== this.STATE.PLAYING && this.currentState !== this.STATE.COUNTDOWN) return;

    window.gameAudio.playHorn(this.currentCarData.id);

    if (this.currentCarData.id === 'uno' && this.player.boostTimer <= 0 && this.currentState === this.STATE.PLAYING) {
      this.player.boostTimer = 4.0;
      this.player.isBoosting = true;
      window.gameAudio.playPowerup();
      this.showAlert("⚡ MODO FIRMA ATIVADO! SUPERROTAÇÃO!");
    }

    const alerted = this.obstacleManager.hornAlert(
      this.player.x,
      this.player.y,
      this.currentCarData.id === 'caminhao' ? 550 : 360
    );

    if (alerted > 0) {
      const bonus = alerted * 80;
      this.stats.score += bonus;
      this.stats.faunaRespected += alerted;
      this.showAlert(`📢 Fauna Protegida! +${bonus} pts 🌿`);
    }
  }

  showAlert(text) {
    const alertEl = this.dom.floatingAlert;
    alertEl.innerText = text;
    alertEl.classList.remove('hidden');
    alertEl.style.animation = 'none';
    alertEl.offsetHeight;
    alertEl.style.animation = 'floatFade 1.8s forwards';
    setTimeout(() => {
      alertEl.classList.add('hidden');
    }, 1800);
  }

  addDustParticle(x, y, isRed = true) {
    this.dustParticles.push({
      x: x + (Math.random() * 12 - 6),
      y: y,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.5 + Math.random() * 2,
      size: 4 + Math.random() * 5,
      color: isRed ? 'rgba(158, 42, 11, 0.45)' : 'rgba(200, 200, 200, 0.35)',
      life: 0.8
    });
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  gameLoop(currentTime) {
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.currentState === this.STATE.COUNTDOWN) {
      this.updateCountdown(delta);
    } else if (this.currentState === this.STATE.PLAYING) {
      this.update(delta);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(delta) {
    const car = this.currentCarData;
    const p = this.player;

    this.raceConfig.raceTime += delta;
    this.updateWeather(delta);

    // 1. Inputs do Jogador
    const isUp = this.keys['arrowup'] || this.keys['w'] || this.touchInputs.gas;
    const isDown = this.keys['arrowdown'] || this.keys['s'] || this.touchInputs.brake;
    const isLeft = this.keys['arrowleft'] || this.keys['a'] || this.touchInputs.left;
    const isRight = this.keys['arrowright'] || this.keys['d'] || this.touchInputs.right;

    p.isBraking = isDown;

    if (p.boostTimer > 0) {
      p.boostTimer -= delta;
      p.isBoosting = p.boostTimer > 0;
    }
    if (p.plankTimer > 0) {
      p.plankTimer -= delta;
    }

    // 2. Fatores de Terreno & Vácuo (Slipstream)
    let currentTraction = car.mudTraction;
    if (p.plankTimer > 0) currentTraction = 1.0;

    let speedLimit = car.maxSpeed;
    if (p.isBoosting) speedLimit += 45;
    if (p.slipstream) speedLimit += 25; // Ganho de vácuo

    if (p.isInMud && p.plankTimer <= 0) {
      speedLimit *= (0.35 + currentTraction * 0.45);
      if (Math.random() < 0.4) {
        this.obstacleManager.addMudParticles(p.x, p.y + car.height/2, 2);
      }
    }

    // 3. Aceleração do Jogador
    if (isUp && p.fuel > 0) {
      p.targetSpeed = speedLimit;
      const boostMult = p.isBoosting ? 2.2 : (p.slipstream ? 1.4 : 1.0);
      p.speed += car.accel * boostMult * delta * 60;
    } else if (isDown) {
      p.targetSpeed = 0;
      p.speed -= car.brake * delta * 60;
    } else {
      const friction = p.isInMud ? 0.35 : 0.12;
      p.speed = Math.max(0, p.speed - friction * delta * 60);
    }

    p.speed = Math.max(0, Math.min(p.speed, speedLimit));

    // Efeito de poeira nas rodas
    if (p.speed > 25 && Math.random() < 0.35) {
      this.addDustParticle(p.x - 12, p.y + car.height/2);
      this.addDustParticle(p.x + 12, p.y + car.height/2);
    }

    // 4. Direção e Estabilidade
    let handlingForce = car.handling;
    if (p.isInMud && currentTraction < 0.7) handlingForce *= 0.6;

    if (isLeft) p.vx -= handlingForce * delta * 8;
    if (isRight) p.vx += handlingForce * delta * 8;
    p.vx *= 0.82;
    p.x += p.vx;

    // Limites da Estrada
    const minX = 200;
    const maxX = 600;
    if (p.x < minX) { p.x = minX; p.vx = 0; p.speed *= 0.95; }
    if (p.x > maxX) { p.x = maxX; p.vx = 0; p.speed *= 0.95; }

    // 5. Consumo e Distância do Jogador
    if (p.speed > 5) {
      const fuelBurn = (0.016 / car.fuelEfficiency) * (p.speed / 100) * (p.isBoosting ? 2.0 : 1.0);
      p.fuel = Math.max(0, p.fuel - fuelBurn * delta * 60);

      const distInc = (p.speed / 3600) * delta * 12;
      p.distanceKm += distInc;
      this.stats.score += p.speed * delta * 0.8;
    }

    // 6. Atualizar IA dos Adversários
    this.updateOpponentsAI(delta);

    // 7. Calcular Posições na Corrida em Tempo Real
    this.calculateRaceRankings();

    // 8. Checar Vácuo (Slipstream) atrás dos rivais
    this.checkSlipstream();

    // 9. Checar Colisões com Perigos e entre Carros
    this.obstacleManager.update(p.speed, delta, this.roadCurvature, p.inBridgeZone, this.weather);
    this.checkCollisions(delta);

    // 10. Atualizar Partículas de Poeira
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const dp = this.dustParticles[i];
      dp.x += dp.vx;
      dp.y += dp.vy + (p.speed * 0.08);
      dp.size = Math.max(0, dp.size - delta * 3);
      dp.life -= delta;
      if (dp.life <= 0 || dp.size <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }

    // 11. Checar Condições de Fim de Jogo
    if (p.fuel <= 0 && p.speed < 2) {
      this.gameOver("Você ficou sem combustível no meio da floresta!");
      return;
    }
    if (p.health <= 0) {
      this.gameOver("Seu veículo não resistiu às crateras da Transamazônica!");
      return;
    }
    if (p.distanceKm >= this.raceConfig.targetDistanceKm) {
      this.finishRace();
      return;
    }

    // 12. Áudio & HUD
    window.gameAudio.updateEngine(p.speed / car.maxSpeed, isUp, car.id);
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - delta * 15);
    }
    this.updateHUD();
  }

  // ==========================================
  // INTELIGÊNCIA ARTIFICIAL DOS 4 RIVAIS
  // ==========================================
  updateOpponentsAI(delta) {
    const p = this.player;

    for (const ai of this.opponents) {
      const carData = ai.carData;

      // Velocidade de cruzeiro da IA de acordo com os atributos do carro
      let aiMaxSpeed = carData.maxSpeed * 0.96;
      let aiTraction = carData.mudTraction;

      // Checar se a IA está sobre lamaçal
      ai.isInMud = false;
      for (const h of this.obstacleManager.hazards) {
        if (h.type === 'mud' && Math.hypot(h.x - ai.x, h.y - ai.y) < 55) {
          ai.isInMud = true;
          break;
        }
      }

      if (ai.isInMud) {
        aiMaxSpeed *= (0.35 + aiTraction * 0.45);
        if (Math.random() < 0.2) {
          this.obstacleManager.addMudParticles(ai.x, ai.y + carData.height/2, 1);
        }
      }

      // Aceleração da IA
      if (ai.speed < aiMaxSpeed) {
        ai.speed += carData.accel * delta * 50;
      } else {
        ai.speed -= 0.15 * delta * 60;
      }

      // Distância percorrida pela IA na BR-230
      const aiDistInc = (ai.speed / 3600) * delta * 12;
      ai.distanceKm += aiDistInc;

      // Posição Y na tela relativa ao jogador (efeito de câmera do jogo de corrida)
      // Se a IA tiver maior distância que o jogador, ela fica mais acima na tela (-Y)
      const distDiffKm = ai.distanceKm - p.distanceKm;
      // 1 km = 3500 pixels de pista
      ai.y = p.y - (distDiffKm * 3500);

      // Comportamento de Direção da IA (Desvio de obstáculos e ultrapassagem)
      ai.laneTimer -= delta;
      if (ai.laneTimer <= 0) {
        ai.laneTimer = 1.5 + Math.random() * 2;
        // Escolhe uma linha na pista longe de buracos e do jogador
        let targetX = 240 + Math.random() * 320;
        if (Math.abs(targetX - p.x) < 40 && Math.abs(ai.y - p.y) < 100) {
          targetX = (p.x > 400) ? 260 : 540;
        }
        ai.targetLane = targetX;
      }

      // Suavização do movimento lateral da IA
      const dx = ai.targetLane - ai.x;
      ai.x += Math.sign(dx) * Math.min(Math.abs(dx), carData.handling * delta * 40);

      // Poeira das rodas dos rivais
      if (ai.speed > 25 && ai.y > -80 && ai.y < 680 && Math.random() < 0.25) {
        this.addDustParticle(ai.x - 10, ai.y + carData.height/2);
        this.addDustParticle(ai.x + 10, ai.y + carData.height/2);
      }
    }
  }

  // ==========================================
  // CÁLCULO DE POSIÇÕES DA CORRIDA (1º AO 5º)
  // ==========================================
  calculateRaceRankings() {
    const allRacers = [
      { isPlayer: true, distanceKm: this.player.distanceKm, name: this.currentCarData.name },
      ...this.opponents.map(ai => ({ isPlayer: false, distanceKm: ai.distanceKm, name: ai.name }))
    ];

    // Ordena do que andou mais (1º) para o que andou menos (5º)
    allRacers.sort((a, b) => b.distanceKm - a.distanceKm);

    const playerIndex = allRacers.findIndex(r => r.isPlayer);
    const newRank = playerIndex + 1;

    if (newRank !== this.raceConfig.currentRank) {
      if (newRank < this.raceConfig.currentRank) {
        // Ultrapassou um rival!
        window.gameAudio.playPowerup();
        this.showAlert(`⬆️ Ultrapassou! Você assumiu o ${newRank}º LUGAR! 🏎️💨`);
      } else {
        // Foi ultrapassado
        this.showAlert(`⬇️ Oponente te ultrapassou! Você caiu para ${newRank}º.`);
      }
      this.raceConfig.currentRank = newRank;
    }
  }

  // ==========================================
  // MECÂNICA DE VÁCUO (SLIPSTREAM)
  // ==========================================
  checkSlipstream() {
    const p = this.player;
    p.slipstream = false;

    for (const ai of this.opponents) {
      // Se a IA estiver à frente (entre 30px e 140px acima) e na mesma linha X (+/- 25px)
      if (ai.y < p.y && (p.y - ai.y) < 140 && (p.y - ai.y) > 30) {
        if (Math.abs(ai.x - p.x) < 26) {
          p.slipstream = true;
          if (Math.random() < 0.3) {
            window.gameAudio.playSlipstream();
          }
          break;
        }
      }
    }
  }

  // ==========================================
  // CLIMA DINÂMICO
  // ==========================================
  updateWeather(delta) {
    this.weatherTimer += delta;
    if (this.weatherTimer > 25) {
      this.weatherTimer = 0;
      const weathers = ['sun', 'fog', 'rain'];
      const nextIdx = (weathers.indexOf(this.weather) + 1) % weathers.length;
      this.weather = weathers[nextIdx];

      if (this.weather === 'rain') {
        this.dom.rainOverlay.classList.add('active');
        window.gameAudio.startRain();
        this.showAlert("🌧️ Temporal Amazônico! Pista de barro ensaboada!");
      } else if (this.weather === 'fog') {
        this.dom.rainOverlay.classList.remove('active');
        window.gameAudio.stopRain();
        this.showAlert("🌫️ Neblina da Manhã sobre a Transamazônica!");
      } else {
        this.dom.rainOverlay.classList.remove('active');
        window.gameAudio.stopRain();
      }
    }

    if (this.weather === 'rain') {
      this.lightningTimer += delta;
      if (this.lightningTimer > 8 + Math.random() * 6) {
        this.lightningTimer = 0;
        this.dom.flashOverlay.classList.add('flash');
        window.gameAudio.playThunder();
        setTimeout(() => {
          this.dom.flashOverlay.classList.remove('flash');
        }, 120);
      }
    }
  }

  // ==========================================
  // COLISÕES (OBSTÁCULOS & CARRO-A-CARRO)
  // ==========================================
  checkCollisions(delta) {
    const p = this.player;
    const car = this.currentCarData;
    let mudContact = false;

    // 1. Colisão com Lama e Perigos
    for (let i = this.obstacleManager.hazards.length - 1; i >= 0; i--) {
      const h = this.obstacleManager.hazards[i];
      const dist = Math.hypot(h.x - p.x, h.y - p.y);

      if (h.type === 'mud') {
        if (dist < (h.width/2 + car.width/3)) {
          mudContact = true;
          if (!p.isInMud) window.gameAudio.playMudSplash();
        }
      } else if (h.type === 'pothole' || h.type === 'bridge_hole') {
        if (dist < (h.width/2 + car.width/4)) {
          let dmg = h.damage || 18;
          if (car.id === 'fusca') dmg *= 0.5;
          if (car.id === 'caminhao') dmg *= 0.3;

          p.health = Math.max(0, p.health - dmg);
          p.speed *= 0.75;
          this.cameraShake = 8;
          window.gameAudio.playImpact();
          this.obstacleManager.hazards.splice(i, 1);
          this.showAlert("💥 Cratera na Pista! Dano no Chassi!");
        }
      } else if (h.type === 'log') {
        if (Math.abs(h.x - p.x) < (h.width/2 + car.width/3) && Math.abs(h.y - p.y) < 25) {
          if (car.id === 'caminhao') {
            this.obstacleManager.hazards.splice(i, 1);
            p.health = Math.max(0, p.health - 5);
            window.gameAudio.playImpact();
            this.showAlert("🪵 Caminhão MB 1113 Esmagou o Tronco!");
          } else {
            p.health = Math.max(0, p.health - (h.damage || 30));
            p.speed *= 0.4;
            this.cameraShake = 12;
            window.gameAudio.playImpact();
            this.obstacleManager.hazards.splice(i, 1);
            this.showAlert("⚠️ Impacto com Tronco Caído!");
          }
        }
      }
    }

    p.isInMud = mudContact;
    if (p.isInMud) this.dom.mudSplatter.classList.add('active');
    else this.dom.mudSplatter.classList.remove('active');

    // 2. Colisão Lateral Entre Carros Rivais (Empurrão de Corrida)
    for (const ai of this.opponents) {
      if (Math.abs(ai.y - p.y) < 45 && Math.abs(ai.x - p.x) < (car.width/2 + ai.carData.width/2 + 2)) {
        // Empurrão lateral
        const pushDir = Math.sign(p.x - ai.x) || 1;
        p.x += pushDir * 8;
        ai.x -= pushDir * 8;
        p.vx += pushDir * 3;
        ai.speed *= 0.92;
        p.speed *= 0.95;

        this.cameraShake = 4;
        window.gameAudio.playCarBump();
        this.addDustParticle((p.x + ai.x)/2, (p.y + ai.y)/2);
      }
    }

    // 3. Colisão com Fauna Amazônica
    for (let i = this.obstacleManager.wildlife.length - 1; i >= 0; i--) {
      const w = this.obstacleManager.wildlife[i];
      const dist = Math.hypot(w.x - p.x, w.y - p.y);

      if (dist < 32) {
        this.stats.score = Math.max(0, this.stats.score - 400);
        p.health = Math.max(0, p.health - 15);
        p.speed *= 0.6;
        this.cameraShake = 10;
        window.gameAudio.playImpact();
        this.obstacleManager.wildlife.splice(i, 1);
        this.showAlert("🚫 CUIDADO COM A FAUNA! Respeite os animais! (-400 pts)");
      }
    }

    // 4. Colisão com Coletáveis
    for (let i = this.obstacleManager.collectibles.length - 1; i >= 0; i--) {
      const c = this.obstacleManager.collectibles[i];
      const dist = Math.hypot(c.x - p.x, c.y - p.y);

      if (dist < (c.radius + 20)) {
        if (c.type === 'seed') {
          this.stats.seedsCollected++;
          this.stats.score += 150;
          window.gameAudio.playSeedPickup();
          this.showAlert("🌱 +1 Muda Amazônica! (+150 pts)");
        } else if (c.type === 'fuel') {
          p.fuel = Math.min(100, p.fuel + 35);
          this.stats.score += 50;
          window.gameAudio.playFuelPickup();
          this.showAlert("⛽ Bio-Combustível Abastecido! (+35%)");
        } else if (c.type === 'repair') {
          p.health = Math.min(p.maxHealth, p.health + (p.maxHealth * 0.3));
          this.stats.score += 50;
          window.gameAudio.playPowerup();
          this.showAlert("🔧 Veículo Reparado na Trilha!");
        } else if (c.type === 'plank') {
          p.plankTimer = 6.0;
          this.stats.score += 80;
          window.gameAudio.playPowerup();
          this.showAlert("🪵 Pranchas de Madeira: Imunidade a Lama!");
        }
        this.obstacleManager.collectibles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // ATUALIZAÇÃO DO HUD & MINI-MAPA DE CORRIDA
  // ==========================================
  updateHUD() {
    const p = this.player;
    this.dom.speedVal.innerText = Math.round(p.speed);

    // Posição no Grid (1º ao 5º)
    this.dom.posVal.innerText = `${this.raceConfig.currentRank}º`;

    // Status de Tração
    if (p.isBoosting) {
      this.dom.tractionWarning.innerText = '⚡ MODO FIRMA';
      this.dom.tractionWarning.className = 'status-pill status-boost';
    } else if (p.slipstream) {
      this.dom.tractionWarning.innerText = '💨 VÁCUO ATIVO';
      this.dom.tractionWarning.className = 'status-pill status-boost';
    } else if (p.plankTimer > 0) {
      this.dom.tractionWarning.innerText = '🪵 PRANCHAS ATIVAS';
      this.dom.tractionWarning.className = 'status-pill status-boost';
    } else if (p.isInMud) {
      this.dom.tractionWarning.innerText = '⚠️ ATOLEIRO DENSO';
      this.dom.tractionWarning.className = 'status-pill status-mud';
    } else {
      this.dom.tractionWarning.innerText = 'PISTA LIVRE';
      this.dom.tractionWarning.className = 'status-pill status-normal';
    }

    // Combustível e Integridade
    this.dom.fuelVal.innerText = `${Math.round(p.fuel)}%`;
    this.dom.fuelBarFill.style.width = `${p.fuel}%`;

    const healthPct = (p.health / p.maxHealth) * 100;
    this.dom.healthVal.innerText = `${Math.round(healthPct)}%`;
    this.dom.healthBarFill.style.width = `${healthPct}%`;

    // Odômetro
    this.dom.checkpointText.innerText = `Km ${p.distanceKm.toFixed(1)} / ${this.raceConfig.targetDistanceKm} km`;
    this.dom.seedCounter.innerText = this.stats.seedsCollected;

    // Mini-Mapa da Corrida (Posição dos 5 Carros no Traçado)
    const targetKm = this.raceConfig.targetDistanceKm;
    const playerPct = Math.min(98, Math.max(2, (p.distanceKm / targetKm) * 100));
    this.dom.dotPlayer.style.left = `${playerPct}%`;

    this.opponents.forEach((ai, idx) => {
      const dotEl = this.dom.dotAI[idx];
      if (dotEl) {
        const aiPct = Math.min(98, Math.max(2, (ai.distanceKm / targetKm) * 100));
        dotEl.style.left = `${aiPct}%`;
      }
    });
  }

  // ==========================================
  // RENDERIZAÇÃO DO CANVAS
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    if (this.cameraShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.cameraShake, (Math.random() - 0.5) * this.cameraShake);
    }

    // 1. Fundo da Mata Fechada
    ctx.fillStyle = '#0b2618';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Margens de Terra
    ctx.fillStyle = '#6e1d08';
    ctx.fillRect(150, 0, 500, this.height);

    // 3. Pista de Barro Vermelho BR-230
    this.roadScrollY = (this.roadScrollY + this.player.speed * 0.25) % 80;
    ctx.fillStyle = '#9e2a0b';
    ctx.fillRect(200, 0, 400, this.height);

    // Rastros de Pneu na Terra
    ctx.strokeStyle = '#782006';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(310, 0); ctx.lineTo(310, this.height);
    ctx.moveTo(490, 0); ctx.lineTo(490, this.height);
    ctx.stroke();

    // 4. Linha de Largada ou Chegada Quadriculada
    if (this.player.distanceKm < 0.15) {
      // Linha de Largada
      const startY = 490 + (this.player.distanceKm * 3500);
      this.drawCheckeredBanner(ctx, startY, "LARGADA");
    } else if ((this.raceConfig.targetDistanceKm - this.player.distanceKm) < 0.2) {
      // Linha de Chegada
      const finishY = this.player.y - ((this.raceConfig.targetDistanceKm - this.player.distanceKm) * 3500);
      this.drawCheckeredBanner(ctx, finishY, "CHEGADA ALTAMIRA 🏁");
    }

    // 5. Obstáculos, Fauna e Coletáveis
    this.obstacleManager.draw(ctx);

    // 6. Partículas de Poeira da Corrida
    for (const dp of this.dustParticles) {
      ctx.fillStyle = dp.color;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Desenhar Adversários IA na Pista
    for (const ai of this.opponents) {
      if (ai.y > -100 && ai.y < 700) {
        ai.carData.draw(ctx, ai.x, ai.y, ai.carData.width, ai.carData.height, false, false);
      }
    }

    // 8. Desenhar Veículo do Jogador
    if (this.currentState !== this.STATE.MENU) {
      this.currentCarData.draw(
        ctx,
        this.player.x,
        this.player.y,
        this.currentCarData.width,
        this.currentCarData.height,
        this.player.isBraking,
        this.player.isBoosting
      );

      // Linhas de Vácuo (Slipstream)
      if (this.player.slipstream) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.player.x - 14, this.player.y - 40);
        ctx.lineTo(this.player.x - 14, this.player.y - 70);
        ctx.moveTo(this.player.x + 14, this.player.y - 40);
        ctx.lineTo(this.player.x + 14, this.player.y - 70);
        ctx.stroke();
      }
    }

    // 9. Árvores e Floresta nas Margens
    this.drawAmazonTrees(ctx);

    // 10. Clima
    if (this.weather === 'fog') {
      ctx.fillStyle = 'rgba(230, 245, 235, 0.25)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.weather === 'rain') {
      ctx.fillStyle = 'rgba(10, 25, 20, 0.28)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  drawCheckeredBanner(ctx, y, text) {
    if (y < -50 || y > 650) return;
    const boxSize = 20;
    for (let bx = 200; bx < 600; bx += boxSize) {
      const isWhite = ((bx / boxSize) % 2 === 0);
      ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
      ctx.fillRect(bx, y - 10, boxSize, 10);
      ctx.fillStyle = isWhite ? '#000000' : '#ffffff';
      ctx.fillRect(bx, y, boxSize, 10);
    }
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px Chakra Petch';
    ctx.textAlign = 'center';
    ctx.fillText(text, 400, y - 18);
  }

  drawAmazonTrees(ctx) {
    for (const tree of this.trees) {
      tree.y = (tree.y + this.player.speed * 0.15) % this.height;

      ctx.save();
      ctx.fillStyle = tree.color;
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, tree.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(tree.x - tree.size * 0.2, tree.y - tree.size * 0.2, tree.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
