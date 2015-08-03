(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, asteroids, explosions, currentColor = 'r', colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0;

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
  asteroids = {r: game.add.group(), g: game.add.group(), b: game.add.group() };
  ['r', 'g', 'b'].forEach(function(type) {
    for(i=0; i < 20; i++) {
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

  game.physics.arcade.collide(player, orbs, collectOrb);

  // Controls
  if (cursors.up.isDown) game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
  else player.body.acceleration.set(0);

  if (cursors.left.isDown) player.body.angularVelocity = -300;
  else if (cursors.right.isDown) player.body.angularVelocity = 300;
  else player.body.angularVelocity = 0;

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) fireBullet();

  orbs.forEachExists(worldWrap);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnJywgeyBwcmVsb2FkOiBwcmVsb2FkLCBjcmVhdGU6IGNyZWF0ZSwgdXBkYXRlOiB1cGRhdGUgfSksXG4gICAgcGxheWVyLCBjdXJzb3JzLCBhc3Rlcm9pZHMsIGV4cGxvc2lvbnMsIGN1cnJlbnRDb2xvciA9ICdyJywgY29sb3JDb3VudCA9IHtyOiA1LCBnOiA1LCBiOiA1fSwgYnVsbGV0VGltZSA9IDA7XG5cbnZhciBXT1JMRF9XSURUSCA9IDIwMjQsIFdPUkxEX0hFSUdIVCA9IDEyMzI7XG5cbmZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIGdhbWUubG9hZC5pbWFnZSgnc3BhY2UnLCAnZ2Z4L3NwYWNlLmpwZycpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3BsYXllcicsICdnZngvc2hpcC5wbmcnLCA2NCwgMzMsIDQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ29yYnMnLCAnZ2Z4L29yYnMucG5nJywgMTEsIDExLCAzKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdidWxsZXRzJywgJ2dmeC9zaG90LnBuZycsIDE4LCAxNywgMyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYXN0ZXJvaWQxJywgJ2dmeC9hc3Rlcm9pZDEucG5nJywgNjQsIDY0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdhc3Rlcm9pZDInLCAnZ2Z4L2FzdGVyb2lkMi5wbmcnLCA2NCwgNjQpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2V4cGxvc2lvbicsICdnZngvZXhwbG9zaW9uLnBuZycsIDY0LCA2NCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZSgpIHtcblxuICAvLyBHYW1lIHdvcmxkXG4gIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIDAsIFdPUkxEX1dJRFRILCBXT1JMRF9IRUlHSFQpO1xuICB2YXIgc3BhY2UgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3NwYWNlJyk7XG5cbiAgLy8gIEdhbWUgaW5wdXRcbiAgY3Vyc29ycyA9IGdhbWUuaW5wdXQua2V5Ym9hcmQuY3JlYXRlQ3Vyc29yS2V5cygpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoWyBQaGFzZXIuS2V5Ym9hcmQuU1BBQ0VCQVIgXSk7XG5cbiAgLy8gT3Jic1xuICBvcmJzID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgb3Jicy5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgZm9yKHZhciBpPTA7aTwxNTtpKyspIHtcbiAgICB2YXIgb3JiID0gb3Jicy5jcmVhdGUoTWF0aC5yYW5kb20oKSAqIFdPUkxEX1dJRFRIIC0gMTEsIE1hdGgucmFuZG9tKCkgKiBXT1JMRF9IRUlHSFQgLSAxMSwgJ29yYnMnLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMykpO1xuICAgIGdhbWUucGh5c2ljcy5lbmFibGUob3JiLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIG9yYi5ib2R5LmJvdW5jZS54ID0gb3JiLmJvZHkuYm91bmNlLnkgPSAxO1xuICAgIG9yYi5ib2R5LmdyYXZpdHkueCA9IG9yYi5ib2R5LmdyYXZpdHkueSA9IDA7XG4gICAgb3JiLmJvZHkubWF4VmVsb2NpdHkuc2V0KDIwKTtcbiAgICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKG9yYi5yb3RhdGlvbiwgMjAsIG9yYi5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIH1cblxuICAvLyBCdWxsZXRzXG4gIGJ1bGxldHMgPSB7IHI6IGdhbWUuYWRkLmdyb3VwKCksIGc6IGdhbWUuYWRkLmdyb3VwKCksIGI6IGdhbWUuYWRkLmdyb3VwKCkgfTtcbiAgdmFyIGZyYW1lT2Zmc2V0cyA9IHtyOiAwLCBnOiAxLCBiOiAyfTtcbiAgZm9yKHZhciBjIGluIGJ1bGxldHMpIHtcbiAgICBpZighYnVsbGV0cy5oYXNPd25Qcm9wZXJ0eShjKSkgY29udGludWU7XG4gICAgYnVsbGV0c1tjXS5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgICBidWxsZXRzW2NdLnBoeXNpY3NCb2R5VHlwZSA9IFBoYXNlci5QaHlzaWNzLkFSQ0FERTtcbiAgICBidWxsZXRzW2NdLmNyZWF0ZU11bHRpcGxlKDUsICdidWxsZXRzJywgZnJhbWVPZmZzZXRzW2NdKTtcbiAgICBidWxsZXRzW2NdLnNldEFsbCgnYW5jaG9yLngnLCAwLjUpO1xuICAgIGJ1bGxldHNbY10uc2V0QWxsKCdhbmNob3IueScsIDAuNSk7XG4gIH1cblxuICAvLyBBc3Rlcm9pZHNcbiAgYXN0ZXJvaWRzID0ge3I6IGdhbWUuYWRkLmdyb3VwKCksIGc6IGdhbWUuYWRkLmdyb3VwKCksIGI6IGdhbWUuYWRkLmdyb3VwKCkgfTtcbiAgWydyJywgJ2cnLCAnYiddLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICAgIGZvcihpPTA7IGkgPCAyMDsgaSsrKSB7XG4gICAgICB2YXIgYXN0ZXJvaWQgPSBhc3Rlcm9pZHNbdHlwZV0uY3JlYXRlKE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCwgJ2FzdGVyb2lkJyArIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSsxKSwgMCk7XG4gICAgICBhc3Rlcm9pZC5hbmNob3Iuc2V0KDAuNSk7XG4gICAgICBhc3Rlcm9pZC5hbmltYXRpb25zLmFkZCgnc3BpbicsIG51bGwsIDEwLCB0cnVlKTtcbiAgICAgIGFzdGVyb2lkLmFuaW1hdGlvbnMucGxheSgnc3BpbicpO1xuICAgICAgZ2FtZS5waHlzaWNzLmVuYWJsZShhc3Rlcm9pZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkuYm91bmNlLnggPSBhc3Rlcm9pZC5ib2R5LmJvdW5jZS55ID0gMTtcbiAgICAgIGFzdGVyb2lkLmJvZHkuZ3Jhdml0eS54ID0gYXN0ZXJvaWQuYm9keS5ncmF2aXR5LnkgPSAwO1xuICAgICAgYXN0ZXJvaWQuYm9keS5tYXhWZWxvY2l0eS5zZXQoMTAwKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkub2Zmc2V0LnNldCgwLCAwKTtcbiAgICAgIGFzdGVyb2lkLmJvZHkud2lkdGggPSBhc3Rlcm9pZC5ib2R5LmhlaWdodCA9IDMyO1xuICAgICAgYXN0ZXJvaWQuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24oYXN0ZXJvaWQucm90YXRpb24sIE1hdGgucmFuZG9tKCkgKiAxMDAsIGFzdGVyb2lkLmJvZHkuYWNjZWxlcmF0aW9uKTtcbiAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweGZmODg4ODtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2cnOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ZmY4ODtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgIGFzdGVyb2lkLnRpbnQgPSAweDg4ODhmZjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBQbGF5ZXJcbiAgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKGdhbWUud2lkdGggLyAyLCBnYW1lLmhlaWdodCAvIDIsICdwbGF5ZXInLCAxKTtcbiAgcGxheWVyLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLnNoaXAgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BsYXllcicsIDApO1xuICBwbGF5ZXIuc2hpcC5hbmNob3Iuc2V0KDAuNSk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuc2hpcCk7XG4gIGdhbWUucGh5c2ljcy5lbmFibGUocGxheWVyLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBwbGF5ZXIuYm9keS5kcmFnLnNldCgxMDApO1xuICBwbGF5ZXIuYm9keS5ib3VuY2Uuc2V0KDEpO1xuICBwbGF5ZXIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjAwKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLnNoaXAuYm9keS5tb3ZlcyA9IGZhbHNlO1xuICBnYW1lLmNhbWVyYS5mb2xsb3cocGxheWVyKTtcblxuICBleHBsb3Npb25zID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICAvLyBDb2xsaXNpb25zXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShhc3Rlcm9pZHMsIGFzdGVyb2lkcyk7XG4gIFsncicsICdnJywgJ2InXS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVyLCBhc3Rlcm9pZHNbdHlwZV0sIGZ1bmN0aW9uKHBsYXllciwgYXN0ZXJvaWQpIHtcbiAgICAgIHZhciBleHBsb3Npb24gPSBleHBsb3Npb25zLmNyZWF0ZShwbGF5ZXIuYm9keS54LCBwbGF5ZXIuYm9keS55LCAnZXhwbG9zaW9uJywgMCk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5hZGQoJ2Jvb20nLCBudWxsLCAyMCwgZmFsc2UpO1xuICAgICAgZXhwbG9zaW9uLmFuaW1hdGlvbnMucGxheSgnYm9vbScpO1xuICAgIH0pO1xuXG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKGJ1bGxldHNbdHlwZV0sIGFzdGVyb2lkc1t0eXBlXSwgZnVuY3Rpb24oYnVsbGV0LCBhc3Rlcm9pZCkge1xuICAgICAgdmFyIGV4cGxvc2lvbiA9IGV4cGxvc2lvbnMuY3JlYXRlKGFzdGVyb2lkLmJvZHkueCwgYXN0ZXJvaWQuYm9keS55LCAnZXhwbG9zaW9uJywgMCk7XG4gICAgICBleHBsb3Npb24uYW5pbWF0aW9ucy5hZGQoJ2Jvb20nLCBudWxsLCAyMCwgZmFsc2UpO1xuICAgICAgZXhwbG9zaW9uLmFuaW1hdGlvbnMucGxheSgnYm9vbScpO1xuICAgICAgYXN0ZXJvaWQua2lsbCgpO1xuICAgICAgYnVsbGV0LmtpbGwoKTtcbiAgICB9KTtcbiAgICBhc3Rlcm9pZHNbdHlwZV0uZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xuICB9KTtcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVyLCBvcmJzLCBjb2xsZWN0T3JiKTtcblxuICAvLyBDb250cm9sc1xuICBpZiAoY3Vyc29ycy51cC5pc0Rvd24pIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKHBsYXllci5yb3RhdGlvbiwgMjAwLCBwbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24pO1xuICBlbHNlIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi5zZXQoMCk7XG5cbiAgaWYgKGN1cnNvcnMubGVmdC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IC0zMDA7XG4gIGVsc2UgaWYgKGN1cnNvcnMucmlnaHQuaXNEb3duKSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAzMDA7XG4gIGVsc2UgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gMDtcblxuICBpZiAoZ2FtZS5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSKSkgZmlyZUJ1bGxldCgpO1xuXG4gIG9yYnMuZm9yRWFjaEV4aXN0cyh3b3JsZFdyYXApO1xufVxuXG5mdW5jdGlvbiB3b3JsZFdyYXAoc3ByaXRlKSB7XG4gIGlmKHNwcml0ZS54IDwgMCkgc3ByaXRlLnggPSBXT1JMRF9XSURUSDtcbiAgZWxzZSBpZihzcHJpdGUueCA+IFdPUkxEX1dJRFRIKSBzcHJpdGUueCA9IDA7XG5cbiAgaWYoc3ByaXRlLnkgPCAwKSBzcHJpdGUueSA9IFdPUkxEX0hFSUdIVDtcbiAgZWxzZSBpZihzcHJpdGUueSA+IFdPUkxEX0hFSUdIVCkgc3ByaXRlLnkgPSAwO1xufVxuXG5mdW5jdGlvbiBmaXJlQnVsbGV0ICgpIHtcbiAgaWYgKGdhbWUudGltZS5ub3cgPiBidWxsZXRUaW1lKSB7XG4gICAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbY3VycmVudENvbG9yXS5nZXRGaXJzdEV4aXN0cyhmYWxzZSk7XG5cbiAgICBpZiAoYnVsbGV0KSB7XG4gICAgICBidWxsZXQucmVzZXQocGxheWVyLmJvZHkueCArIDMwLCBwbGF5ZXIuYm9keS55ICsgMjApO1xuICAgICAgYnVsbGV0LmxpZmVzcGFuID0gMTUwMDtcbiAgICAgIGJ1bGxldC5yb3RhdGlvbiA9IHBsYXllci5yb3RhdGlvbjtcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUudmVsb2NpdHlGcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCA0MDAsIGJ1bGxldC5ib2R5LnZlbG9jaXR5KTtcbiAgICAgIGJ1bGxldFRpbWUgPSBnYW1lLnRpbWUubm93ICsgMTAwO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb2xsZWN0T3JiKHBsYXllciwgb3JiKSB7XG4gIHZhciBjb2xvciA9ICdyJztcbiAgc3dpdGNoKG9yYi5mcmFtZSkge1xuICAgIGNhc2UgMDpcbiAgICAgIGNvbG9yID0gJ3InO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIGNvbG9yID0gJ2cnO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgIGNvbG9yID0gJ2InO1xuICAgIGJyZWFrO1xuICB9XG4gIGNvbG9yQ291bnRbY29sb3JdKys7XG4gIHZhciBidWxsZXQgPSBidWxsZXRzW2NvbG9yXS5jcmVhdGUoMCwgMCwgJ2J1bGxldHMnLCBvcmIuZnJhbWUsIGZhbHNlKTtcbiAgYnVsbGV0LmFuY2hvci5zZXQoMC41KTtcbiAgY3VycmVudENvbG9yID0gY29sb3I7XG4gIG9yYi5yZXNldChNYXRoLnJhbmRvbSgpICogV09STERfV0lEVEggLSAxMSwgTWF0aC5yYW5kb20oKSAqIFdPUkxEX0hFSUdIVCAtIDExLCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSk7XG4gIHBsYXllci5mcmFtZSA9IG9yYi5mcmFtZSArIDE7XG5cbiAgb3JiLmFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ob3JiLnJvdGF0aW9uLCAyMCwgb3JiLmJvZHkuYWNjZWxlcmF0aW9uKTtcbn1cbiJdfQ==
