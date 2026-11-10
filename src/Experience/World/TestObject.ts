import * as kokomi from "kokomi.js";
import * as THREE from "three";
import testObjectVertexShader from "../Shaders/TestObject/vert.glsl";
import testObjectFragShader from "../Shaders/TestObject/frag.glsl";
export default class TestObject extends kokomi.Component {
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  uj: kokomi.UniformInjector;
  constructor(base) {
    super(base);

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    // const geometry = new THREE.PlaneGeometry(4, 4);
    const material = new THREE.ShaderMaterial({
      vertexShader: testObjectVertexShader,
      fragmentShader: testObjectFragShader,
    });
    this.material = material;
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
    material.uniforms = {
      ...material.uniforms,
      ...uj.shadertoyUniforms,
    };
  }
  addExisting() {
    this.container.add(this.mesh);
  }
  update() {
    this.uj.injectShadertoyUniforms(this.material.uniforms);
  }
}
