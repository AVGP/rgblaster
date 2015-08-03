(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, currentColor = 'r', colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0;

var WORLD_WIDTH = 2024, WORLD_HEIGHT = 1232;

function preload() {
  game.load.image('space', 'gfx/space.jpg');
  game.load.spritesheet('player', 'gfx/ship.png', 64, 33, 4);
  game.load.spritesheet('orbs', 'gfx/orbs.png', 11, 11, 3);
  game.load.spritesheet('bullets', 'gfx/shot.png', 18, 17, 3);
  game.load.spritesheet('asteroid1', 'gfx/asteroid1.png', 64, 64);
  game.load.spritesheet('asteroid2', 'gfx/asteroid2.png', 64, 64);
  game.load.spritesheet('explosion', 'gfx/explosion.png', 64, 64);
}

function create() {

  // Game world
  game.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  var space = game.add.sprite(0, 0, 'space');

  //  Game input
  cursors = game.input.keyboard.createCursorKeys();
  game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

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
  asteroids = game.add.group();
  for(i=0; i < 20; i++) {
    var asteroid = asteroids.create(Math.random() * WORLD_WIDTH, Math.random() * WORLD_HEIGHT, 'asteroid' + (Math.floor(Math.random() * 2)+1), 0);
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
    asteroid.type = ['r', 'g', 'b'][Math.floor(Math.random() * 3)];
    switch(asteroid.type) {
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
/*
  //explosion
  var explosion = game.add.sprite(100, 100, 'explosion', 0);
  explosion.animations.add('boom', null, 20, true);
  explosion.animations.play('boom');
*/
}

function update() {
  // Collisions
  game.physics.arcade.collide(asteroids, asteroids);
  game.physics.arcade.collide(player, asteroids, function(player, asteroid) {
  });
  game.physics.arcade.collide(player, orbs, collectOrb);

  // Controls
  if (cursors.up.isDown) game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
  else player.body.acceleration.set(0);

  if (cursors.left.isDown) player.body.angularVelocity = -300;
  else if (cursors.right.isDown) player.body.angularVelocity = 300;
  else player.body.angularVelocity = 0;

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) fireBullet();

  orbs.forEachExists(worldWrap);
  asteroids.forEachExists(worldWrap);
}

function worldWrap(sprite) {
  if(sprite.x < 0) sprite.x = WORLD_WIDTH;
  else if(sprite.x > WORLD_WIDTH) sprite.x = 0;

  if(sprite.y < 0) sprite.y = WORLD_HEIGHT;
  else if(sprite.y > WORLD_HEIGHT) sprite.y = 0;
}

function fireBullet () {
  if (game.time.now > bulletTime) {
    var bullet = bullets[currentColor].getFirstExists(false);

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
  currentColor = color;
  orb.reset(Math.random() * WORLD_WIDTH - 11, Math.random() * WORLD_HEIGHT - 11, Math.floor(Math.random() * 3));
  player.frame = orb.frame + 1;

  orb.angle = Math.random() * 360;
  game.physics.arcade.accelerationFromRotation(orb.rotation, 20, orb.body.acceleration);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDYwMCwgUGhhc2VyLkFVVE8sICcnLCB7IHByZWxvYWQ6IHByZWxvYWQsIGNyZWF0ZTogY3JlYXRlLCB1cGRhdGU6IHVwZGF0ZSB9KSxcbiAgICBwbGF5ZXIsIGN1cnNvcnMsIGFzdGVyb2lkcywgY3VycmVudENvbG9yID0gJ3InLCBjb2xvckNvdW50ID0ge3I6IDUsIGc6IDUsIGI6IDV9LCBidWxsZXRUaW1lID0gMDtcblxudmFyIFdPUkxEX1dJRFRIID0gMjAyNCwgV09STERfSEVJR0hUID0gMTIzMjtcblxuZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgZ2FtZS5sb2FkLmltYWdlKCdzcGFjZScsICdnZngvc3BhY2UuanBnJyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncGxheWVyJywgJ2dmeC9zaGlwLnBuZycsIDY0LCAzMywgNCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnb3JicycsICdnZngvb3Jicy5wbmcnLCAxMSwgMTEsIDMpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2J1bGxldHMnLCAnZ2Z4L3Nob3QucG5nJywgMTgsIDE3LCAzKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdhc3Rlcm9pZDEnLCAnZ2Z4L2FzdGVyb2lkMS5wbmcnLCA2NCwgNjQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2FzdGVyb2lkMicsICdnZngvYXN0ZXJvaWQyLnBuZycsIDY0LCA2NCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnZXhwbG9zaW9uJywgJ2dmeC9leHBsb3Npb24ucG5nJywgNjQsIDY0KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlKCkge1xuXG4gIC8vIEdhbWUgd29ybGRcbiAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgMCwgV09STERfV0lEVEgsIFdPUkxEX0hFSUdIVCk7XG4gIHZhciBzcGFjZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc3BhY2UnKTtcblxuICAvLyAgR2FtZSBpbnB1dFxuICBjdXJzb3JzID0gZ2FtZS5pbnB1dC5rZXlib2FyZC5jcmVhdGVDdXJzb3JLZXlzKCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbIFBoYXNlci5LZXlib2FyZC5TUEFDRUJBUiBdKTtcblxuICAvLyBPcmJzXG4gIG9yYnMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBvcmJzLmVuYWJsZUJvZHkgPSB0cnVlO1xuICBmb3IodmFyIGk9MDtpPDE1O2krKykge1xuICAgIHZhciBvcmIgPSBvcmJzLmNyZWF0ZShNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEggLSAxMSwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCAtIDExLCAnb3JicycsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSozKSk7XG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZShvcmIsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgb3JiLmJvZHkuYm91bmNlLnggPSBvcmIuYm9keS5ib3VuY2UueSA9IDE7XG4gICAgb3JiLmJvZHkuZ3Jhdml0eS54ID0gb3JiLmJvZHkuZ3Jhdml0eS55ID0gMDtcbiAgICBvcmIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjApO1xuICAgIG9yYi5hbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ob3JiLnJvdGF0aW9uLCAyMCwgb3JiLmJvZHkuYWNjZWxlcmF0aW9uKTtcbiAgfVxuXG4gIC8vIEJ1bGxldHNcbiAgYnVsbGV0cyA9IHsgcjogZ2FtZS5hZGQuZ3JvdXAoKSwgZzogZ2FtZS5hZGQuZ3JvdXAoKSwgYjogZ2FtZS5hZGQuZ3JvdXAoKSB9O1xuICB2YXIgZnJhbWVPZmZzZXRzID0ge3I6IDAsIGc6IDEsIGI6IDJ9O1xuICBmb3IodmFyIGMgaW4gYnVsbGV0cykge1xuICAgIGlmKCFidWxsZXRzLmhhc093blByb3BlcnR5KGMpKSBjb250aW51ZTtcbiAgICBidWxsZXRzW2NdLmVuYWJsZUJvZHkgPSB0cnVlO1xuICAgIGJ1bGxldHNbY10ucGh5c2ljc0JvZHlUeXBlID0gUGhhc2VyLlBoeXNpY3MuQVJDQURFO1xuICAgIGJ1bGxldHNbY10uY3JlYXRlTXVsdGlwbGUoNSwgJ2J1bGxldHMnLCBmcmFtZU9mZnNldHNbY10pO1xuICAgIGJ1bGxldHNbY10uc2V0QWxsKCdhbmNob3IueCcsIDAuNSk7XG4gICAgYnVsbGV0c1tjXS5zZXRBbGwoJ2FuY2hvci55JywgMC41KTtcbiAgfVxuXG4gIC8vIEFzdGVyb2lkc1xuICBhc3Rlcm9pZHMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBmb3IoaT0wOyBpIDwgMjA7IGkrKykge1xuICAgIHZhciBhc3Rlcm9pZCA9IGFzdGVyb2lkcy5jcmVhdGUoTWF0aC5yYW5kb20oKSAqIFdPUkxEX1dJRFRILCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hULCAnYXN0ZXJvaWQnICsgKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpKzEpLCAwKTtcbiAgICBhc3Rlcm9pZC5hbmNob3Iuc2V0KDAuNSk7XG4gICAgYXN0ZXJvaWQuYW5pbWF0aW9ucy5hZGQoJ3NwaW4nLCBudWxsLCAxMCwgdHJ1ZSk7XG4gICAgYXN0ZXJvaWQuYW5pbWF0aW9ucy5wbGF5KCdzcGluJyk7XG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZShhc3Rlcm9pZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBhc3Rlcm9pZC5ib2R5LmJvdW5jZS54ID0gYXN0ZXJvaWQuYm9keS5ib3VuY2UueSA9IDE7XG4gICAgYXN0ZXJvaWQuYm9keS5ncmF2aXR5LnggPSBhc3Rlcm9pZC5ib2R5LmdyYXZpdHkueSA9IDA7XG4gICAgYXN0ZXJvaWQuYm9keS5tYXhWZWxvY2l0eS5zZXQoMTAwKTtcbiAgICBhc3Rlcm9pZC5ib2R5Lm9mZnNldC5zZXQoMCwgMCk7XG4gICAgYXN0ZXJvaWQuYm9keS53aWR0aCA9IGFzdGVyb2lkLmJvZHkuaGVpZ2h0ID0gMzI7XG4gICAgYXN0ZXJvaWQuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKGFzdGVyb2lkLnJvdGF0aW9uLCBNYXRoLnJhbmRvbSgpICogMTAwLCBhc3Rlcm9pZC5ib2R5LmFjY2VsZXJhdGlvbik7XG4gICAgYXN0ZXJvaWQudHlwZSA9IFsncicsICdnJywgJ2InXVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKV07XG4gICAgc3dpdGNoKGFzdGVyb2lkLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3InOlxuICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHhmZjg4ODg7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2cnOlxuICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHg4OGZmODg7XG4gICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2InOlxuICAgICAgICBhc3Rlcm9pZC50aW50ID0gMHg4ODg4ZmY7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBQbGF5ZXJcbiAgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKGdhbWUud2lkdGggLyAyLCBnYW1lLmhlaWdodCAvIDIsICdwbGF5ZXInLCAxKTtcbiAgcGxheWVyLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLnNoaXAgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BsYXllcicsIDApO1xuICBwbGF5ZXIuc2hpcC5hbmNob3Iuc2V0KDAuNSk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuc2hpcCk7XG4gIGdhbWUucGh5c2ljcy5lbmFibGUocGxheWVyLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBwbGF5ZXIuYm9keS5kcmFnLnNldCgxMDApO1xuICBwbGF5ZXIuYm9keS5ib3VuY2Uuc2V0KDEpO1xuICBwbGF5ZXIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjAwKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLnNoaXAuYm9keS5tb3ZlcyA9IGZhbHNlO1xuICBnYW1lLmNhbWVyYS5mb2xsb3cocGxheWVyKTtcbi8qXG4gIC8vZXhwbG9zaW9uXG4gIHZhciBleHBsb3Npb24gPSBnYW1lLmFkZC5zcHJpdGUoMTAwLCAxMDAsICdleHBsb3Npb24nLCAwKTtcbiAgZXhwbG9zaW9uLmFuaW1hdGlvbnMuYWRkKCdib29tJywgbnVsbCwgMjAsIHRydWUpO1xuICBleHBsb3Npb24uYW5pbWF0aW9ucy5wbGF5KCdib29tJyk7XG4qL1xufVxuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIC8vIENvbGxpc2lvbnNcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKGFzdGVyb2lkcywgYXN0ZXJvaWRzKTtcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllciwgYXN0ZXJvaWRzLCBmdW5jdGlvbihwbGF5ZXIsIGFzdGVyb2lkKSB7XG4gIH0pO1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVyLCBvcmJzLCBjb2xsZWN0T3JiKTtcblxuICAvLyBDb250cm9sc1xuICBpZiAoY3Vyc29ycy51cC5pc0Rvd24pIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKHBsYXllci5yb3RhdGlvbiwgMjAwLCBwbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24pO1xuICBlbHNlIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi5zZXQoMCk7XG5cbiAgaWYgKGN1cnNvcnMubGVmdC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IC0zMDA7XG4gIGVsc2UgaWYgKGN1cnNvcnMucmlnaHQuaXNEb3duKSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAzMDA7XG4gIGVsc2UgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gMDtcblxuICBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSKSkgZmlyZUJ1bGxldCgpO1xuXG4gIG9yYnMuZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xuICBhc3Rlcm9pZHMuZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xufVxuXG5mdW5jdGlvbiB3b3JsZFdyYXAoc3ByaXRlKSB7XG4gIGlmKHNwcml0ZS54IDwgMCkgc3ByaXRlLnggPSBXT1JMRF9XSURUSDtcbiAgZWxzZSBpZihzcHJpdGUueCA+IFdPUkxEX1dJRFRIKSBzcHJpdGUueCA9IDA7XG5cbiAgaWYoc3ByaXRlLnkgPCAwKSBzcHJpdGUueSA9IFdPUkxEX0hFSUdIVDtcbiAgZWxzZSBpZihzcHJpdGUueSA+IFdPUkxEX0hFSUdIVCkgc3ByaXRlLnkgPSAwO1xufVxuXG5mdW5jdGlvbiBmaXJlQnVsbGV0ICgpIHtcbiAgaWYgKGdhbWUudGltZS5ub3cgPiBidWxsZXRUaW1lKSB7XG4gICAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbY3VycmVudENvbG9yXS5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG5cbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBidWxsZXQucmVzZXQocGxheWVyLmJvZHkueCArIDMwLCBwbGF5ZXIuYm9keS55ICsgMjApO1xuICAgICAgYnVsbGV0LmxpZmVzcGFuID0gMTUwMDtcbiAgICAgIGJ1bGxldC5yb3RhdGlvbiA9IHBsYXllci5yb3RhdGlvbjtcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUudmVsb2NpdHlGcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCA0MDAsIGJ1bGxldC5ib2R5LnZlbG9jaXR5KTtcbiAgICAgIGJ1bGxldFRpbWUgPSBnYW1lLnRpbWUubm93ICsgMTAwO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb2xsZWN0T3JiKHBsYXllciwgb3JiKSB7XG4gIHZhciBjb2xvciA9ICdyJztcbiAgc3dpdGNoKG9yYi5mcmFtZSkge1xuICAgIGNhc2UgMDpcbiAgICAgIGNvbG9yID0gJ3InO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIGNvbG9yID0gJ2cnO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgIGNvbG9yID0gJ2InO1xuICAgIGJyZWFrO1xuICB9XG4gIGNvbG9yQ291bnRbY29sb3JdKys7XG4gIHZhciBidWxsZXQgPSBidWxsZXRzW2NvbG9yXS5jcmVhdGUoMCwgMCwgJ2J1bGxldHMnLCBvcmIuZnJhbWUsIGZhbHNlKTtcbiAgYnVsbGV0LmFuY2hvci5zZXQoMC41KTtcbiAgY3VycmVudENvbG9yID0gY29sb3I7XG4gIG9yYi5yZXNldChNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEggLSAxMSwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCAtIDExLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSk7XG4gIHBsYXllci5mcmFtZSA9IG9yYi5mcmFtZSArIDE7XG5cbiAgb3JiLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ob3JiLnJvdGF0aW9uLCAyMCwgb3JiLmJvZHkuYWNjZWxlcmF0aW9uKTtcbn1cbiJdfQ==
