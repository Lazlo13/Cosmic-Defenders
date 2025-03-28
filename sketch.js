let gameState = 'start';
let level = 1;
let maxLevel = 20; // Extended max level
let playerX, playerY;
let playerSpeed = 5;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let stars = [];
let powerUps = [];
let score = 0;
let lives = 3;
let lastShot = 0;
let shotInterval = 10; // Frames between shots
let enemySpawnInterval = 60; // Frames between enemy spawns
let boss = null;
let isBossLevel = false;
let isBonus = false;
let shipType = 'fighter';
let availableShips = ['fighter', 'scout', 'destroyer'];
let shipStats = {
  fighter: { speed: 5, fireRate: 10, damage: 1 },
  scout: { speed: 7, fireRate: 7, damage: 0.7 },
  destroyer: { speed: 3, fireRate: 15, damage: 1.5 }
};
let activePowerUps = { doubleShot: false, shield: false, rapidFire: false };
let powerUpDuration = { doubleShot: 0, shield: 0, rapidFire: 0 };
let gameOverMessages = [
  "You just got space'd!",
  "That's what happens when you skip space pilot school!",
  "The galaxy will remember your... um... attempt!",
  "Your ship is now a very expensive paperweight!",
  "Max Evans sends his regards!",
  "Maybe try knitting instead?",
  "Pro tip: Avoid the enemy bullets next time!",
  "Game over, insert more quarters... oh wait, it's not 1985 anymore.",
  "Your high score will be forgotten by tomorrow.",
  "At least you tried... sort of."
];
let levelTransitionTimer = 0;
let levelTransitionDuration = 30; // Shorter transition between levels (half a second at 60fps)
let bossNames = [
  "Max Evans: The Void Crusher",
  "Max Evans: Galaxy Devourer",
  "Max Evans: Star Eater",
  "Max Evans: Cosmic Horror"
];
let selectedGameOverMessage = "";
let collectedStars = 0;
let gamePaused = false;
let levelPopupTimer = 0;
let levelPopupDuration = 120; // 2 seconds at 60fps
let levelMessages = [
  "Entering hostile territory!",
  "Reinforcements incoming!",
  "Enemy forces detected!",
  "Danger level increasing!",
  "Brace yourself, pilot!",
  "The battle intensifies!",
  "Hold on tight!",
  "Enemy fleet approaching!",
  "This is getting serious!",
  "You're doing great, keep it up!"
];
let selectedLevelMessage = "";
let bonusLevelChance = 0.38; // 38% chance
let bonusLevelTimer = 0;
let bonusLevelDuration = 1200; // 20 seconds at 60fps
let previousGameState = {};
let pointsPerLevel = 1600; // Points needed to advance a level
let lastScoreCheck = 0; // Last score checked for level advancement
let cameraShake = 0; // For camera shake effect when taking damage

// Font variables
let titleFont, bodyFont;

// Colors
let colors = {
  background: [10, 20, 50],
  player: [100, 180, 255],
  playerAccent: [50, 100, 200],
  enemy: [200, 50, 50],
  enemyAccent: [255, 100, 100],
  boss: [255, 100, 0],
  bossAccent: [255, 200, 0],
  bullet: [255, 200, 50],
  enemyBullet: [0, 255, 100],
  bossBullet: [255, 50, 200], // New color for boss bullets
  particles: [255, 100, 50],
  powerUps: {
    doubleShot: [50, 200, 255],
    shield: [100, 100, 255],
    rapidFire: [255, 255, 0]
  },
  ui: [255, 255, 255],
  uiAccent: [100, 200, 255],
  uiHighlight: [255, 200, 100]
};

// Sound variables
let shootSound, explosionSound, powerUpSound, bossExplosionSound, gameOverSound, victorySound, levelCompleteSound, bgMusic;
let soundsLoaded = true; // Set to true by default to avoid loading issues
let soundsEnabled = false; // Disabled by default to prevent errors

function preload() {
  // Leave empty to prevent issues
}

function playSound(sound) {
  // Simplified sound handling that doesn't actually play sounds,
  // but keeps the game logic intact without errors
  // if you enable sounds, it just returns without doing anything
}

function setup() {
  // Create a responsive canvas that's not entirely fullscreen
  let canvasWidth = min(windowWidth * 0.9, 1200);
  let canvasHeight = min(windowHeight * 0.9, 800);
  createCanvas(canvasWidth, canvasHeight);
  
  playerX = width / 2;
  playerY = height - 50;
  resetStars();
  
  // Set default fonts
  textFont('Orbitron');
  
  // Try to load sounds after setup
  try {
    loadGameSounds();
  } catch (e) {
    console.error("Could not load sounds:", e);
  }
  
  // Select a random game over message
  selectedGameOverMessage = random(gameOverMessages);
}

function resetStars() {
  stars = [];
  // Create parallax star layers
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(0.5, 3),
      speed: map(random(), 0, 1, 0.5, 2)
    });
  }
}

function draw() {
  // Set background with gradient
  setGradientBackground();
  
  // Apply camera shake if active
  if (cameraShake > 0) {
    translate(random(-cameraShake, cameraShake), random(-cameraShake, cameraShake));
    cameraShake *= 0.9; // Reduce shake intensity over time
    if (cameraShake < 0.5) cameraShake = 0;
  }
  
  // Check for auto level advancement based on score
  if (gameState === 'playing' && !gamePaused && !isBossLevel && !isBonus) {
    let scoreThreshold = (level * pointsPerLevel);
    if (score >= scoreThreshold && score > lastScoreCheck) {
      lastScoreCheck = score;
      levelComplete();
    }
  }
  
  switch(gameState) {
    case 'start': 
      drawStartScreen();
      break;
    case 'shipSelect':
      drawShipSelection();
      break;
    case 'playing':
      if (!gamePaused) {
        updateGame();
      }
      drawGame();
      if (gamePaused) {
        drawPauseOverlay();
      }
      break;
    case 'levelComplete':
      drawLevelComplete();
      break;
    case 'gameover':
      drawGameOver();
      break;
    case 'victory':
      drawVictoryScreen();
      break;
    case 'bonusLevel':
      if (!gamePaused) {
        updateBonusLevel();
      }
      drawBonusLevel();
      if (gamePaused) {
        drawPauseOverlay();
      }
      break;
  }
}

function drawPauseOverlay() {
  // Semi-transparent overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Pause text
  textAlign(CENTER);
  textSize(60);
  textStyle(BOLD);
  fill(255);
  text('GAME PAUSED', width/2, height/2 - 50);
  
  textSize(24);
  textStyle(NORMAL);
  text('Click the pause button to resume', width/2, height/2 + 30);
}

function setGradientBackground() {
  // Create a deep space gradient background
  let c1 = color(5, 10, 30); // Dark blue at top
  let c2 = color(20, 30, 80); // Slightly lighter blue at bottom
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
  
  // Nebula effect (random colored clouds in background)
  noStroke();
  for (let i = 0; i < 5; i++) {
    let nebX = sin(frameCount * 0.001 + i) * width/2 + width/2;
    let nebY = cos(frameCount * 0.002 + i) * height/3 + height/2;
    
    fill(100 + i*30, 50, 150, 5);
    for (let j = 0; j < 10; j++) {
      ellipse(nebX, nebY, 300 + j*20, 200 + j*20);
    }
  }
  
  // Draw stars with parallax effect
  for (let star of stars) {
    let flickerAmount = noise(star.x, star.y, frameCount * 0.01) * 50;
    fill(255, 255, 255, map(star.speed, 0.5, 2, 150, 255) + flickerAmount);
    noStroke();
    ellipse(star.x, star.y, star.size, star.size);
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  }
}

function drawStartScreen() {
  push();
  
  // Credits at top with cleaner style
  textAlign(CENTER);
  textSize(26);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 100, 0);
  fill(colors.uiHighlight);
  text('GAME CODED AND BUILT BY Lazlo S. (LazzieTazz)', width/2, 60);
  drawingContext.shadowBlur = 0;
  
  // Title with dramatic effect
  let titleY = height/2 - 60;
  
  // Animated space warp effect behind title
  noStroke();
  for (let i = 0; i < 10; i++) {
    let size = 300 + i * 40 + sin(frameCount * 0.05) * 20;
    let alpha = map(i, 0, 10, 150, 0);
    fill(100, 150, 255, alpha);
    ellipse(width/2, titleY + 20, size, size/3);
  }
  
  // Title text with enhanced glow
  textAlign(CENTER);
  textSize(72);
  textStyle(BOLD);
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = color(0, 150, 255);
  
  // Animated title
  fill(200, 220, 255);
  text('COSMIC DEFENDER', width/2, titleY);
  drawingContext.shadowBlur = 0;
  
  // Subtitle with pulsing effect
  textSize(32);
  textStyle(NORMAL);
  fill(150, 200, 255, 200 + sin(frameCount * 0.05) * 55);
  text('An Epic Space Adventure', width/2, titleY + 60);
  
  // Instructions with cleaner font
  textSize(24);
  fill(200, 200, 200, 220);
  text('Use arrow keys to move, space to shoot', width/2, height/2 + 100);
  
  // Modern start button with larger size
  let buttonY = height/2 + 170;
  let buttonWidth = 320;
  let buttonHeight = 80;
  let buttonPulse = sin(frameCount * 0.05) * 5;
  
  // Button glow
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(0, 150, 255);
  
  // Button background with gradient and pulsing
  let buttonGlow = map(sin(frameCount * 0.05), -1, 1, 0, 40);
  
  // Draw button background
  noFill();
  stroke(colors.uiAccent[0], colors.uiAccent[1], colors.uiAccent[2], 200);
  strokeWeight(3);
  rect(width/2 - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 15);
  
  // Button inner glow
  noStroke();
  fill(colors.uiAccent[0], colors.uiAccent[1], colors.uiAccent[2], 50 + buttonGlow);
  rect(width/2 - buttonWidth/2 + 5, buttonY - buttonHeight/2 + 5, buttonWidth - 10, buttonHeight - 10, 10);
  
  // Button text
  fill(255);
  textStyle(BOLD);
  textSize(28);
  text('PRESS S TO START', width/2, buttonY + 10);
  drawingContext.shadowBlur = 0;
  
  // Sound toggle button with better design
  let soundBtnX = width - 50;
  let soundBtnY = height - 50;
  
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(0, 100, 200);
  
  // Button base
  stroke(colors.uiAccent);
  strokeWeight(2);
  fill(50, 100, 180, 150);
  ellipse(soundBtnX, soundBtnY, 60, 60);
  
  // Sound status with better styling
  noStroke();
  fill(255);
  textSize(14);
  textStyle(NORMAL);
  text(soundsEnabled ? 'SOUND ON' : 'SOUND OFF', soundBtnX, soundBtnY + 30);
  
  // Sound icon
  stroke(255);
  strokeWeight(2);
  if (soundsEnabled) {
    // Speaker icon
    noFill();
    rect(soundBtnX - 10, soundBtnY - 8, 8, 16, 2);
    triangle(soundBtnX - 10, soundBtnY, soundBtnX - 18, soundBtnY - 10, soundBtnX - 18, soundBtnY + 10);
    
    // Sound waves
    noFill();
    arc(soundBtnX + 6, soundBtnY, 18, 18, -QUARTER_PI, QUARTER_PI);
    arc(soundBtnX + 8, soundBtnY, 28, 28, -QUARTER_PI, QUARTER_PI);
  } else {
    // Muted speaker
    noFill();
    rect(soundBtnX - 10, soundBtnY - 8, 8, 16, 2);
    triangle(soundBtnX - 10, soundBtnY, soundBtnX - 18, soundBtnY - 10, soundBtnX - 18, soundBtnY + 10);
    
    // X over speaker
    line(soundBtnX + 2, soundBtnY - 10, soundBtnX + 12, soundBtnY + 10);
    line(soundBtnX + 12, soundBtnY - 10, soundBtnX + 2, soundBtnY + 10);
  }
  
  drawingContext.shadowBlur = 0;
  
  // Animated ship flying across screen
  let shipX = (frameCount * 3) % (width + 200) - 100;
  drawShip(shipX, height/2 + 250, 'fighter');
  
  pop();
}

