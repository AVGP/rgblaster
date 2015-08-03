(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, explosions, colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0;

var WORLD_WIDTH = 2024, WORLD_HEIGHT = 1232;

//
// Preload
//

function preload() {
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
      var explosion = explosions.create(player.body.x, player.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
    });

    game.physics.arcade.collide(bullets[type], asteroids[type], function(bullet, asteroid) {
      var explosion = explosions.create(asteroid.body.x, asteroid.body.y, 'explosion', 0);
      explosion.animations.add('boom', null, 20, false);
      explosion.animations.play('boom');
      asteroid.kill();
      bullet.kill();
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNjAwLCBQaGFzZXIuQVVUTywgJycsIHsgcHJlbG9hZDogcHJlbG9hZCwgY3JlYXRlOiBjcmVhdGUsIHVwZGF0ZTogdXBkYXRlIH0pLFxuICAgIHBsYXllciwgY3Vyc29ycywgYXN0ZXJvaWRzLCBleHBsb3Npb25zLCBjb2xvckNvdW50ID0ge3I6IDUsIGc6IDUsIGI6IDV9LCBidWxsZXRUaW1lID0gMDtcblxudmFyIFdPUkxEX1dJRFRIID0gMjAyNCwgV09STERfSEVJR0hUID0gMTIzMjtcblxuLy9cbi8vIFByZWxvYWRcbi8vXG5cbmZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIGdhbWUubG9hZC5pbWFnZSgnc3BhY2UnLCAnZ2Z4L3NwYWNlLmpwZycpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3BsYXllcicsICdnZngvc2hpcC5wbmcnLCA2NCwgMzMsIDQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ29yYnMnLCAnZ2Z4L29yYnMucG5nJywgMTEsIDExLCAzKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdidWxsZXRzJywgJ2dmeC9zaG90LnBuZycsIDE4LCAxNywgMyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYXN0ZXJvaWQxJywgJ2dmeC9hc3Rlcm9pZDEucG5nJywgNjQsIDY0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdhc3Rlcm9pZDInLCAnZ2Z4L2FzdGVyb2lkMi5wbmcnLCA2NCwgNjQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2V4cGxvc2lvbicsICdnZngvZXhwbG9zaW9uLnBuZycsIDY0LCA2NCk7XG59XG5cbi8vXG4vLyBDcmVhdGVcbi8vXG5cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcblxuICAvLyBHYW1lIHdvcmxkXG4gIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIDAsIFdPUkxEX1dJRFRILCBXT1JMRF9IRUlHSFQpO1xuICB2YXIgc3BhY2UgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3NwYWNlJyk7XG5cbiAgLy8gIEdhbWUgaW5wdXRcbiAgY3Vyc29ycyA9IGdhbWUuaW5wdXQua2V5Ym9hcmQuY3JlYXRlQ3Vyc29yS2V5cygpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoWyBQaGFzZXIuS2V5Ym9hcmQuU1BBQ0VCQVIsIFBoYXNlci5LZXlib2FyZC5DIF0pO1xuXG4gIC8vIE9yYnNcbiAgb3JicyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIG9yYnMuZW5hYmxlQm9keSA9IHRydWU7XG4gIGZvcih2YXIgaT0wO2k8MTU7aSsrKSB7XG4gICAgdmFyIG9yYiA9IG9yYnMuY3JlYXRlKE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsICdvcmJzJywgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjMpKTtcbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKG9yYiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBvcmIuYm9keS5ib3VuY2UueCA9IG9yYi5ib2R5LmJvdW5jZS55ID0gMTtcbiAgICBvcmIuYm9keS5ncmF2aXR5LnggPSBvcmIuYm9keS5ncmF2aXR5LnkgPSAwO1xuICAgIG9yYi5ib2R5Lm1heFZlbG9jaXR5LnNldCgyMCk7XG4gICAgb3JiLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihvcmIucm90YXRpb24sIDIwLCBvcmIuYm9keS5hY2NlbGVyYXRpb24pO1xuICB9XG5cbiAgLy8gQnVsbGV0c1xuICBidWxsZXRzID0geyByOiBnYW1lLmFkZC5ncm91cCgpLCBnOiBnYW1lLmFkZC5ncm91cCgpLCBiOiBnYW1lLmFkZC5ncm91cCgpIH07XG4gIHZhciBmcmFtZU9mZnNldHMgPSB7cjogMCwgZzogMSwgYjogMn07XG4gIGZvcih2YXIgYyBpbiBidWxsZXRzKSB7XG4gICAgaWYoIWJ1bGxldHMuaGFzT3duUHJvcGVydHkoYykpIGNvbnRpbnVlO1xuICAgIGJ1bGxldHNbY10uZW5hYmxlQm9keSA9IHRydWU7XG4gICAgYnVsbGV0c1tjXS5waHlzaWNzQm9keVR5cGUgPSBQaGFzZXIuUGh5c2ljcy5BUkNBREU7XG4gICAgYnVsbGV0c1tjXS5jcmVhdGVNdWx0aXBsZSg1LCAnYnVsbGV0cycsIGZyYW1lT2Zmc2V0c1tjXSk7XG4gICAgYnVsbGV0c1tjXS5zZXRBbGwoJ2FuY2hvci54JywgMC41KTtcbiAgICBidWxsZXRzW2NdLnNldEFsbCgnYW5jaG9yLnknLCAwLjUpO1xuICB9XG5cbiAgLy8gQXN0ZXJvaWRzXG4gIGFzdGVyb2lkcyA9IHtyOiBnYW1lLmFkZC5ncm91cCgpLCBnOiBnYW1lLmFkZC5ncm91cCgpLCBiOiBnYW1lLmFkZC5ncm91cCgpIH07XG4gIFsncicsICdnJywgJ2InXS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBmb3IoaT0wOyBpIDwgMTU7IGkrKykge1xuICAgICAgdmFyIGFzdGVyb2lkID0gYXN0ZXJvaWRzW3R5cGVdLmNyZWF0ZShNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEgsIE1hdGgucmFuZG9tKCkgKiBXT1JMRF9IRUlHSFQsICdhc3Rlcm9pZCcgKyAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMikrMSksIDApO1xuICAgICAgYXN0ZXJvaWQuYW5jaG9yLnNldCgwLjUpO1xuICAgICAgYXN0ZXJvaWQuYW5pbWF0aW9ucy5hZGQoJ3NwaW4nLCBudWxsLCAxMCwgdHJ1ZSk7XG4gICAgICBhc3Rlcm9pZC5hbmltYXRpb25zLnBsYXkoJ3NwaW4nKTtcbiAgICAgIGdhbWUucGh5c2ljcy5lbmFibGUoYXN0ZXJvaWQsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgICBhc3Rlcm9pZC5ib2R5LmJvdW5jZS54ID0gYXN0ZXJvaWQuYm9keS5ib3VuY2UueSA9IDE7XG4gICAgICBhc3Rlcm9pZC5ib2R5LmdyYXZpdHkueCA9IGFzdGVyb2lkLmJvZHkuZ3Jhdml0eS55ID0gMDtcbiAgICAgIGFzdGVyb2lkLmJvZHkubWF4VmVsb2NpdHkuc2V0KDEwMCk7XG4gICAgICBhc3Rlcm9pZC5ib2R5Lm9mZnNldC5zZXQoMCwgMCk7XG4gICAgICBhc3Rlcm9pZC5ib2R5LndpZHRoID0gYXN0ZXJvaWQuYm9keS5oZWlnaHQgPSAzMjtcbiAgICAgIGFzdGVyb2lkLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKGFzdGVyb2lkLnJvdGF0aW9uLCBNYXRoLnJhbmRvbSgpICogMTAwLCBhc3Rlcm9pZC5ib2R5LmFjY2VsZXJhdGlvbik7XG4gICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHhmZjg4ODg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdnJzpcbiAgICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHg4OGZmODg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHg4ODg4ZmY7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gUGxheWVyXG4gIHBsYXllciA9IGdhbWUuYWRkLnNwcml0ZShnYW1lLndpZHRoIC8gMiwgZ2FtZS5oZWlnaHQgLyAyLCAncGxheWVyJywgMSk7XG4gIHBsYXllci5hbmNob3Iuc2V0KDAuNSk7XG4gIHBsYXllci5zaGlwID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdwbGF5ZXInLCAwKTtcbiAgcGxheWVyLnNoaXAuYW5jaG9yLnNldCgwLjUpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNoaXApO1xuICBnYW1lLnBoeXNpY3MuZW5hYmxlKHBsYXllciwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgcGxheWVyLmJvZHkuZHJhZy5zZXQoMTAwKTtcbiAgcGxheWVyLmJvZHkuYm91bmNlLnNldCgxKTtcbiAgcGxheWVyLmJvZHkubWF4VmVsb2NpdHkuc2V0KDIwMCk7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5zaGlwLmJvZHkubW92ZXMgPSBmYWxzZTtcbiAgZ2FtZS5jYW1lcmEuZm9sbG93KHBsYXllcik7XG5cbiAgZXhwbG9zaW9ucyA9IGdhbWUuYWRkLmdyb3VwKCk7XG59XG5cbi8vXG4vLyBVcGRhdGVcbi8vXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIC8vIENvbGxpc2lvbnNcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKGFzdGVyb2lkcywgYXN0ZXJvaWRzKTtcbiAgWydyJywgJ2cnLCAnYiddLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXIsIGFzdGVyb2lkc1t0eXBlXSwgZnVuY3Rpb24ocGxheWVyLCBhc3Rlcm9pZCkge1xuICAgICAgdmFyIGV4cGxvc2lvbiA9IGV4cGxvc2lvbnMuY3JlYXRlKHBsYXllci5ib2R5LngsIHBsYXllci5ib2R5LnksICdleHBsb3Npb24nLCAwKTtcbiAgICAgIGV4cGxvc2lvbi5hbmltYXRpb25zLmFkZCgnYm9vbScsIG51bGwsIDIwLCBmYWxzZSk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5wbGF5KCdib29tJyk7XG4gICAgfSk7XG5cbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoYnVsbGV0c1t0eXBlXSwgYXN0ZXJvaWRzW3R5cGVdLCBmdW5jdGlvbihidWxsZXQsIGFzdGVyb2lkKSB7XG4gICAgICB2YXIgZXhwbG9zaW9uID0gZXhwbG9zaW9ucy5jcmVhdGUoYXN0ZXJvaWQuYm9keS54LCBhc3Rlcm9pZC5ib2R5LnksICdleHBsb3Npb24nLCAwKTtcbiAgICAgIGV4cGxvc2lvbi5hbmltYXRpb25zLmFkZCgnYm9vbScsIG51bGwsIDIwLCBmYWxzZSk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5wbGF5KCdib29tJyk7XG4gICAgICBhc3Rlcm9pZC5raWxsKCk7XG4gICAgICBidWxsZXQua2lsbCgpO1xuICAgIH0pO1xuICAgIGFzdGVyb2lkc1t0eXBlXS5mb3JFYWNoRXhpc3RzKHdvcmxkV3JhcCk7XG4gIH0pO1xuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChwbGF5ZXIsIG9yYnMsIGNvbGxlY3RPcmIpO1xuXG4gIC8vIENvbnRyb2xzXG4gIGlmIChjdXJzb3JzLnVwLmlzRG93bikgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCAyMDAsIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIGVsc2UgcGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnNldCgwKTtcblxuICBpZiAoY3Vyc29ycy5sZWZ0LmlzRG93bikgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gLTMwMDtcbiAgZWxzZSBpZiAoY3Vyc29ycy5yaWdodC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IDMwMDtcbiAgZWxzZSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAwO1xuXG4gIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuU1BBQ0VCQVIpKSBmaXJlQnVsbGV0KCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQub25VcENhbGxiYWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYoZS5rZXlDb2RlID09PSBQaGFzZXIuS2V5Ym9hcmQuQykge1xuICAgICAgICBpZihwbGF5ZXIuZnJhbWUgPT0gMykge1xuICAgICAgICAgIHBsYXllci5mcmFtZSA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyLmZyYW1lID0gcGxheWVyLmZyYW1lICsgMTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhwbGF5ZXIuZnJhbWUpO1xuICAgICAgfVxuICB9O1xuICBvcmJzLmZvckVhY2hFeGlzdHMod29ybGRXcmFwKTtcbn1cblxuLy9cbi8vIEhlbHBlcnNcbi8vXG5cbmZ1bmN0aW9uIHdvcmxkV3JhcChzcHJpdGUpIHtcbiAgaWYoc3ByaXRlLnggPCAwKSBzcHJpdGUueCA9IFdPUkxEX1dJRFRIO1xuICBlbHNlIGlmKHNwcml0ZS54ID4gV09STERfV0lEVEgpIHNwcml0ZS54ID0gMDtcblxuICBpZihzcHJpdGUueSA8IDApIHNwcml0ZS55ID0gV09STERfSEVJR0hUO1xuICBlbHNlIGlmKHNwcml0ZS55ID4gV09STERfSEVJR0hUKSBzcHJpdGUueSA9IDA7XG59XG5cbmZ1bmN0aW9uIGZpcmVCdWxsZXQgKCkge1xuICBpZiAoZ2FtZS50aW1lLm5vdyA+IGJ1bGxldFRpbWUpIHtcbiAgICB2YXIgYnVsbGV0ID0gYnVsbGV0c1tbJ3InLCAnZycsICdiJ11bcGxheWVyLmZyYW1lLTFdXS5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG5cbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBidWxsZXQucmVzZXQocGxheWVyLmJvZHkueCArIDMwLCBwbGF5ZXIuYm9keS55ICsgMjApO1xuICAgICAgYnVsbGV0LmxpZmVzcGFuID0gMTUwMDtcbiAgICAgIGJ1bGxldC5yb3RhdGlvbiA9IHBsYXllci5yb3RhdGlvbjtcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUudmVsb2NpdHlGcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCA0MDAsIGJ1bGxldC5ib2R5LnZlbG9jaXR5KTtcbiAgICAgIGJ1bGxldFRpbWUgPSBnYW1lLnRpbWUubm93ICsgMTAwO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb2xsZWN0T3JiKHBsYXllciwgb3JiKSB7XG4gIHZhciBjb2xvciA9ICdyJztcbiAgc3dpdGNoKG9yYi5mcmFtZSkge1xuICAgIGNhc2UgMDpcbiAgICAgIGNvbG9yID0gJ3InO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIGNvbG9yID0gJ2cnO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgIGNvbG9yID0gJ2InO1xuICAgIGJyZWFrO1xuICB9XG4gIGNvbG9yQ291bnRbY29sb3JdKys7XG4gIHZhciBidWxsZXQgPSBidWxsZXRzW2NvbG9yXS5jcmVhdGUoMCwgMCwgJ2J1bGxldHMnLCBvcmIuZnJhbWUsIGZhbHNlKTtcbiAgYnVsbGV0LmFuY2hvci5zZXQoMC41KTtcbiAgb3JiLnJlc2V0KE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpKTtcbiAgcGxheWVyLmZyYW1lID0gb3JiLmZyYW1lICsgMTtcblxuICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihvcmIucm90YXRpb24sIDIwLCBvcmIuYm9keS5hY2NlbGVyYXRpb24pO1xufVxuIl19
