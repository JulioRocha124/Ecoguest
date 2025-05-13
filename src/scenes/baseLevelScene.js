class BaseLevelScene extends Phaser.Scene {
  constructor(key, levelNumber) {
    super({ key });
    this.levelNumber = levelNumber;
    this.contactTimers = new Map(); // Para rastrear tiempos de contacto con cada enemigo
    this.damageThreshold = 700; // 0.7 segundos en milisegundos
  }

  preload() {
    this.load.image('background', '../src/assets/fondo.png');
    this.load.image('background2', '../src/assets/fondo2.png')
    this.load.image('background3', '../src/assets/fondo3.png')
    this.load.image('player', '../src/assets/jugador.png');
    this.load.image('trash', '../src/assets/basura.png');
    this.load.image('Cplayer', '../src/assets/Cusuario.png');
    this.load.image('Cenemy', '../src/assets/Cenemigo.png');
    this.load.image('enemy', '../src/assets/Enemy.png');
  }

  create() {
    gameState.enemies.forEach(enemy => enemy.destroy());
    gameState.enemies = [];
    
    
    this.resetGameState();
    this.setupBackground();
    this.createPlayer();
    this.createTrashItems(gameConfig.levels[this.levelNumber].trashCount);
    this.createEnemies();
    this.setupControls();
    this.createCounters();
    this.createLivesHUD();
    this.setupResizeHandler();
    this.createPauseMenu();
    this.setupPauseKey();
    this.updateBackground();

    // Colisiones
    this.physics.add.overlap(
    gameState.player, 
    gameState.enemies, 
    this.startContactTimer, 
    null, 
    this
  );
    this.physics.add.overlap(gameState.player, gameState.trashItems, collectTrash, null, this);
  }

  resetGameState() {
    gameState.trashCollected = 0;
    gameState.gameOver = false;
    gameState.trashItems = [];
    gameState.currentLevel = this.levelNumber;
    gameState.lives = 3;
    gameState.isInvulnerable = false;
  }

  createPauseMenu() {
    // Crear el menú de pausa (inicialmente invisible)
    this.pauseMenu = this.add.container();
    
    // Fondo semitransparente
    const bg = this.add.rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
    ).setInteractive();
    
    // Texto "PAUSA"
    const pauseText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 100,
        'PAUSA',
        {
            font: '64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);
    
    // Botón de continuar
    const continueButton = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'Continuar',
        {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#74ff33',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => this.togglePause());
    
    // Botón de volver al menú
    const menuButton = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 80,
        'Volver al Menú',
        {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#ff3333',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => {
        this.scene.stop();
        this.scene.start('MenuScene');
    });
    
    this.pauseMenu.add([bg, pauseText, continueButton, menuButton]);
    this.pauseMenu.setVisible(false);
}

setupPauseKey() {
    // Configurar la tecla ESC para pausar
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    this.pauseKey.on('down', () => {
        if (!gameState.gameOver) {
            this.togglePause();
        }
    });
}

togglePause() {
    if (gameState.gameOver) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        // Pausar el juego
        this.physics.pause();
        this.pauseMenu.setVisible(true);
        this.tweens.pauseAll();
        
        // Limpiar temporizadores de contacto al pausar
        this.contactTimers.forEach((value, enemy) => {
            enemy.clearTint();
        });
        this.contactTimers.clear();
    } else {
        // Reanudar el juego
        this.physics.resume();
        this.pauseMenu.setVisible(false);
        this.tweens.resumeAll();
    }
}
setupBackground() {
  // Crear los fondos en capas (solo el primero visible inicialmente)
  this.backgrounds = [
      this.add.image(0, 0, 'background').setOrigin(0, 0),
      this.add.image(0, 0, 'background2').setOrigin(0, 0),
      this.add.image(0, 0, 'background3').setOrigin(0, 0)
  ];
  
  // Escalar todos los fondos
  this.backgrounds.forEach(bg => {
      bg.setScale(
          game.scale.width / bg.width,
          game.scale.height / bg.height
      );
      bg.setVisible(false);
  });
  
  // Mostrar solo el primer fondo
  this.backgrounds[0].setVisible(true);
  this.currentBackground = 0;
}

