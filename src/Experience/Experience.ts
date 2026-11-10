import * as kokomi from "kokomi.js";
import World from "./World/World";
import TestObject from "./World/TestObject";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
export default class Experience extends kokomi.Base {
  public world: kokomi.Component;
  public testObject: kokomi.Component;
  gui: GUI;
  constructor(el = "#app") {
    super(el);
    window.experience = this;
    this.world = new World(this);
    this.testObject = new TestObject(this);
    this.testObject.addExisting();

    this.camera.position.set(0, 0, 5);
    new kokomi.OrbitControls(this);
    this.gui = new GUI();
  }
}
