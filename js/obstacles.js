/**
 * GERENCIADOR DE OBSTÁCULOS, FAUNA AMAZÔNICA E COLETÁVEIS
 * Responsável pela lógica de geração procedural, atualização e desenho no Canvas.
 */

class ObstacleManager {
  constructor(roadWidth) {
    this.roadWidth = roadWidth;
    this.hazards = [];     // Lamaçais, buracos, troncos, pontes
    this.wildlife = [];    // Capivaras, antas, jacarés, preguiças
    this.collectibles = [];// Mudas, combustíveis, reparos, pranchas
    this.particles = [];   // Spray de lama, folhas, faíscas
    this.spawnTimer = 0;
    this.totalDistance = 0;
  }

  reset() {
    this.hazards = [];
    this.wildlife = [];
    this.collectibles = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.totalDistance = 0;
  }

  update(speed, delta, roadCurvature, isBridgeZone, weather, currentStage = 1) {
    const moveDist = speed * delta * 15;
    this.totalDistance += moveDist;

    // Atualiza e remove perigos
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.y += moveDist;
      if (h.y > 750) {
        this.hazards.splice(i, 1);
      }
    }

    // Atualiza e remove animais
    for (let i = this.wildlife.length - 1; i >= 0; i--) {
      const w = this.wildlife[i];
      w.y += moveDist;
      
      // Movimento do animal atravessando a pista
      w.x += w.vx * (w.alerted ? 2.5 : 1) * delta * 60;
      w.animTimer = (w.animTimer || 0) + delta * 8;

      // Saiu da tela
      if (w.y > 750 || w.x < -100 || w.x > 900) {
        this.wildlife.splice(i, 1);
      }
    }