function drawShipSelection() {
  push();
  // Background panel for ship selection
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(0, 100, 200);
  noStroke();
  fill(20, 40, 80, 200);
  rect(width/2 - 500, height/2 - 250, 1000, 500, 20);
  drawingContext.shadowBlur = 0;
  
  // Header
  textAlign(CENTER);
  textSize(42);
  textStyle(BOLD);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(0, 100, 200);
  fill(colors.uiAccent);
  text('SELECT YOUR SHIP', width/2, height/2 - 190);
  drawingContext.shadowBlur = 0;
  
  // Display ship options in a centered layout with more spacing
  for (let i = 0; i < availableShips.length; i++) {
    let shipX = width/2 + (i - 1) * 280; // More horizontal spacing
    let shipY = height/2 - 50; // Move ships up to create more vertical space
    let ship = availableShips[i];
    
    // Highlight selected ship with a fancy glow
    if (ship === shipType) {
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = color(colors.player);
      stroke(colors.player);
      strokeWeight(2);
      fill(colors.player[0], colors.player[1], colors.player[2], 40);
      rect(shipX - 120, shipY - 80, 240, 250, 15);
      drawingContext.shadowBlur = 0;
    }
    
    // Ship name with style
    fill(ship === shipType ? colors.uiHighlight : colors.ui);
    textStyle(BOLD);
    textSize(30);
    text(ship.toUpperCase(), shipX, shipY - 50);
    
    // Draw ship preview (larger)
    push();
    scale(1.3);
    drawShip(shipX/1.3, shipY/1.3, ship);
    pop();
    
    // Ship stats with improved UI and more spacing
    textSize(18);
    textStyle(NORMAL);
    let statsY = shipY + 80; // More vertical space below ship
    let statsSpacing = 35; // Increased spacing between stats
    
    // Speed stat with bar visualization
    text('SPEED', shipX, statsY);
    drawStatBar(shipX - 70, statsY + 10, 140, 12, shipStats[ship].speed / 10);
    
    // Fire rate stat with bar visualization
    text('FIRE RATE', shipX, statsY + statsSpacing);
    drawStatBar(shipX - 70, statsY + statsSpacing + 10, 140, 12, (20 - shipStats[ship].fireRate) / 20);
    
    // Damage stat with bar visualization
    text('DAMAGE', shipX, statsY + statsSpacing * 2);
    drawStatBar(shipX - 70, statsY + statsSpacing * 2 + 10, 140, 12, shipStats[ship].damage / 2);
  }
  
  // Instruction text with pulsing effect
  let alpha = map(sin(frameCount * 0.05), -1, 1, 180, 255);
  fill(255, 255, 255, alpha);
  textSize(26);
  text('USE ARROW KEYS TO SELECT', width/2, height/2 + 180);
  
  textSize(26);
  text('PRESS ENTER TO CONFIRM', width/2, height/2 + 220);
  pop();
}

// Helper function to draw stat bars
function drawStatBar(x, y, width, height, fillAmount) {
  // Bar background
  noStroke();
  fill(50);
  rect(x, y, width, height, height/2);
  
  // Bar fill with gradient
  let barColor = color(colors.uiAccent);
  fill(barColor);
  rect(x, y, width * fillAmount, height, height/2);
}

function updateGame() {
  // Update player position based on keyboard input (arrow keys and WASD)
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or A
    playerX = max(playerX - shipStats[shipType].speed, 20);
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or D
    playerX = min(playerX + shipStats[shipType].speed, width - 20);
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up arrow or W
    playerY = max(playerY - shipStats[shipType].speed, 20);
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down arrow or S
    playerY = min(playerY + shipStats[shipType].speed, height - 20);
  }
  
  // Player shooting with space
  if (keyIsDown(32) && frameCount > lastShot + shipStats[shipType].fireRate) {
    // Calculate fire rate with power-up
    let currentFireRate = shipStats[shipType].fireRate;
    if (activePowerUps.rapidFire) {
      currentFireRate = currentFireRate / 2;
    }
    
    if (frameCount > lastShot + currentFireRate) {
      lastShot = frameCount;
      
      // Add bullet
      bullets.push({x: playerX, y: playerY - 20, damage: shipStats[shipType].damage});
      playSound(shootSound);
      
      // Double shot power-up
      if (activePowerUps.doubleShot) {
        bullets.push({x: playerX - 15, y: playerY - 15, damage: shipStats[shipType].damage});
        bullets.push({x: playerX + 15, y: playerY - 15, damage: shipStats[shipType].damage});
      }
    }
  }
  
  // Update game elements
  updateBullets();
  updateEnemies();
  updatePowerUps();
  updateParticles();
  
  // Spawn enemies at intervals
  if (frameCount % enemySpawnInterval === 0 && !isBossLevel) {
    spawnEnemy();
  }
  
  // Check for auto level advancement based on score
  if (!isBossLevel && !isBonus) {
    let scoreThreshold = level * pointsPerLevel;
    if (score >= scoreThreshold && score > lastScoreCheck) {
      lastScoreCheck = score;
      levelComplete();
    }
  }
}

function drawGame() {
  // Draw all game elements
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawParticles();
  drawPlayer();
  drawUI();
}

function drawLevelComplete() {
  push();
  
  // Dark overlay
  fill(10, 20, 50, 150);
  rect(0, 0, width, height);
  
  // Credits with consistent style
  textAlign(CENTER);
  textSize(26);
  textStyle(NORMAL);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 100, 0);
  fill(colors.uiHighlight);
  text('GAME CODED AND BUILT BY LazzieTazz', width/2, 60);
  drawingContext.shadowBlur = 0;
  
  // Level complete message
  textAlign(CENTER);
  textSize(48);
  textStyle(BOLD);
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = color(0, 200, 255);
  fill(colors.uiAccent);
  text('LEVEL ' + level + ' COMPLETE!', width/2, height/2 - 40);
  drawingContext.shadowBlur = 0;
  
  // Next level info
  textSize(28);
  textStyle(NORMAL);
  fill(colors.ui);
  
  // Automatically transition to next level
  levelTransitionTimer--;
  if (levelTransitionTimer <= 0) {
    advanceToNextLevel();
  }
  
  // Countdown visualization
  let countdownPercent = levelTransitionTimer / levelTransitionDuration;
  textSize(24);
  if (level < maxLevel) {
    text('Get ready for level ' + (level + 1), width/2, height/2 + 20);
    
    // Draw countdown bar
    let barWidth = 300;
    let barHeight = 10;
    
    // Bar background
    noStroke();
    fill(50);
    rect(width/2 - barWidth/2, height/2 + 60, barWidth, barHeight, barHeight/2);
    
    // Bar fill
    fill(colors.uiAccent);
    rect(width/2 - barWidth/2, height/2 + 60, barWidth * countdownPercent, barHeight, barHeight/2);
    
    // Show skip option
    fill(255, 255, 255, 200);
    textSize(18);
    text('PRESS ENTER TO SKIP', width/2, height/2 + 100);
  } else {
    text('Congratulations! You\'ve completed the game!', width/2, height/2 + 20);
    
    // Progress bar for final level
    let barWidth = 300;
    let barHeight = 10;
    
    // Bar background
    noStroke();
    fill(50);
    rect(width/2 - barWidth/2, height/2 + 60, barWidth, barHeight, barHeight/2);
    
    // Bar fill
    fill(colors.uiAccent);
    rect(width/2 - barWidth/2, height/2 + 60, barWidth * countdownPercent, barHeight, barHeight/2);
    
    textSize(18);
    text('PRESS ENTER TO CONTINUE', width/2, height/2 + 100);
  }
  pop();
}

