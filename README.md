# 🏁 Rally Transamazônica: Grande Corrida BR-230

> **Jogo 2D Web de Corrida Competitiva e Rally Ecológico na Maior Floresta Tropical do Mundo.**  
> Desenvolvido para o **Desafio Final de Programação Web • Missão Amazônia Criativa**.

---

## 📝 Mini-Apresentação para Entrega do Desafio

> **"Rally Transamazônica: Grande Corrida BR-230"** coloca o jogador em uma disputa acirrada de rally lado a lado contra os outros grandes clássicos automotivos brasileiros pilotados por inteligência artificial (Uno Mille com escada, Fusca Baja, Camionete D20, Jeep Willys e Caminhão Mercedes-Benz 1113). Com largada em grid, semáforo dinâmico e posições em tempo real (1º ao 5º lugar), a corrida desafia o piloto a usar o vácuo aerodinâmico (slipstream) e a dominar os terrenos traiçoeiros da floresta — onde atoleiros densos de barro vermelho desaceleram os carros menos preparados, mas abrem caminho para veículos 4x4 virarem o jogo. Aliando a adrenalina da competição com a consciência ecológica, o jogo premia o motorista que coleta mudas de castanheira e utiliza a buzina para proteger a fauna nativa (capivaras, antas, jacarés e preguiças) sem causar colisões, conquistando o topo do pódio na Base Amazônica de Altamira em HTML5 Canvas, CSS3 e JavaScript puro.

---

## 🚗 Garagem de Veículos e Atributos

| Veículo | Categoria | Habilidade Especial |
| :--- | :--- | :--- |
| 🚗 **Uno Mille com Escada** | O Lendário | **Modo Firma**: Super Nitro com chama ao pressionar Espaço! |
| 🚙 **Fusca Baja 1974** | O Valente | **Suspensão Reforçada**: 50% de resistência extra a crateras. |
| 🛻 **Camionete D20 Raiz** | Força Bruta | **Tração 4x4**: Estabilidade pesada e caçamba de carga. |
| 🚜 **Jeep Willys 1960** | Rei da Lama | **Reduzida Willys**: Imunidade quase total a atoleiros de barro. |
| 🚛 **Caminhão MB 1113** | Gigante da BR | **Buzina a Ar & Casco**: Esmaga troncos e afasta animais de longe. |

---

## 🎮 Controles

### Teclado (Desktop)
- **⬆️ / W**: Acelerar
- **⬇️ / S**: Freio / Marcha Ré
- **⬅️ ➡️ / A D**: Controlar Direção (Volante)
- **ESPAÇO**: Buzina / Habilidade Especial (Nitro do Uno Mille)
- **P / ESC**: Pausar a Expedição

### Toque / Touchscreen (Mobile e Tablet)
- Botões virtuais na tela para aceleração, frenagem, direção e botão de buzina/habilidade.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: Estrutura acessível com `<header>`, `<main>`, `<canvas>`, `<section>` e `<footer>`.
- **CSS3 Moderno**: Efeitos visuais temáticos, layout responsivo para smartphones e desktops, HUD translúcido com glassmorphism e animações.
- **JavaScript Puro (ES6+)**: Física de vetores e atrito, sistema de partículas, geração procedural infinita, detecção de colisões AABB/radial e persistência de High Scores com `localStorage`.
- **Web Audio API**: Sintetizador procedural em tempo real para sons de motor dinâmico por RPM, buzinas temáticas, atoleiro, chuva, trovões e vitórias sem dependência de bibliotecas ou arquivos externos.

---

## 🚀 Como Publicar o Jogo Online (Deploy)

### Opção 1: GitHub Pages (Gratuito e Rápido)
1. Crie um repositório no seu GitHub (ex: `expedicao-transamazonica`).
2. Faça o upload de todos os arquivos da pasta do projeto (`index.html`, `style.css`, pasta `js/` e `README.md`).
3. Vá em **Settings** > **Pages** no seu repositório.
4. Em **Branch**, selecione `main` (ou `master`) e clique em **Save**.
5. Em poucos segundos, o GitHub fornecerá o link público (ex: `https://seu-usuario.github.io/expedicao-transamazonica/`).

### Opção 2: Itch.io (Plataforma de Jogos)
1. Compacte os arquivos do projeto em um arquivo `.zip` (o arquivo `index.html` deve estar na raiz do zip).
2. Acesse [itch.io](https://itch.io) e crie uma conta.
3. Clique em **Create new project**.
4. Em **Kind of project**, selecione **HTML** (Playable in browser).
5. Faça o upload do arquivo `.zip` e marque a opção **"This file will be played in the browser"**.
6. Salve e publique como **Public**!

---

## 🏆 Critérios de Avaliação Atendidos

- [x] **Conexão Temática (2,0 pts)**: Fauna amazônica protegida, barro vermelho da BR-230, clima de temporal e bioma florestal.
- [x] **Mecânica & Lógica JS (3,5 pts)**: Física fluida, 5 veículos únicos, detecção precisa de colisões, pontuação em tempo real e reinício instantâneo.
- [x] **Visual & UX CSS (2,0 pts)**: Identidade visual marcante, paleta verde/barro, HUD com velocímetro digital e responsividade total.
- [x] **Código Limpo (1,5 pts)**: Modularizado (`audio.js`, `vehicles.js`, `obstacles.js`, `game.js`), legível e documentado.
- [x] **Deploy Pronto (1,0 pt)**: Estrutura 100% estática pronta para GitHub Pages e Itch.io.
