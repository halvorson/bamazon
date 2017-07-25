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
			type: 'input',
			name: 'name',
			message: 'Welcome to Bamazon. What is your name?',
			validate: function validateName(name){
				if (name === "") {
					console.log("Name cannot be blank!");
					return false;
				}
				return true;
			}
		}
		]
		)
	.then(function (ans1) {
		name = ans1.name;
		inquirer.prompt(
			[
			{
				type: 'list',
				name: 'task',
				message: 'Hi ' + ans1.name + '. How can we help you today?',
				choices: [
				'Buy an item',
				'Return an item',
				]
			}
			]
			)
		.then(function(ans2) {
			switch(ans2.task) {
				case "Buy an item": 
				shopChooseDepartment();
				break;
				case "Return an item":
				returnChooseItem();
				break;
			}
		});
	});
}

function restartPrompt() {
	inquirer.prompt(
		[
		{
			type: 'confirm',
			name: 'restartBoolean',
			message: 'Can we help you with anything else today?'
		}
		]
		)
	.then(function(ans8) {
		if (ans8.restartBoolean) {
			restartStore();
		} else {
			console.log("Thanks for shopping!");
			connection.end();
		}
	});
}

function restartStore() {
	inquirer.prompt(
		[
		{
			type: 'list',
			name: 'task',
			message: 'What else can we help you with today?',
			choices: [
			'Buy an item',
			'Return an item',
			]
		}
		]
		)
	.then(function(ans2) {
		switch(ans2.task) {
			case "Buy an item": 
			shopChooseDepartment();
			break;
			case "Return an item":
			returnChooseItem();
			break;
		}
	});
}

function shopChooseDepartment() {
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
				shopChooseItem(ans3.dept);
			});
		});
}

function shopChooseItem(dept) {
	var items = [];
	var itemsList = [];
	var query = connection.query(
		"select * from products where department_name = ?",
		[dept],
		function(err,res) {
			res.forEach( function(obj, i) {
				items.push(obj);
				itemsList.push((i+1) + ": " + centsToStr(obj.price_cents) + ": " + obj.product_name);
			});
			inquirer.prompt([{
				type: 'list',
				name: 'item',
				message: 'What do you want to buy?',
				choices: itemsList
			}]).then(function(ans4) {
				var choiceNumber = Number(ans4.item.split(":")[0])-1;
				shopChooseQty(items[choiceNumber]);
			});
		});
}

function centsToStr(p) {
	return "$"+p/100;
}

function shopChooseQty(item) {
	inquirer.prompt([{
		type: 'input',
		name: 'qty',
		message: 'How many do you want to buy? (' + item.stock_quantity+' in stock)',
		validate: function validateQty(qty){ 
			if (qty < 0) {
				console.log("\nYou cannot buy a negative amount. To return items, please choose 'Return an item'.");
				return false;
			} else if (qty > item.stock_quantity) {
				console.log("\nWe don't have that many!");
				return false;
			} else if (Math.floor(Number(qty)) !== Number(qty)) {
				console.log("\nQuantity has to be an integer");
				return false;
			} else {
				return true;
			}
		}
	}]).then(function(ans5) {
		console.log("Buying " + ans5.qty + " " + item.product_name + "s. Total cost: " + centsToStr(ans5.qty*item.price_cents));
		var query = connection.query(
			"UPDATE products SET stock_quantity = ? WHERE item_id = ?;",
			[item.stock_quantity - ans5.qty, item.item_id],
			function(err,res) {
				addItemsToUser(item, ans5.qty);
				console.log("Thanks for shopping! We have " + (item.stock_quantity - ans5.qty) + " " + item.product_name + "s remaining.");
			}
			);
	});
}

function addItemsToUser(item, qty) {
	var query = connection.query(
		"select quantity_owned from user_inventory where name = ? and item_id = ?;",
		[name, item.item_id],
		function(err,res) {
			if (res.length === 0) {
				var query = connection.query(
					"INSERT INTO user_inventory SET ?", 
					{
						name: name,
						item_id: item.item_id,
						quantity_owned: qty
					},
					function(err, res) {
						if (qty === 1) {
							console.log("This is your first " + item.product_name + ". Enjoy." );	
						} else {
							console.log("These are your first " + qty + " " + item.product_name + "s. Enjoy.");
						}
						restartPrompt();
					}
					);
			}
			else {
				var qtyPreviouslyOwned = res[0].quantity_owned;
				//console.log(item, qty);
				var query = connection.query(
					"UPDATE user_inventory SET quantity_owned = ? WHERE item_id = ? AND name = ?;", 
					[Number(qtyPreviouslyOwned) + Number(qty), item.item_id, name],
					function(err, res) {
						console.log("You now own " + (qtyPreviouslyOwned + qty) + " " + item.product_name + "s. Enjoy." );	
						restartPrompt();
					}
					);
			}
		}
		);
}

function returnChooseItem() {
	var items = [];
	var itemsList = [];
	var query = connection.query(
		"select * from (select * from user_inventory where name = ? and quantity_owned > 0) a join products b on a.item_id = b.item_id",
		[name],
		function(err,res) {
			if (res.length === 0) {
				console.log("You don't own any items to return.");
				restartPrompt();
			} else {
				//console.log(res);
				res.forEach( function(obj, i) {
					items.push(obj);
					itemsList.push((i+1) + ": " + obj.product_name);
				});
				inquirer.prompt([{
					type: 'list',
					name: 'item',
					message: 'What do you want to return?',
					choices: itemsList
				}]).then(function(ans6) {
					var choiceNumber = Number(ans6.item.split(":")[0])-1;
					returnChooseQty(items[choiceNumber]);
				});
			}
		});
}

function returnChooseQty(item) {
	inquirer.prompt([{
		type: 'input',
		name: 'qty',
		message: 'How many do you want to return? (' + item.quantity_owned + ' owned)',
		validate: function validateQty(qty){ 
			if (qty < 0) {
				console.log("\nYou cannot return a negative amount. To buy items, please choose 'Purchase an item'.");
				return false;
			} else if (qty > item.quantity_owned) {
				console.log("\nYou don't own that many!");
				return false;
			} else if (Math.floor(Number(qty)) !== Number(qty)) {
				console.log("\nQuantity has to be an integer");
				return false;
			} else {
				return true;
			}
		}
	}]).then(function(ans7) {
		console.log("Returning " + ans7.qty + " " + item.product_name + "s. Total value: " + centsToStr(ans7.qty*item.price_cents));
		var query = connection.query(
			"UPDATE products SET stock_quantity = ? WHERE item_id = ?;",
			[Number(item.stock_quantity) + Number(ans7.qty), item.item_id],
			function(err,res) {
				addItemsToUser(item, -Number(ans7.qty));
				console.log("Thanks for shopping! We have " + (Number(item.stock_quantity) + Number(ans7.qty)) + " " + item.product_name + "s remaining.");
			}
			);
	});
}