function advanceToNextLevel() {
  level++;
  
  // Every 5th level is a boss level
  if (level % 5 === 0) {
    isBossLevel = true;
  } else {
    isBossLevel = false;
    
    // Check for bonus level - every 2nd level has a chance
    if (level % 2 === 0 && random() < bonusLevelChance && !isBonus) {
      startBonusLevel();
      return;
    }
  }
  
  // Reset entities but keep score and lives
  enemies = [];
  bullets = [];
  enemyBullets = [];
  powerUps = [];
  particles = [];
  boss = null;
  
  // Give a bonus life at certain levels
  if (level % 5 === 0 && lives < 5) {
    lives++;
  }
  
  // Select a level message and start the popup
  selectedLevelMessage = random(levelMessages);
  levelPopupTimer = levelPopupDuration;
  
  // Add a star for each level completed
  collectedStars++;
  
  gameState = 'playing';
}

function startBonusLevel() {
  // Save current game state
  previousGameState = {
    enemies: enemies.slice(),
    bullets: bullets.slice(),
    enemyBullets: enemyBullets.slice(),
    powerUps: powerUps.slice(),
    isBossLevel: isBossLevel
  };
  
  // Reset entities for bonus level
  enemies = [];
  bullets = [];
  enemyBullets = [];
  powerUps = [];
  
  // Set bonus level flags
  isBonus = true;
  bonusLevelTimer = bonusLevelDuration;
  
  // Display bonus level message
  selectedLevelMessage = "BONUS LEVEL! Destroy all enemies for extra stars!";
  levelPopupTimer = levelPopupDuration;
  
  gameState = 'bonusLevel';
}

function endBonusLevel() {
  // Restore game state
  isBonus = false;
  enemies = previousGameState.enemies;
  bullets = previousGameState.bullets;
  enemyBullets = previousGameState.enemyBullets;
  powerUps = previousGameState.powerUps;
  isBossLevel = previousGameState.isBossLevel;
  
  // Return to normal gameplay
  gameState = 'playing';
}

function updateBonusLevel() {
  // Update bonus level timer
  bonusLevelTimer--;
  
  if (bonusLevelTimer <= 0) {
    endBonusLevel();
    return;
  }
  
  // Similar to updateGame but with different enemy patterns
  // Player movement
  let currentSpeed = shipStats[shipType].speed;
  if (activePowerUps.rapidFire) currentSpeed *= 1.2;
  
  if (keyIsDown(LEFT_ARROW)) playerX -= currentSpeed;
  if (keyIsDown(RIGHT_ARROW)) playerX += currentSpeed;
  if (keyIsDown(UP_ARROW)) playerY -= currentSpeed * 0.7;
  if (keyIsDown(DOWN_ARROW)) playerY += currentSpeed * 0.7;
  
  // Constrain player to screen
  playerX = constrain(playerX, 20, width - 20);
  playerY = constrain(playerY, height/2, height - 20);

  // Player shooting
  let fireRate = shipStats[shipType].fireRate;
  if (activePowerUps.rapidFire) fireRate = max(3, fireRate * 0.5);
  
  if (keyIsDown(32) && frameCount - lastShot > fireRate) {
    if (activePowerUps.doubleShot) {
      bullets.push({x: playerX - 10, y: playerY - 15, damage: shipStats[shipType].damage});
      bullets.push({x: playerX + 10, y: playerY - 15, damage: shipStats[shipType].damage});
    } else {
      bullets.push({x: playerX, y: playerY - 15, damage: shipStats[shipType].damage});
    }
    lastShot = frameCount;
    playSound(shootSound);
  }

  // Update power-up timers
  for (let power in powerUpDuration) {
    if (powerUpDuration[power] > 0) {
      powerUpDuration[power]--;
      if (powerUpDuration[power] <= 0) {
        activePowerUps[power] = false;
      }
    }
  }

  // Spawn bonus level enemies in special patterns
  if (frameCount % 90 === 0 && enemies.length < 20) {
    spawnBonusEnemy();
  }

  // Update and check collisions for game objects
  updateBullets();
  updateBonusEnemies();
  updatePowerUps();
  updateParticles();
  
  // Check if bonus level is complete (all enemies destroyed)
  if (enemies.length === 0 && bonusLevelTimer > bonusLevelDuration / 2) {
    // Award extra stars for quick completion
    collectedStars += 3;
    endBonusLevel();
  }
}

function drawBonusLevel() {
  // Draw all game elements with special effects for bonus level
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 200, 0);
  
  // Draw all game elements
  drawBullets();
  drawEnemies();
  drawPowerUps();
  drawParticles();
  drawPlayer();
  drawUI();
  
  drawingContext.shadowBlur = 0;
}

function spawnBonusEnemy() {
  // Different spawn patterns for bonus level
  let patterns = ['circle', 'spiral', 'wave', 'grid'];
  let pattern = random(patterns);
  
  // Bonus enemies move in special patterns
  switch(pattern) {
    case 'circle':
      // Spawn enemies in a circle formation
      let centerX = width/2;
      let centerY = height/3;
      let radius = 150;
      
      for (let i = 0; i < 8; i++) {
        let angle = TWO_PI * i / 8;
        spawnSpecialEnemy(
          centerX + cos(angle) * radius,
          centerY + sin(angle) * radius,
          'circle',
          centerX,
          centerY,
          angle,
          radius
        );
      }
      break;
      
    case 'spiral':
      // Spawn enemies that move in a spiral
      let spiralCount = 5;
      let spiralStartAngle = random(TWO_PI);
      
      for (let i = 0; i < spiralCount; i++) {
        let angle = spiralStartAngle + i * (TWO_PI / spiralCount);
        let dist = 50 + i * 30;
        spawnSpecialEnemy(
          width/2 + cos(angle) * dist,
          height/3 + sin(angle) * dist,
          'spiral',
          0, 0, angle, dist
        );
      }
      break;
      
    case 'wave':
      // Spawn enemies in a wave pattern
      let waveCount = 8;
      
      for (let i = 0; i < waveCount; i++) {
        let x = width * (i / (waveCount - 1));
        spawnSpecialEnemy(
          x,
          100,
          'wave',
          0, 0, 0, 0
        );
      }
      break;
      
    case 'grid':
      // Spawn enemies in a grid
      let gridSize = 3;
      let spacing = 80;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          spawnSpecialEnemy(
            width/3 + i * spacing,
            height/6 + j * spacing,
            'grid',
            i, j, 0, 0
          );
        }
      }
      break;
  }
}

function spawnSpecialEnemy(x, y, pattern, centerX, centerY, angle, radius) {
  let enemy = {
    x: x,
    y: y,
    size: 30,
    health: 1,
    points: 25,
    pattern: pattern,
    centerX: centerX,
    centerY: centerY,
    angle: angle,
    radius: radius,
    speed: 2,
    fireRate: 120,
    type: 'bonus'
  };
  
  enemies.push(enemy);
}

function updateBonusEnemies() {
  // Update specialized enemy movements for bonus level
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    // Special movement patterns
    switch (enemy.pattern) {
      case 'circle':
        // Move in a circle
        enemy.angle += 0.02;
        enemy.x = enemy.centerX + cos(enemy.angle) * enemy.radius;
        enemy.y = enemy.centerY + sin(enemy.angle) * enemy.radius;
        break;
        
      case 'spiral':
        // Spiral movement
        enemy.angle += 0.03;
        enemy.radius -= 0.5;
        enemy.x = width/2 + cos(enemy.angle) * enemy.radius;
        enemy.y = height/3 + sin(enemy.angle) * enemy.radius;
        
        // Remove if spiral is complete
        if (enemy.radius < 30) {
          enemies.splice(i, 1);
          continue;
        }
        break;
        
      case 'wave':
        // Wave pattern
        enemy.y += enemy.speed;
        enemy.x += sin(frameCount * 0.1) * 3;
        
        // Remove if off screen
        if (enemy.y > height) {
          enemies.splice(i, 1);
          continue;
        }
        break;
        
      case 'grid':
        // Grid with subtle movements
        enemy.x += sin(frameCount * 0.05 + enemy.centerX) * 2;
        enemy.y += cos(frameCount * 0.05 + enemy.centerY) * 2;
        break;
    }
    
    // Occasional shooting
    if (frameCount % enemy.fireRate === 0 && random() < 0.2) {
      let angle = atan2(playerY - enemy.y, playerX - enemy.x);
      enemyBullets.push({
        x: enemy.x, 
        y: enemy.y, 
        vx: cos(angle) * 4,
        vy: sin(angle) * 4,
        speed: 0,
        type: 'bonus'
      });
    }
    
    // Check collision with player
    if (dist(enemy.x, enemy.y, playerX, playerY) < (enemy.size + 20) / 2) {
      if (!activePowerUps.shield) {
        lives--;
        // Trigger camera shake effect
        cameraShake = 15;
        createExplosion(playerX, playerY, 10, colors.player);
        playSound(explosionSound);
        if (lives <= 0) {
          gameState = 'gameover';
          playSound(gameOverSound);
          if (bgMusic.isPlaying()) {
            bgMusic.stop();
          }
        }
      }
      createExplosion(enemy.x, enemy.y, 15, [255, 200, 0]);
      enemies.splice(i, 1);
    }
  }
}

