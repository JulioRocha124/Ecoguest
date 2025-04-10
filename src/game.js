// Configuración global del juego
const gameConfig = {
  originalWidth: 1366,
  originalHeight: 768,
  levels: {
    1: { trashCount: 10, nextLevel: 2 },
    2: { trashCount: 15, nextLevel: 3 },
    3: { trashCount: 20, nextLevel: null }
  }
};

// Estado global del juego
const gameState = {
  player: null,
  trashItems: [],
  trashCollected: 0,
  trashCounterText: null,
  levelCounterText: null,
  restartButton: null,
  gameOver: false,
  cursors: null,
  currentLevel: 1,
  lives: 3,
  enemies: [],
  isInvulnerable: false,
  invulnerabilityTime: 1000
};

// Inicialización del juego
const config = {
  type: Phaser.AUTO,
  width: gameConfig.originalWidth,
  height: gameConfig.originalHeight,
  parent: "game-container",
  physics: {
    default: 'arcade',
    arcade: { 
      gravity: { y: 0 },
      debug: true
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, Level1Scene, Level2Scene, Level3Scene]
};

const game = new Phaser.Game(config);

// Funciones de utilidad
function collectTrash(player, trash) {
  if (gameState.gameOver) return;

  trash.disableBody(true, true);
  gameState.trashCollected++;
  gameState.trashCounterText.setText(`Basura recogida: ${gameState.trashCollected}`);

  if (gameState.trashCollected === gameState.trashItems.length) {
    completeLevel.call(this);
  }
}

function completeLevel() {
  gameState.gameOver = true;
  
  const victoryMessage = this.add.text(
    game.scale.width / 2, 
    game.scale.height / 2 - 50, 
    gameState.currentLevel < 3 ? 
      '¡Felicidades!\nCompletaste el nivel' : 
      '¡Felicidades!\nCompletaste el juego',
    {
      font: '48px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }
  ).setOrigin(0.5);

  if (gameState.currentLevel < 3) {
    this.time.delayedCall(3000, () => {
      gameState.currentLevel++;
      this.scene.start(`Level${gameState.currentLevel}Scene`);
    });
  } else {
    showRestartButton.call(this);
  }
}

function showRestartButton() {
  gameState.restartButton = this.add.text(
    game.scale.width / 2, 
    game.scale.height / 1.5, 
    'Reintentar', 
    {
      font: '32px Arial',
      fill: '#ffffff',
      backgroundColor: '#ff3333',
      padding: { x: 20, y: 10 }
    }
  ).setOrigin(0.5)
  .setInteractive()
  .on('pointerdown', () => location.reload());
}

function scaleAndReposition(fondo) {
  const newScaleX = game.scale.width / fondo.width;
  const newScaleY = game.scale.height / fondo.height;
  fondo.setScale(newScaleX, newScaleY);

  gameState.player.setPosition(
    (100 / gameConfig.originalWidth) * game.scale.width,
    (560 / gameConfig.originalHeight) * game.scale.height
  );

  gameState.trashItems.forEach((trash) => {
    trash.setPosition(
      Phaser.Math.Between(100, game.scale.width - 100),
      Phaser.Math.Between(100, game.scale.height - 100)
    );
  });
}