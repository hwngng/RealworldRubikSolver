this.size = 3;
const m = this.size - 1;
const first =
  this.size % 2 !== 0 ? 0 - Math.floor(this.size / 2) : 0.5 - this.size / 2;

let x, y, z;

this.positions = [];

for (x = 0; x < this.size; x++) {
  for (y = 0; y < this.size; y++) {
    for (z = 0; z < this.size; z++) {
      let position = new THREE.Vector3(first + x, first + y, first + z);
      let edges = [];

      if (x == 0) edges.push(0);
      if (x == m) edges.push(1);
      if (y == 0) edges.push(2);
      if (y == m) edges.push(3);
      if (z == 0) edges.push(4);
      if (z == m) edges.push(5);

      position.edges = edges;
      this.positions.push(position);
      console.log(this.positions);
    }
  }
}