    // Atualiza e remove coletáveis
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.y += moveDist;
      c.pulse = (c.pulse || 0) + delta * 5;
      if (c.y > 750) {
        this.collectibles.splice(i, 1);
      }
    }

    // Atualiza partículas de lama/efeitos
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta * 60;
      p.y += (p.vy + moveDist * 0.5) * delta * 60;
      p.life -= delta * 2;
      p.size = Math.max(0, p.size - delta * 4);
      if (p.life <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Spawn Procedural baseado na distância e na Fase
    this.spawnTimer += delta;
    const spawnThreshold = currentStage >= 3 ? 1.0 : 1.2;
    if (this.spawnTimer > spawnThreshold) {
      this.spawnTimer = 0;
      this.spawnWave(isBridgeZone, weather, currentStage);
    }
  }

  spawnWave(isBridgeZone, weather, currentStage = 1) {
    const roadLeft = 200;
    const roadRight = 600;
    const roadCenter = 400;

    // Se estiver em ponte estreita de igarapé / pinguela
    if (isBridgeZone) {
      if (Math.random() < 0.4) {
        this.hazards.push({
          type: 'bridge_hole',
          x: roadCenter + (Math.random() * 120 - 60),
          y: -80,
          width: 45,
          height: 35
        });
      }
      if (Math.random() < 0.5) {
        this.collectibles.push({
          type: 'seed',
          x: roadCenter + (Math.random() * 100 - 50),
          y: -100,
          radius: 14
        });
      }
      return;
    }

    // SPAWN DE PERIGOS ESPECÍFICOS DE CADA FASE:
    const hazardChance = (weather === 'rain' || currentStage >= 3) ? 0.88 : 0.70;

    if (Math.random() < hazardChance) {
      const hX = roadLeft + 40 + Math.random() * (roadRight - roadLeft - 80);
      const rand = Math.random();

      // FASE 2: BR-163 / BR-236 (Grandes Barrancos e Deslizamentos)
      if (currentStage === 2) {
        if (rand < 0.45) {
          // Desmoronamento de Barranco / Pedras e Terra
          const isFromSide = Math.random() < 0.5;
          this.hazards.push({
            type: 'barranco_rock',
            x: isFromSide ? (roadLeft + 25 + Math.random() * 50) : (roadRight - 25 - Math.random() * 50),
            y: -90,
            width: 45 + Math.random() * 25,
            height: 35 + Math.random() * 20,
            damage: 22
          });
        } else if (rand < 0.75) {
          // Atoleiro denso
          this.hazards.push({
            type: 'mud',
            x: hX,
            y: -120,
            width: 100 + Math.random() * 50,
            height: 80 + Math.random() * 50,
            viscosity: 0.65
          });
        } else {
          // Cratera
          this.hazards.push({
            type: 'pothole',
            x: hX,
            y: -80,
            width: 48,
            height: 38,
            damage: 20
          });
        }
      }
      // FASE 3: BR-230 Oeste (Atoleiro de Chupeta & Canaletas Profundas)
      else if (currentStage === 3) {
        if (rand < 0.45) {
          // Canaleta / Vala Profunda de Pneu de Carreta
          this.hazards.push({
            type: 'canaleta',
            x: roadCenter + (Math.random() < 0.5 ? -70 : 70),
            y: -150,
            width: 48,
            height: 150 + Math.random() * 80,
            damage: 5
          });
        } else if (rand < 0.75) {
          // Atoleiro de Chupeta (Super viscoso)
          this.hazards.push({
            type: 'mud',
            x: hX,
            y: -130,
            width: 120 + Math.random() * 60,
            height: 90 + Math.random() * 60,
            viscosity: 0.50 // Mais pesado que o normal!
          });
        } else {
          // Tronco caído
          this.hazards.push({
            type: 'log',
            x: hX,
            y: -80,
            width: 110,
            height: 28,
            damage: 32
          });
        }
      }
      // FASE 4: BR-319 / Humaitá (Trechos Alagados & Caminhão Atolado)
      else if (currentStage === 4) {
        if (rand < 0.40) {
          // Trecho Alagado / Igarapé Transbordado
          this.hazards.push({
            type: 'flood_water',
            x: roadCenter,
            y: -140,
            width: 380,
            height: 130 + Math.random() * 40
          });
        } else if (rand < 0.65) {
          // Caminhão de Carga Atolado no meio da pista
          this.hazards.push({
            type: 'stuck_truck',
            x: roadLeft + 60 + Math.random() * (roadRight - roadLeft - 120),
            y: -120,
            width: 52,
            height: 88,
            damage: 30
          });
        } else {
          // Atoleiro gigante
          this.hazards.push({
            type: 'mud',
            x: hX,
            y: -130,
            width: 130 + Math.random() * 60,
            height: 100 + Math.random() * 50,
            viscosity: 0.30
          });
        }
      }
      // FASE 1: Padrão
      else {
        if (rand < 0.55) {
          this.hazards.push({
            type: 'mud',
            x: hX,
            y: -120,
            width: 90 + Math.random() * 60,
            height: 80 + Math.random() * 50,
            viscosity: 0.6
          });
        } else if (rand < 0.85) {
          this.hazards.push({
            type: 'pothole',
            x: hX,
            y: -80,
            width: 48,
            height: 38,
            damage: 18
          });
        } else {
          this.hazards.push({
            type: 'log',
            x: hX,
            y: -80,
            width: 100,
            height: 28,
            damage: 30
          });
        }
      }
    }

    // Spawn de Fauna Amazônica
    if (Math.random() < 0.35) {
      const speciesList = ['capivara', 'anta', 'jacare', 'preguica'];
      const chosen = speciesList[Math.floor(Math.random() * speciesList.length)];
      const fromLeft = Math.random() < 0.5;
      
      let speed = 0.8;
      if (chosen === 'capivara') speed = 1.2;
      else if (chosen === 'anta') speed = 1.6;
      else if (chosen === 'preguica') speed = 0.3;
      else if (chosen === 'jacare') speed = 0.6;

      this.wildlife.push({
        type: chosen,
        x: fromLeft ? 160 : 640,
        y: -90,
        width: chosen === 'preguica' ? 26 : 38,
        height: chosen === 'anta' ? 48 : 34,
        vx: fromLeft ? speed : -speed,
        alerted: false,
        respected: false,
        animTimer: 0
      });
    }

    // Spawn de Coletáveis (Mudas, Bio-Combustível, Reparos, Pranchas)
    if (Math.random() < 0.85) {
      const cX = roadLeft + 35 + Math.random() * (roadRight - roadLeft - 70);
      const randC = Math.random();
      let type = 'seed';

      // Distribuição equilibrada: mudas e combustíveis espalhados com frequência
      if (randC < 0.45) type = 'seed';
      else if (randC < 0.82) type = 'fuel';
      else if (randC < 0.93) type = 'repair';
      else type = 'plank'; // Pranchas nos atoleiros

      this.collectibles.push({
        type: type,
        x: cX,
        y: -100,
        radius: 16
      });

      // Ocasionalmente spawna par complementar (muda + combustível) em pistas diferentes
      if (Math.random() < 0.35) {
        const otherType = (type === 'fuel') ? 'seed' : 'fuel';
        const otherX = (cX > roadCenter) 
          ? (roadLeft + 35 + Math.random() * 120) 
          : (roadRight - 35 - Math.random() * 120);
        this.collectibles.push({
          type: otherType,
          x: otherX,
          y: -145,
          radius: 16
        });
      }
    }
  }

  // Alerta animais próximos com a buzina
  hornAlert(playerX, playerY, range = 350) {
    let alertedCount = 0;
    for (const w of this.wildlife) {
      const dist = Math.hypot(w.x - playerX, w.y - playerY);
      if (dist < range && !w.alerted) {
        w.alerted = true;
        w.vx *= 2.2; // Animal se assusta e corre para a margem da floresta
        alertedCount++;
      }
    }
    return alertedCount;
  }

  addMudParticles(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 3,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#78281f' : '#9e2a0b',
        life: 1.0
      });
    }
  }

  // Spray sujo de barro e pedregulhos arremessados pelos rivais
  addDirtySpray(x, y) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x: x + (Math.random() * 24 - 12),
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: 3 + Math.random() * 6,
        size: 5 + Math.random() * 7,
        color: Math.random() < 0.5 ? '#4a1505' : '#1f0800',
        life: 0.8,
        isDirtyMud: true
      });
    }
  }

  // Animal surpresa que surge dentro do banco de neblina espessa
  spawnFogWildlife(roadCenterX) {
    const species = ['onca', 'anta', 'capivara'];
    const chosen = species[Math.floor(Math.random() * species.length)];
    this.wildlife.push({
      type: chosen === 'onca' ? 'anta' : chosen, // onça usa sprite estilizado ou anta
      x: roadCenterX + (Math.random() * 100 - 50),
      y: -60,
      width: 44,
      height: 38,
      vx: (Math.random() < 0.5 ? 0.6 : -0.6),
      alerted: false,
      respected: false,
      animTimer: 0,
      inFog: true
    });
  }

  // ==========================================
  // RENDERIZAÇÃO DOS OBJETOS NO CANVAS
  // ==========================================
  draw(ctx) {
    // 1. Desenhar Lamaçais e Buracos (Camada inferior)
    for (const h of this.hazards) {
      if (h.type === 'mud') {
        ctx.save();
        ctx.fillStyle = '#6e1d08';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.width / 2, h.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Camada interna mais escura e pegajosa
        ctx.fillStyle = '#4a1103';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.width / 2.8, h.height / 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rastros de pneu no barro
        ctx.strokeStyle = '#2d0800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(h.x - h.width/4, h.y - h.height/2.5);
        ctx.lineTo(h.x - h.width/4, h.y + h.height/2.5);
        ctx.moveTo(h.x + h.width/4, h.y - h.height/2.5);
        ctx.lineTo(h.x + h.width/4, h.y + h.height/2.5);
        ctx.stroke();

        ctx.restore();
      } else if (h.type === 'pothole' || h.type === 'bridge_hole') {
        ctx.save();
        ctx.fillStyle = '#1a0c08';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.width / 2, h.height / 2, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (h.type === 'log') {
        ctx.save();
        // Tronco de madeira caído
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(h.x - h.width/2, h.y - h.height/2, h.width, h.height, 6);
        ctx.fill();
        ctx.strokeStyle = '#271a17';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Musgo amazônico no tronco
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(h.x - h.width/3, h.y - h.height/2, h.width/2, 4);
        ctx.restore();
      } else if (h.type === 'barranco_rock') {
        // Pedregulhos e Terra de Desmoronamento de Barranco (Fase 2)
        ctx.save();
        ctx.fillStyle = '#8b2500';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y, h.width/2, h.height/2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Rochas angulares
        ctx.fillStyle = '#4a1505';
        ctx.beginPath();
        ctx.moveTo(h.x - h.width/3, h.y + h.height/4);
        ctx.lineTo(h.x, h.y - h.height/3);
        ctx.lineTo(h.x + h.width/4, h.y + h.height/3);
        ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else if (h.type === 'canaleta') {
        // Vala Profunda / Trilho de Pneu no Barro (Fase 3)
        ctx.save();
        ctx.fillStyle = '#3a0c02';
        ctx.beginPath();
        ctx.roundRect(h.x - h.width/2, h.y - h.height/2, h.width, h.height, 8);
        ctx.fill();
        // Fundo com lama negra
        ctx.fillStyle = '#1a0400';
        ctx.fillRect(h.x - h.width/4, h.y - h.height/2 + 6, h.width/2, h.height - 12);
        // Frisos de roda
        ctx.strokeStyle = '#5a1505';
        ctx.lineWidth = 2;
        ctx.strokeRect(h.x - h.width/2, h.y - h.height/2, h.width, h.height);
        ctx.restore();
      } else if (h.type === 'flood_water') {
        // Igarapé Transbordado / Trecho Alagado (Fase 4)
        ctx.save();
        ctx.fillStyle = 'rgba(41, 128, 185, 0.65)';
        ctx.beginPath();
        ctx.roundRect(h.x - h.width/2, h.y - h.height/2, h.width, h.height, 12);
        ctx.fill();
        // Ondulações de correnteza
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let wy = -h.height/3; wy <= h.height/3; wy += 20) {
          ctx.beginPath();
          ctx.moveTo(h.x - h.width/2.5, h.y + wy);
          ctx.quadraticCurveTo(h.x, h.y + wy + 8, h.x + h.width/2.5, h.y + wy);
          ctx.stroke();
        }
        ctx.restore();
      } else if (h.type === 'stuck_truck') {
        // Caminhão Antigo Atolado na Lama (Fase 4)
        ctx.save();
        ctx.translate(h.x, h.y);
        // Sombra / poça de lama em volta
        ctx.fillStyle = '#2c0b02';
        ctx.beginPath();
        ctx.ellipse(0, 0, h.width/1.2 + 10, h.height/2 + 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cabine verde musgo enferrujada
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-h.width/2, -h.height/2, h.width, 34);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-h.width/2 + 4, -h.height/2 + 6, h.width - 8, 10); // para-brisa
        // Caçamba de madeira velha
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(-h.width/2 + 2, -h.height/2 + 34, h.width - 4, h.height - 36);
        // Triângulo de alerta de perigo atrás
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(0, h.height/2 - 12);
        ctx.lineTo(-8, h.height/2 - 2);
        ctx.lineTo(8, h.height/2 - 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Desenhar Partículas de Barro
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Desenhar Fauna Amazônica
    for (const w of this.wildlife) {
      ctx.save();
      ctx.translate(w.x, w.y);
      if (w.vx < 0) ctx.scale(-1, 1);

      if (w.type === 'capivara') {
        // Capivara fofa
        ctx.fillStyle = '#8d5524';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // Focinho quadrado
        ctx.fillRect(10, -6, 9, 10);
        // Orelhinha
        ctx.fillStyle = '#5c3818';
        ctx.beginPath();
        ctx.arc(6, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        // Olhinho
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(12, -4, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (w.type === 'anta') {
        // Anta Brasileira (Tapir)
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cabeça com tromba característica
        ctx.fillRect(12, -7, 12, 11);
        ctx.beginPath();
        ctx.moveTo(24, -3);
        ctx.lineTo(28, 2);
        ctx.lineTo(22, 4);
        ctx.fill();
        // Olho
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(16, -4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (w.type === 'jacare') {
        // Jacaré-Açu
        ctx.fillStyle = '#1e3f20';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Focinho longo
        ctx.fillRect(10, -4, 16, 8);
        // Cauda
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-18, 4);
        ctx.fill();
        // Olhos amarelos
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(8, -6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (w.type === 'preguica') {
        // Bicho-Preguiça
        ctx.fillStyle = '#a0855b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Máscara facial clássica
        ctx.fillStyle = '#f5f6fa';
        ctx.beginPath();
        ctx.arc(8, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(6, -2, 4, 2); // Faixa dos olhos
      }

      // Se o animal estiver em alerta pela buzina
      if (w.alerted) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 12px Montserrat';
        ctx.fillText('!', 0, -16);
      }

      ctx.restore();
    }

    // 4. Desenhar Coletáveis
    for (const c of this.collectibles) {
      ctx.save();
      ctx.translate(c.x, c.y);
      const scale = 1 + Math.sin(c.pulse) * 0.1;
      ctx.scale(scale, scale);

      // Brilho de fundo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      if (c.type === 'seed') {
        // Muda Ecológica / Semente de Castanheira
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Chakra Petch';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌱', 0, 0);
      } else if (c.type === 'fuel') {
        // Galão de Bio-Combustível
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.roundRect(-10, -12, 20, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-6, -16, 12, 4); // Alça
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Montserrat';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛽', 0, 0);
      } else if (c.type === 'repair') {
        // Kit de Ferramentas
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.roundRect(-12, -10, 24, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Montserrat';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔧', 0, 0);
      } else if (c.type === 'plank') {
        // Pranchas de Desatolamento (Anti-lama)
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.roundRect(-12, -12, 24, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Montserrat';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪵', 0, 0);
      }

      ctx.restore();
    }
  }
}

window.ObstacleManager = ObstacleManager;
