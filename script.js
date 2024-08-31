let message = "";

let inputs = [];
let outputs = [];

let last_values = [];

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
inputs[0].value = "2*a+3=7";

document.addEventListener("keypress", (event) => {
	if(event.key == "Enter" && event.shiftKey) {
		addLine();
	}
});

const isNum = (str) => {
	return /^\d+$/.test(str);
}

const generateTokens = (equation) => {
	let tokens = [];

	let equ = equation.replace(" ", "");
	let last_char = "";
	let last_char_type = false;

	let current_token = "";
	
	for(let i=0; i < equ.length; i++) {
		let this_char = equ[i];
		let this_char_type = isNum(this_char);

		if(last_char_type == true && this_char_type == true) {
			current_token += this_char;

			if(i == equ.length - 1) {
				tokens.push(current_token);
			}
		}

		if(last_char_type == true && this_char_type == false) {
			tokens.push(current_token);
			tokens.push(this_char);
		}

		if(last_char_type == false && this_char_type == true) {
			current_token = "" + this_char;
			
			if(i == equ.length - 1) {
				tokens.push(current_token);
			}
		}

		if(last_char_type == false && this_char_type == false) {
			tokens.push(this_char);
		}

		last_char = this_char;
		last_char_type = this_char_type;
	}

	return tokens;
};

class ASTNode {
	constructor(type, value, left=null, right=null) {
		this.type = type;
		this.value = value;
		if(left != null) {
			this.left = left;
		}
		if(right != null) {
			this.right = right;
		}
	}
}

const lookForOps = (operations, array) => {
	let left = [];
	let right = [];
	let operation_found = false;
	for(let i=array.length - 1; i >= 0; i--) {
		if(operations.includes(array[i]) && operation_found == false) {
			operation_found = i;
		} else {
			(operation_found ? left : right).push(array[i]);
		}
	}

	if(operation_found === false) {
		return {"found": false, "node": array}
	} else {
		return {"found": true, "node": new ASTNode("operation", array[operation_found], left, right)};
	}
};

const checkAllOps = (array) => {
	let processed = lookForOps(["="], array);
	let found = processed.found;
	let node = processed.node;
	if(found == false) {
		processed = lookForOps(["+", "-"], array);
		found = processed.found;
		node = processed.node;
		if(found == false) {
			processed = lookForOps(["*", "/"], array);
			found = processed.found;
			node = processed.node;
			if(found == false) {
				if(isNum(array[0]) == true) {
					return new ASTNode("operand_n", parseInt(array[0]));
				} else {
					return new ASTNode("operand_v", array[0]);
				}
			} else {
				return new ASTNode("operation", node.value, node.left, node.right);
			}
		} else {
			return new ASTNode("operation", node.value, node.left, node.right);
		}
	} else {
		return new ASTNode("operation", node.value, node.left, node.right);
	}
};

const processTokens = (tokens) => {
	let AST = checkAllOps(tokens);
	if(AST.type == "operation") {
		return new ASTNode("operation", AST.value, processTokens(AST.left), processTokens(AST.right));
	} else {
		return AST;
	}
};

const simplifyAST1 = (AST) => {
	let new_ast = AST;

	if(AST.type == "operation") {
		if(AST.value == "+" || AST.value == "-") {
			new_ast = new ASTNode("operation", AST.value, simplifyAST1(AST.left), simplifyAST1(AST.right));

			if(new_ast.left.type == "operand_n" && new_ast.right.type == "operand_n") {
				new_ast = new ASTNode("operand_n", eval(`${new_ast.left.value} ${new_ast.value} ${new_ast.right.value}`));
			} else if(new_ast.left.type == "operand_n") {
				if(new_ast.right.value == "+" || new_ast.right.value == "-") {
					if(new_ast.right.left.type == "operand_n") {
						new_ast = new ASTNode("operation", new_ast.value, new ASTNode("operand_n", eval(`${new_ast.left.value} ${new_ast.value} ${new_ast.right.left.value}`)), new_ast.right.right);
					} else if(new_ast.right.right.type == "operand_n") {
						new_ast = new ASTNode("operation", new_ast.value, new ASTNode("operand_n", eval(`${new_ast.left.value} ${new_ast.value} ${new_ast.right.right.value}`)), new_ast.right.left);
					}
				}
			} else if(new_ast.right.type == "operand_n") {
				if(new_ast.left.value == "+" || new_ast.left.value == "-") {
					if(new_ast.left.left.type == "operand_n") {
						new_ast = new ASTNode("operation", new_ast.value, new ASTNode("operand_n", eval(`${new_ast.right.value} ${new_ast.value} ${new_ast.left.left.value}`)), new_ast.left.right);
					} else if(new_ast.left.right.type == "operand_n") {
						new_ast = new ASTNode("operation", new_ast.value, new ASTNode("operand_n", eval(`${new_ast.right.value} ${new_ast.value} ${new_ast.left.right.value}`)), new_ast.left.left);
					}
				}

			}
		} else if(AST.value == "*" || AST.value == "/") {
			new_ast = new ASTNode("operation", AST.value, simplifyAST1(AST.left), simplifyAST1(AST.right));
			
			let left_valid = new_ast.left.type == "operand_n";
			let right_valid = new_ast.right.type == "operand_n";

			if(left_valid == true && right_valid == true) {
				new_ast = new ASTNode("operand_n", eval(`${new_ast.left.value} ${new_ast.value} ${new_ast.right.value}`));
			}
		} else if(AST.value == "=") {
			new_ast = new ASTNode("operation", "=", simplifyAST1(AST.left), simplifyAST1(AST.right));
		}
	}

	return new_ast
};

