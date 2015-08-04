(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, explosions, text, colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0, score = 0, lifes = 3;

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
  game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.C ]);

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
  asteroids = {r: game.add.group(), g: game.add.group(), b: game.add.group() };
  ['r', 'g', 'b'].forEach(function(type) {
    for(i=0; i < 15; i++) {
      var asteroid = asteroids[type].create(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, 'asteroid' + (Math.floor(Math.random() * 2)+1), 0);
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
      }
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
  player.body.maxVelocity.set(200);
  player.body.collideWorldBounds = true;
  player.ship.body.moves = false;
  game.camera.follow(player);

  explosions = game.add.group();
}

//
// Update
//
function update() {
  // Collisions
  ['r', 'g', 'b'].forEach(function(type) {
    ['r', 'g', 'b'].forEach(function(otherType) { game.physics.arcade.collide(asteroids[type], asteroids[otherType]); });
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

    game.physics.arcade.collide(bullets[type], asteroids[type], function(bullet, asteroid) {
      var explosion = explosions.create(asteroid.body.x, asteroid.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
      asteroid.kill();
      bullet.kill();
      score++;
      updateText();
    });
    asteroids[type].forEachExists(worldWrap);
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
      if(e.keyCode === Phaser.Keyboard.C) {
        if(player.frame == 3) {
          player.frame = 1;
        } else {
          player.frame = player.frame + 1;
        }
        console.log(player.frame);
      }
  };
  orbs.forEachExists(worldWrap);
}

//
// Helpers
//

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
  text = game.add.text(game.width / 2, 10, "Lifes: 3 - Score: 0", {
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnJywgeyBwcmVsb2FkOiBwcmVsb2FkLCBjcmVhdGU6IGNyZWF0ZSwgdXBkYXRlOiB1cGRhdGUgfSksXG4gICAgcGxheWVyLCBjdXJzb3JzLCBhc3Rlcm9pZHMsIGV4cGxvc2lvbnMsIHRleHQsIGNvbG9yQ291bnQgPSB7cjogNSwgZzogNSwgYjogNX0sIGJ1bGxldFRpbWUgPSAwLCBzY29yZSA9IDAsIGxpZmVzID0gMztcblxudmFyIFdPUkxEX1dJRFRIID0gMjAyNCwgV09STERfSEVJR0hUID0gMTIzMjtcblxudmFyIGhpZ2hzY29yZXMgPSBbXTtcbnRyeSB7XG4gIGhpZ2hzY29yZXMgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWdoc2NvcmVzJykpO1xuICBpZihoaWdoc2NvcmVzID09PSBudWxsKSBoaWdoc2NvcmVzID0gW107XG59IGNhdGNoKGUpIHtcbiAgLy8gbm90aGluZyBuZWVkZWQuXG59XG5cbi8vXG4vLyBQcmVsb2FkXG4vL1xuV2ViRm9udENvbmZpZyA9IHtcbiAgICAvLyAgJ2FjdGl2ZScgbWVhbnMgYWxsIHJlcXVlc3RlZCBmb250cyBoYXZlIGZpbmlzaGVkIGxvYWRpbmdcbiAgICAvLyAgV2Ugc2V0IGEgMSBzZWNvbmQgZGVsYXkgYmVmb3JlIGNhbGxpbmcgJ2NyZWF0ZVRleHQnLlxuICAgIC8vICBGb3Igc29tZSByZWFzb24gaWYgd2UgZG9uJ3QgdGhlIGJyb3dzZXIgY2Fubm90IHJlbmRlciB0aGUgdGV4dCB0aGUgZmlyc3QgdGltZSBpdCdzIGNyZWF0ZWQuXG4gICAgYWN0aXZlOiBmdW5jdGlvbigpIHsgZ2FtZS50aW1lLmV2ZW50cy5hZGQoUGhhc2VyLlRpbWVyLlNFQ09ORCwgY3JlYXRlVGV4dCwgdGhpcyk7IH0sXG5cbiAgICAvLyAgVGhlIEdvb2dsZSBGb250cyB3ZSB3YW50IHRvIGxvYWQgKHNwZWNpZnkgYXMgbWFueSBhcyB5b3UgbGlrZSBpbiB0aGUgYXJyYXkpXG4gICAgZ29vZ2xlOiB7XG4gICAgICBmYW1pbGllczogWydPcmJpdHJvbjo6bGF0aW4nXVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIGdhbWUubG9hZC5zY3JpcHQoJ3dlYmZvbnQnLCAnaHR0cHM6Ly8vL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL3dlYmZvbnQvMS40Ljcvd2ViZm9udC5qcycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3NwYWNlJywgJ2dmeC9zcGFjZS5qcGcnKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwbGF5ZXInLCAnZ2Z4L3NoaXAucG5nJywgNjQsIDMzLCA0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdvcmJzJywgJ2dmeC9vcmJzLnBuZycsIDExLCAxMSwgMyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYnVsbGV0cycsICdnZngvc2hvdC5wbmcnLCAxOCwgMTcsIDMpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2FzdGVyb2lkMScsICdnZngvYXN0ZXJvaWQxLnBuZycsIDY0LCA2NCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYXN0ZXJvaWQyJywgJ2dmeC9hc3Rlcm9pZDIucG5nJywgNjQsIDY0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdleHBsb3Npb24nLCAnZ2Z4L2V4cGxvc2lvbi5wbmcnLCA2NCwgNjQpO1xufVxuXG4vL1xuLy8gQ3JlYXRlXG4vL1xuXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG5cbiAgLy8gR2FtZSB3b3JsZFxuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAwLCBXT1JMRF9XSURUSCwgV09STERfSEVJR0hUKTtcbiAgdmFyIHNwYWNlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzcGFjZScpO1xuXG4gIC8vICBHYW1lIGlucHV0XG4gIGN1cnNvcnMgPSBnYW1lLmlucHV0LmtleWJvYXJkLmNyZWF0ZUN1cnNvcktleXMoKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFsgUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSLCBQaGFzZXIuS2V5Ym9hcmQuQyBdKTtcblxuICAvLyBPcmJzXG4gIG9yYnMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBvcmJzLmVuYWJsZUJvZHkgPSB0cnVlO1xuICBmb3IodmFyIGk9MDtpPDE1O2krKykge1xuICAgIHZhciBvcmIgPSBvcmJzLmNyZWF0ZShNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEggLSAxMSwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCAtIDExLCAnb3JicycsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSozKSk7XG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZShvcmIsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgb3JiLmJvZHkuYm91bmNlLnggPSBvcmIuYm9keS5ib3VuY2UueSA9IDE7XG4gICAgb3JiLmJvZHkuZ3Jhdml0eS54ID0gb3JiLmJvZHkuZ3Jhdml0eS55ID0gMDtcbiAgICBvcmIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjApO1xuICAgIG9yYi5hbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ob3JiLnJvdGF0aW9uLCAyMCwgb3JiLmJvZHkuYWNjZWxlcmF0aW9uKTtcbiAgfVxuXG4gIC8vIEJ1bGxldHNcbiAgYnVsbGV0cyA9IHsgcjogZ2FtZS5hZGQuZ3JvdXAoKSwgZzogZ2FtZS5hZGQuZ3JvdXAoKSwgYjogZ2FtZS5hZGQuZ3JvdXAoKSB9O1xuICB2YXIgZnJhbWVPZmZzZXRzID0ge3I6IDAsIGc6IDEsIGI6IDJ9O1xuICBmb3IodmFyIGMgaW4gYnVsbGV0cykge1xuICAgIGlmKCFidWxsZXRzLmhhc093blByb3BlcnR5KGMpKSBjb250aW51ZTtcbiAgICBidWxsZXRzW2NdLmVuYWJsZUJvZHkgPSB0cnVlO1xuICAgIGJ1bGxldHNbY10ucGh5c2ljc0JvZHlUeXBlID0gUGhhc2VyLlBoeXNpY3MuQVJDQURFO1xuICAgIGJ1bGxldHNbY10uY3JlYXRlTXVsdGlwbGUoNSwgJ2J1bGxldHMnLCBmcmFtZU9mZnNldHNbY10pO1xuICAgIGJ1bGxldHNbY10uc2V0QWxsKCdhbmNob3IueCcsIDAuNSk7XG4gICAgYnVsbGV0c1tjXS5zZXRBbGwoJ2FuY2hvci55JywgMC41KTtcbiAgfVxuXG4gIC8vIEFzdGVyb2lkc1xuICBhc3Rlcm9pZHMgPSB7cjogZ2FtZS5hZGQuZ3JvdXAoKSwgZzogZ2FtZS5hZGQuZ3JvdXAoKSwgYjogZ2FtZS5hZGQuZ3JvdXAoKSB9O1xuICBbJ3InLCAnZycsICdiJ10uZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gICAgZm9yKGk9MDsgaSA8IDE1OyBpKyspIHtcbiAgICAgIHZhciBhc3Rlcm9pZCA9IGFzdGVyb2lkc1t0eXBlXS5jcmVhdGUoTWF0aC5yYW5kb20oKSAqIFdPUkxEX1dJRFRILCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hULCAnYXN0ZXJvaWQnICsgKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpKzEpLCAwKTtcbiAgICAgIGFzdGVyb2lkLmFuY2hvci5zZXQoMC41KTtcbiAgICAgIGFzdGVyb2lkLmFuaW1hdGlvbnMuYWRkKCdzcGluJywgbnVsbCwgMTAsIHRydWUpO1xuICAgICAgYXN0ZXJvaWQuYW5pbWF0aW9ucy5wbGF5KCdzcGluJyk7XG4gICAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKGFzdGVyb2lkLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgICAgYXN0ZXJvaWQuYm9keS5ib3VuY2UueCA9IGFzdGVyb2lkLmJvZHkuYm91bmNlLnkgPSAxO1xuICAgICAgYXN0ZXJvaWQuYm9keS5ncmF2aXR5LnggPSBhc3Rlcm9pZC5ib2R5LmdyYXZpdHkueSA9IDA7XG4gICAgICBhc3Rlcm9pZC5ib2R5Lm1heFZlbG9jaXR5LnNldCgxMDApO1xuICAgICAgYXN0ZXJvaWQuYm9keS5vZmZzZXQuc2V0KDAsIDApO1xuICAgICAgYXN0ZXJvaWQuYm9keS53aWR0aCA9IGFzdGVyb2lkLmJvZHkuaGVpZ2h0ID0gMzI7XG4gICAgICBhc3Rlcm9pZC5hbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihhc3Rlcm9pZC5yb3RhdGlvbiwgTWF0aC5yYW5kb20oKSAqIDEwMCwgYXN0ZXJvaWQuYm9keS5hY2NlbGVyYXRpb24pO1xuICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgYXN0ZXJvaWQudGludCA9IDB4ZmY4ODg4O1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZyc6XG4gICAgICAgICAgYXN0ZXJvaWQudGludCA9IDB4ODhmZjg4O1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgYXN0ZXJvaWQudGludCA9IDB4ODg4OGZmO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIFBsYXllclxuICBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoZ2FtZS53aWR0aCAvIDIsIGdhbWUuaGVpZ2h0IC8gMiwgJ3BsYXllcicsIDEpO1xuICBwbGF5ZXIuYW5jaG9yLnNldCgwLjUpO1xuICBwbGF5ZXIuc2hpcCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAncGxheWVyJywgMCk7XG4gIHBsYXllci5zaGlwLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLmFkZENoaWxkKHBsYXllci5zaGlwKTtcbiAgZ2FtZS5waHlzaWNzLmVuYWJsZShwbGF5ZXIsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gIHBsYXllci5ib2R5LmRyYWcuc2V0KDEwMCk7XG4gIHBsYXllci5ib2R5LmJvdW5jZS5zZXQoMSk7XG4gIHBsYXllci5ib2R5Lm1heFZlbG9jaXR5LnNldCgyMDApO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuc2hpcC5ib2R5Lm1vdmVzID0gZmFsc2U7XG4gIGdhbWUuY2FtZXJhLmZvbGxvdyhwbGF5ZXIpO1xuXG4gIGV4cGxvc2lvbnMgPSBnYW1lLmFkZC5ncm91cCgpO1xufVxuXG4vL1xuLy8gVXBkYXRlXG4vL1xuZnVuY3Rpb24gdXBkYXRlKCkge1xuICAvLyBDb2xsaXNpb25zXG4gIFsncicsICdnJywgJ2InXS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBbJ3InLCAnZycsICdiJ10uZm9yRWFjaChmdW5jdGlvbihvdGhlclR5cGUpIHsgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKGFzdGVyb2lkc1t0eXBlXSwgYXN0ZXJvaWRzW290aGVyVHlwZV0pOyB9KTtcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVyLCBhc3Rlcm9pZHNbdHlwZV0sIGZ1bmN0aW9uKHBsYXllciwgYXN0ZXJvaWQpIHtcbiAgICAgIGFzdGVyb2lkLmtpbGwoKTtcbiAgICAgIHZhciBleHBsb3Npb24gPSBleHBsb3Npb25zLmNyZWF0ZShwbGF5ZXIuYm9keS54LCBwbGF5ZXIuYm9keS55LCAnZXhwbG9zaW9uJywgMCk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5hZGQoJ2Jvb20nLCBudWxsLCAyMCwgZmFsc2UpO1xuICAgICAgZXhwbG9zaW9uLmFuaW1hdGlvbnMucGxheSgnYm9vbScpO1xuICAgICAgbGlmZXMtLTtcbiAgICAgIGlmKGxpZmVzID09PSAwKSB7XG4gICAgICAgIGdhbWVPdmVyKCk7XG4gICAgICB9XG4gICAgICB1cGRhdGVUZXh0KCk7XG4gICAgfSk7XG5cbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoYnVsbGV0c1t0eXBlXSwgYXN0ZXJvaWRzW3R5cGVdLCBmdW5jdGlvbihidWxsZXQsIGFzdGVyb2lkKSB7XG4gICAgICB2YXIgZXhwbG9zaW9uID0gZXhwbG9zaW9ucy5jcmVhdGUoYXN0ZXJvaWQuYm9keS54LCBhc3Rlcm9pZC5ib2R5LnksICdleHBsb3Npb24nLCAwKTtcbiAgICAgIGV4cGxvc2lvbi5hbmltYXRpb25zLmFkZCgnYm9vbScsIG51bGwsIDIwLCBmYWxzZSk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5wbGF5KCdib29tJyk7XG4gICAgICBhc3Rlcm9pZC5raWxsKCk7XG4gICAgICBidWxsZXQua2lsbCgpO1xuICAgICAgc2NvcmUrKztcbiAgICAgIHVwZGF0ZVRleHQoKTtcbiAgICB9KTtcbiAgICBhc3Rlcm9pZHNbdHlwZV0uZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xuICB9KTtcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAocGxheWVyLCBvcmJzLCBjb2xsZWN0T3JiKTtcblxuICAvLyBDb250cm9sc1xuICBpZiAoY3Vyc29ycy51cC5pc0Rvd24pIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKHBsYXllci5yb3RhdGlvbiwgMjAwLCBwbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24pO1xuICBlbHNlIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi5zZXQoMCk7XG5cbiAgaWYgKGN1cnNvcnMubGVmdC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IC0zMDA7XG4gIGVsc2UgaWYgKGN1cnNvcnMucmlnaHQuaXNEb3duKSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAzMDA7XG4gIGVsc2UgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gMDtcblxuICBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSKSkgZmlyZUJ1bGxldCgpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLm9uVXBDYWxsYmFjayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKGUua2V5Q29kZSA9PT0gUGhhc2VyLktleWJvYXJkLkMpIHtcbiAgICAgICAgaWYocGxheWVyLmZyYW1lID09IDMpIHtcbiAgICAgICAgICBwbGF5ZXIuZnJhbWUgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllci5mcmFtZSA9IHBsYXllci5mcmFtZSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cocGxheWVyLmZyYW1lKTtcbiAgICAgIH1cbiAgfTtcbiAgb3Jicy5mb3JFYWNoRXhpc3RzKHdvcmxkV3JhcCk7XG59XG5cbi8vXG4vLyBIZWxwZXJzXG4vL1xuXG5mdW5jdGlvbiB3b3JsZFdyYXAoc3ByaXRlKSB7XG4gIGlmKHNwcml0ZS5ib2R5KSB7XG4gICAgaWYoc3ByaXRlLmJvZHkueCA8IDApIHNwcml0ZS5ib2R5LnggPSBXT1JMRF9XSURUSDtcbiAgICBlbHNlIGlmKHNwcml0ZS5ib2R5LnggPiBXT1JMRF9XSURUSCkgc3ByaXRlLmJvZHkueCA9IDA7XG5cbiAgICBpZihzcHJpdGUuYm9keS55IDwgMCkgc3ByaXRlLmJvZHkueSA9IFdPUkxEX0hFSUdIVDtcbiAgICBlbHNlIGlmKHNwcml0ZS5ib2R5LnkgPiBXT1JMRF9IRUlHSFQpIHNwcml0ZS5ib2R5LnkgPSAwO1xuXG4gIH0gZWxzZSB7XG4gICAgaWYoc3ByaXRlLnggPCAwKSBzcHJpdGUueCA9IFdPUkxEX1dJRFRIO1xuICAgIGVsc2UgaWYoc3ByaXRlLnggPiBXT1JMRF9XSURUSCkgc3ByaXRlLnggPSAwO1xuXG4gICAgaWYoc3ByaXRlLnkgPCAwKSBzcHJpdGUueSA9IFdPUkxEX0hFSUdIVDtcbiAgICBlbHNlIGlmKHNwcml0ZS55ID4gV09STERfSEVJR0hUKSBzcHJpdGUueSA9IDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlyZUJ1bGxldCAoKSB7XG4gIGlmIChnYW1lLnRpbWUubm93ID4gYnVsbGV0VGltZSkge1xuICAgIHZhciBidWxsZXQgPSBidWxsZXRzW1sncicsICdnJywgJ2InXVtwbGF5ZXIuZnJhbWUtMV1dLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcblxuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5yZXNldChwbGF5ZXIuYm9keS54ICsgMzAsIHBsYXllci5ib2R5LnkgKyAyMCk7XG4gICAgICBidWxsZXQubGlmZXNwYW4gPSAxNTAwO1xuICAgICAgYnVsbGV0LnJvdGF0aW9uID0gcGxheWVyLnJvdGF0aW9uO1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS52ZWxvY2l0eUZyb21Sb3RhdGlvbihwbGF5ZXIucm90YXRpb24sIDQwMCwgYnVsbGV0LmJvZHkudmVsb2NpdHkpO1xuICAgICAgYnVsbGV0VGltZSA9IGdhbWUudGltZS5ub3cgKyAxMDA7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RPcmIocGxheWVyLCBvcmIpIHtcbiAgdmFyIGNvbG9yID0gJ3InO1xuICBzd2l0Y2gob3JiLmZyYW1lKSB7XG4gICAgY2FzZSAwOlxuICAgICAgY29sb3IgPSAncic7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgICAgY29sb3IgPSAnZyc7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgY29sb3IgPSAnYic7XG4gICAgYnJlYWs7XG4gIH1cbiAgY29sb3JDb3VudFtjb2xvcl0rKztcbiAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbY29sb3JdLmNyZWF0ZSgwLCAwLCAnYnVsbGV0cycsIG9yYi5mcmFtZSwgZmFsc2UpO1xuICBidWxsZXQuYW5jaG9yLnNldCgwLjUpO1xuICBvcmIucmVzZXQoTWF0aC5yYW5kb20oKSAqIFdPUkxEX1dJRFRIIC0gMTEsIE1hdGgucmFuZG9tKCkgKiBXT1JMRF9IRUlHSFQgLSAxMSwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykpO1xuICBwbGF5ZXIuZnJhbWUgPSBvcmIuZnJhbWUgKyAxO1xuXG4gIG9yYi5hbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKG9yYi5yb3RhdGlvbiwgMjAsIG9yYi5ib2R5LmFjY2VsZXJhdGlvbik7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRleHQoKSB7XG4gIHRleHQgPSBnYW1lLmFkZC50ZXh0KGdhbWUud2lkdGggLyAyLCAxMCwgXCJMaWZlczogMyAtIFNjb3JlOiAwXCIsIHtcbiAgICBmb250OiAnMjBweCBPcmJpdHJvbicsXG4gICAgZmlsbDogJyNmZmYnLFxuICAgIHN0cm9rZTogJyNjY2YnLFxuICAgIGFsaWduOiAnY2VudGVyJ1xuICB9KTtcbiAgdGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcbiAgdGV4dC5hbmNob3IueCA9IDAuNTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVGV4dCgpIHtcbiAgdGV4dC50ZXh0ID0gXCJMaWZlczogXCIgKyBsaWZlcyArIFwiIC0gU2NvcmU6IFwiICsgc2NvcmU7XG59XG5cbmZ1bmN0aW9uIGdhbWVPdmVyKCkge1xuICB2YXIgbmFtZSA9IHdpbmRvdy5wcm9tcHQoJ0dhbWUgb3ZlciFcXG5XaGF0IGlzIHlvdXIgbmFtZT8nLCAnUGxheWVyJyk7XG4gIGhpZ2hzY29yZXMucHVzaCh7bmFtZTogbmFtZSwgc2NvcmU6IHNjb3JlfSk7XG4gIGhpZ2hzY29yZXMgPSBoaWdoc2NvcmVzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5zY29yZSA8IGIuc2NvcmU7IH0pO1xuICB0cnkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdoaWdoc2NvcmVzJywgSlNPTi5zdHJpbmdpZnkoaGlnaHNjb3Jlcy5zbGljZSgwLCAxMCkpKTtcbiAgfSBjYXRjaChlKSB7fVxuICB2YXIgaGlnaHNjb3JlTXNnID0gJyc7XG4gIGZvcih2YXIgaT0wOyBpPE1hdGgubWluKDEwLCBoaWdoc2NvcmVzLmxlbmd0aCk7IGkrKykge1xuICAgIGhpZ2hzY29yZU1zZyArPSBoaWdoc2NvcmVzW2ldLm5hbWUgKyAnIC0gJyArIGhpZ2hzY29yZXNbaV0uc2NvcmUgKyAnXFxuJztcbiAgfVxuICBhbGVydCgnSGlnaHNjb3JlczpcXG4nICsgaGlnaHNjb3JlTXNnKTtcbiAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xufVxuIl19
