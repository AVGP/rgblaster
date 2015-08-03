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
  game.load.spritesheet('asteroid3', 'gfx/asteroid3.png', 64, 64);
  game.load.spritesheet('asteroid4', 'gfx/asteroid4.png', 64, 64);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnJywgeyBwcmVsb2FkOiBwcmVsb2FkLCBjcmVhdGU6IGNyZWF0ZSwgdXBkYXRlOiB1cGRhdGUgfSksXG4gICAgcGxheWVyLCBjdXJzb3JzLCBhc3Rlcm9pZHMsIGN1cnJlbnRDb2xvciA9ICdyJywgY29sb3JDb3VudCA9IHtyOiA1LCBnOiA1LCBiOiA1fSwgYnVsbGV0VGltZSA9IDA7XG5cbnZhciBXT1JMRF9XSURUSCA9IDIwMjQsIFdPUkxEX0hFSUdIVCA9IDEyMzI7XG5cbmZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIGdhbWUubG9hZC5pbWFnZSgnc3BhY2UnLCAnZ2Z4L3NwYWNlLmpwZycpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3BsYXllcicsICdnZngvc2hpcC5wbmcnLCA2NCwgMzMsIDQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ29yYnMnLCAnZ2Z4L29yYnMucG5nJywgMTEsIDExLCAzKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdidWxsZXRzJywgJ2dmeC9zaG90LnBuZycsIDE4LCAxNywgMyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYXN0ZXJvaWQxJywgJ2dmeC9hc3Rlcm9pZDEucG5nJywgNjQsIDY0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdhc3Rlcm9pZDInLCAnZ2Z4L2FzdGVyb2lkMi5wbmcnLCA2NCwgNjQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2FzdGVyb2lkMycsICdnZngvYXN0ZXJvaWQzLnBuZycsIDY0LCA2NCk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYXN0ZXJvaWQ0JywgJ2dmeC9hc3Rlcm9pZDQucG5nJywgNjQsIDY0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdleHBsb3Npb24nLCAnZ2Z4L2V4cGxvc2lvbi5wbmcnLCA2NCwgNjQpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG5cbiAgLy8gR2FtZSB3b3JsZFxuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAwLCBXT1JMRF9XSURUSCwgV09STERfSEVJR0hUKTtcbiAgdmFyIHNwYWNlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzcGFjZScpO1xuXG4gIC8vICBHYW1lIGlucHV0XG4gIGN1cnNvcnMgPSBnYW1lLmlucHV0LmtleWJvYXJkLmNyZWF0ZUN1cnNvcktleXMoKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFsgUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSIF0pO1xuXG4gIC8vIE9yYnNcbiAgb3JicyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIG9yYnMuZW5hYmxlQm9keSA9IHRydWU7XG4gIGZvcih2YXIgaT0wO2k8MTU7aSsrKSB7XG4gICAgdmFyIG9yYiA9IG9yYnMuY3JlYXRlKE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsICdvcmJzJywgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjMpKTtcbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKG9yYiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBvcmIuYm9keS5ib3VuY2UueCA9IG9yYi5ib2R5LmJvdW5jZS55ID0gMTtcbiAgICBvcmIuYm9keS5ncmF2aXR5LnggPSBvcmIuYm9keS5ncmF2aXR5LnkgPSAwO1xuICAgIG9yYi5ib2R5Lm1heFZlbG9jaXR5LnNldCgyMCk7XG4gICAgb3JiLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihvcmIucm90YXRpb24sIDIwLCBvcmIuYm9keS5hY2NlbGVyYXRpb24pO1xuICB9XG5cbiAgLy8gQnVsbGV0c1xuICBidWxsZXRzID0geyByOiBnYW1lLmFkZC5ncm91cCgpLCBnOiBnYW1lLmFkZC5ncm91cCgpLCBiOiBnYW1lLmFkZC5ncm91cCgpIH07XG4gIHZhciBmcmFtZU9mZnNldHMgPSB7cjogMCwgZzogMSwgYjogMn07XG4gIGZvcih2YXIgYyBpbiBidWxsZXRzKSB7XG4gICAgaWYoIWJ1bGxldHMuaGFzT3duUHJvcGVydHkoYykpIGNvbnRpbnVlO1xuICAgIGJ1bGxldHNbY10uZW5hYmxlQm9keSA9IHRydWU7XG4gICAgYnVsbGV0c1tjXS5waHlzaWNzQm9keVR5cGUgPSBQaGFzZXIuUGh5c2ljcy5BUkNBREU7XG4gICAgYnVsbGV0c1tjXS5jcmVhdGVNdWx0aXBsZSg1LCAnYnVsbGV0cycsIGZyYW1lT2Zmc2V0c1tjXSk7XG4gICAgYnVsbGV0c1tjXS5zZXRBbGwoJ2FuY2hvci54JywgMC41KTtcbiAgICBidWxsZXRzW2NdLnNldEFsbCgnYW5jaG9yLnknLCAwLjUpO1xuICB9XG5cbiAgLy8gQXN0ZXJvaWRzXG4gIGFzdGVyb2lkcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIGZvcihpPTA7IGkgPCAyMDsgaSsrKSB7XG4gICAgdmFyIGFzdGVyb2lkID0gYXN0ZXJvaWRzLmNyZWF0ZShNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEgsIE1hdGgucmFuZG9tKCkgKiBXT1JMRF9IRUlHSFQsICdhc3Rlcm9pZCcgKyAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMikrMSksIDApO1xuICAgIGFzdGVyb2lkLmFuY2hvci5zZXQoMC41KTtcbiAgICBhc3Rlcm9pZC5hbmltYXRpb25zLmFkZCgnc3BpbicsIG51bGwsIDEwLCB0cnVlKTtcbiAgICBhc3Rlcm9pZC5hbmltYXRpb25zLnBsYXkoJ3NwaW4nKTtcbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKGFzdGVyb2lkLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIGFzdGVyb2lkLmJvZHkuYm91bmNlLnggPSBhc3Rlcm9pZC5ib2R5LmJvdW5jZS55ID0gMTtcbiAgICBhc3Rlcm9pZC5ib2R5LmdyYXZpdHkueCA9IGFzdGVyb2lkLmJvZHkuZ3Jhdml0eS55ID0gMDtcbiAgICBhc3Rlcm9pZC5ib2R5Lm1heFZlbG9jaXR5LnNldCgxMDApO1xuICAgIGFzdGVyb2lkLmJvZHkub2Zmc2V0LnNldCgwLCAwKTtcbiAgICBhc3Rlcm9pZC5ib2R5LndpZHRoID0gYXN0ZXJvaWQuYm9keS5oZWlnaHQgPSAzMjtcbiAgICBhc3Rlcm9pZC5hbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24oYXN0ZXJvaWQucm90YXRpb24sIE1hdGgucmFuZG9tKCkgKiAxMDAsIGFzdGVyb2lkLmJvZHkuYWNjZWxlcmF0aW9uKTtcbiAgICBhc3Rlcm9pZC50eXBlID0gWydyJywgJ2cnLCAnYiddW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpXTtcbiAgICBzd2l0Y2goYXN0ZXJvaWQudHlwZSkge1xuICAgICAgY2FzZSAncic6XG4gICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweGZmODg4ODtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZyc6XG4gICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ZmY4ODtcbiAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYic6XG4gICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ODhmZjtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFBsYXllclxuICBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoZ2FtZS53aWR0aCAvIDIsIGdhbWUuaGVpZ2h0IC8gMiwgJ3BsYXllcicsIDEpO1xuICBwbGF5ZXIuYW5jaG9yLnNldCgwLjUpO1xuICBwbGF5ZXIuc2hpcCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAncGxheWVyJywgMCk7XG4gIHBsYXllci5zaGlwLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLmFkZENoaWxkKHBsYXllci5zaGlwKTtcbiAgZ2FtZS5waHlzaWNzLmVuYWJsZShwbGF5ZXIsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gIHBsYXllci5ib2R5LmRyYWcuc2V0KDEwMCk7XG4gIHBsYXllci5ib2R5LmJvdW5jZS5zZXQoMSk7XG4gIHBsYXllci5ib2R5Lm1heFZlbG9jaXR5LnNldCgyMDApO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuc2hpcC5ib2R5Lm1vdmVzID0gZmFsc2U7XG4gIGdhbWUuY2FtZXJhLmZvbGxvdyhwbGF5ZXIpO1xuLypcbiAgLy9leHBsb3Npb25cbiAgdmFyIGV4cGxvc2lvbiA9IGdhbWUuYWRkLnNwcml0ZSgxMDAsIDEwMCwgJ2V4cGxvc2lvbicsIDApO1xuICBleHBsb3Npb24uYW5pbWF0aW9ucy5hZGQoJ2Jvb20nLCBudWxsLCAyMCwgdHJ1ZSk7XG4gIGV4cGxvc2lvbi5hbmltYXRpb25zLnBsYXkoJ2Jvb20nKTtcbiovXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgLy8gQ29sbGlzaW9uc1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoYXN0ZXJvaWRzLCBhc3Rlcm9pZHMpO1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVyLCBhc3Rlcm9pZHMsIGZ1bmN0aW9uKHBsYXllciwgYXN0ZXJvaWQpIHtcbiAgfSk7XG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXIsIG9yYnMsIGNvbGxlY3RPcmIpO1xuXG4gIC8vIENvbnRyb2xzXG4gIGlmIChjdXJzb3JzLnVwLmlzRG93bikgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCAyMDAsIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIGVsc2UgcGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnNldCgwKTtcblxuICBpZiAoY3Vyc29ycy5sZWZ0LmlzRG93bikgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gLTMwMDtcbiAgZWxzZSBpZiAoY3Vyc29ycy5yaWdodC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IDMwMDtcbiAgZWxzZSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAwO1xuXG4gIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuU1BBQ0VCQVIpKSBmaXJlQnVsbGV0KCk7XG5cbiAgb3Jicy5mb3JFYWNoRXhpc3RzKHdvcmxkV3JhcCk7XG4gIGFzdGVyb2lkcy5mb3JFYWNoRXhpc3RzKHdvcmxkV3JhcCk7XG59XG5cbmZ1bmN0aW9uIHdvcmxkV3JhcChzcHJpdGUpIHtcbiAgaWYoc3ByaXRlLnggPCAwKSBzcHJpdGUueCA9IFdPUkxEX1dJRFRIO1xuICBlbHNlIGlmKHNwcml0ZS54ID4gV09STERfV0lEVEgpIHNwcml0ZS54ID0gMDtcblxuICBpZihzcHJpdGUueSA8IDApIHNwcml0ZS55ID0gV09STERfSEVJR0hUO1xuICBlbHNlIGlmKHNwcml0ZS55ID4gV09STERfSEVJR0hUKSBzcHJpdGUueSA9IDA7XG59XG5cbmZ1bmN0aW9uIGZpcmVCdWxsZXQgKCkge1xuICBpZiAoZ2FtZS50aW1lLm5vdyA+IGJ1bGxldFRpbWUpIHtcbiAgICB2YXIgYnVsbGV0ID0gYnVsbGV0c1tjdXJyZW50Q29sb3JdLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcblxuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5yZXNldChwbGF5ZXIuYm9keS54ICsgMzAsIHBsYXllci5ib2R5LnkgKyAyMCk7XG4gICAgICBidWxsZXQubGlmZXNwYW4gPSAxNTAwO1xuICAgICAgYnVsbGV0LnJvdGF0aW9uID0gcGxheWVyLnJvdGF0aW9uO1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS52ZWxvY2l0eUZyb21Sb3RhdGlvbihwbGF5ZXIucm90YXRpb24sIDQwMCwgYnVsbGV0LmJvZHkudmVsb2NpdHkpO1xuICAgICAgYnVsbGV0VGltZSA9IGdhbWUudGltZS5ub3cgKyAxMDA7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RPcmIocGxheWVyLCBvcmIpIHtcbiAgdmFyIGNvbG9yID0gJ3InO1xuICBzd2l0Y2gob3JiLmZyYW1lKSB7XG4gICAgY2FzZSAwOlxuICAgICAgY29sb3IgPSAncic7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgICAgY29sb3IgPSAnZyc7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgY29sb3IgPSAnYic7XG4gICAgYnJlYWs7XG4gIH1cbiAgY29sb3JDb3VudFtjb2xvcl0rKztcbiAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbY29sb3JdLmNyZWF0ZSgwLCAwLCAnYnVsbGV0cycsIG9yYi5mcmFtZSwgZmFsc2UpO1xuICBidWxsZXQuYW5jaG9yLnNldCgwLjUpO1xuICBjdXJyZW50Q29sb3IgPSBjb2xvcjtcbiAgb3JiLnJlc2V0KE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpKTtcbiAgcGxheWVyLmZyYW1lID0gb3JiLmZyYW1lICsgMTtcblxuICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihvcmIucm90YXRpb24sIDIwLCBvcmIuYm9keS5hY2NlbGVyYXRpb24pO1xufVxuIl19
