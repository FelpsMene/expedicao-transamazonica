/**
 * DEFINIÇÃO DOS VEÍCULOS BRASILEIROS DA TRANSAMAZÔNICA
 * Contém atributos de física, renderização procedural do sprite em 2D Top-Down e Garage Preview.
 */

const VEHICLES = {
  uno: {
    id: 'uno',
    name: 'Uno Mille com Escada',
    tag: 'O LENDÁRIO DA FIRMA',
    desc: 'O mito das estradas brasileiras. Rápido, leve e munido com a clássica escada aerodinâmica no teto. Ativa o "Modo Firma" (Nitro).',
    ability: 'Modo Firma: Super Nitro com a tecla ESPAÇO / Toque!',
    width: 36,
    height: 64,
    maxSpeed: 135,
    accel: 0.28,
    brake: 0.35,
    handling: 3.6,
    mudTraction: 0.52, // Sofre na lama
    durability: 100,
    fuelEfficiency: 0.85,
    color: '#f5f6fa',
    accentColor: '#e74c3c',
    draw: function(ctx, x, y, width, height, isBraking, isBoosting) {
      ctx.save();
      ctx.translate(x, y);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 3, -height/2 + 3, width, height, 6);
      ctx.fill();

      // Carroceria Branca Uno
      ctx.fillStyle = isBoosting ? '#fff07c' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-width/2, -height/2, width, height, 4);
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Para-brisa e Vidros
      ctx.fillStyle = '#2c3e50';
      // Dianteiro
      ctx.fillRect(-width/2 + 4, -height/2 + 14, width - 8, 10);
      // Traseiro
      ctx.fillRect(-width/2 + 4, height/2 - 14, width - 8, 8);
      // Laterais
      ctx.fillRect(-width/2 + 2, -height/2 + 26, 3, 20);
      ctx.fillRect(width/2 - 5, -height/2 + 26, 3, 20);

      // Teto do Uno
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(-width/2 + 5, -height/2 + 24, width - 10, 24);

      // A LENDÁRIA ESCADA NO TETO
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.5;
      // Trilhos da escada
      ctx.beginPath();
      ctx.moveTo(-width/2 + 9, -height/2 + 8);
      ctx.lineTo(-width/2 + 9, height/2 - 6);
      ctx.moveTo(width/2 - 9, -height/2 + 8);
      ctx.lineTo(width/2 - 9, height/2 - 6);
      // Degraus
      for (let step = -height/2 + 14; step <= height/2 - 10; step += 8) {
        ctx.moveTo(-width/2 + 9, step);
        ctx.lineTo(width/2 - 9, step);
      }
      ctx.stroke();

      // Faixa da Firma na Lateral / Capô
      ctx.fillStyle = '#3498db';
      ctx.fillRect(-width/2 + 8, -height/2 + 4, width - 16, 4);

      // Faróis Dianteiros
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-width/2 + 3, -height/2 + 1, 7, 3);
      ctx.fillRect(width/2 - 10, -height/2 + 1, 7, 3);

      // Lanternas Traseiras
      ctx.fillStyle = isBraking ? '#ff0000' : '#c0392b';
      if (isBraking) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(-width/2 + 2, height/2 - 3, 6, 3);
      ctx.fillRect(width/2 - 8, height/2 - 3, 6, 3);

      // Chamas no Nitro
      if (isBoosting) {
        ctx.fillStyle = '#ff3838';
        ctx.beginPath();
        ctx.moveTo(-6, height/2 + 2);
        ctx.lineTo(0, height/2 + 16 + Math.random() * 8);
        ctx.lineTo(6, height/2 + 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },

  fusca: {
    id: 'fusca',
    name: 'Fusca 1974 Baja Reformado',
    tag: 'O VALENTE DA TERRA',
    desc: 'Motor boxer refrigerado a ar sobre o eixo de tração traseiro. Excelente tração em barro e alta tolerância a solavancos.',
    ability: 'Suspensão Baja: 50% de resistência extra contra buracos e erosões.',
    width: 38,
    height: 62,
    maxSpeed: 105,
    accel: 0.22,
    brake: 0.32,
    handling: 3.8,
    mudTraction: 0.82, // Ótima tração
    durability: 135,
    fuelEfficiency: 0.95,
    color: '#e67e22',
    accentColor: '#2c3e50',
    draw: function(ctx, x, y, width, height, isBraking, isBoosting) {
      ctx.save();
      ctx.translate(x, y);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(2, 3, width/2 + 1, height/2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Paralamas Arredondados do Fusca Baja
      ctx.fillStyle = '#2c3e50';
      // Dianteiros
      ctx.fillRect(-width/2 - 1, -height/2 + 10, 6, 16);
      ctx.fillRect(width/2 - 5, -height/2 + 10, 6, 16);
      // Traseiros
      ctx.fillRect(-width/2 - 2, height/2 - 26, 7, 18);
      ctx.fillRect(width/2 - 5, height/2 - 26, 7, 18);

      // Carroceria Curvada Laranja / Amarelo Ocre
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.ellipse(0, 0, width/2 - 2, height/2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9e2a0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vidros arredondados
      ctx.fillStyle = '#1e272e';
      // Dianteiro
      ctx.beginPath();
      ctx.ellipse(0, -height/2 + 16, width/2 - 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Traseiro
      ctx.beginPath();
      ctx.ellipse(0, height/2 - 16, width/2 - 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Teto Solar / Ragtop
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-width/2 + 9, -height/2 + 22, width - 18, 18);

      // Grade do Motor Traseiro (Boxer)
      ctx.fillStyle = '#2c3e50';
      for (let i = height/2 - 8; i <= height/2 - 2; i += 3) {
        ctx.fillRect(-6, i, 12, 1.5);
      }

      // Quebra-Mato Dianteiro Tubular
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-width/2 + 6, -height/2 + 3);
      ctx.lineTo(width/2 - 6, -height/2 + 3);
      ctx.stroke();

      // Faróis redondos
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-width/2 + 8, -height/2 + 6, 3.5, 0, Math.PI * 2);
      ctx.arc(width/2 - 8, -height/2 + 6, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Lanternas
      ctx.fillStyle = isBraking ? '#ff0000' : '#c0392b';
      ctx.fillRect(-width/2 + 5, height/2 - 4, 4, 3);
      ctx.fillRect(width/2 - 9, height/2 - 4, 4, 3);

      ctx.restore();
    }
  },

  camionete: {
    id: 'camionete',
    name: 'Camionete D20 / Hilux Raiz',
    tag: 'FORÇA BRUTA 4X4',
    desc: 'Robusta, espaçosa e com caçamba reforçada. Tanque grande e tração bruta nas quatro rodas para enfrentar qualquer trecho.',
    ability: 'Força Bruta: Alta resistência e pneus off-road para lamaçal denso.',
    width: 42,
    height: 74,
    maxSpeed: 120,
    accel: 0.25,
    brake: 0.30,
    handling: 3.2,
    mudTraction: 0.88,
    durability: 160,
    fuelEfficiency: 0.75,
    color: '#2980b9',
    accentColor: '#bdc3c7',
    draw: function(ctx, x, y, width, height, isBraking, isBoosting) {
      ctx.save();
      ctx.translate(x, y);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 3, -height/2 + 3, width, height, 6);
      ctx.fill();

      // Pneus Lameiros Saltados
      ctx.fillStyle = '#111';
      ctx.fillRect(-width/2 - 2, -height/2 + 10, 5, 16);
      ctx.fillRect(width/2 - 3, -height/2 + 10, 5, 16);
      ctx.fillRect(-width/2 - 2, height/2 - 24, 5, 16);
      ctx.fillRect(width/2 - 3, height/2 - 24, 5, 16);

      // Carroceria Cabine Dupla Azul Petróleo
      ctx.fillStyle = '#2471a3';
      ctx.beginPath();
      ctx.roundRect(-width/2, -height/2, width, height, 5);
      ctx.fill();
      ctx.strokeStyle = '#1b4f72';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Capô e Santo Antônio
      ctx.fillStyle = '#1f618d';
      ctx.fillRect(-width/2 + 4, -height/2 + 4, width - 8, 18);

      // Para-brisa
      ctx.fillStyle = '#1c2833';
      ctx.fillRect(-width/2 + 5, -height/2 + 20, width - 10, 10);

      // Teto da Cabine
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(-width/2 + 4, -height/2 + 28, width - 8, 16);

      // Caçamba com Carga / Mudas
      ctx.fillStyle = '#1a3628';
      ctx.fillRect(-width/2 + 4, height/2 - 26, width - 8, 22);
      ctx.strokeStyle = '#2c3e50';
      ctx.strokeRect(-width/2 + 4, height/2 - 26, width - 8, 22);

      // Mudas verdes na caçamba
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(-6, height/2 - 15, 4, 0, Math.PI * 2);
      ctx.arc(4, height/2 - 17, 5, 0, Math.PI * 2);
      ctx.arc(-1, height/2 - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Santo Antônio Cromado
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-width/2 + 6, height/2 - 28, width - 12, 4);

      // Faróis
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-width/2 + 3, -height/2 + 1, 9, 3);
      ctx.fillRect(width/2 - 12, -height/2 + 1, 9, 3);

      // Lanternas
      ctx.fillStyle = isBraking ? '#ff0000' : '#c0392b';
      ctx.fillRect(-width/2 + 3, height/2 - 3, 7, 3);
      ctx.fillRect(width/2 - 10, height/2 - 3, 7, 3);

      ctx.restore();
    }
  },

  jeep: {
    id: 'jeep',
    name: 'Jeep Willys 1960 4x4',
    tag: 'O REI DA LAMA',
    desc: 'O veterano indomável da Amazônia. Tração 4x4 com marcha reduzida que atravessa qualquer atoleiro sem perder o controle.',
    ability: 'Imunidade ao Barro: Redução de velocidade quase nula nos atoleiros densos.',
    width: 40,
    height: 60,
    maxSpeed: 92,
    accel: 0.24,
    brake: 0.36,
    handling: 4.0,
    mudTraction: 0.96, // Quase imune à lama
    durability: 170,
    fuelEfficiency: 0.80,
    color: '#27ae60',
    accentColor: '#d35400',
    draw: function(ctx, x, y, width, height, isBraking, isBoosting) {
      ctx.save();
      ctx.translate(x, y);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 2, -height/2 + 3, width, height, 4);
      ctx.fill();

      // Pneus largos Off-Road
      ctx.fillStyle = '#111';
      ctx.fillRect(-width/2 - 3, -height/2 + 6, 6, 15);
      ctx.fillRect(width/2 - 3, -height/2 + 6, 6, 15);
      ctx.fillRect(-width/2 - 3, height/2 - 20, 6, 15);
      ctx.fillRect(width/2 - 3, height/2 - 20, 6, 15);

      // Carroceria Verde Militar
      ctx.fillStyle = '#1e8449';
      ctx.beginPath();
      ctx.roundRect(-width/2, -height/2, width, height, 3);
      ctx.fill();
      ctx.strokeStyle = '#145a32';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Capô Clássico Estreito Willys
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-width/2 + 7, -height/2 + 2, width - 14, 18);

      // Grade com fendas verticais
      ctx.fillStyle = '#145a32';
      for (let gx = -width/2 + 10; gx <= width/2 - 12; gx += 4) {
        ctx.fillRect(gx, -height/2 + 2, 2, 4);
      }

      // Para-brisa Dobrável
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-width/2 + 5, -height/2 + 20, width - 10, 5);

      // Habitáculo Aberto com Santo Antônio / Gaiola
      ctx.fillStyle = '#145a32';
      ctx.fillRect(-width/2 + 5, -height/2 + 26, width - 10, 22);

      // Bancos e Volante
      ctx.fillStyle = '#78281f';
      ctx.fillRect(-width/2 + 8, -height/2 + 30, 9, 8);
      ctx.fillRect(width/2 - 17, -height/2 + 30, 9, 8);

      // Gaiola Tubular
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width/2 + 6, -height/2 + 27, width - 12, 20);

      // Estepe Traseiro
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(0, height/2 - 1, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Faróis redondos
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-width/2 + 6, -height/2 + 4, 3, 0, Math.PI * 2);
      ctx.arc(width/2 - 6, -height/2 + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Lanternas
      ctx.fillStyle = isBraking ? '#ff0000' : '#c0392b';
      ctx.fillRect(-width/2 + 2, height/2 - 3, 4, 3);
      ctx.fillRect(width/2 - 6, height/2 - 3, 4, 3);

      ctx.restore();
    }
  },

  caminhao: {
    id: 'caminhao',
    name: 'Caminhão MB 1113 Trucado',
    tag: 'O GIGANTE DA ESTRADA',
    desc: 'O lendário caminhão Mercedes-Benz que abriu a Transamazônica. Chassi super resistente, rodagem dupla e buzina a ar potente.',
    ability: 'Casco Pesado & Buzina a Ar: Destrói pequenos obstáculos e afasta animais a longa distância.',
    width: 48,
    height: 94,
    maxSpeed: 102,
    accel: 0.18,
    brake: 0.28,
    handling: 2.7,
    mudTraction: 0.85,
    durability: 230, // Gigante
    fuelEfficiency: 0.70,
    color: '#c0392b',
    accentColor: '#f39c12',
    draw: function(ctx, x, y, width, height, isBraking, isBoosting) {
      ctx.save();
      ctx.translate(x, y);

      // Sombra alongada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 4, -height/2 + 4, width, height, 6);
      ctx.fill();

      // Rodagem Dupla Traseira (Trucado) e Dianteira
      ctx.fillStyle = '#111';
      // Dianteiras
      ctx.fillRect(-width/2 - 3, -height/2 + 14, 5, 18);
      ctx.fillRect(width/2 - 2, -height/2 + 14, 5, 18);
      // Trucado 1
      ctx.fillRect(-width/2 - 4, height/2 - 40, 6, 16);
      ctx.fillRect(width/2 - 2, height/2 - 40, 6, 16);
      // Trucado 2
      ctx.fillRect(-width/2 - 4, height/2 - 20, 6, 16);
      ctx.fillRect(width/2 - 2, height/2 - 20, 6, 16);

      // Carroceria / Madeira da Caçamba (Traseira)
      ctx.fillStyle = '#8e44ad';
      // Madeira marrom / azul clássico
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-width/2 + 2, -height/2 + 36, width - 4, height - 40);
      ctx.strokeStyle = '#3e2713';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width/2 + 2, -height/2 + 36, width - 4, height - 40);

      // Réguas de madeira da carroceria
      ctx.strokeStyle = '#8d5524';
      ctx.lineWidth = 1;
      for (let ypos = -height/2 + 44; ypos < height/2 - 6; ypos += 8) {
        ctx.beginPath();
        ctx.moveTo(-width/2 + 4, ypos);
        ctx.lineTo(width/2 - 4, ypos);
        ctx.stroke();
      }

      // Carga de Sacarias / Mudas Amazônicas
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-width/2 + 8, -height/2 + 42, width - 16, 20);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-width/2 + 10, height/2 - 30, width - 20, 18);

      // Cabine Clássica Bicuda MB 1113 Vermelha / Azul
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 3, -height/2, width - 6, 38, 6);
      ctx.fill();
      ctx.strokeStyle = '#962d22';
      ctx.stroke();

      // Capô dianteiro arredondado com Estrela MB
      ctx.fillStyle = '#a93226';
      ctx.beginPath();
      ctx.roundRect(-width/2 + 10, -height/2, width - 20, 16, 4);
      ctx.fill();

      // Friso cromado do capô
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-2, -height/2 + 2, 4, 12);

      // Para-brisa bipartido
      ctx.fillStyle = '#1c2833';
      ctx.fillRect(-width/2 + 7, -height/2 + 16, (width - 16) / 2 - 1, 8);
      ctx.fillRect(1, -height/2 + 16, (width - 16) / 2 - 1, 8);

      // Teto da Cabine com Buzinas Marítimas
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-width/2 + 6, -height/2 + 24, width - 12, 10);

      // Buzinas a Ar no Teto
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(-10, -height/2 + 26, 4, 7);
      ctx.fillRect(6, -height/2 + 26, 4, 7);

      // Quebra-Sol Verde
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-width/2 + 6, -height/2 + 14, width - 12, 2);

      // Faróis redondos potentes
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-width/2 + 8, -height/2 + 3, 4, 0, Math.PI * 2);
      ctx.arc(width/2 - 8, -height/2 + 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Lanternas
      ctx.fillStyle = isBraking ? '#ff0000' : '#c0392b';
      ctx.fillRect(-width/2 + 4, height/2 - 4, 8, 3);
      ctx.fillRect(width/2 - 12, height/2 - 4, 8, 3);

      ctx.restore();
    }
  }
};

window.VEHICLES = VEHICLES;
