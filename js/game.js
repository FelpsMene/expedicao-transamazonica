/**
 * MOTOR PRINCIPAL DE CORRIDA: RALLY TRANSAMAZÔNICA (BR-230)
 * Controla o Game Loop de Corrida, IA dos 4 Rivais com Táticas Sujas,
 * Curvas Dinâmicas, Subidas Íngremes e Descidas (física de gravidade e bio-combustível),
 * Bancos de Neblina Espessa com Animais Surpresa,
 * Modo Tela Cheia, Menu Completo, Placar de Recordes e Guia do Piloto.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.previewCanvas = document.getElementById('vehiclePreviewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');

    // Dimensões Virtuais do Canvas
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

    // CONFIGURAÇÃO DAS 4 ETAPAS DO RALLY
    this.STAGES = {
      1: {
        number: 1,
        name: 'BR-230: Marabá ➔ Altamira',
        subtitle: 'Barro Vermelho & Poeirão',
        badge: 'FASE 1 • BR-230',
        distanceKm: 5.0,
        roadColor: '#9e2a0b',
        shoulderColor: '#6e1d08',
        forestColor: '#0b2618',
        weatherDefault: 'sun',
        hasBarranco: false,
        treeColor: '#1b4d3e',
        curveIntensity: 45
      },
      2: {
        number: 2,
        name: 'BR-163 / BR-236: Rurópolis ➔ Santarém',
        subtitle: 'Grandes Barrancos & Voçorocas',
        badge: 'FASE 2 • BR-163/236',
        distanceKm: 6.0,
        roadColor: '#b84d00',
        shoulderColor: '#7a2d00',
        forestColor: '#142c1b',
        weatherDefault: 'sun',
        hasBarranco: true,
        barrancoColor: '#521900',
        treeColor: '#2d6a4f',
        curveIntensity: 75
      },
      3: {
        number: 3,
        name: 'BR-230 Oeste: Itaituba ➔ Apuí',
        subtitle: 'Atoleiro de Chupeta & Pinguelas',
        badge: 'FASE 3 • BR-230 OESTE',
        distanceKm: 6.5,
        roadColor: '#521d0a',
        shoulderColor: '#361104',
        forestColor: '#081d11',
        weatherDefault: 'fog',
        hasBarranco: false,
        treeColor: '#133926',
        curveIntensity: 60
      },
      4: {
        number: 4,
        name: 'BR-319: Apuí ➔ Humaitá',
        subtitle: 'Trechos Alagados & Dilúvio',
        badge: 'FASE 4 • BR-319',
        distanceKm: 7.0,
        roadColor: '#361e12',
        shoulderColor: '#1f130b',
        forestColor: '#04120a',
        weatherDefault: 'rain',
        hasBarranco: false,
        treeColor: '#0e2b1d',
        curveIntensity: 85
      }
    };

    // Progresso de Fases
    this.currentStage = 1;
    this.unlockedStage = parseInt(localStorage.getItem('transamazonica_unlocked_stage') || '1', 10);

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
      slipstream: false,
      inCanaleta: false,
      inFlood: false,
      isSlidingBackwards: false
    };

    // Adversários IA na Corrida
    this.opponents = [];

    // Estatísticas da Corrida
    this.raceConfig = {
      targetDistanceKm: 5.0,
      raceTime: 0,
      currentRank: 5,
      prevRank: 5
    };

    this.stats = {
      seedsCollected: 0,
      faunaRespected: 0,
      score: 0,
      highScore: parseInt(localStorage.getItem('transamazonica_highscore') || '0', 10),
      totalSeeds: parseInt(localStorage.getItem('transamazonica_total_seeds') || '0', 10),
      totalFauna: parseInt(localStorage.getItem('transamazonica_total_fauna') || '0', 10)
    };

    // Semáforo de Largada
    this.countdownTimer = 3.5;

    // Clima e Efeitos
    this.weather = 'sun';
    this.weatherTimer = 0;
    this.lightningTimer = 0;
    this.fogPocketTimer = 0;
    this.inFogPocket = false;
    this.dirtyMudTimer = 0;

    // CURVAS, SUBIDAS E DESCIDAS
    this.roadScrollY = 0;
    this.roadCurvature = 0;
    this.roadCenterOffset = 0;
    this.hillState = 'flat'; // 'flat', 'uphill', 'downhill'
    this.hillTimer = 0;
    this.hillSlope = 0; // -1 (subida forte) a +1 (descida forte)

    this.trees = [];
    this.initTrees();

    // Partículas
    this.dustParticles = [];

    // Controles
    this.keys = {};
    this.touchInputs = { left: false, right: false, gas: false, brake: false };

    // Timing & Fullscreen
    this.lastTime = performance.now();
    this.cameraShake = 0;
    this.alertThrottle = 0;
    this.dirtyAttackThrottle = 0;
    this.isFullscreen = false;

    // Inicialização
    this.initDOM();
    this.initInputs();
    this.updateStageUI();
    this.updateRecordsUI();
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
        baseX: isLeft ? 30 + Math.random() * 120 : 650 + Math.random() * 120,
        x: 0,
        y: Math.random() * this.height,
        size: 28 + Math.random() * 24,
        type: Math.random() < 0.6 ? 'castanheira' : 'palmeira',
        color: '#1b4d3e'
      });
    }
  }

  initDOM() {
    this.dom = {
      container: document.getElementById('game-container'),
      hud: document.getElementById('game-hud'),
      menuScreen: document.getElementById('menu-screen'),
      pauseScreen: document.getElementById('pause-screen'),
      gameoverScreen: document.getElementById('gameover-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      recordsModal: document.getElementById('records-modal'),
      infoModal: document.getElementById('info-modal'),
      touchControls: document.getElementById('touch-controls'),
      startLights: document.getElementById('start-lights'),
      countdownText: document.getElementById('countdown-text'),
      light1: document.getElementById('light-1'),
      light2: document.getElementById('light-2'),
      light3: document.getElementById('light-3'),
      mudSplatter: document.getElementById('mud-splatter'),
      dirtyMudSplatter: document.getElementById('dirty-mud-splatter'),
      rainOverlay: document.getElementById('rain-overlay'),
      fogOverlay: document.getElementById('fog-overlay'),
      flashOverlay: document.getElementById('flash-overlay'),
      speedVal: document.getElementById('speed-val'),
      posVal: document.getElementById('pos-val'),
      tractionWarning: document.getElementById('traction-warning'),
      slopeIndicator: document.getElementById('slope-indicator'),
      fuelVal: document.getElementById('fuel-val'),
      fuelBarFill: document.getElementById('fuel-bar-fill'),
      healthVal: document.getElementById('health-val'),
      healthBarFill: document.getElementById('health-bar-fill'),
      checkpointText: document.getElementById('checkpoint-text'),
      stageBadgeHud: document.getElementById('stage-badge-hud'),
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
      vicScore: document.getElementById('vic-score'),
      btnNextStage: document.getElementById('btn-next-stage')
    };

    // BOTÕES DO CABEÇALHO
    document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btn-sound').addEventListener('click', () => {
      const active = window.gameAudio.toggle();
      document.getElementById('btn-sound').innerText = active ? '🔊' : '🔇';
    });
    document.getElementById('btn-records').addEventListener('click', () => this.openRecordsModal());
    document.getElementById('btn-info').addEventListener('click', () => {
      this.dom.infoModal.classList.remove('hidden');
    });

    document.getElementById('btn-close-records').addEventListener('click', () => {
      this.dom.recordsModal.classList.add('hidden');
    });
    document.getElementById('btn-close-info').addEventListener('click', () => {
      this.dom.infoModal.classList.add('hidden');
    });

    // BOTÃO DE PAUSA NO HUD
    document.getElementById('btn-hud-pause').addEventListener('click', () => this.pauseGame());

    // BOTÕES DO MENU DE PAUSA
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.dom.pauseScreen.classList.add('hidden');
      this.startRaceCountdown();
    });
    document.getElementById('btn-pause-records').addEventListener('click', () => this.openRecordsModal());
    document.getElementById('btn-pause-guide').addEventListener('click', () => {
      this.dom.infoModal.classList.remove('hidden');
    });
    document.getElementById('btn-quit').addEventListener('click', () => this.returnToGarage());

    // SELETOR DE CARROS
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

    // SELETOR DE ETAPAS (1 a 4)
    for (let s = 1; s <= 4; s++) {
      const btn = document.getElementById(`stage-btn-${s}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (s <= this.unlockedStage) {
            this.currentStage = s;
            this.updateStageUI();
            window.gameAudio.playPowerup();
          } else {
            this.showAlert(`🔒 Etapa Bloqueada! Suba ao pódio na Fase ${s - 1} para liberar!`);
            window.gameAudio.playImpact();
          }
        });
      }
    }

    // AÇÕES DE PARTIDA E VITÓRIA
    document.getElementById('btn-start').addEventListener('click', () => this.startRaceCountdown());
    document.getElementById('btn-retry').addEventListener('click', () => this.startRaceCountdown());
    document.getElementById('btn-play-again').addEventListener('click', () => this.startRaceCountdown());

    if (this.dom.btnNextStage) {
      this.dom.btnNextStage.addEventListener('click', () => {
        if (this.currentStage < 4 && this.unlockedStage > this.currentStage) {
          this.currentStage++;
          this.updateStageUI();
          this.startRaceCountdown();
        } else {
          this.returnToGarage();
        }
      });
    }

    document.getElementById('btn-garage-return').addEventListener('click', () => this.returnToGarage());
    document.getElementById('btn-vic-garage').addEventListener('click', () => this.returnToGarage());


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

  // MODO TELA CHEIA / REDIMENSIONAMENTO
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      this.dom.container.classList.add('fullscreen-mode');
      document.getElementById('btn-fullscreen').innerText = '✕';
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      this.dom.container.classList.remove('fullscreen-mode');
      document.getElementById('btn-fullscreen').innerText = '⛶';
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // MODAL DE RECORDES E PONTOS
  openRecordsModal() {
    this.updateRecordsUI();
    this.dom.recordsModal.classList.remove('hidden');
  }

  updateRecordsUI() {
    document.getElementById('rec-high-score').innerText = `${this.stats.highScore} pts`;
    document.getElementById('rec-total-seeds').innerText = `${this.stats.totalSeeds} 🌱`;
    document.getElementById('rec-total-fauna').innerText = `${this.stats.totalFauna} 🐆`;
    document.getElementById('rec-unlocked-stages').innerText = `Fase ${this.unlockedStage} / 4`;

    for (let s = 1; s <= 4; s++) {
      const best = localStorage.getItem(`transamazonica_best_time_${s}`);
      const el = document.getElementById(`rec-time-${s}`);
      if (el) el.innerText = best ? best : '--:--';
    }
  }

  // ATUALIZA INTERFACE DAS ETAPAS
  updateStageUI() {
    for (let s = 1; s <= 4; s++) {
      const btn = document.getElementById(`stage-btn-${s}`);
      const status = document.getElementById(`stage-status-${s}`);
      if (!btn || !status) continue;

      btn.classList.remove('stage-active', 'stage-locked');
      if (s === this.currentStage) {
        btn.classList.add('stage-active');
      }

      if (s <= this.unlockedStage) {
        status.innerText = '🔓 DESBLOQUEADA';
        status.style.color = '#2ecc71';
      } else {
        btn.classList.add('stage-locked');
        status.innerText = `🔒 PÓDIO NA FASE ${s - 1}`;
        status.style.color = '#e74c3c';
      }
    }

    const currentStg = this.STAGES[this.currentStage];
    if (this.dom.stageBadgeHud) {
      this.dom.stageBadgeHud.innerText = currentStg.badge;
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

    const stg = this.STAGES[this.currentStage];
    ctx.fillStyle = stg.roadColor;
    ctx.fillRect(0, 0, 220, 150);
    ctx.fillStyle = stg.shoulderColor;
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
    const stg = this.STAGES[this.currentStage];

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
      slipstream: false,
      inCanaleta: false,
      inFlood: false,
      isSlidingBackwards: false
    };

    this.opponents = [];
    const otherKeys = this.vehicleKeys.filter(k => k !== this.currentCarData.id);
    
    const startGridPositions = [
      { x: 260, y: 310, distOffset: 0.05 },
      { x: 500, y: 340, distOffset: 0.04 },
      { x: 290, y: 390, distOffset: 0.025 },
      { x: 480, y: 430, distOffset: 0.015 }
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
        colorDot: idx,
        dirtyAttackTimer: 2 + Math.random() * 3
      });
    });

    this.raceConfig.targetDistanceKm = stg.distanceKm;
    this.raceConfig.raceTime = 0;
    this.raceConfig.currentRank = 5;
    this.raceConfig.prevRank = 5;

    this.stats.seedsCollected = 0;
    this.stats.faunaRespected = 0;
    this.stats.score = 0;

    // Clima & Relevo
    this.weather = stg.weatherDefault;
    this.weatherTimer = 0;
    this.fogPocketTimer = 0;
    this.inFogPocket = false;
    this.dirtyMudTimer = 0;
    this.hillState = 'flat';
    this.hillTimer = 0;
    this.hillSlope = 0;
    this.roadCenterOffset = 0;

    if (this.weather === 'rain') {
      this.dom.rainOverlay.classList.add('active');
      window.gameAudio.startRain();
    } else {
      this.dom.rainOverlay.classList.remove('active');
      window.gameAudio.stopRain();
    }
    this.dom.fogOverlay.classList.remove('active');
    this.dom.dirtyMudSplatter.classList.remove('active');

    this.obstacleManager.reset();
    this.dustParticles = [];

    // Telas
    this.dom.menuScreen.classList.add('hidden');
    this.dom.pauseScreen.classList.add('hidden');
    this.dom.gameoverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');
    this.dom.recordsModal.classList.add('hidden');
    this.dom.infoModal.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');

    this.countdownTimer = 3.6;
    this.currentState = this.STATE.COUNTDOWN;
    this.dom.startLights.classList.remove('hidden');
    this.lastBeepCount = 4;

    window.gameAudio.startEngine(this.currentCarData.id);
  }

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
      this.dom.countdownText.innerText = 'LARGADA! 🏁';
      if (this.lastBeepCount !== 0) {
        window.gameAudio.playCountdownBeep(true);
        this.lastBeepCount = 0;
      }
      setTimeout(() => {
        this.dom.startLights.classList.add('hidden');
      }, 700);

      this.currentState = this.STATE.PLAYING;
      this.showAlert(`🚦 LARGADA DA FASE ${this.currentStage}! PISA FUNDO!`);
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
    this.dom.recordsModal.classList.add('hidden');
    this.dom.infoModal.classList.add('hidden');
    this.dom.menuScreen.classList.remove('hidden');

    this.updateStageUI();
    this.updateRecordsUI();
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

  // ==========================================
  // LINHA DE CHEGADA & REGRA DE PÓDIO
  // ==========================================
  finishRace() {
    this.currentState = this.STATE.VICTORY;

    const rank = this.raceConfig.currentRank;
    const minutes = Math.floor(this.raceConfig.raceTime / 60);
    const seconds = Math.floor(this.raceConfig.raceTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Salvar melhor tempo da etapa
    const stageKey = `transamazonica_best_time_${this.currentStage}`;
    const prevBest = localStorage.getItem(stageKey);
    if (!prevBest || timeStr < prevBest) {
      localStorage.setItem(stageKey, timeStr);
    }

    // Salvar totais acumulados
    this.stats.totalSeeds += this.stats.seedsCollected;
    this.stats.totalFauna += this.stats.faunaRespected;
    localStorage.setItem('transamazonica_total_seeds', this.stats.totalSeeds.toString());
    localStorage.setItem('transamazonica_total_fauna', this.stats.totalFauna.toString());

    let rankBonus = 0;
    const isPodium = rank <= 3;

    if (isPodium) {
      window.gameAudio.playVictory();

      // Desbloqueia próxima fase se estiver em 1º, 2º ou 3º
      if (this.currentStage < 4) {
        this.unlockedStage = Math.max(this.unlockedStage, this.currentStage + 1);
        localStorage.setItem('transamazonica_unlocked_stage', this.unlockedStage.toString());
        if (this.dom.btnNextStage) {
          this.dom.btnNextStage.innerText = `AVANÇAR PARA FASE ${this.currentStage + 1} ➡️`;
          this.dom.btnNextStage.classList.remove('hidden');
        }
      } else {
        if (this.dom.btnNextStage) this.dom.btnNextStage.classList.add('hidden');
      }

      if (rank === 1) {
        this.dom.vicTrophy.innerText = '🏆';
        this.dom.vicTitle.innerText = `1º LUGAR! CAMPEÃO DA FASE ${this.currentStage}!`;
        this.dom.vicSubtitle.innerText = `Vitória fantástica pilotando o ${this.currentCarData.name}! Próxima etapa liberada!`;
        this.dom.vicBadge.innerText = '🥇 CAMPEÃO (1º LUGAR)';
        this.dom.vicBadge.style.background = 'linear-gradient(135deg, #f1c40f, #d35400)';
        rankBonus = 4000;
      } else if (rank === 2) {
        this.dom.vicTrophy.innerText = '🥈';
        this.dom.vicTitle.innerText = `2º LUGAR NO PÓDIO DA FASE ${this.currentStage}!`;
        this.dom.vicSubtitle.innerText = 'Excelente corrida pelas trilhas da Amazônia! Próxima etapa liberada!';
        this.dom.vicBadge.innerText = '🥈 VICE-CAMPEÃO (2º LUGAR)';
        this.dom.vicBadge.style.background = 'linear-gradient(135deg, #bdc3c7, #7f8c8d)';
        rankBonus = 2500;
      } else if (rank === 3) {
        this.dom.vicTrophy.innerText = '🥉';
        this.dom.vicTitle.innerText = `3º LUGAR NO PÓDIO DA FASE ${this.currentStage}!`;
        this.dom.vicSubtitle.innerText = 'Você garantiu o pódio e conquistou a vaga para a próxima rodovia!';
        this.dom.vicBadge.innerText = '🥉 3º LUGAR NO PÓDIO';
        this.dom.vicBadge.style.background = 'linear-gradient(135deg, #e67e22, #a04000)';
        rankBonus = 1500;
      }
    } else {
      // NÃO SUBIU AO PÓDIO (4º ou 5º) -> BLOQUEADO!
      window.gameAudio.playGameOver();
      if (this.dom.btnNextStage) this.dom.btnNextStage.classList.add('hidden');

      this.dom.vicTrophy.innerText = '❌';
      this.dom.vicTitle.innerText = `NÃO SUBIU AO PÓDIO! (${rank}º LUGAR)`;
      this.dom.vicSubtitle.innerText = 'Na Transamazônica só os 3 primeiros colocados avançam de etapa! Tente novamente para se classificar.';
      this.dom.vicBadge.innerText = `🚫 DESCLASSIFICADO (${rank}º LUGAR)`;
      this.dom.vicBadge.style.background = 'linear-gradient(135deg, #c0392b, #78281f)';
      rankBonus = 300;
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
  // HABILIDADES & BUZINA
  // ==========================================
  triggerHornOrAbility() {
    if (this.currentState !== this.STATE.PLAYING && this.currentState !== this.STATE.COUNTDOWN) return;

    window.gameAudio.playHorn(this.currentCarData.id);

    if (this.currentCarData.id === 'uno' && this.player.boostTimer <= 0 && this.currentState === this.STATE.PLAYING) {
      this.player.boostTimer = 1.0;
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
    const stg = this.STAGES[this.currentStage];
    const color = isRed ? stg.roadColor : 'rgba(200, 200, 200, 0.35)';
    this.dustParticles.push({
      x: x + (Math.random() * 12 - 6),
      y: y,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.5 + Math.random() * 2,
      size: 4 + Math.random() * 5,
      color: color,
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

  // ==========================================
  // ATUALIZAÇÃO FÍSICA E MECÂNICAS REALISTAS
  // ==========================================
  update(delta) {
    const car = this.currentCarData;
    const p = this.player;
    const stg = this.STAGES[this.currentStage];

    this.raceConfig.raceTime += delta;
    this.updateWeatherAndFog(delta);

    // 1. CURVAS SINUOSAS DINÂMICAS DA TRANSAMAZÔNICA
    const curvePhase = (p.distanceKm * 2.8);
    const targetOffset = Math.sin(curvePhase) * stg.curveIntensity + Math.sin(curvePhase * 0.5) * (stg.curveIntensity * 0.5);
    this.roadCenterOffset += (targetOffset - this.roadCenterOffset) * delta * 2.5;

    // Força centrífuga empurra o carro nas curvas
    const curveForce = -Math.cos(curvePhase) * (stg.curveIntensity * 0.05) * (p.speed / 100);
    p.vx += curveForce * delta * 4;

    // 2. SUBIDAS ÍNGREMES E DESCIDAS (FÍSICA DE RELEVO E BIO-COMBUSTÍVEL)
    this.hillTimer += delta;
    // Ciclos periódicos de subidas e descidas
    const hillCycle = Math.sin(p.distanceKm * 2.2);
    if (hillCycle > 0.45) {
      this.hillState = 'uphill';
      this.hillSlope = -1.0;
    } else if (hillCycle < -0.45) {
      this.hillState = 'downhill';
      this.hillSlope = 0.8;
    } else {
      this.hillState = 'flat';
      this.hillSlope = 0;
    }

    // 3. Inputs do Jogador
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

    // Fatores de Terreno
    let currentTraction = car.mudTraction;
    if (p.plankTimer > 0) currentTraction = 1.0;

    let speedLimit = car.maxSpeed;
    if (p.isBoosting) speedLimit += 45;
    if (p.slipstream) speedLimit += 25;

    if (p.isInMud && p.plankTimer <= 0) {
      speedLimit *= (0.32 + currentTraction * 0.45);
      if (Math.random() < 0.4) {
        this.obstacleManager.addMudParticles(p.x, p.y + car.height/2, 2);
      }
    }
    if (p.inCanaleta && p.plankTimer <= 0) {
      speedLimit *= (car.mudTraction > 0.85 ? 0.8 : 0.55);
    }
    if (p.inFlood && p.plankTimer <= 0) {
      speedLimit *= (car.mudTraction > 0.85 ? 0.85 : 0.65);
    }

    // 4. RELEVO FLUIDO (SUBIDAS E DESCIDAS NATURAIS)
    if (this.hillState === 'uphill') {
      // Subida de serra fluida: leve sensação de aclive sem travar o veículo
      speedLimit *= 0.94;
    } else if (this.hillState === 'downhill') {
      // Descida: ganho de embalo e velocidade
      speedLimit *= 1.08;
    }

    // Aceleração do Jogador
    if (isUp && p.fuel > 0) {
      p.targetSpeed = speedLimit;
      const boostMult = p.isBoosting ? 2.2 : (p.slipstream ? 1.4 : 1.0);
      p.speed += car.accel * boostMult * delta * 60;
    } else if (isDown) {
      p.targetSpeed = 0;
      p.speed -= car.brake * delta * 60;
    } else {
      const friction = p.isInMud ? 0.38 : (p.inCanaleta ? 0.3 : 0.12);
      p.speed = Math.max(0, p.speed - friction * delta * 60);
    }

    p.speed = Math.max(0, Math.min(p.speed, speedLimit));

    if (p.speed > 25 && Math.random() < 0.35) {
      this.addDustParticle(p.x - 12, p.y + car.height/2);
      this.addDustParticle(p.x + 12, p.y + car.height/2);
    }

    // 5. Direção e Estabilidade
    let handlingForce = car.handling;
    if (p.isInMud && currentTraction < 0.7) handlingForce *= 0.6;
    if (p.inCanaleta) handlingForce *= 0.45;

    if (isLeft) p.vx -= handlingForce * delta * 8;
    if (isRight) p.vx += handlingForce * delta * 8;

    if (p.inFlood && p.speed > 55) {
      p.vx += (Math.random() - 0.5) * 1.8;
    }

    p.vx *= 0.82;
    p.x += p.vx;

    // Limites da Estrada & BARRANCOS (Fase 2)
    const roadLeftCurrent = 205 + this.roadCenterOffset;
    const roadRightCurrent = 595 + this.roadCenterOffset;

    if (p.x < roadLeftCurrent) {
      p.x = roadLeftCurrent;
      p.vx = 0;
      p.speed *= 0.94;
      if (stg.hasBarranco) {
        p.health = Math.max(0, p.health - 14 * delta);
        this.cameraShake = 5;
        this.addDustParticle(p.x, p.y, true);
        if (performance.now() - this.alertThrottle > 2000) {
          this.alertThrottle = performance.now();
          this.showAlert("⚠️ RASPANDO NO BARRANCO! DANO LATERAL!");
          window.gameAudio.playImpact();
        }
      }
    }
    if (p.x > roadRightCurrent) {
      p.x = roadRightCurrent;
      p.vx = 0;
      p.speed *= 0.94;
      if (stg.hasBarranco) {
        p.health = Math.max(0, p.health - 14 * delta);
        this.cameraShake = 5;
        this.addDustParticle(p.x, p.y, true);
        if (performance.now() - this.alertThrottle > 2000) {
          this.alertThrottle = performance.now();
          this.showAlert("⚠️ RASPANDO NO BARRANCO! DANO LATERAL!");
          window.gameAudio.playImpact();
        }
      }
    }

    // 6. Consumo Fluido e Equilibrado de Bio-Combustível
    if (p.speed > 4) {
      const fuelBurn = (0.012 / car.fuelEfficiency) * (p.speed / 100) * (p.isBoosting ? 1.7 : 1.0);
      p.fuel = Math.max(0, p.fuel - fuelBurn * delta * 60);

      const distInc = (p.speed / 3600) * delta * 12;
      p.distanceKm = Math.max(0, p.distanceKm + distInc);
      if (p.speed > 0) this.stats.score += p.speed * delta * 0.8;
    }

    // 7. IA DOS RIVAIS (COM TÁTICAS SUJAS)
    this.updateOpponentsAI(delta);

    // 8. Posições na Corrida
    this.calculateRaceRankings();

    // 9. Vácuo (Slipstream)
    this.checkSlipstream();

    // 10. Atualizar Obstáculos & Colisões
    this.obstacleManager.update(p.speed, delta, this.roadCurvature, p.inBridgeZone, this.weather, this.currentStage);
    this.checkCollisions(delta);

    // 11. Timer do Spray Sujo de Barro no Para-brisa
    if (this.dirtyMudTimer > 0) {
      this.dirtyMudTimer -= delta;
      if (this.dirtyMudTimer <= 0) {
        this.dom.dirtyMudSplatter.classList.remove('active');
      }
    }

    // 12. Poeira
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

    // 13. Checagem de Fim de Prova
    if (p.fuel <= 0 && Math.abs(p.speed) < 2) {
      this.gameOver("Você ficou sem bio-combustível na rodovia!");
      return;
    }
    if (p.health <= 0) {
      this.gameOver("Seu veículo foi destruído pelas pedras e barrancos!");
      return;
    }
    if (p.distanceKm >= this.raceConfig.targetDistanceKm) {
      this.finishRace();
      return;
    }

    // 14. Áudio & HUD
    window.gameAudio.updateEngine(Math.abs(p.speed) / car.maxSpeed, isUp, car.id);
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - delta * 15);
    }
    this.updateHUD();
  }

  // ==========================================
  // IA DOS RIVAIS COM TÁTICAS SUJAS
  // ==========================================
  updateOpponentsAI(delta) {
    const p = this.player;

    for (const ai of this.opponents) {
      const carData = ai.carData;
      let aiMaxSpeed = carData.maxSpeed * 0.50;
      let aiTraction = carData.mudTraction;

      ai.isInMud = false;
      for (const h of this.obstacleManager.hazards) {
        if (h.type === 'mud' && Math.hypot(h.x - ai.x, h.y - ai.y) < 55) {
          ai.isInMud = true;
          break;
        }
      }

      if (ai.isInMud) {
        aiMaxSpeed *= (0.35 + aiTraction * 0.25);
        if (Math.random() < 0.2) {
          this.obstacleManager.addMudParticles(ai.x, ai.y + carData.height/2, 1);
        }
      }

      if (ai.speed < aiMaxSpeed) {
        ai.speed += carData.accel * delta * 40;
      } else {
        ai.speed -= 0.15 * delta * 60;
      }

      const aiDistInc = (ai.speed / 3600) * delta * 12;
      ai.distanceKm += aiDistInc;

      const distDiffKm = ai.distanceKm - p.distanceKm;
      ai.y = p.y - (distDiffKm * 3500);

      // TÁTICA SUJA 1: FECHAR A PORTA (BLOCKING)
      // Se o jogador estiver tentando ultrapassar logo atrás ou de lado
      const isPlayerThreat = (ai.y < p.y && (p.y - ai.y) < 120 && Math.abs(ai.x - p.x) < 80);
      if (isPlayerThreat && Math.random() < 0.6) {
        // AI fecha o traçado do jogador!
        ai.targetLane = p.x;
      } else {
        ai.laneTimer -= delta;
        if (ai.laneTimer <= 0) {
          ai.laneTimer = 1.5 + Math.random() * 2;
          let targetX = 240 + this.roadCenterOffset + Math.random() * 320;
          ai.targetLane = targetX;
        }
      }

      const dx = ai.targetLane - ai.x;
      ai.x += Math.sign(dx) * Math.min(Math.abs(dx), carData.handling * delta * 45);

      if (ai.speed > 25 && ai.y > -80 && ai.y < 680 && Math.random() < 0.25) {
        this.addDustParticle(ai.x - 10, ai.y + carData.height/2);
        this.addDustParticle(ai.x + 10, ai.y + carData.height/2);
      }
    }
  }

  calculateRaceRankings() {
    const allRacers = [
      { isPlayer: true, distanceKm: this.player.distanceKm, name: this.currentCarData.name },
      ...this.opponents.map(ai => ({ isPlayer: false, distanceKm: ai.distanceKm, name: ai.name }))
    ];

    allRacers.sort((a, b) => b.distanceKm - a.distanceKm);
    const playerIndex = allRacers.findIndex(r => r.isPlayer);
    const newRank = playerIndex + 1;

    if (newRank !== this.raceConfig.currentRank) {
      if (newRank < this.raceConfig.currentRank) {
        window.gameAudio.playPowerup();
        this.showAlert(`⬆️ Ultrapassou! Você assumiu o ${newRank}º LUGAR! 🏎️💨`);
      } else {
        this.showAlert(`⬇️ Oponente te ultrapassou! Você caiu para ${newRank}º.`);
      }
      this.raceConfig.currentRank = newRank;
    }
  }

  checkSlipstream() {
    const p = this.player;
    p.slipstream = false;

    for (const ai of this.opponents) {
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
  // CLIMA DINÂMICO & BANCOS DE NEBLINA ESPESSA
  // ==========================================
  updateWeatherAndFog(delta) {
    this.weatherTimer += delta;
    if (this.weatherTimer > 30) {
      this.weatherTimer = 0;
      const weathers = ['sun', 'fog', 'rain'];
      const nextIdx = (weathers.indexOf(this.weather) + 1) % weathers.length;
      this.weather = (this.currentStage === 4 && Math.random() < 0.7) ? 'rain' : weathers[nextIdx];

      if (this.weather === 'rain') {
        this.dom.rainOverlay.classList.add('active');
        window.gameAudio.startRain();
        this.showAlert("🌧️ Temporal Amazônico! Pista de barro ensaboada!");
      } else {
        this.dom.rainOverlay.classList.remove('active');
        window.gameAudio.stopRain();
      }
    }

    // BANCOS DE NEBLINA LOCALIZADOS (Surge neblina densa e animais)
    this.fogPocketTimer += delta;
    if (this.fogPocketTimer > 20) {
      this.fogPocketTimer = 0;
      this.inFogPocket = !this.inFogPocket;

      if (this.inFogPocket) {
        this.dom.fogOverlay.classList.add('active');
        this.showAlert("🌫️ ENTRANDO EM BANCO DE NEBLINA ESPESSA! CUIDADO COM ANIMAIS!");
        // Spawna um animal surpresa bem no meio da neblina
        this.obstacleManager.spawnFogWildlife(400 + this.roadCenterOffset);
      } else {
        this.dom.fogOverlay.classList.remove('active');
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
  // DETECÇÃO DE COLISÕES
  // ==========================================
checkCollisions(delta) {
    const p = this.player;
    const car = this.currentCarData;
    let mudContact = false;
    let canaletaContact = false;
    let floodContact = false;

    // Fator de mitigação de dano baseado na durabilidade máxima do carro
    // Veículos mais frágeis tomam dano proporcional, veículos pesados absorvem melhor
    const defenseFactor = 100 / car.durability;

    for (let i = this.obstacleManager.hazards.length - 1; i >= 0; i--) {
      const h = this.obstacleManager.hazards[i];
      const dist = Math.hypot(h.x - p.x, h.y - p.y);

      if (h.type === 'mud') {
        if (dist < (h.width/2 + car.width/3)) {
          mudContact = true;
          if (!p.isInMud) window.gameAudio.playMudSplash();
        }
      } else if (h.type === 'barranco_rock') {
        if (dist < (h.width/2 + car.width/3)) {
          let baseDmg = (h.damage || 5) * defenseFactor;
          if (car.id === 'fusca') baseDmg *= 0.5; // Habilidade Baja

          p.health = Math.max(0, p.health - baseDmg);
          p.speed *= 0.7;
          this.cameraShake = 9;
          window.gameAudio.playImpact();
          this.obstacleManager.hazards.splice(i, 1);
          this.showAlert("💥 Desmoronamento de Barranco! Colisão com Pedras!");
        }
      } else if (h.type === 'canaleta') {
        if (Math.abs(h.x - p.x) < (h.width/2 + car.width/4) && Math.abs(h.y - p.y) < (h.height/2)) {
          canaletaContact = true;
          // Agora canaleta aplica dano contínuo ao chassi se entrar rápido!
          if (p.speed > 40) {
            p.health = Math.max(0, p.health - (8 * delta * defenseFactor));
          }
          if (!p.inCanaleta) {
            window.gameAudio.playMudSplash();
            this.showAlert("⚠️ CAIU NA CANALETA! DANO NO CHASSI!");
          }
        }
      } else if (h.type === 'flood_water') {
        if (Math.abs(h.x - p.x) < (h.width/2) && Math.abs(h.y - p.y) < (h.height/2)) {
          floodContact = true;
          if (!p.inFlood) {
            window.gameAudio.playMudSplash();
            this.showAlert("🌊 TRECHO ALAGADO! RISCO DE HIDROPLANAGEM!");
          }
        }
      } else if (h.type === 'stuck_truck') {
        if (Math.abs(h.x - p.x) < (h.width/2 + car.width/2) && Math.abs(h.y - p.y) < 38) {
          let baseDmg = (h.damage || 10) * defenseFactor;
          p.health = Math.max(0, p.health - baseDmg);
          p.speed *= 0.3;
          this.cameraShake = 7;
          window.gameAudio.playImpact();
          this.obstacleManager.hazards.splice(i, 1);
          this.showAlert("💥 BATEU NO CAMINHÃO ATOLADO!");
        }
      } else if (h.type === 'pothole' || h.type === 'bridge_hole') {
        if (dist < (h.width/2 + car.width/4)) {
          let baseDmg = (h.damage || 10) * defenseFactor;
          if (car.id === 'fusca') baseDmg *= 0.5;

          p.health = Math.max(0, p.health - baseDmg);
          p.speed *= 0.75;
          this.cameraShake = 8;
          window.gameAudio.playImpact();
          this.obstacleManager.hazards.splice(i, 1);
          this.showAlert("💥 Cratera na Pista! Dano na Suspensão!");
        }
      } else if (h.type === 'log') {
        if (Math.abs(h.x - p.x) < (h.width/2 + car.width/3) && Math.abs(h.y - p.y) < 25) {
          if (car.id === 'caminhao') {
            this.obstacleManager.hazards.splice(i, 1);
            p.health = Math.max(0, p.health - 5);
            window.gameAudio.playImpact();
            this.showAlert("🪵 Caminhão MB 1113 Esmagou o Tronco!");
          } else {
            let baseDmg = (h.damage || 9) * defenseFactor;
            p.health = Math.max(0, p.health - baseDmg);
            p.speed *= 0.4;
            this.cameraShake = 6;
            window.gameAudio.playImpact();
            this.obstacleManager.hazards.splice(i, 1);
            this.showAlert("⚠️ Impacto com Tronco Caído!");
          }
        }
      }
    }

    p.isInMud = mudContact;
    p.inCanaleta = canaletaContact;
    p.inFlood = floodContact;

    if (p.isInMud || p.inCanaleta) this.dom.mudSplatter.classList.add('active');
    else this.dom.mudSplatter.classList.remove('active');

    // EMPURRÕES VIOLENTOS ENTRE CARROS (Aplica dano de colisão)
    for (const ai of this.opponents) {
      if (Math.abs(ai.y - p.y) < 45 && Math.abs(ai.x - p.x) < (car.width/2 + ai.carData.width/2 + 2)) {
        const pushDir = Math.sign(p.x - ai.x) || 1;
        p.x += pushDir * 12;
        ai.x -= pushDir * 4;
        p.vx += pushDir * 4;
        ai.speed *= 0.94;
        p.speed *= 0.92;

        // Adicionado DANO na batida contra outros carros
        p.health = Math.max(0, p.health - (2 * defenseFactor));

        this.cameraShake = 6;
        window.gameAudio.playCarBump();
        this.addDustParticle((p.x + ai.x)/2, (p.y + ai.y)/2);
        if (performance.now() - this.dirtyAttackThrottle > 2200) {
          this.dirtyAttackThrottle = performance.now();
          this.showAlert(`🚷 ${ai.name} TE EMPURROU CONTRA O BARRANCO!`);
        }
      }
    }

    // Colisão com Fauna
    for (let i = this.obstacleManager.wildlife.length - 1; i >= 0; i--) {
      const w = this.obstacleManager.wildlife[i];
      const dist = Math.hypot(w.x - p.x, w.y - p.y);

      if (dist < 32) {
        this.stats.score = Math.max(0, this.stats.score - 400);
        p.health = Math.max(0, p.health - (15 * defenseFactor));
        p.speed *= 0.6;
        this.cameraShake = 10;
        window.gameAudio.playImpact();
        this.obstacleManager.wildlife.splice(i, 1);
        this.showAlert("🚫 CUIDADO COM A FAUNA! Respeite os animais! (-400 pts)");
      }
    }

    // Coletáveis (Mudas, Combustível, Reparos, Pranchas)
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
          p.fuel = Math.min(100, p.fuel + 40);
          this.stats.score += 50;
          window.gameAudio.playFuelPickup();
          this.showAlert("⛽ Bio-Combustível Abastecido! (+40%) 🌿");
        } else if (c.type === 'repair') {
          p.health = Math.min(p.maxHealth, p.health + (p.maxHealth * 0.35));
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
  // ATUALIZAÇÃO DO HUD & MINI-MAPA
  // ==========================================
  updateHUD() {
    const p = this.player;
    this.dom.speedVal.innerText = Math.round(p.speed);
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
    } else if (p.inCanaleta) {
      this.dom.tractionWarning.innerText = '⚠️ NA CANALETA';
      this.dom.tractionWarning.className = 'status-pill status-mud';
    } else if (p.inFlood) {
      this.dom.tractionWarning.innerText = '🌊 TRECHO ALAGADO';
      this.dom.tractionWarning.className = 'status-pill status-mud';
    } else if (p.isInMud) {
      this.dom.tractionWarning.innerText = '⚠️ ATOLEIRO DENSO';
      this.dom.tractionWarning.className = 'status-pill status-mud';
    } else {
      this.dom.tractionWarning.innerText = 'PISTA LIVRE';
      this.dom.tractionWarning.className = 'status-pill status-normal';
    }

    // Indicador de Relevo (Subidas/Descidas)
    if (this.hillState === 'uphill') {
      this.dom.slopeIndicator.innerText = '🔺 ACLIVE / SUBIDA';
      this.dom.slopeIndicator.className = 'slope-pill slope-uphill';
    } else if (this.hillState === 'downhill') {
      this.dom.slopeIndicator.innerText = '🔻 DECLIVE / DESCIDA';
      this.dom.slopeIndicator.className = 'slope-pill slope-downhill';
    } else {
      this.dom.slopeIndicator.innerText = '↔️ PISTA PLANA';
      this.dom.slopeIndicator.className = 'slope-pill slope-flat';
    }

    this.dom.fuelVal.innerText = `${Math.round(p.fuel)}%`;
    this.dom.fuelBarFill.style.width = `${p.fuel}%`;

    const healthPct = (p.health / p.maxHealth) * 100;
    this.dom.healthVal.innerText = `${Math.round(healthPct)}%`;
    this.dom.healthBarFill.style.width = `${healthPct}%`;

    this.dom.checkpointText.innerText = `Km ${p.distanceKm.toFixed(1)} / ${this.raceConfig.targetDistanceKm} km`;
    this.dom.seedCounter.innerText = this.stats.seedsCollected;

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
  // RENDERIZAÇÃO DO CENÁRIO, CURVAS E BARRANCOS
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    if (this.cameraShake > 0) {
      ctx.translate((Math.random() - 0.2) * this.cameraShake, (Math.random() - 0.5) * this.cameraShake);
    }

    const stg = this.STAGES[this.currentStage];
    const roadCenter = 400 + this.roadCenterOffset;

    // 1. Fundo da Mata da Etapa
    ctx.fillStyle = stg.forestColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Efeito de relevo no horizonte (Subida/Descida)
    if (this.hillState === 'uphill') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, this.width, 180);
    } else if (this.hillState === 'downhill') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, 0, this.width, 180);
    }

    // 2. Margens da Estrada
    ctx.fillStyle = stg.shoulderColor;
    ctx.fillRect(roadCenter - 250, 0, 500, this.height);

    // 3. Pista Principal com Curvas Sinuosas
    this.roadScrollY = (this.roadScrollY + this.player.speed * 0.25) % 100;
    ctx.fillStyle = stg.roadColor;
    ctx.fillRect(roadCenter - 200, 0, 400, this.height);

    // BARRANCOS LATERAIS (FASE 2: BR-163 / BR-236)
    if (stg.hasBarranco) {
      // Paredão do barranco esquerdo
      ctx.fillStyle = stg.barrancoColor;
      ctx.fillRect(roadCenter - 260, 0, 65, this.height);
      ctx.strokeStyle = '#852b00';
      ctx.lineWidth = 3;
      for (let by = 0; by < this.height; by += 40) {
        ctx.beginPath();
        ctx.moveTo(roadCenter - 230, by);
        ctx.lineTo(roadCenter - 140, by + 15);
        ctx.stroke();
      }

      // Paredão do barranco direito
      ctx.fillStyle = stg.barrancoColor;
      ctx.fillRect(roadCenter + 195, 0, 65, this.height);
      for (let by = 0; by < this.height; by += 40) {
        ctx.beginPath();
        ctx.moveTo(roadCenter + 230, by);
        ctx.lineTo(roadCenter + 140, by + 15);
        ctx.stroke();
      }
    }

    // Rastros de Rodagem
    ctx.strokeStyle = stg.shoulderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadCenter - 90, 0); ctx.lineTo(roadCenter - 90, this.height);
    ctx.moveTo(roadCenter + 90, 0); ctx.lineTo(roadCenter + 90, this.height);
    ctx.stroke();

    // 4. Linha de Largada ou Chegada
    if (this.player.distanceKm < 0.15) {
      const startY = 490 + (this.player.distanceKm * 3500);
      this.drawCheckeredBanner(ctx, startY, `LARGADA: ${stg.name}`, roadCenter);
    } else if ((this.raceConfig.targetDistanceKm - this.player.distanceKm) < 0.2) {
      const finishY = this.player.y - ((this.raceConfig.targetDistanceKm - this.player.distanceKm) * 3500);
      this.drawCheckeredBanner(ctx, finishY, `CHEGADA FASE ${this.currentStage} 🏁`, roadCenter);
    }

    // 5. Obstáculos da Fase
    this.obstacleManager.draw(ctx);

    // 6. Poeira
    for (const dp of this.dustParticles) {
      ctx.fillStyle = dp.color;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Rivais IA
    for (const ai of this.opponents) {
      if (ai.y > -100 && ai.y < 700) {
        ai.carData.draw(ctx, ai.x, ai.y, ai.carData.width, ai.carData.height, false, false);
      }
    }

    // 8. Veículo do Jogador
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

    // 9. Árvores Marginais
    this.drawAmazonTrees(ctx);

    // 10. Clima
    if (this.weather === 'fog' || this.inFogPocket) {
      ctx.fillStyle = 'rgba(230, 245, 235, 0.35)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.weather === 'rain') {
      ctx.fillStyle = 'rgba(10, 25, 20, 0.28)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  drawCheckeredBanner(ctx, y, text, roadCenter = 400) {
    if (y < -50 || y > 650) return;
    const boxSize = 20;
    const startX = roadCenter - 200;
    const endX = roadCenter + 200;
    for (let bx = startX; bx < endX; bx += boxSize) {
      const isWhite = (Math.floor(bx / boxSize) % 2 === 0);
      ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
      ctx.fillRect(bx, y - 10, boxSize, 10);
      ctx.fillStyle = isWhite ? '#000000' : '#ffffff';
      ctx.fillRect(bx, y, boxSize, 10);
    }
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 15px Chakra Petch';
    ctx.textAlign = 'center';
    ctx.fillText(text, roadCenter, y - 18);
  }

  drawAmazonTrees(ctx) {
    const stg = this.STAGES[this.currentStage];
    for (const tree of this.trees) {
      tree.y = (tree.y + this.player.speed * 0.15) % this.height;
      const curX = tree.baseX + this.roadCenterOffset * 0.6;

      ctx.save();
      ctx.fillStyle = stg.treeColor || tree.color;
      ctx.beginPath();
      ctx.arc(curX, tree.y, tree.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(curX - tree.size * 0.2, tree.y - tree.size * 0.2, tree.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