updateBackground() {
  const trashPercentage = gameState.trashCollected / gameConfig.levels[this.levelNumber].trashCount;

  if (trashPercentage > 0.5 && this.currentBackground === 0) {
    // Cambiar al segundo fondo cuando se recolecta más del 50%
    this.backgrounds[0].setVisible(false);
    this.backgrounds[1].setVisible(true);
    this.currentBackground = 1;

    // Efecto visual de transición
    this.cameras.main.flash(500, 200, 230, 200);
  }
  else if (trashPercentage > 0.9 && this.currentBackground === 1) {
    this.backgrounds[1].setVisible(false);
    this.backgrounds[2].setVisible(true);
    this.currentBackground = 2;

    // Efecto visual de transición
    this.cameras.main.flash(500, 100, 255, 100);
  }
}

  createPlayer() {
    gameState.player = this.physics.add.sprite(
      (100 / gameConfig.originalWidth) * game.scale.width,
      (560 / gameConfig.originalHeight) * game.scale.height,
      'player'
    ).setScale((game.scale.width / gameConfig.originalWidth) * 0.45);
    
    gameState.player.setCollideWorldBounds(true);
    gameState.player.body.setSize(200, 350, 15, 50);
  }

  createEnemies() {
    const baseCount = 2;
    const extraEnemies = gameState.currentLevel - 1;
    const totalEnemies = baseCount + extraEnemies;
    
    for (let i = 0; i < totalEnemies; i++) {
      const x = Phaser.Math.Between(100, this.scale.width - 100);
      const y = Phaser.Math.Between(100, this.scale.height - 100);
      
      const enemy = this.physics.add.sprite(x, y, 'enemy')
        .setScale(0.20)
        .setCollideWorldBounds(true)
        .setBounce(1);
      
      enemy.setVelocity(
        Phaser.Math.Between(-150, 150),
        Phaser.Math.Between(-150, 150)
      );
      
      gameState.enemies.push(enemy);
    }
  }

  createTrashItems(count) {
    const trashScale = (game.scale.width / gameConfig.originalWidth) * 0.15;
    
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, game.scale.width - 100);
      const y = Phaser.Math.Between(100, game.scale.height - 100);
      
      const trash = this.physics.add.sprite(x, y, 'trash')
        .setScale(trashScale);
      
      gameState.trashItems.push(trash);
    }
  }

  setupControls() {
    gameState.cursors = this.input.keyboard.createCursorKeys();
  }

  createLivesHUD() {
    gameState.livesContainer = this.add.container(640, 30);
    
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(60 * i, 0, 'Cplayer')
        .setScale(0.1)
        .setScrollFactor(0)
        .setVisible(i < gameState.lives); // Solo mostrar corazones activos
      gameState.livesContainer.add(heart);
    }
  }

  createCounters() {
    gameState.trashCounterText = this.add.text(20, 20, 'Basura recogida: 0', {
      font: '24px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    gameState.levelCounterText = this.add.text(1130, 20, `Nivel actual: ${this.levelNumber}`, {
      font: '24px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
        this.backgrounds.forEach(bg => {
            bg.setScale(
                game.scale.width / bg.width,
                game.scale.height / bg.height
            );
        });
        
        // Reposicionar otros elementos si es necesario
        scaleAndReposition(this);
    });
}

