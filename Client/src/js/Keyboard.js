const SHIFT = 16;

const CTRL = [
  70, // f
  85, // u
  66, // b
  76, // l
  68, // d
  82 // r
];

const ROTATION = [
  90, // z
  88, // x
  67 // c
];

class Keyboard {
  constructor(game) {
    this.game = game;
    this.shift = false;

    this.keydown = this.keydown.bind(this);
	this.keyup = this.keyup.bind(this);
	
	this.keyboardMap = CTRL;
	
    window.addEventListener("keydown", this.keydown, false);
    window.addEventListener("keyup", this.keyup, false);
  }

  keydown(e) {
    if (e.keyCode === SHIFT) this.shift = true;

    if (CTRL.includes(e.keyCode)) {
      const modifier = this.shift ? `'` : `1`;
      const face = { 76: "L", 82: "R", 85: "U", 68: "D", 70: "F", 66: "B" }[
        e.keyCode
      ];

      const convertedMove = this.game.scrambler.convertMove(face + modifier);
      this.game.controls.keyboardMove("LAYER", convertedMove, () => {});
    } else if (ROTATION.includes(e.keyCode)) {
      const axis = { 90: "x", 88: "y", 67: "z" }[e.keyCode];
      const angle = ((this.shift ? 1 : -1) * Math.PI) / 2;

      this.game.controls.keyboardMove("CUBE", { axis, angle }, () => {});
    }
  }

  keyup(e) {
    if (e.keyCode === SHIFT) this.shift = false;
  }
}

export { Keyboard };
