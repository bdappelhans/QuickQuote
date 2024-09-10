# QuickQuote

Welcome to QuickQuote! This project was developed as part of a group assignment for our Introduction to Software Engineering course. We were given a problem statement and tasked with designing and developing a solution.

## General Information

QuickQuote is a dynamic full-stack CRUD web application designed to enhance efficiency for a plant repair service company. Our team developed this solution to simplify the sales quote process. QuickQuote offers tailored interfaces for sales associates, office workers, and administrators, providing each user with the tools they need for their specific tasks. The application simplifies key processes such as creating and editing quotes, managing purchase orders, and assigning commissions, ultimately improving the overall sales workflow. 

## Technologies and Tools

- Node.js
- Express.js
- JavaScript
- MySQL
- jQuery
- Axios
- HTML/CSS
- AWS

As a group of software engineers with a company that sells plant repair services via a network of sales people, you are tasked to build a new system that enables the sales force to record their quotes via the Internet. The system will maintain a database of sales associates, handle the recording of sales quotes, establish and fulfill purchase orders. The system will also assign sales commissions for the sales associate.

A sales associate is presented with a custom quote tracking program which can be run anywhere on an Internet platform. After the associate logs in (s)he can enter sales quotes for customers. Quotes are entered for existing customers, their information is maintained in a company legacy database with customer name, address, and contact info (details provided later). A quote consists of multiple line items. Each line item has a free form description and a price. The associate can also attach secret notes of free form text. The quote is entered into a new quote database. The associate also attaches a customer e-mail address to the quote, which is used as e-mail destination for communication as the quote is processed. The associate can edit quotes until (s)he finalizes the quote.

The second interface to the system runs in-house at company headquarters: finalized quotes can be retrieved, line items added, edited or removed, and prices can be changed. A discount can be given either as percentage or amount. All line items and the discount are computed into the final price quoted. The secret notes added by the sales associate can be reviewed, and new ones added. The quotes are updated in the quote database: either left unresolved, or sanctioned. Sanctioned quotes are considered complete and sent out via e-mail to the customer. The email contains all quote data except the secret notes.

The third interface (also in-house) allows to convert a quote into a purchase order once the customer has indicated to go ahead with the order (the go ahead is given outside of the scope of this system, e.g. via phone or snail mail). At this time an additional final discount can be entered. The final amount is computed. The purchase order is then sent to an external processing system (details provided later) which answers with a processing date and sales commission rate for the sales associate. The commission is computed and recorded for the quote and in the sales associateâ€™s accumulated commission. An email is sent to the customer with all the purchase details, including the processing date.

And lastly, there will be an administrative interface to maintain sales associate and quote information. Sales associate information contains their name, user id, password, accumulated commission, and address. The interface allows to view, add, edit and delete sales associate records. It also allows to search and view quotes based on status (finalized, sanctioned, ordered), date range, sales associate, and customer.

Quote System - Design and Implementation

The first step we took in tackling the project involved creating a use case model to demonstrate how the system interacts with different outside actors. Per the problem statement, the company's customers come from an existing legacy database. New data like sales associates and quotes had to be tracked in a new database. I created a new MySQL database and hosted it on AWS. We decided to implement the project primarily using tools like JavaScript, html, node.js, express.js, and jQuery.