update() {
  if (gameState.gameOver || gameState.isPaused) return;

  // Verificar contactos prolongados
  const currentTime = this.time.now;
  this.contactTimers.forEach((startTime, enemy) => {
    const contactDuration = currentTime - startTime;
    
    if (contactDuration >= this.damageThreshold) {
      // Aplicar daño después de 0.7 segundos
      this.applyDamage(gameState.player, enemy); // Usar gameState.player en lugar de player
      this.contactTimers.delete(enemy);
    } else if (!this.physics.overlap(gameState.player, enemy)) { // Usar gameState.player aquí también
      // Si ya no están en contacto, eliminar el temporizador
      enemy.clearTint();
      this.contactTimers.delete(enemy);
    }
  });
  
  gameState.player.setVelocity(0);

  // Movimiento horizontal
  if (gameState.cursors.left.isDown) {
    gameState.player.setVelocityX(-200);
    gameState.player.setFlipX(true);
  } 
  else if (gameState.cursors.right.isDown) {
    gameState.player.setVelocityX(200);
    gameState.player.setFlipX(false);
  }

  // Movimiento vertical
  if (gameState.cursors.up.isDown) {
    gameState.player.setVelocityY(-200);
  } 
  else if (gameState.cursors.down.isDown) {
    gameState.player.setVelocityY(200);
  }

  // Movimiento diagonal (combinación de teclas)
  if (gameState.cursors.left.isDown && gameState.cursors.up.isDown) {
    gameState.player.setVelocityX(-180);
    gameState.player.setVelocityY(-180);
  }
  if (gameState.cursors.right.isDown && gameState.cursors.up.isDown) {
    gameState.player.setVelocityX(180);
    gameState.player.setVelocityY(-180);
  }
  if (gameState.cursors.left.isDown && gameState.cursors.down.isDown) {
    gameState.player.setVelocityX(-180);
    gameState.player.setVelocityY(180);
  }
  if (gameState.cursors.right.isDown && gameState.cursors.down.isDown) {
    gameState.player.setVelocityX(180);
    gameState.player.setVelocityY(180);
  }

  

  // Efecto de invulnerabilidad
  if (gameState.isInvulnerable) {
    gameState.player.alpha = Math.floor(this.time.now / 100) % 2 === 0 ? 0.5 : 1;
  } else {
    gameState.player.alpha = 1;
  }
}

applyDamage(player, enemy) {
    if (gameState.isInvulnerable || gameState.gameOver || gameState.isPaused) return;

    // Lógica de daño
    gameState.lives--;
    if (gameState.livesContainer.getAt(gameState.lives)) {
        gameState.livesContainer.getAt(gameState.lives).setVisible(false);
    }
    
    // Efectos visuales
    this.cameras.main.shake(200, 0.01);
    player.setTint(0xff0000);
    enemy.setTint(0xff0000);
    
    // Limpiar el temporizador de este enemigo
    this.contactTimers.delete(enemy);
    
    // Temporizador para quitar el tinte
    this.time.delayedCall(200, () => {
        player.clearTint();
        enemy.clearTint();
    });

    // Invulnerabilidad temporal
    gameState.isInvulnerable = true;
    this.time.delayedCall(gameState.invulnerabilityTime, () => {
        gameState.isInvulnerable = false;
    });

    if (gameState.lives <= 0) {
        this.gameOver();
    }
}


hitByEnemy(player, enemy) {

}
  
  gameOver() {
    gameState.gameOver = true;
    
    gameState.enemies.forEach(enemy => enemy.setVelocity(0));
    
    const gameOverText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      '¡Game Over!',
      {
        font: '48px Arial',
        fill: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5);
    
    const restartText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 50,
      'Reintentar',
      {
        font: '32px Arial',
        fill: '#ffffff',
        backgroundColor: '#ff3333',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => {
      this.scene.restart();
      gameState.lives = 3;
    });
    
    this.tweens.add({
      targets: gameOverText,
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.out'
    });
  }

startContactTimer(player, enemy) {
    // No registrar contacto si el juego está pausado
    if (gameState.isPaused) return;
    
    // Si ya está en contacto con este enemigo, no hacer nada
    if (this.contactTimers.has(enemy)) return;

    // Registrar el momento inicial de contacto
    this.contactTimers.set(enemy, this.time.now);
    
    // Efecto visual de inicio de contacto
    enemy.setTint(0xffaaaa);
}


  freezeGameObjects() {
    // Congelar al jugador
    if (gameState.player && gameState.player.body) {
      gameState.player.setVelocity(0);
      gameState.player.body.enable = false; // Desactivar físicas
      gameState.player.setTint(0x00ff00); // Opcional: efecto visual
    }
  
    // Congelar todos los enemigos
    gameState.enemies.forEach(enemy => {
      if (enemy && enemy.body) {
        enemy.setVelocity(0);
        enemy.body.enable = false;
      }
    });
  
    // Desactivar controles
    gameState.gameOver = true; // Esto evitará que el update procese movimientos
  }
}

