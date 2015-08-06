var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, explosions, text, colorCount = {r: 5, g: 5, b: 5},
    bulletTime = 0, score = 0, lifes = 5, asteroidGenerationTime = 0;

var WORLD_WIDTH = 2024, WORLD_HEIGHT = 1232;

var highscores = [];
try {
  highscores = JSON.parse(localStorage.getItem('highscores'));
  if(highscores === null) highscores = [];
} catch(e) {
  // nothing needed.
}

//
// Preload
//
WebFontConfig = {
    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    active: function() { game.time.events.add(Phaser.Timer.SECOND, createText, this); },

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Orbitron::latin']
    }
};

function preload() {
  game.load.script('webfont', 'https:////ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
  game.load.image('space', 'gfx/space.jpg');
  game.load.spritesheet('player', 'gfx/ship.png', 64, 33, 4);
  game.load.spritesheet('orbs', 'gfx/orbs.png', 11, 11, 3);
  game.load.spritesheet('bullets', 'gfx/shot.png', 18, 17, 3);
  game.load.spritesheet('asteroid1', 'gfx/asteroid1.png', 64, 64);
  game.load.spritesheet('asteroid2', 'gfx/asteroid2.png', 64, 64);
  game.load.spritesheet('asteroid3', 'gfx/asteroid3.png', 64, 64);
  game.load.spritesheet('asteroid4', 'gfx/asteroid4.png', 64, 64);
  game.load.spritesheet('explosion', 'gfx/explosion.png', 64, 64);
}

//
// Create
//

function create() {

  // Game world
  game.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  var space = game.add.sprite(0, 0, 'space');

  //  Game input
  cursors = game.input.keyboard.createCursorKeys();
  game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.X, Phaser.Keyboard.C, Phaser.Keyboard.V ]);

  // Orbs
  orbs = game.add.group();
  orbs.enableBody = true;
  for(var i=0;i<15;i++) {
    var orb = orbs.create(Math.random() * WORLD_WIDTH - 11, Math.random() * WORLD_HEIGHT - 11, 'orbs', Math.floor(Math.random()*3));
    game.physics.enable(orb, Phaser.Physics.ARCADE);
    orb.body.bounce.x = orb.body.bounce.y = 1;
    orb.body.gravity.x = orb.body.gravity.y = 0;
    orb.body.maxVelocity.set(20);
    orb.angle = Math.random() * 360;
    game.physics.arcade.accelerationFromRotation(orb.rotation, 20, orb.body.acceleration);
  }

  // Bullets
  bullets = { r: game.add.group(), g: game.add.group(), b: game.add.group() };
  var frameOffsets = {r: 0, g: 1, b: 2};
  for(var c in bullets) {
    if(!bullets.hasOwnProperty(c)) continue;
    bullets[c].enableBody = true;
    bullets[c].physicsBodyType = Phaser.Physics.ARCADE;
    bullets[c].createMultiple(5, 'bullets', frameOffsets[c]);
    bullets[c].setAll('anchor.x', 0.5);
    bullets[c].setAll('anchor.y', 0.5);
  }

  // Asteroids
  asteroids = {r: game.add.group(), g: game.add.group(), b: game.add.group(), indestructible: game.add.group() };
  ['r', 'g', 'b', 'indestructible'].forEach(function(type) {
    for(i=0; i < 5; i++) {
      createAsteroid(type);
    }
  });

  // Player
  player = game.add.sprite(game.width / 2, game.height / 2, 'player', 1);
  player.anchor.set(0.5);
  player.ship = game.add.sprite(0, 0, 'player', 0);
  player.ship.anchor.set(0.5);
  player.addChild(player.ship);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.drag.set(100);
  player.body.bounce.set(1);
  player.body.maxVelocity.set(300);
  player.body.collideWorldBounds = true;
  player.ship.body.moves = false;
  game.camera.follow(player);

  explosions = game.add.group();
}

