# Bamazon readme

## Overview

This folder has many files in it: 2 sql files, this readme, and two bamazon JS scripts. The sql files exist to set up a new mysql schema (schema.sql), and to populate it with initial data (seed.sql). The mysql schema includes a product table, and a user_inventory table. The bamazon JS files include one view for a customer, and another for a manager, and require a bit more of an in-depth walkthrough, which follows. 

## Bamazon customer

Bamazon customer is a node.js file that utilizes inquirer and mysql to provide a shopping experience. 

It first asks for a name, then provides an option to buy or return an item (fig 1). 

![Options](/screens/options.png)

Buying lets you select a department and an item from lists, and then choose the quantity . If you try to purchase more than the quantity (or a non-integer, or a text string), it fails. 

![Too Many Error](/screens/tooMany.png)

Upon purchasing, it reduces the number available in the products table of the mysql database, and then checks if you (as a user) already own them. If so, it updates your personal quantity. If no, it writes a new row to the user_inventory table. It then asks if you want to continue shopping.

![New User Item](/screens/newUserItem.png)

Returning an item allows you to select an item from your inventory to return, again making sure you aren't returning too many. It will then subtract that number from your inventory, and add it back to the store.

![Successful Return](/screens/return.png)

## Bamazon manager

Bamazon manager allows managers of our store to perform one of 4 tasks: View Products for sale, View Products with low inventory, Add to inventory, or Add a new product. 

Viewing products for sale returns all items that have more than 0 items in stock, and groups them by category.

![View products](/screens/viewProducts.png)

Viewing products with low inventory only displays items that have 5 or fewer items in stock, returning an error if there are none. 

Adding inventory to an item lets you choose a department, then a product (eerily similar to shopping above), then lets you add any positive integer to the inventory amount (via mysql).

![Add to inventory](/screens/addInventory.png)

Lastly, Add new product lets you add a new product from scratch. It takes a name, department, price (in cents), and initial quantity, and writes that to the database. 

![Add product](/screens/addProduct.png)



