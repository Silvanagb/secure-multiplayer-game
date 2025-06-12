export default class Player {
  constructor(id) {
    this.id = id;
    this.score = 0;
    this.x = Math.floor(Math.random() * 500);
    this.y = Math.floor(Math.random() * 500);
  }

  movePlayer(direction, amount) {
    switch(direction) {
      case 'up': this.y -= amount; break;
      case 'down': this.y += amount; break;
      case 'left': this.x -= amount; break;
      case 'right': this.x += amount; break;
    }
  }

  calculateRank(players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${players.length}`;
  }

  collision(item) {
    return (
      this.x < item.x + 20 &&
      this.x + 20 > item.x &&
      this.y < item.y + 20 &&
      this.y + 20 > item.y
    );
  }
}