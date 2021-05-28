import {
	World
} from "./World.js";
import {
	Cube
} from "./Cube.js";
import {
	Controls
} from "./Controls.js";
import {
	Scrambler
} from "./Scrambler.js";
import {
	Transition
} from "./Transition.js";
import {
	Timer
} from "./Timer.js";
import {
	Preferences
} from "./Preferences.js";
import {
	Confetti
} from "./Confetti.js";
import {
	Scores
} from "./Scores.js";
import {
	Storage
} from "./Storage.js";
import {
	Themes
} from "./Themes.js";
import {
	ThemeEditor
} from "./ThemeEditor.js";
import {
	States
} from "./States.js";
import {
	Keyboard
} from "./Keyboard.js";
import {
	Icons
} from "./Icons.js";

const STATE = {
	Menu: 0,
	Playing: 1,
	Complete: 2,
	Stats: 3,
	Prefs: 4,
	Theme: 5
};

var BUTTONS = {
	Menu: ["stats", "prefs"],
	Playing: ["back", "manual", "auto"],
	Complete: [],
	Stats: [],
	Prefs: ["back", "theme"],
	Theme: ["back", "reset"],
	None: []
};

const SHOW = true;
const HIDE = false;

class Game {
	constructor() {
		this.dom = {
			ui: document.querySelector(".ui"),
			game: document.querySelector(".ui__game"),
			back: document.querySelector(".ui__background"),
			prefs: document.querySelector(".ui__prefs"),
			theme: document.querySelector(".ui__theme"),
			stats: document.querySelector(".ui__stats"),
			texts: {
				title: document.querySelector(".text--title"),
				note: document.querySelector(".text--note"),
				timer: document.querySelector(".text--timer"),
				complete: document.querySelector(".text--complete"),
				best: document.querySelector(".text--best-time"),
				theme: document.querySelector(".text--theme")
			},
			buttons: {
				prefs: document.querySelector(".btn--prefs"),
				back: document.querySelector(".btn--back"),
				stats: document.querySelector(".btn--stats"),
				reset: document.querySelector(".btn--reset"),
				theme: document.querySelector(".btn--theme"),
				manual: document.querySelector(".btn--manual"),
				auto: document.querySelector(".btn--auto")
			}
		};

		this.world = new World(this);
		this.cube = new Cube(this);
		this.controls = new Controls(this);
		this.scrambler = new Scrambler(this);
		this.transition = new Transition(this);
		this.timer = new Timer(this);
		this.preferences = new Preferences(this);
		this.scores = new Scores(this);
		this.storage = new Storage(this);
		this.confetti = new Confetti(this);
		this.themes = new Themes(this);
		this.themeEditor = new ThemeEditor(this);
		this.keyboard = new Keyboard(this);
		this.initActions(); //double-click for random cube

		this.state = STATE.Menu;
		this.newGame = false;
		this.saved = false;

		this.storage.init();
		this.preferences.init();
		this.cube.init();
		this.transition.init();
		this.storage.loadGame();
		this.scores.calcStats();
		setTimeout(() => {
			this.transition.float();
			this.transition.cube(SHOW);

			setTimeout(() => this.transition.title(SHOW), 700);
			setTimeout(
				() => this.transition.buttons(BUTTONS.Menu, BUTTONS.None),
				1000
			);
		}, 500);
	}

	initActions() {
		// console.log(this.cube.pieces.position);
		this.solved_move = [];
		let tappedTwice = false;
		this.dom.game.addEventListener(
			"click",
			event => {
				// console.log(this.cube.pieces);
				// this.convertDef();
				if (this.transition.activeTransitions > 0) return;
				if (this.state === STATE.Playing) return;

				if (this.state === STATE.Menu) {
					if (!tappedTwice) {
						tappedTwice = true;
						setTimeout(() => (tappedTwice = false), 300);
						return false;
					}

					this.game(SHOW);
				} else if (this.state === STATE.Complete) {
					this.complete(HIDE);
				} else if (this.state === STATE.Stats) {
					this.stats(HIDE);
				}
			},
			false
		);

		this.controls.onMove = () => {
			if (this.newGame) {
				this.timer.start(true);
				this.newGame = false;
			}
		};

		this.dom.buttons.back.onclick = event => {
			if (this.transition.activeTransitions > 0) return;

			if (this.state === STATE.Playing) {
				this.game(HIDE);
			} else if (this.state === STATE.Prefs) {
				this.prefs(HIDE);
			} else if (this.state === STATE.Theme) {
				this.theme(HIDE);
			}
		};

		this.dom.buttons.manual.onclick = async event => {
			if (this.controls.state == 0) { // STILL = 0
				this.dom.buttons.auto.classList.remove("blinking");
				this.dom.buttons.manual.classList.add("blinking");
				this.dom.buttons.manual.innerHTML = "loading...";
				let _ = await this.generateSolvedMove();
				if (this.solved_move.length < 1) {
					this.dom.buttons.manual.classList.remove("blinking");
				}
				this.dom.buttons.manual.innerHTML = "Manual Solve";
				this.dom.buttons.manual.blur();
				this.timer.reset();
				this.timer.setText();
			}
		};

		window.addEventListener("keydown", e => {
			if (this.solved_move.length != 0) {
				if (e.keyCode === 32) {
					let convertedMove = this.solved_move.pop();
					this.controls.keyboardMove("LAYER", convertedMove, () => {});
				}
			}
		});

		this.dom.buttons.auto.onclick = async event => {
			if (this.controls.state == 0) { // STILL = 0
				this.dom.buttons.manual.classList.remove("blinking");
				this.dom.buttons.auto.classList.add("blinking");
				this.dom.buttons.auto.innerHTML = "loading...";
				let _ = await this.generateSolvedMove();
				if (this.solved_move.length < 1) {
					this.dom.buttons.auto.classList.remove("blinking");
				}
				this.dom.buttons.auto.innerHTML = "Auto Solve";
				this.dom.buttons.auto.blur();
				this.timer.reset();
				this.timer.setText();
				this.controls.scrambleCube(this.solved_move);
			}
		};

		this.dom.buttons.reset.onclick = event => {
			if (this.state === STATE.Theme) {
				this.themeEditor.resetTheme();
			}
		};

		// this.dom.buttons.prefs.onclick = event => this.prefs(SHOW);

		// this.dom.buttons.theme.onclick = event => this.theme(SHOW);

		// this.dom.buttons.stats.onclick = event => this.stats(SHOW);

		this.controls.onSolved = () => this.complete(SHOW);
	}