function drawGameOver() {
  push();
  // Dark overlay with radial gradient
  background(10, 15, 35, 200);
  
  // Explosion effect
  drawingContext.shadowBlur = 0;
  for (let i = 0; i < 3; i++) {
    let size = 400 + i * 100;
    let alpha = map(i, 0, 3, 100, 0);
    fill(200, 50, 20, alpha);
    ellipse(width/2, height/2, size, size);
  }
  
  // Credits at top
  textAlign(CENTER);
  textSize(26);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 100, 0);
  fill(colors.uiHighlight);
  text('GAME CODED AND BUILT BY Lazlo S. (LazzieTazz)', width/2, 60);
  drawingContext.shadowBlur = 0;
  
  textAlign(CENTER);
  
  // Game over text with intense glow
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = color(255, 0, 0);
  textSize(80);
  textStyle(BOLD);
  fill(255, 50, 50);
  text('GAME OVER', width/2, height/2 - 80);
  drawingContext.shadowBlur = 0;
  
  // Funny message
  textSize(28);
  textStyle(ITALIC);
  fill(255, 200, 100);
  text(selectedGameOverMessage, width/2, height/2 - 10);
  
  // Score
  textStyle(NORMAL);
  textSize(32);
  fill(colors.ui);
  text('FINAL SCORE: ' + score, width/2, height/2 + 60);
  
  // Restart button with larger size
  let buttonPulse = sin(frameCount * 0.05) * 5;
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(50, 100, 200);
  
  // Button with improved design
  noFill();
  stroke(colors.uiAccent);
  strokeWeight(3);
  rect(width/2 - 180, height/2 + 110, 360, 80, 15);
  
  // Button glow
  noStroke();
  fill(colors.player[0], colors.player[1], colors.player[2], 80);
  rect(width/2 - 175, height/2 + 115, 350, 70, 12);
  
  fill(255);
  textSize(28);
  text('PRESS R TO RESTART', width/2, height/2 + 150);
  
  drawingContext.shadowBlur = 0;
  pop();
}

function drawVictoryScreen() {
  push();
  // Space background with special effects
  background(20, 40, 80);
  
  // Credits at top
  textAlign(CENTER);
  textSize(32);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(255, 100, 0);
  fill(255, 200, 100);
  text('GAME CODED AND BUILT BY Lazlo S. (LazzieTazz)', width/2, 60);
  drawingContext.shadowBlur = 0;
  
  // Victory light beams
  for (let i = 0; i < 8; i++) {
    let angle = i * PI/4;
    let beamLength = 1000 + sin(frameCount * 0.02 + i) * 200;
    let alpha = 100 + sin(frameCount * 0.03 + i) * 50;
    
    stroke(200, 220, 255, alpha);
    strokeWeight(20);
    line(width/2, height/2, 
         width/2 + cos(angle + frameCount * 0.005) * beamLength, 
         height/2 + sin(angle + frameCount * 0.005) * beamLength);
  }
  
  // Stars collected display
  textAlign(CENTER);
  textSize(24);
  fill(255, 255, 150);
  text('STARS COLLECTED: ' + collectedStars, width/2, height/2 + 130);
  
  // Display stars
  let starSize = 30;
  let starSpacing = 40;
  let totalWidth = collectedStars * starSpacing;
  let startX = width/2 - totalWidth/2 + starSize/2;
  
  for (let i = 0; i < collectedStars; i++) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 255, 0);
    fill(255, 255, 0);
    drawStar(startX + i * starSpacing, height/2 + 160, 15, 30, 5);
  }
  
  // Victory stars animation
  noStroke();
  for (let i = 0; i < 5; i++) {
    let t = frameCount * 0.01 + i;
    let x = width/2 + cos(t) * 200;
    let y = height/2 + sin(t * 1.5) * 150;
    
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = color(255, 255, 100);
    fill(255, 255, 100);
    drawStar(x, y, 20, 40, 5);
    drawingContext.shadowBlur = 0;
  }
  
  // Victory text with glow
  textAlign(CENTER);
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = color(100, 200, 255);
  textSize(80);
  fill(100, 200, 255);
  text('VICTORY!', width/2, height/2 - 60);
  drawingContext.shadowBlur = 0;
  
  // Message
  textSize(36);
  fill(colors.ui);
  text('You have saved the galaxy!', width/2, height/2 + 20);
  
  // Score
  textSize(28);
  text('FINAL SCORE: ' + score, width/2, height/2 + 80);
  
  // Play again button with larger size
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(50, 100, 200);
  
  // Button with improved design
  noFill();
  stroke(colors.uiAccent);
  strokeWeight(3);
  rect(width/2 - 180, height/2 + 200, 360, 80, 15);
  
  // Button glow
  noStroke();
  fill(colors.player[0], colors.player[1], colors.player[2], 80);
  rect(width/2 - 175, height/2 + 205, 350, 70, 12);
  
  fill(255);
  textSize(28);
  text('PRESS R TO PLAY AGAIN', width/2, height/2 + 240);
  
  drawingContext.shadowBlur = 0;
  pop();
}

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function levelComplete() {
  if (level < maxLevel) {
    levelTransitionTimer = levelTransitionDuration;
    gameState = 'levelComplete';
    playSound(levelCompleteSound);
  } else {
    gameState = 'victory';
    playSound(victorySound);
    if (bgMusic.isPlaying()) {
      bgMusic.stop();
    }
  }
}

function keyPressed() {
  // Start screen
  if (gameState === 'start' && key === 's') {
    gameState = 'shipSelect';
    playSound(powerUpSound);
  } 
  // Ship selection
  else if (gameState === 'shipSelect') {
    // Navigate through ship types
    if (keyCode === LEFT_ARROW) {
      let index = availableShips.indexOf(shipType);
      index = (index - 1 + availableShips.length) % availableShips.length;
      shipType = availableShips[index];
      playSound(shootSound);
    } else if (keyCode === RIGHT_ARROW) {
      let index = availableShips.indexOf(shipType);
      index = (index + 1) % availableShips.length;
      shipType = availableShips[index];
      playSound(shootSound);
    } else if (keyCode === ENTER) {
      resetGame();
      gameState = 'playing';
      playSound(powerUpSound);
    }
  } 
  // Level complete - allow skipping the countdown
  else if (gameState === 'levelComplete' && keyCode === ENTER) {
    advanceToNextLevel();
  } 
  // Game over or victory
  else if ((gameState === 'gameover' || gameState === 'victory') && key === 'r') {
    level = 1;
    resetGame();
    gameState = 'shipSelect';
    playSound(powerUpSound);
    // Choose a new funny game over message
    selectedGameOverMessage = random(gameOverMessages);
  }
}

function resetGame() {
  playerX = width / 2;
  playerY = height - 50;
  bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  powerUps = [];
  boss = null;
  score = 0;
  lives = 3;
  isBossLevel = false;
  isBonus = false;
  level = 1;
  collectedStars = 0;
  cameraShake = 0;
  lastScoreCheck = 0;
  
  // Reset power-ups
  for (let power in activePowerUps) {
    activePowerUps[power] = false;
    powerUpDuration[power] = 0;
  }
  
  resetStars();
}

// Player ship sprite
function drawShip(x, y, type) {
  push();
  translate(x, y);
  
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(colors.player);
  
  switch(type) {
    case 'fighter':
      // Main body
      fill(colors.player);
      beginShape();
      vertex(0, -20);
      vertex(-15, 0);
      vertex(-10, 10);
      vertex(10, 10);
      vertex(15, 0);
      endShape(CLOSE);
      
      // Wings
      fill(colors.playerAccent);
      beginShape();
      vertex(-15, 0);
      vertex(-25, 15);
      vertex(-10, 10);
      endShape(CLOSE);
      
      beginShape();
      vertex(15, 0);
      vertex(25, 15);
      vertex(10, 10);
      endShape(CLOSE);
      
      // Cockpit
      fill(200, 230, 255, 200);
      ellipse(0, -5, 10, 15);
      break;
      
    case 'scout':
      // Main body - sleek and fast
      fill(colors.player);
      beginShape();
      vertex(0, -25);
      vertex(-10, 5);
      vertex(-5, 15);
      vertex(5, 15);
      vertex(10, 5);
      endShape(CLOSE);
      
      // Small wings
      fill(colors.playerAccent);
      beginShape();
      vertex(-10, 5);
      vertex(-20, 10);
      vertex(-5, 15);
      endShape(CLOSE);
      
      beginShape();
      vertex(10, 5);
      vertex(20, 10);
      vertex(5, 15);
      endShape(CLOSE);
      
      // Cockpit
      fill(200, 230, 255, 200);
      ellipse(0, -8, 8, 12);
      break;
      
    case 'destroyer':
      // Main body - bulky and powerful
      fill(colors.player);
      beginShape();
      vertex(0, -15);
      vertex(-20, -5);
      vertex(-15, 10);
      vertex(15, 10);
      vertex(20, -5);
      endShape(CLOSE);
      
      // Heavy wings
      fill(colors.playerAccent);
      beginShape();
      vertex(-20, -5);
      vertex(-30, 15);
      vertex(-15, 10);
      endShape(CLOSE);
      
      beginShape();
      vertex(20, -5);
      vertex(30, 15);
      vertex(15, 10);
      endShape(CLOSE);
      
      // Twin cannons
      fill(150);
      rect(-12, -5, 5, 10);
      rect(7, -5, 5, 10);
      
      // Reinforced cockpit
      fill(200, 230, 255, 200);
      ellipse(0, -5, 15, 10);
      break;
  }
  
  drawingContext.shadowBlur = 0;
  pop();
}

