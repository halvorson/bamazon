var mysql = require("mysql");
var fs = require("fs");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,

	// Your username
	user: "root",

	// Your password
	password: "",
	database: "bamazonDB"
});

var name = "";

startTheShow();

function startTheShow() {

	inquirer.prompt(
		[
		{
			type: 'list',
			name: 'task',
			message: 'What do you want to do?',
			choices: [
			'View Products for Sale',
			'View Low Inventory',
			'Add to Inventory',
			'Add New Product',
			]
		}
		]
		)
	.then(function(ans) {
		switch(ans.task) {
			case "View Products for Sale": 
			viewProducts();
			break;
			case "View Low Inventory":
			viewLowInventory();
			break;
			case "Add to Inventory":
			addToInventory();
			break;
			case "Add New Product":
			addNewProduct();
			break;
		}
	});
}

function viewProducts() {
	var query = connection.query(
		"select * from products order by department_name", function(err,res) {
			var lastDepartment = '';
			console.log("Items currently offered:");
			res.forEach(function (obj, i) {
				if (obj.department_name !== lastDepartment) {
					lastDepartment = obj.department_name;
					console.log("");
					console.log("-------------" + obj.department_name + "--------------");
				}
				console.log(obj.product_name);
			});
			restartPrompt();
		});
}


function viewLowInventory() {
	var query = connection.query(
		"select * from products where stock_quantity <= 5", function(err,res) {
			var lastDepartment = '';
			if(res.length === 0) {
				console.log("Relax, everything has more than 5 in stock.");
			} else {
				console.log("These items have fewer than 5 left in stock! You should reorder (select 'Add to Inventory' from the main menu).");
				res.forEach(function (obj, i) {
					if (obj.department_name !== lastDepartment) {
						lastDepartment = obj.department_name;
						console.log("");
						console.log("-------------" + obj.department_name + "--------------");
					}
					console.log(obj.product_name + ": only " + obj.stock_quantity + " remaining!");
				});
			}
			restartPrompt();
		});
}

function addToInventory() {
	refillChooseDepartment();
}

function refillChooseDepartment() {
	var departments = [];
	var query = connection.query(
		"select department_name from products group by 1", function(err,res) {
			res.forEach( function(i) {
				//console.log(i.department_name);
				departments.push(i.department_name);
			});
			inquirer.prompt([{
				type: 'list',
				name: 'dept',
				message: 'What department should we look in?',
				choices: departments
			}]).then(function(ans3) {
				refillChooseItem(ans3.dept);
			});
		});
}

function refillChooseItem(dept) {
	var items = [];
	var itemsList = [];
	var query = connection.query(
		"select * from products where department_name = ?",
		[dept],
		function(err,res) {
			res.forEach( function(obj, i) {
				items.push(obj);
				itemsList.push((i+1) + ": " + obj.product_name);
			});
			inquirer.prompt([{
				type: 'list',
				name: 'item',
				message: 'What do you want to refill?',
				choices: itemsList
			}]).then(function(ans4) {
				var choiceNumber = Number(ans4.item.split(":")[0])-1;
				refillChooseQty(items[choiceNumber]);
			});
		});
}

function refillChooseQty(item) {
	inquirer.prompt([{
		type: 'input',
		name: 'qty',
		message: 'How many do you want to add? (' + item.stock_quantity+' in stock)',
		validate: function validateQty(qty){ 
			if (qty < 0) {
				console.log("\nYou cannot add a negative amount.");
				return false;
			} else {
				return true;
			}
		}
	}]).then(function(ans5) {
		console.log("Adding " + ans5.qty + " " + item.product_name + "s.");
		var query = connection.query(
			"UPDATE products SET stock_quantity = ? WHERE item_id = ?;",
			[Number(item.stock_quantity) + Number(ans5.qty), item.item_id],
			function(err,res) {
				console.log("Thanks for the reload! There are now " + (Number(item.stock_quantity) + Number(ans5.qty)) + " " + item.product_name + "s remaining.");
				restartPrompt();
			}
			);
	});
}

function addNewProduct() {
	console.log("-------Add a new item-------");
	var departments = [];
	var query = connection.query(
		"select department_name from products group by 1", function(err,res) {
			res.forEach( function(i) {
				departments.push(i.department_name);
			});
			inquirer.prompt([{
				type: 'input',
				name: 'product_name',
				message: 'Product Name:',
				validate: function validateItemName(name){
					if(name === "") {
						console.log("Product must have a name");
						return false;
					} else {
						return true;
					}
				}
			},
			{
				type: 'list',
				name: 'dept',
				message: 'Department:',
				choices: departments
			},
			{
				type: 'input',
				name: 'price_cents',
				message: 'Price (in cents):',
				validate: function validatePrice(p){
					if (Number(p) > 0 && Math.floor(Number(p)) === Number(p)) {
						return true;
					} else {
						console.log("Price must be a positive integer.");
						return false;
					}
				}
			},
			{
				type: 'input',
				name: 'inventory',
				message: 'Initial inventory:',
				validate: function validateQty(q){
					if (Number(q) > 0 && Math.floor(Number(q)) === Number(q)) {
						return true;
					} else {
						console.log("Quantity must be a positive integer.");
						return false;
					} 
				}
			},
			]).then(function(ans3) {
				var query = connection.query(
					"INSERT INTO products SET ?", 
					{
						product_name: ans3.product_name,
						department_name: ans3.dept,
						price_cents: ans3.price_cents,
						stock_quantity: ans3.inventory
					},
					function(err, res) {
						console.log("Added " + ans3.product_name + " to the " + ans3.dept + " department.");
						console.log("Initial quantity: " + ans3.inventory);
						console.log("Price: " + centsToStr(ans3.price_cents));
						restartPrompt();
					}
					);
			});
		});
}

function centsToStr(p) {
	return "$"+p/100;
}

function restartPrompt() {
	inquirer.prompt(
		[
		{
			type: 'confirm',
			name: 'restartBoolean',
			message: 'Do you want to do anything else?'
		}
		]
		)
	.then(function(ans8) {
		if (ans8.restartBoolean) {
			startTheShow();
		} else {
			console.log("Have a good day.");
			connection.end();
		}
	});
}

