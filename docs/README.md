# GLSL Boilerplate

Writing openGL in string literals in JS is annoying.
This boilerplate lets you use `.glsl` files.
Plus, hot reload. Who doesn't love hot reload?

## Loader

This boilerplate uses [shader-loader](https://www.npmjs.com/package/shader-loader).

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