// Enemy sprite
function drawEnemy(x, y, enemy) {
  push();
  translate(x, y);
  
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(colors.enemy);
  
  switch(enemy.type) {
    case 'basic':
      // Menacing alien face
      fill(colors.enemy);
      ellipse(0, 0, enemy.size, enemy.size);
      
      // Eyes
      fill(255, 255, 0);
      let eyeSize = enemy.size/4;
      ellipse(-enemy.size/4, -enemy.size/5, eyeSize, eyeSize * 0.8);
      ellipse(enemy.size/4, -enemy.size/5, eyeSize, eyeSize * 0.8);
      
      // Evil pupils
      fill(0);
      ellipse(-enemy.size/4, -enemy.size/5, eyeSize/2, eyeSize/2);
      ellipse(enemy.size/4, -enemy.size/5, eyeSize/2, eyeSize/2);
      
      // Jagged teeth mouth
      fill(255);
      beginShape();
      vertex(-enemy.size/3, enemy.size/5);
      vertex(-enemy.size/4, enemy.size/10);
      vertex(-enemy.size/6, enemy.size/5);
      vertex(0, enemy.size/10);
      vertex(enemy.size/6, enemy.size/5);
      vertex(enemy.size/4, enemy.size/10);
      vertex(enemy.size/3, enemy.size/5);
      endShape();
      break;
      
    case 'fast':
      // Sharp, predatory shape
      fill(colors.enemy);
      
      // Spiked shape
      beginShape();
      vertex(0, -enemy.size/1.5);
      vertex(-enemy.size/3, -enemy.size/4);
      vertex(-enemy.size/2, enemy.size/3);
      vertex(-enemy.size/4, 0);
      vertex(-enemy.size/3, enemy.size/2);
      vertex(0, enemy.size/4);
      vertex(enemy.size/3, enemy.size/2);
      vertex(enemy.size/4, 0);
      vertex(enemy.size/2, enemy.size/3);
      vertex(enemy.size/3, -enemy.size/4);
      endShape(CLOSE);
      
      // Glowing eye
      fill(255, 0, 0, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, enemy.size/3, enemy.size/3);
      break;
      
    case 'tank':
      // Heavy, armored nightmare
      fill(colors.enemy);
      rect(-enemy.size/2, -enemy.size/2, enemy.size, enemy.size, 5);
      
      // Armor plates
      fill(colors.enemyAccent);
      rect(-enemy.size/2, -enemy.size/2, enemy.size/3, enemy.size/4, 3);
      rect(enemy.size/6, -enemy.size/2, enemy.size/3, enemy.size/4, 3);
      rect(-enemy.size/2, enemy.size/4, enemy.size/4, enemy.size/4, 3);
      rect(enemy.size/4, enemy.size/4, enemy.size/4, enemy.size/4, 3);
      
      // Menacing eye slits
      fill(255, 0, 0, 150 + sin(frameCount * 0.2) * 50);
      rect(-enemy.size/5, -enemy.size/6, enemy.size/10, enemy.size/3);
      rect(enemy.size/10, -enemy.size/6, enemy.size/10, enemy.size/3);
      break;
      
    case 'zigzag':
      // Chaotic, eldritch horror
      fill(colors.enemy);
      
      // Pulsing, irregular shape
      beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = map(i, 0, 8, 0, TWO_PI);
        let jitter = sin(frameCount * 0.05 + i) * 5;
        let r = enemy.size/2 + jitter;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Strange, alien eyes
      for (let i = 0; i < 3; i++) {
        let angle = map(i, 0, 3, 0, TWO_PI);
        let eyeX = cos(angle) * enemy.size/4;
        let eyeY = sin(angle) * enemy.size/4;
        
        fill(0, 255, 255, 200);
        ellipse(eyeX, eyeY, enemy.size/6, enemy.size/6);
        
        fill(255, 0, 255);
        ellipse(eyeX, eyeY, enemy.size/12, enemy.size/12);
      }
      break;
  }
  
  drawingContext.shadowBlur = 0;
  pop();
}

// Player bullet sprite
function drawBullet(x, y) {
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(255, 0, 0);
  fill(255, 0, 0); // Red
  ellipse(x, y, 5, 5);
  drawingContext.shadowBlur = 0;
}

// Enemy bullet sprite
function drawEnemyBullet(x, y) {
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = color(0, 255, 0);
  fill(0, 255, 0); // Green
  ellipse(x, y, 5, 5);
  drawingContext.shadowBlur = 0;
}

function updateBullets() {
  // Player bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.y -= 10;
    
    // Remove bullet when it goes off screen
    if (bullet.y < -10) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check for collisions with boss
    if (boss && bullet) {
      if (dist(bullet.x, bullet.y, boss.x, boss.y) < boss.size / 2) {
        // Apply damage
        boss.health -= bullet.damage;
        createExplosion(bullet.x, bullet.y, 5, colors.bullet);
        
        // Remove bullet
        bullets.splice(i, 1);
        
        // Check if boss is destroyed
        if (boss.health <= 0) {
          // Add big score
          score += 500;
          
          // Create massive explosion with intense camera shake
          cameraShake = 25; // Stronger shake for boss explosion
          for (let k = 0; k < 3; k++) {
            setTimeout(() => {
              createExplosion(
                boss.x + random(-boss.size/2, boss.size/2), 
                boss.y + random(-boss.size/2, boss.size/2), 
                20, 
                colors.boss
              );
              playSound(explosionSound);
            }, k * 300);
          }
          
          // Remove boss
          boss = null;
          
          // Level complete will be triggered in updateGame
        }
      }
    }
    
    // Check for collisions with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size / 2) {
        // Apply damage
        enemy.health -= bullet.damage;
        createExplosion(bullet.x, bullet.y, 5, colors.bullet);
        
        // Remove bullet
        bullets.splice(i, 1);
        
        // Check if enemy is destroyed
        if (enemy.health <= 0) {
          // Add score based on enemy type
          let enemyScore = enemy.points || 10;
          score += enemyScore;
          
          // Create explosion with very subtle camera shake
          createExplosion(enemy.x, enemy.y, 15, colors.enemy);
          // Very subtle camera shake for regular enemy destruction
          cameraShake = max(cameraShake, 1.5);
          playSound(explosionSound);
          
          // Chance to spawn power-up
          if (random() < 0.1) {
            spawnPowerUp(enemy.x, enemy.y);
          }
          
          // Remove enemy
          enemies.splice(j, 1);
        }
        break;
      }
    }
  }
  
  // Enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    
    // Handle different bullet movement types
    if (bullet.vx !== undefined && bullet.vy !== undefined) {
      // Bullets with velocity vectors (like boss bullets)
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    } else {
      // Regular bullets that just move down
      bullet.y += bullet.speed || 5;
    }
    
    // Remove when off screen
    if (bullet.y > height + 10 || bullet.y < -10 || bullet.x < -10 || bullet.x > width + 10) {
      enemyBullets.splice(i, 1);
      continue;
    }
    
    // Check for collision with player
    if (dist(bullet.x, bullet.y, playerX, playerY) < 20) {
      // Create explosion
      createExplosion(bullet.x, bullet.y, 5, bullet.type === 'boss' ? colors.bossBullet : colors.enemyBullet);
      
      if (!activePowerUps.shield) {
        // Player takes damage
        lives--;
        
        // Trigger camera shake effect - more intense for boss bullets
        if (bullet.type === 'boss') {
          cameraShake = 20; // More intense shake for boss bullets
        } else {
          cameraShake = 15; // Regular shake for normal bullets
        }
        
        createExplosion(playerX, playerY, 10, colors.player);
        playSound(explosionSound);
        
        if (lives <= 0) {
          // Final death has most intense shake
          cameraShake = 30;
          gameState = 'gameover';
          playSound(gameOverSound);
          if (bgMusic.isPlaying()) {
            bgMusic.stop();
          }
          
          // Select a random game over message
          selectedGameOverMessage = random(gameOverMessages);
        }
      }
      
      // Remove bullet
      enemyBullets.splice(i, 1);
    }
  }
}

function updateEnemies() {
  // Spawn new enemies if not a boss level
  if (!isBossLevel && frameCount % (enemySpawnInterval - level * 5) === 0 && enemies.length < 10 + level * 2) {
    spawnEnemy();
  }
  
  // Spawn boss if it's time and it's a boss level
  if (isBossLevel && boss === null) {
    spawnBoss();
  }
  
  // Update boss
  if (boss) {
    boss.x += boss.vx;
    boss.y += boss.vy;
    
    // Boss movement patterns
    if (boss.x < boss.size/2 || boss.x > width - boss.size/2) {
      boss.vx *= -1;
    }
    
    if (boss.y < boss.size/2 || boss.y > height/2) {
      boss.vy *= -1;
    }
    
    // Boss firing patterns based on level
    if (frameCount % boss.fireRate === 0) {
      // Calculate the angle to the player for directed shots
      let angle = atan2(playerY - boss.y, playerX - boss.x);
      
      // Get the boss index to determine attack pattern
      let bossIndex = Math.floor(level / 5) - 1;
      if (bossIndex >= bossNames.length) bossIndex = bossNames.length - 1;
      
      if (bossIndex === 3) { // Final boss - Cosmic Horror
        // Circle of bullets
        for (let i = 0; i < 12; i++) {
          let bulletAngle = TWO_PI * i / 12;
          let mouthAngle = angle + PI; // Opposite direction of player
          let mouthX = cos(mouthAngle) * boss.size/3;
          let mouthY = sin(mouthAngle) * boss.size/3;
          
          enemyBullets.push({
            x: boss.x + mouthX + cos(bulletAngle) * 20, 
            y: boss.y + mouthY + sin(bulletAngle) * 20,
            vx: cos(bulletAngle) * 3,
            vy: sin(bulletAngle) * 3,
            speed: 3,
            type: 'boss',
            homing: false
          });
        }
      } else if (bossIndex === 2) { // Third boss - Energy Devourer
        // Spiral pattern
        for (let i = 0; i < 5; i++) {
          let spreadAngle = angle - 0.4 + (i * 0.2);
          enemyBullets.push({
            x: boss.x, 
            y: boss.y,
            vx: cos(spreadAngle) * 4,
            vy: sin(spreadAngle) * 4,
            speed: 0, // Using vx/vy for movement instead
            type: 'boss',
            homing: false
          });
        }
      } else if (bossIndex === 1) { // Second boss - Star Eater
        // Targeted burst
        for (let i = 0; i < 3; i++) {
          let bulletSpeed = 4 + i;
          enemyBullets.push({
            x: boss.x, 
            y: boss.y + boss.size/8,
            vx: cos(angle) * bulletSpeed,
            vy: sin(angle) * bulletSpeed,
            speed: 0, // Using vx/vy for movement
            type: 'boss',
            homing: false
          });
        }
      } else { // First boss - Void Crusher
        // Triple shot from mouth
        enemyBullets.push({
          x: boss.x - 20, 
          y: boss.y,
          vx: cos(angle - 0.2) * 4,
          vy: sin(angle - 0.2) * 4,
          speed: 0, // Using vx/vy for movement
          type: 'boss',
          homing: false
        });
        enemyBullets.push({
          x: boss.x, 
          y: boss.y,
          vx: cos(angle) * 5,
          vy: sin(angle) * 5,
          speed: 0,
          type: 'boss',
          homing: false
        });
        enemyBullets.push({
          x: boss.x + 20, 
          y: boss.y,
          vx: cos(angle + 0.2) * 4,
          vy: sin(angle + 0.2) * 4,
          speed: 0,
          type: 'boss',
          homing: false
        });
      }
    }
    
    // Spawn minions
    if (frameCount % 180 === 0 && enemies.length < 3) {
      spawnEnemy();
    }
  }
  
  // Update regular enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    // Apply enemy movement
    enemy.x += enemy.vx || 0;
    enemy.y += enemy.vy || enemy.speed;
    
    // Boundary checks
    if (enemy.pattern === 'zigzag') {
      if (enemy.x < 30 || enemy.x > width - 30) {
        enemy.vx *= -1;
      }
    }
    
    // Remove enemies that go off screen
    if (enemy.y > height + 50) {
      enemies.splice(i, 1);
      continue;
    }
    
    // Enemy shooting
    if (frameCount % enemy.fireRate === 0 && random() < 0.3 + level * 0.1) {
      enemyBullets.push({x: enemy.x, y: enemy.y + 15, speed: 3 + level * 0.5, type: 'normal'});
    }
    
    // Check collision with player
    if (dist(enemy.x, enemy.y, playerX, playerY) < (enemy.size + 20) / 2) {
      if (!activePowerUps.shield) {
        lives--;
        // Trigger camera shake effect
        cameraShake = 15;
        createExplosion(playerX, playerY, 10, colors.player);
        playSound(explosionSound);
        if (lives <= 0) {
          gameState = 'gameover';
          playSound(gameOverSound);
          if (bgMusic.isPlaying()) {
            bgMusic.stop();
          }
        }
      }
      createExplosion(enemy.x, enemy.y, 15, colors.enemy);
      enemies.splice(i, 1);
    }
  }
}

