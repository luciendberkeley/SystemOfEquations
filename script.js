let message = "";

let inputs = [];
let outputs = [];

// Startup
const addLine = () => {
	let input_div = document.querySelector(".inputs");
	let output_div = document.querySelector(".outputs");

	inputs.push(document.createElement("input"));
	outputs.push(document.createElement("div"));

	let last_id = inputs.length - 1;

	input_div.appendChild(inputs[last_id]);
	output_div.appendChild(outputs[last_id]);

	inputs[last_id].focus()
}

addLine();

document.addEventListener("keypress", (event) => {
	if(event.key == "Enter") {
		addLine();
	}
});

const animation = () => {
	for(let i=0; i < inputs.length; i++) {
		message = inputs[i].value;
		if(message != "") {
			outputs[i].innerText = `$${message}$`;
		} else {
			outputs[i].innerText = "";
		}
	}
	

	MathJax.typeset()
	
	requestAnimationFrame(animation);
};

animation();