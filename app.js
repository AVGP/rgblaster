(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update }),
    player, cursors, currentColor = 'r', colorCount = {r: 5, g: 5, b: 5}, bulletTime = 0;

var WORLD_WIDTH = 2024, WORLD_HEIGHT = 1232;

function preload() {
  game.load.image('space', 'gfx/space.jpg');
  game.load.spritesheet('player', 'gfx/ship.png', 64, 33, 4);
  game.load.spritesheet('orbs', 'gfx/orbs.png', 11, 11, 3);
  game.load.spritesheet('bullets', 'gfx/shot.png', 18, 17, 3);
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
    orb.body.drag.set(100);
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

  // Player
  player = game.add.sprite(game.width / 2, game.height / 2, 'player', 1);
  player.anchor.set(0.5);
  player.ship = game.add.sprite(0, 0, 'player', 0);
  player.ship.anchor.set(0.5);
  player.addChild(player.ship);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.drag.set(100);
  player.body.maxVelocity.set(200);
  player.body.collideWorldBounds = true;
  player.ship.body.moves = false;
  game.camera.follow(player);
}

function update() {
  player.bringToTop();
  // Collisions
  game.physics.arcade.overlap(player, orbs, collectOrb);

  // Controls
  if (cursors.up.isDown) game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
  else player.body.acceleration.set(0);

  if (cursors.left.isDown) player.body.angularVelocity = -300;
  else if (cursors.right.isDown) player.body.angularVelocity = 300;
  else player.body.angularVelocity = 0;

  if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) fireBullet();

  // orbs wrapping
  orbs.forEachExists(function(orb) {
    if(orb.x < 0) orb.x = WORLD_WIDTH;
    else if(orb.x > WORLD_WIDTH) orb.x = 0;
      if(orb.y < 0) orb.y = WORLD_HEIGHT;
      else if(orb.y > WORLD_HEIGHT) orb.y = 0;
  }, this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA2MDAsIFBoYXNlci5BVVRPLCAnJywgeyBwcmVsb2FkOiBwcmVsb2FkLCBjcmVhdGU6IGNyZWF0ZSwgdXBkYXRlOiB1cGRhdGUgfSksXG4gICAgcGxheWVyLCBjdXJzb3JzLCBjdXJyZW50Q29sb3IgPSAncicsIGNvbG9yQ291bnQgPSB7cjogNSwgZzogNSwgYjogNX0sIGJ1bGxldFRpbWUgPSAwO1xuXG52YXIgV09STERfV0lEVEggPSAyMDI0LCBXT1JMRF9IRUlHSFQgPSAxMjMyO1xuXG5mdW5jdGlvbiBwcmVsb2FkKCkge1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3NwYWNlJywgJ2dmeC9zcGFjZS5qcGcnKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwbGF5ZXInLCAnZ2Z4L3NoaXAucG5nJywgNjQsIDMzLCA0KTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdvcmJzJywgJ2dmeC9vcmJzLnBuZycsIDExLCAxMSwgMyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYnVsbGV0cycsICdnZngvc2hvdC5wbmcnLCAxOCwgMTcsIDMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG5cbiAgLy8gR2FtZSB3b3JsZFxuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAwLCBXT1JMRF9XSURUSCwgV09STERfSEVJR0hUKTtcbiAgdmFyIHNwYWNlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzcGFjZScpO1xuXG4gIC8vICBHYW1lIGlucHV0XG4gIGN1cnNvcnMgPSBnYW1lLmlucHV0LmtleWJvYXJkLmNyZWF0ZUN1cnNvcktleXMoKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFsgUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSIF0pO1xuXG4gIC8vIE9yYnNcbiAgb3JicyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIG9yYnMuZW5hYmxlQm9keSA9IHRydWU7XG4gIGZvcih2YXIgaT0wO2k8MTU7aSsrKSB7XG4gICAgdmFyIG9yYiA9IG9yYnMuY3JlYXRlKE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsICdvcmJzJywgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjMpKTtcbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKG9yYiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBvcmIuYm9keS5kcmFnLnNldCgxMDApO1xuICAgIG9yYi5ib2R5LmJvdW5jZS54ID0gb3JiLmJvZHkuYm91bmNlLnkgPSAxO1xuICAgIG9yYi5ib2R5LmdyYXZpdHkueCA9IG9yYi5ib2R5LmdyYXZpdHkueSA9IDA7XG4gICAgb3JiLmJvZHkubWF4VmVsb2NpdHkuc2V0KDIwKTtcbiAgICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuYWNjZWxlcmF0aW9uRnJvbVJvdGF0aW9uKG9yYi5yb3RhdGlvbiwgMjAsIG9yYi5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIH1cblxuICAvLyBCdWxsZXRzXG4gIGJ1bGxldHMgPSB7IHI6IGdhbWUuYWRkLmdyb3VwKCksIGc6IGdhbWUuYWRkLmdyb3VwKCksIGI6IGdhbWUuYWRkLmdyb3VwKCkgfTtcbiAgdmFyIGZyYW1lT2Zmc2V0cyA9IHtyOiAwLCBnOiAxLCBiOiAyfTtcbiAgZm9yKHZhciBjIGluIGJ1bGxldHMpIHtcbiAgICBpZighYnVsbGV0cy5oYXNPd25Qcm9wZXJ0eShjKSkgY29udGludWU7XG4gICAgYnVsbGV0c1tjXS5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgICBidWxsZXRzW2NdLnBoeXNpY3NCb2R5VHlwZSA9IFBoYXNlci5QaHlzaWNzLkFSQ0FERTtcbiAgICBidWxsZXRzW2NdLmNyZWF0ZU11bHRpcGxlKDUsICdidWxsZXRzJywgZnJhbWVPZmZzZXRzW2NdKTtcbiAgICBidWxsZXRzW2NdLnNldEFsbCgnYW5jaG9yLngnLCAwLjUpO1xuICAgIGJ1bGxldHNbY10uc2V0QWxsKCdhbmNob3IueScsIDAuNSk7XG4gIH1cblxuICAvLyBQbGF5ZXJcbiAgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKGdhbWUud2lkdGggLyAyLCBnYW1lLmhlaWdodCAvIDIsICdwbGF5ZXInLCAxKTtcbiAgcGxheWVyLmFuY2hvci5zZXQoMC41KTtcbiAgcGxheWVyLnNoaXAgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3BsYXllcicsIDApO1xuICBwbGF5ZXIuc2hpcC5hbmNob3Iuc2V0KDAuNSk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuc2hpcCk7XG4gIGdhbWUucGh5c2ljcy5lbmFibGUocGxheWVyLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBwbGF5ZXIuYm9keS5kcmFnLnNldCgxMDApO1xuICBwbGF5ZXIuYm9keS5tYXhWZWxvY2l0eS5zZXQoMjAwKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLnNoaXAuYm9keS5tb3ZlcyA9IGZhbHNlO1xuICBnYW1lLmNhbWVyYS5mb2xsb3cocGxheWVyKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBwbGF5ZXIuYnJpbmdUb1RvcCgpO1xuICAvLyBDb2xsaXNpb25zXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChwbGF5ZXIsIG9yYnMsIGNvbGxlY3RPcmIpO1xuXG4gIC8vIENvbnRyb2xzXG4gIGlmIChjdXJzb3JzLnVwLmlzRG93bikgZ2FtZS5waHlzaWNzLmFyY2FkZS5hY2NlbGVyYXRpb25Gcm9tUm90YXRpb24ocGxheWVyLnJvdGF0aW9uLCAyMDAsIHBsYXllci5ib2R5LmFjY2VsZXJhdGlvbik7XG4gIGVsc2UgcGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnNldCgwKTtcblxuICBpZiAoY3Vyc29ycy5sZWZ0LmlzRG93bikgcGxheWVyLmJvZHkuYW5ndWxhclZlbG9jaXR5ID0gLTMwMDtcbiAgZWxzZSBpZiAoY3Vyc29ycy5yaWdodC5pc0Rvd24pIHBsYXllci5ib2R5LmFuZ3VsYXJWZWxvY2l0eSA9IDMwMDtcbiAgZWxzZSBwbGF5ZXIuYm9keS5hbmd1bGFyVmVsb2NpdHkgPSAwO1xuXG4gIGlmIChnYW1lLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuU1BBQ0VCQVIpKSBmaXJlQnVsbGV0KCk7XG5cbiAgLy8gb3JicyB3cmFwcGluZ1xuICBvcmJzLmZvckVhY2hFeGlzdHMoZnVuY3Rpb24ob3JiKSB7XG4gICAgaWYob3JiLnggPCAwKSBvcmIueCA9IFdPUkxEX1dJRFRIO1xuICAgIGVsc2UgaWYob3JiLnggPiBXT1JMRF9XSURUSCkgb3JiLnggPSAwO1xuICAgICAgaWYob3JiLnkgPCAwKSBvcmIueSA9IFdPUkxEX0hFSUdIVDtcbiAgICAgIGVsc2UgaWYob3JiLnkgPiBXT1JMRF9IRUlHSFQpIG9yYi55ID0gMDtcbiAgfSwgdGhpcyk7XG59XG5cbmZ1bmN0aW9uIGZpcmVCdWxsZXQgKCkge1xuICBpZiAoZ2FtZS50aW1lLm5vdyA+IGJ1bGxldFRpbWUpIHtcbiAgICB2YXIgYnVsbGV0ID0gYnVsbGV0c1tjdXJyZW50Q29sb3JdLmdldEZpcnN0RXhpc3RzKGZhbHNlKTtcblxuICAgIGlmIChidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5yZXNldChwbGF5ZXIuYm9keS54ICsgMzAsIHBsYXllci5ib2R5LnkgKyAyMCk7XG4gICAgICBidWxsZXQubGlmZXNwYW4gPSAxNTAwO1xuICAgICAgYnVsbGV0LnJvdGF0aW9uID0gcGxheWVyLnJvdGF0aW9uO1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS52ZWxvY2l0eUZyb21Sb3RhdGlvbihwbGF5ZXIucm90YXRpb24sIDQwMCwgYnVsbGV0LmJvZHkudmVsb2NpdHkpO1xuICAgICAgYnVsbGV0VGltZSA9IGdhbWUudGltZS5ub3cgKyAxMDA7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RPcmIocGxheWVyLCBvcmIpIHtcbiAgdmFyIGNvbG9yID0gJ3InO1xuICBzd2l0Y2gob3JiLmZyYW1lKSB7XG4gICAgY2FzZSAwOlxuICAgICAgY29sb3IgPSAncic7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgICAgY29sb3IgPSAnZyc7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgY29sb3IgPSAnYic7XG4gICAgYnJlYWs7XG4gIH1cbiAgY29sb3JDb3VudFtjb2xvcl0rKztcbiAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbY29sb3JdLmNyZWF0ZSgwLCAwLCAnYnVsbGV0cycsIG9yYi5mcmFtZSwgZmFsc2UpO1xuICBidWxsZXQuYW5jaG9yLnNldCgwLjUpO1xuICBjdXJyZW50Q29sb3IgPSBjb2xvcjtcbiAgb3JiLnJlc2V0KE1hdGgucmFuZG9tKCkgKiBXT1JMRF9XSURUSCAtIDExLCBNYXRoLnJhbmRvbSgpICogV09STERfSEVJR0hUIC0gMTEsIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpKTtcbiAgcGxheWVyLmZyYW1lID0gb3JiLmZyYW1lICsgMTtcblxuICBvcmIuYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmFjY2VsZXJhdGlvbkZyb21Sb3RhdGlvbihvcmIucm90YXRpb24sIDIwLCBvcmIuYm9keS5hY2NlbGVyYXRpb24pO1xufVxuIl19