function spawnEnemy() {
  let types = ['basic', 'fast', 'tank', 'zigzag'];
  let type = random(types);
  
  let enemy = {
    x: random(50, width - 50),
    y: -50,
    type: type,
    points: 10
  };
  
  // Increase the speed factor based on level (gets faster as game progresses)
  let speedFactor = 1 + (level * 0.1); // 10% faster per level
  
  // Set enemy properties based on type
  switch(type) {
    case 'basic':
      enemy.size = 30;
      enemy.speed = 1 + level * 0.3;
      enemy.health = 1;
      enemy.fireRate = 120;
      break;
    case 'fast':
      enemy.size = 20;
      enemy.speed = 2 + level * 0.4;
      enemy.health = 0.5;
      enemy.fireRate = 180;
      enemy.points = 15;
      break;
    case 'tank':
      enemy.size = 40;
      enemy.speed = 0.5 + level * 0.2;
      enemy.health = 3;
      enemy.fireRate = 100;
      enemy.points = 25;
      break;
    case 'zigzag':
      enemy.size = 25;
      enemy.speed = 1 + level * 0.3;
      enemy.vx = (random() < 0.5 ? -1 : 1) * speedFactor;
      enemy.vy = 1 + level * 0.2;
      enemy.health = 1.5;
      enemy.fireRate = 150;
      enemy.pattern = 'zigzag';
      enemy.points = 20;
      break;
  }
  
  // Apply the speed factor to all enemies
  enemy.speed *= speedFactor;
  
  enemies.push(enemy);
}

function spawnBoss() {
  let bossIndex = Math.floor(level / 5) - 1;
  if (bossIndex >= bossNames.length) bossIndex = bossNames.length - 1;
  
  boss = {
    x: width / 2,
    y: 100,
    size: 100,
    vx: 1,
    vy: 0.5,
    health: 20 + (level * 10),
    maxHealth: 20 + (level * 10),
    fireRate: 60 - level * 5,
    name: bossNames[bossIndex]
  };
}

function updatePowerUps() {
  // Update power-up timers
  for (let power in powerUpDuration) {
    if (powerUpDuration[power] > 0) {
      powerUpDuration[power]--;
      if (powerUpDuration[power] <= 0) {
        activePowerUps[power] = false;
      }
    }
  }
  
  // Update power-ups on screen
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    
    // Move power-up down slowly with a wave motion
    powerUp.y += 1;
    powerUp.x += sin(frameCount * 0.05 + i) * 0.5;
    
    // Remove if off screen
    if (powerUp.y > height) {
      powerUps.splice(i, 1);
      continue;
    }
    
    // Check collision with player
    if (dist(powerUp.x, powerUp.y, playerX, playerY) < 30) {
      activatePowerUp(powerUp.type);
      powerUps.splice(i, 1);
    }
  }
}

function spawnPowerUp(x, y) {
  let types = Object.keys(activePowerUps);
  let type = random(types);
  
  // Only spawn the power-up if its cooldown has expired
  if (powerUpDuration[type] <= 0) {
    powerUps.push({
      x: x,
      y: y,
      type: type
    });
  }
}

function activatePowerUp(type) {
  activePowerUps[type] = true;
  powerUpDuration[type] = 600; // 10 seconds at 60fps
  playSound(powerUpSound);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function createExplosion(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-3, 3),
      vy: random(-3, 3),
      life: random(20, 40),
      color: color
    });
  }
}

function drawBullets() {
  // Draw player bullets
  for (let bullet of bullets) {
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(colors.bullet);
    fill(colors.bullet);
    noStroke();
    ellipse(bullet.x, bullet.y, 6, 10);
  }
  
  // Draw enemy bullets
  for (let bullet of enemyBullets) {
    drawingContext.shadowBlur = 8;
    
    if (bullet.type === 'boss') {
      // Boss bullets are larger and more menacing
      drawingContext.shadowColor = color(colors.bossBullet);
      fill(colors.bossBullet);
      noStroke();
      
      // Draw based on movement direction
      if (bullet.vx !== undefined && bullet.vy !== undefined) {
        push();
        translate(bullet.x, bullet.y);
        rotate(atan2(bullet.vy, bullet.vx));
        
        // Elongated bullet shape
        beginShape();
        vertex(10, 0);
        vertex(-5, -5);
        vertex(-2, 0);
        vertex(-5, 5);
        endShape(CLOSE);
        pop();
      } else {
        // Fallback to circular shape
        ellipse(bullet.x, bullet.y, 10, 10);
      }
    } else if (bullet.type === 'bonus') {
      // Bonus level bullets - special effects
      drawingContext.shadowColor = color(255, 200, 0);
      
      // Draw based on movement direction
      if (bullet.vx !== undefined && bullet.vy !== undefined) {
        push();
        translate(bullet.x, bullet.y);
        rotate(atan2(bullet.vy, bullet.vx));
        
        // Star bullet shape
        fill(255, 150, 0);
        drawStar(0, 0, 4, 8, 5);
        pop();
      } else {
        // Fallback to star shape at fixed rotation
        fill(255, 150, 0);
        push();
        translate(bullet.x, bullet.y);
        rotate(frameCount * 0.1);
        drawStar(0, 0, 4, 8, 5);
        pop();
      }
    } else {
      // Regular enemy bullets
      drawingContext.shadowColor = color(colors.enemyBullet);
      fill(colors.enemyBullet);
      noStroke();
      ellipse(bullet.x, bullet.y, 8, 8);
    }
  }
  
  drawingContext.shadowBlur = 0;
}

function drawEnemies() {
  // Draw boss if present
  if (boss) {
    drawBoss();
  }
  
  // Draw regular enemies
  for (let enemy of enemies) {
    if (enemy.type === 'bonus') {
      drawBonusEnemy(enemy.x, enemy.y, enemy);
    } else {
      drawEnemy(enemy.x, enemy.y, enemy);
    }
  }
}

function drawPowerUps() {
  drawingContext.shadowBlur = 15;
  noStroke();
  
  for (let powerUp of powerUps) {
    drawingContext.shadowColor = color(colors.powerUps[powerUp.type]);
    fill(colors.powerUps[powerUp.type]);
    
    push();
    translate(powerUp.x, powerUp.y);
    rotate(frameCount * 0.03);
    
    // Different shapes for different power-ups
    if (powerUp.type === 'doubleShot') {
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = map(i, 0, 5, 0, TWO_PI);
        let r = 12;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
    } else if (powerUp.type === 'shield') {
      ellipse(0, 0, 24, 24);
    } else if (powerUp.type === 'rapidFire') {
      triangle(-10, 10, 0, -10, 10, 10);
    }
    
    pop();
  }
  
  drawingContext.shadowBlur = 0;
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    let alpha = map(p.life, 0, 40, 0, 255);
    fill(p.color[0], p.color[1], p.color[2], alpha);
    ellipse(p.x, p.y, 4, 4);
  }
}

function drawPlayer() {
  push();
  translate(playerX, playerY);
  
  // Shield effect
  if (activePowerUps.shield) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(colors.powerUps.shield);
    noFill();
    stroke(colors.powerUps.shield[0], colors.powerUps.shield[1], colors.powerUps.shield[2], 150 + sin(frameCount * 0.1) * 50);
    strokeWeight(3);
    ellipse(0, 0, 50, 50);
    drawingContext.shadowBlur = 0;
  }
  
  // Power-up indicators
  if (activePowerUps.doubleShot) {
    fill(colors.powerUps.doubleShot[0], colors.powerUps.doubleShot[1], colors.powerUps.doubleShot[2], 150);
    rect(-20, -15, 5, 5);
    rect(15, -15, 5, 5);
  }
  
  if (activePowerUps.rapidFire) {
    fill(colors.powerUps.rapidFire[0], colors.powerUps.rapidFire[1], colors.powerUps.rapidFire[2], 150);
    rect(-3, -25, 6, 5);
  }
  
  // Draw the ship based on type
  drawShip(0, 0, shipType);
  
  // Engine glow
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(255, 100, 0);
  fill(255, 200, 0);
  ellipse(-10, 15, 5, 8 + sin(frameCount * 0.2) * 2);
  ellipse(10, 15, 5, 8 + sin(frameCount * 0.2 + 1) * 2);
  drawingContext.shadowBlur = 0;
  
  pop();
}

