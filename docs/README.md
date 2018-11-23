# Hair Generation Demo

## Purpose

Final project for Com S 336: Introduction to Computer Graphics at Iowa State University.

## Goal

In this demo, we will attempt to emulate the hair generation and dynamics described in [Nvidia's GPU Gems 2](https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter23.html) as used for the Nalu Dynamic Hair demo.
Our main goal is to generate variable density hair of adjustable length based from a mesh using few control hairs to define the movement.

Our stretch goal is to accurately simulate light refraction through the surface of the hair.


## Usage

### Install Dependencies

```
yarn install
```

### Run

Running will start a [webpack-dev-server](https://webpack.js.org/configuration/dev-server/) that hot-reloads on file saves.

```
yarn start
```

### Build

Builds to the `dist` directory.

```
yarn build
```

## Developing

Place source code in the `src` folder and execute in `src/index.js`.

## Helpful Resources

- [WebGL 2.0 Reference Guide](https://www.khronos.org/files/webgl20-reference-guide.pdf)

