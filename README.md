# Realworld Rubik Solver
## Description
Capture state of the rubik in realworld, simulate it in 3D form and solve it with [Kociemba's algorithm](https://github.com/hkociemba/RubiksCube-TwophaseSolver)
- [x] Basic rubik game
- [x] Capture color of realworld rubik
- [x] Show the guidance to solve the given rubik

## Prerequisite
* Python 3.4+
* Package `numpy` installed
* npm 6+

## Build & Run instruction
### Client
Run following commands for building:
```
cd Client
npm install
./node_modules/.bin/rollup -c rollup.config.dev.js
```
To run it:
* For only using features of basic rubik game, just simply open `Client/index.html'.
* To use our realworld rubik detector, you must open `Client` with a host, virtual host or localhost. (We recommend to use [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) on VS Code to run our project)

### Server
Run following commands for building and running:
```
cd Server
python start_server.py
```
It takes about 0.5-1.5 hours to generate pattern tables at the first run.

### Demo
[![Real rubik solver](http://img.youtube.com/vi/dRhSDgQ13kk/0.jpg)](http://www.youtube.com/watch?v=dRhSDgQ13kk)


## References:
* Client: https://github.com/bsehovac/the-cube
* Server: https://github.com/hkociemba/RubiksCube-TwophaseSolver
* YOLO: https://hackernoon.com/understanding-yolo-f5a74bbc7967
* Tensorflow.js: https://www.tensorflow.org/js/tutorials