function drawUI() {
  push();
  
  // Score
  textAlign(LEFT);
  textSize(20);
  fill(colors.ui);
  text('SCORE: ' + score, 20, 30);
  
  // Lives
  textAlign(RIGHT);
  text('LIVES: ' + lives, width - 90, 30);
  
  // Level indicator
  textAlign(CENTER);
  text('LEVEL ' + level, width/2, 30);
  
  // Collected stars
  textAlign(LEFT);
  fill(colors.uiHighlight);
  text('⭐ ' + collectedStars, 20, height - 20);
  
  // Power-up indicators with cooldowns
  textAlign(LEFT);
  textSize(14);
  let y = 60;
  for (let power in activePowerUps) {
    // Display active power-ups
    if (activePowerUps[power]) {
      fill(colors.powerUps[power]);
      text(power.toUpperCase() + ': ' + Math.ceil(powerUpDuration[power] / 60) + 's', 20, y);
      y += 20;
    }
  }
  
  // Display level popup if active
  if (levelPopupTimer > 0) {
    let alpha = levelPopupTimer > 30 ? 255 : map(levelPopupTimer, 0, 30, 0, 255);
    
    // Background for popup
    fill(0, 0, 50, alpha * 0.7);
    rectMode(CENTER);
    rect(width/2, height/4, 500, 100, 20);
    
    // Border
    strokeWeight(3);
    stroke(colors.uiAccent[0], colors.uiAccent[1], colors.uiAccent[2], alpha);
    noFill();
    rect(width/2, height/4, 510, 110, 22);
    
    // Text
    textAlign(CENTER);
    fill(255, 255, 255, alpha);
    textSize(36);
    text(`LEVEL ${level}`, width/2, height/4 - 10);
    
    textSize(24);
    fill(colors.uiHighlight[0], colors.uiHighlight[1], colors.uiHighlight[2], alpha);
    text(selectedLevelMessage, width/2, height/4 + 30);
    
    // Decrease timer
    levelPopupTimer--;
  }
  
  // Pause button (only in gameplay)
  if (gameState === 'playing' || gameState === 'bonusLevel') {
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(0, 100, 200);
    
    // Button base
    let pauseBtnX = width - 50;
    let pauseBtnY = 50;
    
    stroke(colors.uiAccent);
    strokeWeight(2);
    fill(50, 100, 180, 150);
    ellipse(pauseBtnX, pauseBtnY, 50, 50);
    
    // Pause/Play icon
    stroke(255);
    strokeWeight(3);
    noFill();
    if (gamePaused) {
      // Play icon
      triangle(pauseBtnX - 8, pauseBtnY - 12, pauseBtnX - 8, pauseBtnY + 12, pauseBtnX + 12, pauseBtnY);
    } else {
      // Pause icon
      rect(pauseBtnX - 12, pauseBtnY - 10, 8, 20, 1);
      rect(pauseBtnX + 4, pauseBtnY - 10, 8, 20, 1);
    }
    
    drawingContext.shadowBlur = 0;
  }
  
  // Boss health bar - enhanced version
  if (boss) {
    // Get boss name based on level
    let bossIndex = Math.floor(level / 5) - 1;
    if (bossIndex >= bossNames.length) bossIndex = bossNames.length - 1;
    let bossName = bossNames[bossIndex];
    
    // Panel background
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(0, 0, 0);
    fill(10, 20, 50, 200);
    rect(width/2 - 200, 45, 400, 50, 10);
    drawingContext.shadowBlur = 0;
    
    // Boss name with dramatic style
    textAlign(CENTER);
    textSize(18);
    textStyle(BOLD);
    fill(colors.uiHighlight);
    text(bossName, width/2, 70);
    
    // Health bar dimensions
    let barWidth = 320;
    let barHeight = 15;
    let healthPercent = boss.health / boss.maxHealth;
    
    // Health bar background with texture
    noStroke();
    fill(40, 40, 40);
    rect(width/2 - barWidth/2, 85, barWidth, barHeight, barHeight/2);
    
    // Health bar texture/pattern
    fill(30, 30, 30);
    for (let i = 0; i < barWidth; i += 10) {
      rect(width/2 - barWidth/2 + i, 85, 5, barHeight, 0);
    }
    
    // Health bar fill with dynamic color based on health percentage
    let barColor;
    if (healthPercent > 0.6) {
      barColor = color(100, 255, 100); // Green for high health
    } else if (healthPercent > 0.3) {
      barColor = color(255, 255, 0); // Yellow for medium health
    } else {
      barColor = color(255, 50, 50); // Red for low health
    }
    
    // Add pulsing effect when low health
    if (healthPercent < 0.3) {
      let pulseAmount = map(sin(frameCount * 0.1), -1, 1, 0.8, 1.2);
      barColor.setAlpha(200 + sin(frameCount * 0.1) * 55);
      barWidth *= pulseAmount;
    }
    
    // Draw the health bar with gradient
    fill(barColor);
    rect(width/2 - barWidth/2, 85, barWidth * healthPercent, barHeight, barHeight/2);
    
    // Bar segments/ticks
    stroke(0);
    strokeWeight(1);
    for (let i = 0.25; i < 1; i += 0.25) {
      if (i <= healthPercent) {
        stroke(0, 0, 0, 100);
      } else {
        stroke(0, 0, 0, 50);
      }
      line(width/2 - barWidth/2 + barWidth * i, 85, width/2 - barWidth/2 + barWidth * i, 85 + barHeight);
    }
    
    // Boss icon
    noStroke();
    fill(colors.boss);
    ellipse(width/2 - barWidth/2 - 20, 85 + barHeight/2, 25, 25);
    
    // Skull icon for boss
    fill(0);
    ellipse(width/2 - barWidth/2 - 20, 85 + barHeight/2 - 5, 6, 6); // Eye
    ellipse(width/2 - barWidth/2 - 20 + 8, 85 + barHeight/2 - 5, 6, 6); // Eye
    fill(255);
    rect(width/2 - barWidth/2 - 24, 85 + barHeight/2 + 2, 8, 2); // Teeth
    rect(width/2 - barWidth/2 - 20, 85 + barHeight/2 + 2, 8, 2); // Teeth
    rect(width/2 - barWidth/2 - 16, 85 + barHeight/2 + 2, 8, 2); // Teeth
  }
  
  // Bonus level timer
  if (isBonus) {
    // Show remaining time
    let timeLeft = Math.ceil(bonusLevelTimer / 60); // Convert to seconds
    textAlign(CENTER);
    textSize(24);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 200, 0);
    fill(255, 200, 0);
    text('BONUS LEVEL: ' + timeLeft + 's', width/2, 70);
    drawingContext.shadowBlur = 0;
  }
  
  pop();
}

