# Hair Generation Demo

## Purpose

Final project for Com S 336: Introduction to Computer Graphics at Iowa State University.

## Goal

In this demo, we will attempt to emulate the hair generation and dynamics described in [Nvidia's GPU Gems 2](https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter23.html) as used for the Nalu Dynamic Hair demo.
Our main goal is to generate variable density hair of adjustable length based from a mesh using few control hairs to define the movement of the hair as a whole. 
Relevant topics are barycentric coordinates, bezier curves, cloth dynamics, and dynamic generation.
As a strech goal, we would like to implement the light refration and shadowing described in the article, although it does pose more of a challenge.

Our stretch goal is to accurately simulate light refraction through the surface of the hair.


## Usage

### Install Dependencies

```
npm install
```

### Run

Running will start a [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) that hot-reloads on file saves.

```
npm run start
```

### Build

Builds to the `dist` directory.

```
npm run build
```

## Developing

Place code in the `src` folder, then import and execute in `src/index.js`:

```javascript
import demo from 'demo';

function onWindowLoad() {
  /* ... */

  demo();
}

/* ... */
```

See `src/demo` for an example to set up a scene.

### Navigating

There are some key utilities that are worth mentioning if you are interested in developing or reading through this codebase.

#### `src/lib`

This folder contains utility classes from Dr. Kouichi Matsuda and Dr. Rodger Lea's [WebGL Programming Guide](http://www.amazon.com/WebGL-Programming-Guide-Interactive-Graphics/dp/0321902920).

Note: there was a bug in `cuon-matrix.js` within the `multiplyVector3()` function. That is fixed here.

#### `src/utils`

This folder became a bit of a "catch-all" for anything that felt like a global usecase that could span across demos.

Most of the fun hair maths can be found in `Hair.js`, `VerletParticle.js`, and `Constraint.js`.

### Helpful Resources

- [WebGL 2.0 Reference Guide](https://www.khronos.org/files/webgl20-reference-guide.pdf)

## Our Group

- **Bryan Friestad** ([GitHub Profile](https://github.com/BryanFriestad))
- **Zach Newton** ([GitHub Profile](https://github.com/znewton))