//
// Update
//
function update() {
  // generate new asteroid, if it's time
  if(game.time.now > asteroidGenerationTime + 5000) {
    var types = ['r', 'g', 'b'];
    createAsteroid(types[Math.floor(Math.random() * types.length)]);
    asteroidGenerationTime = game.time.now;
  }

  // Collisions
  ['r', 'g', 'b', 'indestructible'].forEach(function(type) {
    ['r', 'g', 'b', 'indestructible'].forEach(function(otherType) { game.physics.arcade.collide(asteroids[type], asteroids[otherType]); });
    game.physics.arcade.collide(player, asteroids[type], function(player, asteroid) {
      asteroid.kill();
      var explosion = explosions.create(player.body.x, player.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
      lifes--;
      if(lifes === 0) {
        gameOver();
      }
      updateText();
    });

    asteroids[type].forEachExists(worldWrap);

    if(type === 'indestructible') return;

    game.physics.arcade.collide(bullets[type], asteroids[type], function(bullet, asteroid) {
      var explosion = explosions.create(asteroid.body.x, asteroid.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
      asteroid.kill();
      bullet.kill();
      score++;
      updateText();
    });
  });

  game.physics.arcade.overlap(player, orbs, collectOrb);

  // Controls
  if (cursors.up.isDown) game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
  else player.body.acceleration.set(0);

  if (cursors.left.isDown) player.body.angularVelocity = -300;
  else if (cursors.right.isDown) player.body.angularVelocity = 300;
  else player.body.angularVelocity = 0;

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) fireBullet();
  game.input.keyboard.onUpCallback = function(e) {
    switch(e.keyCode) {
      case Phaser.Keyboard.X:
        player.frame = 1;
      break;
      case Phaser.Keyboard.C:
        player.frame = 2;
      break;
      case Phaser.Keyboard.V:
        player.frame = 3;
      break;
    }
  };
  orbs.forEachExists(worldWrap);
}

//
// Helpers
//

function createAsteroid(type) {
  var index = Math.floor(Math.random() * 2) + 1;
  var asteroid = asteroids[type].create(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, 'asteroid' + index, 0);
  asteroid.anchor.set(0.5);
  asteroid.animations.add('spin', null, 10, true);
  asteroid.animations.play('spin');
  game.physics.enable(asteroid, Phaser.Physics.ARCADE);
  asteroid.body.bounce.x = asteroid.body.bounce.y = 1;
  asteroid.body.gravity.x = asteroid.body.gravity.y = 0;
  asteroid.body.maxVelocity.set(100);
  asteroid.body.offset.set(0, 0);
  asteroid.body.width = asteroid.body.height = 32;
  asteroid.angle = Math.random() * 360;
  game.physics.arcade.accelerationFromRotation(asteroid.rotation, Math.random() * 100, asteroid.body.acceleration);
  switch(type) {
    case 'r':
      asteroid.tint = 0xff8888;
    break;
    case 'g':
      asteroid.tint = 0x88ff88;
    break;
    case 'b':
      asteroid.tint = 0x8888ff;
    break;
    default:
      asteroid.tint = 0xffff88;
    break;
  }
}

function worldWrap(sprite) {
  if(sprite.body) {
    if(sprite.body.x < 0) sprite.body.x = WORLD_WIDTH;
    else if(sprite.body.x > WORLD_WIDTH) sprite.body.x = 0;

    if(sprite.body.y < 0) sprite.body.y = WORLD_HEIGHT;
    else if(sprite.body.y > WORLD_HEIGHT) sprite.body.y = 0;

  } else {
    if(sprite.x < 0) sprite.x = WORLD_WIDTH;
    else if(sprite.x > WORLD_WIDTH) sprite.x = 0;

    if(sprite.y < 0) sprite.y = WORLD_HEIGHT;
    else if(sprite.y > WORLD_HEIGHT) sprite.y = 0;
  }
}

function fireBullet () {
  if (game.time.now > bulletTime) {
    var bullet = bullets[['r', 'g', 'b'][player.frame-1]].getFirstExists(false);

    if (bullet) {
      bullet.reset(player.body.x + 30, player.body.y + 20);
      bullet.lifespan = 1500;
      bullet.rotation = player.rotation;
      game.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
      bulletTime = game.time.now + 100;
    }
  }
}

function collectOrb(player, orb) {
  var color = 'r';
  switch(orb.frame) {
    case 0:
      color = 'r';
    break;
    case 1:
      color = 'g';
    break;
    case 2:
      color = 'b';
    break;
  }
  colorCount[color]++;
  var bullet = bullets[color].create(0, 0, 'bullets', orb.frame, false);
  bullet.anchor.set(0.5);
  orb.reset(Math.random() * WORLD_WIDTH - 11, Math.random() * WORLD_HEIGHT - 11, Math.floor(Math.random() * 3));
  player.frame = orb.frame + 1;

  orb.angle = Math.random() * 360;
  game.physics.arcade.accelerationFromRotation(orb.rotation, 20, orb.body.acceleration);
}

function createText() {
  text = game.add.text(game.width / 2, 10, "Lifes: " + lifes + " - Score: 0", {
    font: '20px Orbitron',
    fill: '#fff',
    stroke: '#ccf',
    align: 'center'
  });
  text.fixedToCamera = true;
  text.anchor.x = 0.5;
}

function updateText() {
  text.text = "Lifes: " + lifes + " - Score: " + score;
}

function gameOver() {
  var name = window.prompt('Game over!\nWhat is your name?', 'Player');
  highscores.push({name: name, score: score});
  highscores = highscores.sort(function(a, b) { return a.score < b.score; });
  try {
    localStorage.setItem('highscores', JSON.stringify(highscores.slice(0, 10)));
  } catch(e) {}
  var highscoreMsg = '';
  for(var i=0; i<Math.min(10, highscores.length); i++) {
    highscoreMsg += highscores[i].name + ' - ' + highscores[i].score + '\n';
  }
  alert('Highscores:\n' + highscoreMsg);
  window.location.reload();
}
