const scene1 = new Scene({
  additionalAnimation(delta) {
    constraintContainer.solve();
    allFinalVertices = [];
    cube.update(delta, allFinalVertices);
    allFinalVertices = new Float32Array(allFinalVertices);

    let increment = 1.5 * 60 * delta;
    if (!paused) {
      switch (axis) {
        case 'x':
          cube.rotateX(increment);
          axis = 'x';
          break;
        case 'y':
          axis = 'y';
          cube.rotateY(increment);
          break;
        case 'z':
          axis = 'z';
          cube.rotateZ(increment);
          break;
        default:
      }
    }
  },
  additionalSetup() {
  },
  additionalHandleKeypress(event, ch) {
    switch (ch) {
      case ' ':
        paused = !paused;
        event.preventDefault();
        return false;
      case 'x':
        axis = 'x';
        break;
      case 'y':
        axis = 'y';
        break;
      case 'z':
        axis = 'z';
        break;
      case 'm':
        this.is_mesh = !this.is_mesh;
        break;
    }
  },
});
