function Collectible(id) {
  this.id = id;
  this.value = 1;
  this.x = Math.floor(Math.random() * 500);
  this.y = Math.floor(Math.random() * 500);
}

module.exports = Collectible;