	convertDefStr() {
		// x+ : R
		// x- : L
		// y+ : U
		// y- : D
		// z+ : F
		// z- : B
		const sides = {
			"x-": {},
			"x+": {},
			"y-": {},
			"y+": {},
			"z-": {},
			"z+": {}
		};
		this.cube.edges.forEach(edge => {
			const position = edge.parent
				.localToWorld(edge.position.clone())
				.sub(this.cube.object.position);

			const mainAxis = this.controls.getMainAxis(position);
			const mainSign =
				position.multiplyScalar(2).round()[mainAxis] < 1 ? "-" : "+";

			sides[mainAxis + mainSign][
				this.cube.pos2PieceId[
					edge.parent.position
					.clone()
					.multiplyScalar(3)
					.addScalar(1)
					.round()
					.toArray()
					.toString()
				]
			] = edge.name;
		});

		const edgeMap=[{U1:6},{U2:15},{U3:24},{U4:7},{U5:16},{U6:25},{U7:8},{U8:17},{U9:26},{R1:26},{R2:25},{R3:24},{R4:23},{R5:22},{R6:21},{R7:20},{R8:19},{R9:18},{F1:8},{F2:17},{F3:26},{F4:5},{F5:14},{F6:23},{F7:2},{F8:11},{F9:20},{D1:2},{D2:11},{D3:20},{D4:1},{D5:10},{D6:19},{D7:0},{D8:9},{D9:18},{L1:6},{L2:7},{L3:8},{L4:3},{L5:4},{L6:5},{L7:0},{L8:1},{L9:2},{B1:24},{B2:15},{B3:6},{B4:21},{B5:12},{B6:3},{B7:18},{B8:9},{B9:0}];

		const sideMap={R:"x+",L:"x-",U:"y+",D:"y-",F:"z+",B:"z-"};

		let defstr = "";
		edgeMap.forEach(edge => {
			let edgeName = Object.keys(edge)[0];
			defstr += sides[sideMap[edgeName[0]]][edge[edgeName]];
		});
		return defstr;
	}

	async generateSolvedMove() {
		const defstr = this.convertDefStr();
		this.solved_move = await this.connectSv(defstr);
		if (this.solved_move.length < 1) {
			return;
		}
		this.solved_move.pop();
		this.solved_move = this.solved_move.reverse().map(move => {
			if (move[1] == '3') move = move[0] + '\'';
			return this.scrambler.convertMove(move);
		});
	}

	async connectSv(defStr) {
		let ans = '';
		const server = "http://localhost:8080/" + defStr;
		console.log(server);
		let res = '';
		try {
			res = await fetch(server, {
				method: "GET"
			});
		} catch {
			alert('Server error !');
			return [];
		}
		let data = await res.text();
		ans = data.substring(62, data.length - 1);
		ans = ans.replace("</body></html>", "");
		if (ans.toUpperCase().indexOf('ERROR') != -1) {
			alert(ans);
			ans = [];
		} else {
			ans = ans.replace("\n", "").split(" ");
		}
		return ans;
	}

	convertCube() {
		var defStr = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
		var cubeStr = "";
		let mapping = "L7D7B9L8D4L9D1F7L4B6L5L6F4L1U1B3L2U4L3U7F1D8B8D5D2F8B5F5U2B2U5U8F2R9D9B7R8D6R7D3F9R6B4R5R4F6R3U3B1R2U6R1U9F3";
		for (let i = 0; i < defStr.length; i += 2) {
			cubeStr += mapping[i];
		}
		console.log(cubeStr);
	}

