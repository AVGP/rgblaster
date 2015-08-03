(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, explosions, text, colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0, score = 0, lifes = 3;

var WORLD_WIDTH = 2024, WORLD_HEIGHT = 1232;

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
  game.physics.arcade.collide(asteroids, asteroids);
  ['r', 'g', 'b'].forEach(function(type) {
    game.physics.arcade.collide(player, asteroids[type], function(player, asteroid) {
      asteroid.kill();
      var explosion = explosions.create(player.body.x, player.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
      lifes--;
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
  if(sprite.x < 0) sprite.x = WORLD_WIDTH;
  else if(sprite.x > WORLD_WIDTH) sprite.x = 0;

  if(sprite.y < 0) sprite.y = WORLD_HEIGHT;
  else if(sprite.y > WORLD_HEIGHT) sprite.y = 0;
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDYwMCwgUGhhc2VyLkFVVE8sICcnLCB7IHByZWxvYWQ6IHByZWxvYWQsIGNyZWF0ZTogY3JlYXRlLCB1cGRhdGU6IHVwZGF0ZSB9KSxcbiAgICBwbGF5ZXIsIGN1cnNvcnMsIGFzdGVyb2lkcywgZXhwbG9zaW9ucywgdGV4dCwgY29sb3JDb3VudCA9IHtyOiA1LCBnOiA1LCBiOiA1fSwgYnVsbGV0VGltZSA9IDAsIHNjb3JlID0gMCwgbGlmZXMgPSAzO1xuXG52YXIgV09STERfV0lEVEggPSAyMDI0LCBXT1JMRF9IRUlHSFQgPSAxMjMyO1xuXG4vL1xuLy8gUHJlbG9hZFxuLy9cbldlYkZvbnRDb25maWcgPSB7XG4gICAgLy8gICdhY3RpdmUnIG1lYW5zIGFsbCByZXF1ZXN0ZWQgZm9udHMgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nXG4gICAgLy8gIFdlIHNldCBhIDEgc2Vjb25kIGRlbGF5IGJlZm9yZSBjYWxsaW5nICdjcmVhdGVUZXh0Jy5cbiAgICAvLyAgRm9yIHNvbWUgcmVhc29uIGlmIHdlIGRvbid0IHRoZSBicm93c2VyIGNhbm5vdCByZW5kZXIgdGhlIHRleHQgdGhlIGZpcnN0IHRpbWUgaXQncyBjcmVhdGVkLlxuICAgIGFjdGl2ZTogZnVuY3Rpb24oKSB7IGdhbWUudGltZS5ldmVudHMuYWRkKFBoYXNlci5UaW1lci5TRUNPTkQsIGNyZWF0ZVRleHQsIHRoaXMpOyB9LFxuXG4gICAgLy8gIFRoZSBHb29nbGUgRm9udHMgd2Ugd2FudCB0byBsb2FkIChzcGVjaWZ5IGFzIG1hbnkgYXMgeW91IGxpa2UgaW4gdGhlIGFycmF5KVxuICAgIGdvb2dsZToge1xuICAgICAgZmFtaWxpZXM6IFsnT3JiaXRyb246OmxhdGluJ11cbiAgICB9XG59O1xuXG5mdW5jdGlvbiBwcmVsb2FkKCkge1xuICBnYW1lLmxvYWQuc2NyaXB0KCd3ZWJmb250JywgJ2h0dHBzOi8vLy9hamF4Lmdvb2dsZWFwaXMuY29tL2FqYXgvbGlicy93ZWJmb250LzEuNC43L3dlYmZvbnQuanMnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdzcGFjZScsICdnZngvc3BhY2UuanBnJyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncGxheWVyJywgJ2dmeC9zaGlwLnBuZycsIDY0LCAzMywgNCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnb3JicycsICdnZngvb3Jicy5wbmcnLCAxMSwgMTEsIDMpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2J1bGxldHMnLCAnZ2Z4L3Nob3QucG5nJywgMTgsIDE3LCAzKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdhc3Rlcm9pZDEnLCAnZ2Z4L2FzdGVyb2lkMS5wbmcnLCA2NCwgNjQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2FzdGVyb2lkMicsICdnZngvYXN0ZXJvaWQyLnBuZycsIDY0LCA2NCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnZXhwbG9zaW9uJywgJ2dmeC9leHBsb3Npb24ucG5nJywgNjQsIDY0KTtcbn1cblxuLy9cbi8vIENyZWF0ZVxuLy9cblxuZnVuY3Rpb24gY3JlYXRlKCkge1xuXG4gIC8vIEdhbWUgd29ybGRcbiAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgMCwgV09STERfV0lEVEgsIFdPUkxEX0hFSUdIVCk7XG4gIHZhciBzcGFjZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc3BhY2UnKTtcblxuICAvLyAgR2FtZSBpbnB1dFxuICBjdXJzb3JzID0gZ2FtZS5pbnB1dC5rZXlib2FyZC5jcmVhdGVDdXJzb3JLZXlzKCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbIFBoYXNlci5LZXlib2FyZC5TUEFDRUJBUiwgUGhhc2VyLktleWJvYXJkLkMgXSk7XG5cbiAgLy8gT3Jic1xuICBvcmJzID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgb3Jicy5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgZm9yKHZhciBpPTA7aTwxNTtpKyspIHtcbiAgICB2YXIgb3JiID0gb3Jicy5jcmVhdGUoTWF0aC5yYW5kb20oKSAqIFdPUkxEX1dJRFRIIC0gMTEsIE1hdGgucmFuZG9tKCkgKiBXT1JMRF9IRUlHSFQgLSAxMSwgJ29yYnMnLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMykpO1xuICAgIGdhbWUucGh5c2ljcy5lbmFibGUob3JiLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIG9yYi5ib2R5LmJvdW5jZS54ID0gb3JiLmJvZHkuYm91bmNlLnkgPSAxO1xuICAgIG9yYi5ib2R5LmdyYXZpdHkueCA9IG9yYi5ib2R5LmdyYXZpdHkueSA9IDA7XG4gICAgb3JiLmJvZHkubWF4VmVsb2NpdHkuc2V0KDIwKTtcbiAgICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKG9yYi5yb3RhdGlvbiwgMjAsIG9yYi5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIH1cblxuICAvLyBCdWxsZXRzXG4gIGJ1bGxldHMgPSB7IHI6IGdhbWUuYWRkLmdyb3VwKCksIGc6IGdhbWUuYWRkLmdyb3VwKCksIGI6IGdhbWUuYWRkLmdyb3VwKCkgfTtcbiAgdmFyIGZyYW1lT2Zmc2V0cyA9IHtyOiAwLCBnOiAxLCBiOiAyfTtcbiAgZm9yKHZhciBjIGluIGJ1bGxldHMpIHtcbiAgICBpZighYnVsbGV0cy5oYXNPd25Qcm9wZXJ0eShjKSkgY29udGludWU7XG4gICAgYnVsbGV0c1tjXS5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgICBidWxsZXRzW2NdLnBoeXNpY3NCb2R5VHlwZSA9IFBoYXNlci5QaHlzaWNzLkFSQ0FERTtcbiAgICBidWxsZXRzW2NdLmNyZWF0ZU11bHRpcGxlKDUsICdidWxsZXRzJywgZnJhbWVPZmZzZXRzW2NdKTtcbiAgICBidWxsZXRzW2NdLnNldEFsbCgnYW5jaG9yLngnLCAwLjUpO1xuICAgIGJ1bGxldHNbY10uc2V0QWxsKCdhbmNob3IueScsIDAuNSk7XG4gIH1cblxuICAvLyBBc3Rlcm9pZHNcbiAgYXN0ZXJvaWRzID0ge3I6IGdhbWUuYWRkLmdyb3VwKCksIGc6IGdhbWUuYWRkLmdyb3VwKCksIGI6IGdhbWUuYWRkLmdyb3VwKCkgfTtcbiAgWydyJywgJ2cnLCAnYiddLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICAgIGZvcihpPTA7IGkgPCAxNTsgaSsrKSB7XG4gICAgICB2YXIgYXN0ZXJvaWQgPSBhc3Rlcm9pZHNbdHlwZV0uY3JlYXRlKE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCwgJ2FzdGVyb2lkJyArIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSsxKSwgMCk7XG4gICAgICBhc3Rlcm9pZC5hbmNob3Iuc2V0KDAuNSk7XG4gICAgICBhc3Rlcm9pZC5hbmltYXRpb25zLmFkZCgnc3BpbicsIG51bGwsIDEwLCB0cnVlKTtcbiAgICAgIGFzdGVyb2lkLmFuaW1hdGlvbnMucGxheSgnc3BpbicpO1xuICAgICAgZ2FtZS5waHlzaWNzLmVuYWJsZShhc3Rlcm9pZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkuYm91bmNlLnggPSBhc3Rlcm9pZC5ib2R5LmJvdW5jZS55ID0gMTtcbiAgICAgIGFzdGVyb2lkLmJvZHkuZ3Jhdml0eS54ID0gYXN0ZXJvaWQuYm9keS5ncmF2aXR5LnkgPSAwO1xuICAgICAgYXN0ZXJvaWQuYm9keS5tYXhWZWxvY2l0eS5zZXQoMTAwKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkub2Zmc2V0LnNldCgwLCAwKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkud2lkdGggPSBhc3Rlcm9pZC5ib2R5LmhlaWdodCA9IDMyO1xuICAgICAgYXN0ZXJvaWQuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24oYXN0ZXJvaWQucm90YXRpb24sIE1hdGgucmFuZG9tKCkgKiAxMDAsIGFzdGVyb2lkLmJvZHkuYWNjZWxlcmF0aW9uKTtcbiAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweGZmODg4ODtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ZmY4ODtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ODhmZjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBQbGF5ZXJcbiAgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKGdhbWUud2lkdGggLyAyLCBnYW1lLmhlaWdodCAvIDIsICdwbGF5ZXInLCAxKTtcbiAgcGxheWVyLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLnNoaXAgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BsYXllcicsIDApO1xuICBwbGF5ZXIuc2hpcC5hbmNob3Iuc2V0KDAuNSk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuc2hpcCk7XG4gIGdhbWUucGh5c2ljcy5lbmFibGUocGxheWVyLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBwbGF5ZXIuYm9keS5kcmFnLnNldCgxMDApO1xuICBwbGF5ZXIuYm9keS5ib3VuY2Uuc2V0KDEpO1xuICBwbGF5ZXIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjAwKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLnNoaXAuYm9keS5tb3ZlcyA9IGZhbHNlO1xuICBnYW1lLmNhbWVyYS5mb2xsb3cocGxheWVyKTtcblxuICBleHBsb3Npb25zID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbn1cblxuLy9cbi8vIFVwZGF0ZVxuLy9cbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgLy8gQ29sbGlzaW9uc1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoYXN0ZXJvaWRzLCBhc3Rlcm9pZHMpO1xuICBbJ3InLCAnZycsICdiJ10uZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllciwgYXN0ZXJvaWRzW3R5cGVdLCBmdW5jdGlvbihwbGF5ZXIsIGFzdGVyb2lkKSB7XG4gICAgICBhc3Rlcm9pZC5raWxsKCk7XG4gICAgICB2YXIgZXhwbG9zaW9uID0gZXhwbG9zaW9ucy5jcmVhdGUocGxheWVyLmJvZHkueCwgcGxheWVyLmJvZHkueSwgJ2V4cGxvc2lvbicsIDApO1xuICAgICAgZXhwbG9zaW9uLmFuaW1hdGlvbnMuYWRkKCdib29tJywgbnVsbCwgMjAsIGZhbHNlKTtcbiAgICAgIGV4cGxvc2lvbi5hbmltYXRpb25zLnBsYXkoJ2Jvb20nKTtcbiAgICAgIGxpZmVzLS07XG4gICAgICB1cGRhdGVUZXh0KCk7XG4gICAgfSk7XG5cbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoYnVsbGV0c1t0eXBlXSwgYXN0ZXJvaWRzW3R5cGVdLCBmdW5jdGlvbihidWxsZXQsIGFzdGVyb2lkKSB7XG4gICAgICB2YXIgZXhwbG9zaW9uID0gZXhwbG9zaW9ucy5jcmVhdGUoYXN0ZXJvaWQuYm9keS54LCBhc3Rlcm9pZC5ib2R5LnksICdleHBsb3Npb24nLCAwKTtcbiAgICAgIGV4cGxvc2lvbi5hbmltYXRpb25zLmFkZCgnYm9vbScsIG51bGwsIDIwLCBmYWxzZSk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5wbGF5KCdib29tJyk7XG4gICAgICBhc3Rlcm9pZC5raWxsKCk7XG4gICAgICBidWxsZXQua2lsbCgpO1xuICAgICAgc2NvcmUrKztcbiAgICAgIHVwZGF0ZVRleHQoKTtcbiAgICB9KTtcbiAgICBhc3Rlcm9pZHNbdHlwZV0uZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xuICB9KTtcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAocGxheWVyLCBvcmJzLCBjb2xsZWN0T3JiKTtcblxuICAvLyBDb250cm9sc1xuICBpZiAoY3Vyc29ycy51cC5pc0Rvd24pIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKHBsYXllci5yb3RhdGlvbiwgMjAwLCBwbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24pO1xuICBlbHNlIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi5zZXQoMCk7XG5cbiAgaWYgKGN1cnNvcnMubGVmdC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IC0zMDA7XG4gIGVsc2UgaWYgKGN1cnNvcnMucmlnaHQuaXNEb3duKSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAzMDA7XG4gIGVsc2UgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gMDtcblxuICBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSKSkgZmlyZUJ1bGxldCgpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLm9uVXBDYWxsYmFjayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKGUua2V5Q29kZSA9PT0gUGhhc2VyLktleWJvYXJkLkMpIHtcbiAgICAgICAgaWYocGxheWVyLmZyYW1lID09IDMpIHtcbiAgICAgICAgICBwbGF5ZXIuZnJhbWUgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllci5mcmFtZSA9IHBsYXllci5mcmFtZSArIDE7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2cocGxheWVyLmZyYW1lKTtcbiAgICAgIH1cbiAgfTtcbiAgb3Jicy5mb3JFYWNoRXhpc3RzKHdvcmxkV3JhcCk7XG59XG5cbi8vXG4vLyBIZWxwZXJzXG4vL1xuXG5mdW5jdGlvbiB3b3JsZFdyYXAoc3ByaXRlKSB7XG4gIGlmKHNwcml0ZS54IDwgMCkgc3ByaXRlLnggPSBXT1JMRF9XSURUSDtcbiAgZWxzZSBpZihzcHJpdGUueCA+IFdPUkxEX1dJRFRIKSBzcHJpdGUueCA9IDA7XG5cbiAgaWYoc3ByaXRlLnkgPCAwKSBzcHJpdGUueSA9IFdPUkxEX0hFSUdIVDtcbiAgZWxzZSBpZihzcHJpdGUueSA+IFdPUkxEX0hFSUdIVCkgc3ByaXRlLnkgPSAwO1xufVxuXG5mdW5jdGlvbiBmaXJlQnVsbGV0ICgpIHtcbiAgaWYgKGdhbWUudGltZS5ub3cgPiBidWxsZXRUaW1lKSB7XG4gICAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbWydyJywgJ2cnLCAnYiddW3BsYXllci5mcmFtZS0xXV0uZ2V0Rmlyc3RFeGlzdHMoZmFsc2UpO1xuXG4gICAgaWYgKGJ1bGxldCkge1xuICAgICAgYnVsbGV0LnJlc2V0KHBsYXllci5ib2R5LnggKyAzMCwgcGxheWVyLmJvZHkueSArIDIwKTtcbiAgICAgIGJ1bGxldC5saWZlc3BhbiA9IDE1MDA7XG4gICAgICBidWxsZXQucm90YXRpb24gPSBwbGF5ZXIucm90YXRpb247XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLnZlbG9jaXR5RnJvbVJvdGF0aW9uKHBsYXllci5yb3RhdGlvbiwgNDAwLCBidWxsZXQuYm9keS52ZWxvY2l0eSk7XG4gICAgICBidWxsZXRUaW1lID0gZ2FtZS50aW1lLm5vdyArIDEwMDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29sbGVjdE9yYihwbGF5ZXIsIG9yYikge1xuICB2YXIgY29sb3IgPSAncic7XG4gIHN3aXRjaChvcmIuZnJhbWUpIHtcbiAgICBjYXNlIDA6XG4gICAgICBjb2xvciA9ICdyJztcbiAgICBicmVhaztcbiAgICBjYXNlIDE6XG4gICAgICBjb2xvciA9ICdnJztcbiAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICBjb2xvciA9ICdiJztcbiAgICBicmVhaztcbiAgfVxuICBjb2xvckNvdW50W2NvbG9yXSsrO1xuICB2YXIgYnVsbGV0ID0gYnVsbGV0c1tjb2xvcl0uY3JlYXRlKDAsIDAsICdidWxsZXRzJywgb3JiLmZyYW1lLCBmYWxzZSk7XG4gIGJ1bGxldC5hbmNob3Iuc2V0KDAuNSk7XG4gIG9yYi5yZXNldChNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEggLSAxMSwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCAtIDExLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSk7XG4gIHBsYXllci5mcmFtZSA9IG9yYi5mcmFtZSArIDE7XG5cbiAgb3JiLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ob3JiLnJvdGF0aW9uLCAyMCwgb3JiLmJvZHkuYWNjZWxlcmF0aW9uKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGV4dCgpIHtcbiAgdGV4dCA9IGdhbWUuYWRkLnRleHQoZ2FtZS53aWR0aCAvIDIsIDEwLCBcIkxpZmVzOiAzIC0gU2NvcmU6IDBcIiwge1xuICAgIGZvbnQ6ICcyMHB4IE9yYml0cm9uJyxcbiAgICBmaWxsOiAnI2ZmZicsXG4gICAgc3Ryb2tlOiAnI2NjZicsXG4gICAgYWxpZ246ICdjZW50ZXInXG4gIH0pO1xuICB0ZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuICB0ZXh0LmFuY2hvci54ID0gMC41O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVUZXh0KCkge1xuICB0ZXh0LnRleHQgPSBcIkxpZmVzOiBcIiArIGxpZmVzICsgXCIgLSBTY29yZTogXCIgKyBzY29yZTtcbn1cbiJdfQ==