const simplifyAST2 = (AST, count=0) => {
	let new_ast = AST;

	if(count > 30) {
		return new_ast
	}

	if(new_ast.value == "=") {
		if(new_ast.left.value == "+") {
			if(new_ast.left.left.type == "operand_n") {
				new_ast.right.value -= new_ast.left.left.value;
				new_ast.left = new_ast.left.right;
			} else if(new_ast.left.right.type == "operand_n") {
				new_ast.right.value -= new_ast.left.right.value;
				new_ast.left = new_ast.left.left;
			}
		} else if(new_ast.left.value == "-") {
			if(new_ast.left.left.type == "operand_n") {
				new_ast.right.value += new_ast.left.left.value;
				new_ast.left = new_ast.left.right;
			} else if(new_ast.left.right.type == "operand_n") {
				new_ast.right.value += new_ast.left.right.value;
				new_ast.left = new_ast.left.left;
			}
		} else if(new_ast.left.value == "*") {
			if(new_ast.left.left.type == "operand_n") {
				new_ast.right.value /= new_ast.left.left.value;
				new_ast.left = new_ast.left.right;
			} else if(new_ast.left.right.type == "operand_n") {
				new_ast.right.value /= new_ast.left.right.value;
				new_ast.left = new_ast.left.left;
			}
		} else if(new_ast.left.value == "/") {
			if(new_ast.left.left.type == "operand_n") {
				new_ast.right.value *= new_ast.left.left.value;
				new_ast.left = new_ast.left.right;
			} else if(new_ast.left.right.type == "operand_n") {
				new_ast.right.value *= new_ast.left.right.value;
				new_ast.left = new_ast.left.left;
			}
		}
		if(new_ast.left.type != "operand_v") {
			console.log(new_ast)
			new_ast = simplifyAST2(new_ast, count + 1);
		}
	} else {
		console.error("Invalid Equation.")
	}

	return new_ast
};

const generateAST = (tokens) => {
	let starting_ast = processTokens(tokens);
	let simplified = simplifyAST1(starting_ast);
	simplified = simplifyAST2(simplified);
	console.log(`Before: ${JSON.stringify(starting_ast)}, After: ${JSON.stringify(simplified)}`)

	let equation = returnEquation(simplified);

	return equation
};

const returnEquation = (AST) => {
	let equation = "";
	if(AST.type == "operand_n" || AST.type == "operand_v") {
		return AST.value;
	} else if(AST.type == "operation") {
		let left = returnEquation(AST.left);
		let right = returnEquation(AST.right);
		equation = `${left} ${AST.value} ${right}`;
		return equation
	}
};

const change = (values) => {
	for(let i=0; i < values.length; i++) {
		message = values[i];
		let tokens = generateTokens(message);
		let ast = generateAST(tokens);
		
		if(ast !== "") {
			outputs[i].innerText = `$${ast}$`;
		} else {
			outputs[i].innerText = "";
		}
	}
}

const animation = () => {
	let this_values = [];

	for(let i=0; i < inputs.length; i++) {
		this_values.push(inputs[i].value);
	}

	if(JSON.stringify(this_values) != JSON.stringify(last_values)) {
		change(this_values);
	}
	
	MathJax.typeset();
	last_values = this_values;
	
	requestAnimationFrame(animation);
};

animation();