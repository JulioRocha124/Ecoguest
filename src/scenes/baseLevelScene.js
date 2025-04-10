class BaseLevelScene extends Phaser.Scene {
  constructor(key, levelNumber) {
    super({ key });
    this.levelNumber = levelNumber;
  }

  preload() {
    this.load.image('background', '../srcassets/fondo.png');
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

    // Colisiones
    this.physics.add.overlap(gameState.player, gameState.enemies, this.hitByEnemy, null, this);
    this.physics.add.overlap(gameState.player, gameState.trashItems, collectTrash, null, this);
  }

  resetGameState() {
    gameState.trashCollected = 0;
    gameState.gameOver = false;
    gameState.trashItems = [];
    gameState.currentLevel = this.levelNumber;
  }

  setupBackground() {
    this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    this.background.setScale(
      game.scale.width / this.background.width,
      game.scale.height / this.background.height
    );
  }

  createPlayer() {
    gameState.player = this.physics.add.sprite(
      (100 / gameConfig.originalWidth) * game.scale.width,
      (560 / gameConfig.originalHeight) * game.scale.height,
      'player'
    ).setScale((game.scale.width / gameConfig.originalWidth) * 0.5);
    
    gameState.player.setCollideWorldBounds(true);
    gameState.player.body.setSize(30, 50, 15, 10);
  }

  createEnemies() {
    const baseCount = 2;
    const extraEnemies = gameState.currentLevel - 1;
    const totalEnemies = baseCount + extraEnemies;
    
    for (let i = 0; i < totalEnemies; i++) {
      const x = Phaser.Math.Between(100, this.scale.width - 100);
      const y = Phaser.Math.Between(100, this.scale.height - 100);
      
      const enemy = this.physics.add.sprite(x, y, 'enemy')
        .setScale(0.25)
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
        .setScrollFactor(0);
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
    window.addEventListener('resize', () => scaleAndReposition(this.background));
  }

  update() {
    if (gameState.gameOver) return;

    gameState.player.setVelocity(0);

    if (gameState.cursors.left.isDown) {
      gameState.player.setVelocityX(-200);
    } else if (gameState.cursors.right.isDown) {
      gameState.player.setVelocityX(200);
    }

    if (gameState.cursors.up.isDown) {
      gameState.player.setVelocityY(-200);
    } else if (gameState.cursors.down.isDown) {
      gameState.player.setVelocityY(200);
    }

    // Efecto de invulnerabilidad
    if (gameState.isInvulnerable) {
      gameState.player.alpha = Math.floor(this.time.now / 100) % 2 === 0 ? 0.5 : 1;
    } else {
      gameState.player.alpha = 1;
    }
  }

  hitByEnemy(player, enemy) {
    if (gameState.isInvulnerable) return;
    
    gameState.lives--;
    gameState.livesContainer.getAt(gameState.lives).setVisible(false);
    
    this.cameras.main.shake(200, 0.01);
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => player.clearTint());
    
    gameState.isInvulnerable = true;
    this.time.delayedCall(gameState.invulnerabilityTime, () => {
      gameState.isInvulnerable = false;
    });
    
    if (gameState.lives <= 0) {
      this.gameOver();
    }
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
}