function drawBoss() {
  push();
  translate(boss.x, boss.y);
  
  // Get the boss name for this level
  let bossIndex = Math.floor(level / 5) - 1;
  if (bossIndex >= bossNames.length) bossIndex = bossNames.length - 1;
  let bossName = bossNames[bossIndex];
  
  // Boss glow effect
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = color(colors.boss);
  
  // Draw different boss designs based on the level
  if (bossIndex === 3) { // Final boss - Cosmic Horror
    // Main body
    fill(colors.boss);
    beginShape();
    for (let i = 0; i < 12; i++) {
      let angle = TWO_PI * i / 12;
      let radius = boss.size/2;
      if (i % 2 === 0) {
        radius += 20 + sin(frameCount * 0.1 + i) * 10;
      }
      vertex(cos(angle) * radius, sin(angle) * radius);
    }
    endShape(CLOSE);
    
    // Rotating elements with pulsating size
    push();
    rotate(frameCount * 0.01);
    for (let i = 0; i < 8; i++) {
      push();
      rotate(i * PI/4);
      let pulseSize = sin(frameCount * 0.05 + i) * 10;
      fill(colors.bossAccent);
      ellipse(boss.size/2, 0, boss.size/4 + pulseSize, boss.size/4 + pulseSize);
      pop();
    }
    pop();
    
    // Pulsating core
    let coreSize = boss.size/2 + sin(frameCount * 0.05) * 10;
    fill(colors.bossAccent);
    ellipse(0, 0, coreSize, coreSize);
    
    // Terrifying eye that follows player
    let angle = atan2(playerY - boss.y, playerX - boss.x);
    let eyeOffsetX = cos(angle) * boss.size/8;
    let eyeOffsetY = sin(angle) * boss.size/8;
    
    fill(255);
    ellipse(eyeOffsetX, eyeOffsetY, boss.size/3, boss.size/3);
    
    fill(0);
    ellipse(eyeOffsetX, eyeOffsetY, boss.size/6, boss.size/6);
    
    // Mouth for shooting
    fill(255, 0, 0);
    let mouthAngle = angle + PI; // Opposite direction of player
    let mouthX = cos(mouthAngle) * boss.size/3;
    let mouthY = sin(mouthAngle) * boss.size/3;
    ellipse(mouthX, mouthY, boss.size/4, boss.size/4);
    
    // Boss name
    textSize(16);
    fill(255);
    text(bossName, 0, -boss.size/2 - 20);
  } else if (bossIndex === 2) { // Third boss - Energy Devourer
    // Main body - crystalline structure
    noStroke();
    fill(colors.boss);
    
    // Draw crystalline structure
    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = TWO_PI * i / 8;
      let radius = boss.size/2;
      
      // Make every other point extend outward
      if (i % 2 === 0) {
        radius = boss.size/1.5;
      }
      
      // Add some movement to the shape
      radius += sin(frameCount * 0.05 + i) * 10;
      
      vertex(cos(angle) * radius, sin(angle) * radius);
    }
    endShape(CLOSE);
    
    // Energy core
    fill(255, 200, 0, 150 + sin(frameCount * 0.1) * 50);
    ellipse(0, 0, boss.size/2, boss.size/2);
    
    // Orbiting energy balls
    for (let i = 0; i < 4; i++) {
      let orbitAngle = frameCount * 0.03 + i * PI/2;
      let orbitX = cos(orbitAngle) * boss.size/1.5;
      let orbitY = sin(orbitAngle) * boss.size/1.5;
      
      fill(colors.bossAccent);
      ellipse(orbitX, orbitY, boss.size/5, boss.size/5);
    }
    
    // Mouth for shooting
    let angle = atan2(playerY - boss.y, playerX - boss.x);
    fill(255, 0, 0);
    arc(0, 0, boss.size/3, boss.size/3, angle - 0.3, angle + 0.3);
    
    // Boss name
    textSize(16);
    fill(255);
    text(bossName, 0, -boss.size/2 - 20);
  } else if (bossIndex === 1) { // Second boss - Star Eater
    // Main body - alien ship
    fill(colors.boss);
    
    // Draw saucer shape
    ellipse(0, 0, boss.size * 1.5, boss.size/2);
    
    // Top dome
    fill(colors.bossAccent);
    arc(0, 0, boss.size, boss.size/2, PI, TWO_PI, CHORD);
    
    // Bottom details
    fill(50);
    arc(0, 0, boss.size * 1.3, boss.size/3, 0, PI, CHORD);
    
    // Glowing lights around the rim
    for (let i = 0; i < 8; i++) {
      let angle = i * PI/4;
      let lightX = cos(angle) * boss.size * 0.7;
      let lightY = sin(angle) * boss.size * 0.2;
      
      // Only draw lights on the bottom half
      if (lightY > -5) {
        fill(255, 0, 0, 150 + sin(frameCount * 0.1 + i) * 50);
        ellipse(lightX, lightY, boss.size/10, boss.size/10);
      }
    }
    
    // Central eye/weapon
    fill(colors.bossBullet);
    ellipse(0, boss.size/8, boss.size/3, boss.size/6);
    
    // Boss name
    textSize(16);
    fill(255);
    text(bossName, 0, -boss.size/2 - 10);
  } else { // First boss - Void Crusher
    // Main body - mechanical monster
    fill(colors.boss);
    
    // Body shape
    beginShape();
    vertex(-boss.size/2, -boss.size/3);
    vertex(boss.size/2, -boss.size/3);
    vertex(boss.size/1.5, 0);
    vertex(boss.size/2, boss.size/3);
    vertex(-boss.size/2, boss.size/3);
    vertex(-boss.size/1.5, 0);
    endShape(CLOSE);
    
    // Armor plates with metallic look
    fill(colors.bossAccent);
    beginShape();
    vertex(-boss.size/2.2, -boss.size/3.3);
    vertex(boss.size/2.2, -boss.size/3.3);
    vertex(boss.size/2.5, -boss.size/6);
    vertex(-boss.size/2.5, -boss.size/6);
    endShape(CLOSE);
    
    beginShape();
    vertex(-boss.size/2.5, boss.size/6);
    vertex(boss.size/2.5, boss.size/6);
    vertex(boss.size/2.2, boss.size/3.3);
    vertex(-boss.size/2.2, boss.size/3.3);
    endShape(CLOSE);
    
    // Central cannon/mouth
    fill(50);
    ellipse(0, 0, boss.size/2, boss.size/3);
    
    // Cannon muzzle - glowing when about to fire
    let glowIntensity = (frameCount % boss.fireRate) < 10 ? 255 : 150; 
    fill(255, 50, 50, glowIntensity);
    ellipse(0, 0, boss.size/3, boss.size/4);
    
    // Eyes that follow the player
    let angle = atan2(playerY - boss.y, playerX - boss.x);
    let eyeOffsetX = cos(angle) * boss.size/15;
    let eyeOffsetY = sin(angle) * boss.size/15;
    
    fill(0, 255, 255);
    ellipse(-boss.size/4 + eyeOffsetX, -boss.size/6 + eyeOffsetY, boss.size/8, boss.size/10);
    ellipse(boss.size/4 + eyeOffsetX, -boss.size/6 + eyeOffsetY, boss.size/8, boss.size/10);
    
    // Boss name
    textSize(16);
    fill(255);
    text(bossName, 0, -boss.size/2 - 10);
  }
  
  // Health bar above boss
  let barWidth = boss.size;
  let barHeight = 8;
  let healthPercent = boss.health / boss.maxHealth;
  
  // Bar background
  fill(50);
  rect(-barWidth/2, -boss.size/2 - 5, barWidth, barHeight, barHeight/2);
  
  // Health bar gradient
  if (healthPercent > 0.6) {
    fill(0, 255, 0); // Green for high health
  } else if (healthPercent > 0.3) {
    fill(255, 255, 0); // Yellow for medium health
  } else {
    fill(255, 0, 0); // Red for low health
  }
  rect(-barWidth/2, -boss.size/2 - 5, barWidth * healthPercent, barHeight, barHeight/2);
  
  drawingContext.shadowBlur = 0;
  pop();
}

function drawBonusEnemy(x, y, enemy) {
  push();
  translate(x, y);
  
  // Special glow for bonus enemies
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(255, 200, 0);
  
  // Draw different bonus enemy types depending on their pattern
  switch(enemy.pattern) {
    case 'circle':
      // Star-shaped enemy
      fill(255, 200, 0);
      drawStar(0, 0, enemy.size/3, enemy.size/1.5, 5);
      
      // Core
      fill(255, 100, 0);
      ellipse(0, 0, enemy.size/2, enemy.size/2);
      break;
      
    case 'spiral':
      // Spiral enemy
      fill(255, 150, 50);
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = TWO_PI * i / 6;
        let r = enemy.size/2;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Energy core
      fill(255, 255, 0, 200 + sin(frameCount * 0.2) * 55);
      ellipse(0, 0, enemy.size/3, enemy.size/3);
      break;
      
    case 'wave':
      // Wave pattern enemy
      fill(255, 150, 0);
      
      // Wavy-edged circle
      beginShape();
      for (let i = 0; i < 20; i++) {
        let angle = TWO_PI * i / 20;
        let r = enemy.size/2 + sin(angle * 8 + frameCount * 0.1) * 5;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Glowing center
      fill(255, 255, 0);
      ellipse(0, 0, enemy.size/4, enemy.size/4);
      break;
      
    case 'grid':
      // Geometric cube-like enemy
      noStroke();
      
      // 3D cube effect
      fill(255, 100, 0);
      rect(-enemy.size/3, -enemy.size/3, enemy.size/1.5, enemy.size/1.5);
      
      // Highlight
      fill(255, 200, 0, 150);
      beginShape();
      vertex(-enemy.size/3, -enemy.size/3);
      vertex(enemy.size/6, -enemy.size/3);
      vertex(enemy.size/6, enemy.size/6);
      vertex(-enemy.size/3, enemy.size/6);
      endShape(CLOSE);
      
      // Center mark
      fill(255, 50, 0);
      rect(-enemy.size/6, -enemy.size/6, enemy.size/3, enemy.size/3);
      break;
      
    default:
      // Fallback design
      fill(255, 150, 0);
      ellipse(0, 0, enemy.size, enemy.size);
      fill(255, 255, 0);
      ellipse(0, 0, enemy.size/2, enemy.size/2);
  }
  
  drawingContext.shadowBlur = 0;
  pop();
}

// ... existing code ...

function mousePressed() {
  // Only check for sound button on start screen
  if (gameState === 'start') {
    let soundBtnX = width - 50;
    let soundBtnY = height - 50;
    let pauseBtnX = width - 120;
    let pauseBtnY = height - 50;
    
    if (dist(mouseX, mouseY, soundBtnX, soundBtnY) < 30) {
      soundsEnabled = !soundsEnabled;
      
      // Toggle background music
      try {
        if (soundsLoaded && bgMusic) {
          if (soundsEnabled) {
            if (typeof bgMusic.loop === 'function' && !bgMusic.isPlaying()) {
              bgMusic.loop();
            }
          } else {
            if (typeof bgMusic.pause === 'function') {
              bgMusic.pause();
            }
          }
        }
      } catch (e) {
        console.error("Error toggling sound:", e);
      }
      return false; // Prevent default
    }
    
    // Check for pause button press
    if (dist(mouseX, mouseY, pauseBtnX, pauseBtnY) < 30) {
      togglePause();
      return false;
    }
  }
  
  // Add pause button to game screen
  if (gameState === 'playing') {
    let pauseBtnX = width - 50;
    let pauseBtnY = 50;
    
    if (dist(mouseX, mouseY, pauseBtnX, pauseBtnY) < 25) {
      togglePause();
      return false;
    }
  }
}

// Function to toggle pause state
function togglePause() {
  gamePaused = !gamePaused;
}

// Resize canvas function updated to maintain responsive size
function windowResized() {
  let canvasWidth = min(windowWidth * 0.9, 1200);
  let canvasHeight = min(windowHeight * 0.9, 800);
  resizeCanvas(canvasWidth, canvasHeight);
}

// New function for loading sounds outside of preload
function loadGameSounds() {
  // Create dummy sound objects
  shootSound = { play: function() {} };
  explosionSound = { play: function() {} };
  powerUpSound = { play: function() {} };
  bossExplosionSound = { play: function() {} };
  gameOverSound = { play: function() {} };
  victorySound = { play: function() {} };
  levelCompleteSound = { play: function() {} };
  
  // Background music with dummy methods
  bgMusic = {
    isPlaying: function() { return false; },
    loop: function() {},
    stop: function() {},
    pause: function() {}
  };
  
  soundsLoaded = true;
}

function soundLoaded() {
  // Simplified version
  soundsLoaded = true;
}

function soundError(err) {
  console.error("Sound error:", err);
}