	game(show) {
		if (show) {
			if (!this.saved) {
				this.scrambler.scramble();
				this.newGame = true;
				this.solved_move = [];
			}

			const duration = 0;

			this.state = STATE.Playing;
			this.saved = true;

			this.transition.buttons(BUTTONS.None, BUTTONS.Menu);

			this.transition.zoom(STATE.Playing, duration);
			this.transition.title(HIDE);

			setTimeout(() => {
				this.transition.timer(SHOW);
				this.transition.buttons(BUTTONS.Playing, BUTTONS.None);
			}, this.transition.durations.zoom - 1000);

			setTimeout(() => {
				this.controls.enable();
				if (!this.newGame) this.timer.start(true);
			}, this.transition.durations.zoom);
		} else {
			this.state = STATE.Menu;

			this.transition.buttons(BUTTONS.Menu, BUTTONS.Playing);

			this.transition.zoom(STATE.Menu, 0);

			this.controls.disable();
			if (!this.newGame) this.timer.stop();
			this.transition.timer(HIDE);

			setTimeout(
				() => this.transition.title(SHOW),
				this.transition.durations.zoom - 1000
			);

			this.playing = false;
			this.controls.disable();
		}

		this.dom.buttons.manual.classList.remove("blinking");
		this.dom.buttons.auto.classList.remove("blinking");
	}

	prefs(show) {
		if (show) {
			if (this.transition.activeTransitions > 0) return;

			this.state = STATE.Prefs;

			this.transition.buttons(BUTTONS.Prefs, BUTTONS.Menu);

			this.transition.title(HIDE);
			this.transition.cube(HIDE);

			setTimeout(() => this.transition.preferences(SHOW), 1000);
		} else {
			this.cube.resize();

			this.state = STATE.Menu;

			this.transition.buttons(BUTTONS.Menu, BUTTONS.Prefs);

			this.transition.preferences(HIDE);

			setTimeout(() => this.transition.cube(SHOW), 500);
			setTimeout(() => this.transition.title(SHOW), 1200);
		}
	}

	theme(show) {
		this.themeEditor.colorPicker(show);

		if (show) {
			if (this.transition.activeTransitions > 0) return;

			this.cube.loadFromData(States["3"]["checkerboard"]);

			this.themeEditor.setHSL(null, false);

			this.state = STATE.Theme;

			this.transition.buttons(BUTTONS.Theme, BUTTONS.Prefs);

			this.transition.preferences(HIDE);

			setTimeout(() => this.transition.cube(SHOW, true), 500);
			setTimeout(() => this.transition.theming(SHOW), 1000);
		} else {
			this.state = STATE.Prefs;

			this.transition.buttons(BUTTONS.Prefs, BUTTONS.Theme);

			this.transition.cube(HIDE, true);
			this.transition.theming(HIDE);

			setTimeout(() => this.transition.preferences(SHOW), 1000);
			setTimeout(() => {
				const gameCubeData = JSON.parse(
					localStorage.getItem("theCube_savedState")
				);

				if (!gameCubeData) {
					this.cube.resize(true);
					return;
				}

				this.cube.loadFromData(gameCubeData);
			}, 1500);
		}
	}

	stats(show) {
		if (show) {
			if (this.transition.activeTransitions > 0) return;

			this.state = STATE.Stats;

			this.transition.buttons(BUTTONS.Stats, BUTTONS.Menu);

			this.transition.title(HIDE);
			this.transition.cube(HIDE);

			setTimeout(() => this.transition.stats(SHOW), 1000);
		} else {
			this.state = STATE.Menu;

			this.transition.buttons(BUTTONS.Menu, BUTTONS.None);

			this.transition.stats(HIDE);

			setTimeout(() => this.transition.cube(SHOW), 500);
			setTimeout(() => this.transition.title(SHOW), 1200);
		}
	}

	complete(show) {
		if (show) {
			this.transition.buttons(BUTTONS.Complete, BUTTONS.Playing);

			this.state = STATE.Complete;
			this.saved = false;

			this.timer.stop();
			this.controls.disable();
			this.storage.clearGame();

			this.transition.zoom(STATE.Menu, 0);
			this.transition.elevate(SHOW);

			setTimeout(() => {
				this.transition.complete(SHOW, this.bestTime);
				this.confetti.start();
			}, 1000);
		} else {
			this.state = STATE.Menu;
			this.saved = false;

			this.transition.timer(HIDE);
			this.transition.complete(HIDE, this.bestTime);
			this.transition.cube(HIDE);


			setTimeout(() => {
				this.timer.reset();
				this.confetti.stop();
				this.transition.elevate(0);
				this.transition.float();
				setTimeout(() => this.transition.cube(SHOW), 500);
				setTimeout(() => this.transition.title(SHOW), 1200);
				this.transition.buttons(BUTTONS.Menu, BUTTONS.Complete);
			}, 1000);
			return false;
		}
	}
}

window.game = new Game();
