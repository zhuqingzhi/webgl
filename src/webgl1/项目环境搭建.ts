import "../index.css";

import Experience from "./Experience/Experience";

document.querySelector("#app")!.innerHTML = `
<div id='sketch'></div>
`;
new Experience("#sketch");
