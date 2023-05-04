const express = require("express")
const app = express()
const router = express.Router()

require('dotenv').config()

const path = require("path")
const engines = require("consolidate")

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())

require("dotenv").config();

const mysql = require("mysql");

const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(session({
  secret : '467project',
  resave : true,
  saveUninitialized : true
}));

// Create legacy DB connection
const legacy_conn = mysql.createConnection({
  host: process.env.LEGACY_HOST,
  port: process.env.LEGACY_PORT,
  database: process.env.LEGACY_DATABASE,
  user: process.env.LEGACY_USER,
  password: process.env.LEGACY_PASSWORD
})

legacy_conn.connect((err) => {
  if(err) throw err;
  else {
  console.log('Legacy Database connected...');
}})

// Create new DB connection
const conn = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.PORT,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD
})

const yaml = require('js-yaml')
const fs = require('fs')
const doc = yaml.load(fs.readFileSync('data.yaml', 'utf-8'))
const reset_instance_data = false;

conn.connect((err) => {
  if(err) throw err;
  else {
    console.log('New Database connected...');
    if(reset_instance_data) {
      conn.query("DELETE FROM quotes")
      conn.query("DELETE FROM sales_assoc")

      for (let k in doc) {
        for (let v of doc[k]) {
          if (k == "sales_assoc")
            conn.query(`INSERT INTO ${k} VALUES ("${v.id}", "${v.first_name}", "${v.last_name}", "${v.password}", ${v.total_commission}, "${v.address}")`)
          else if (k == "quotes")
            conn.query(`INSERT INTO ${k} VALUES (${v.quote_id}, ${v.customer_id}, "${v.sa_id}", ${v.date_time}, "${v.customer_email}", ${v.initial_total_price}, ${v.discount}, ${v.final_total_price}, ${v.finalized}, ${v.sanctioned}, ${v.commission_rate}, ${v.commission})`)
        }
      }
    }
  }
})

app.set('views', path.resolve(__dirname, 'views'));
app.engine('html', engines.mustache)
app.set('view engine', 'html');

app.set('view engine', 'ejs');

app.use("/public", express.static(path.resolve(__dirname, "public")))
app.use('/', router)

router.get('', (_, res) => res.render('pages/index'))

router.get('/office-login', (_, res) => res.render('pages/office-login'))

router.get('/on-site-login', (_, res) => res.render('pages/on-site-login'))

// verifies on-site username and password
router.post('/onsitelogin', function(request, response, next){
  var usrUsername = request.body.usernameInput;
  var usrPswrd = request.body.passwordInput;

  if(usrUsername && usrPswrd){
    query = `SELECT * FROM sales_assoc WHERE id = "${usrUsername}"`;
    conn.query(query, function(error, data){

      if(data.length > 0){
        for(var count = 0; count < data.length; count++){
          if(data[count].password == usrPswrd)
          {
            request.session.user_id = data[count].id;
            console.log(`User ${request.session.user_id} logged in...`);
            response.redirect('/on-site-portal');
          }else{
            response.send('Incorrect Password');
          }
        }
      }else{
        response.send('Incorrect Username');
      }
      response.end();
    });

  }else{
    response.send('Please Enter Login Info');
    response.end();
  }
});

// verifies office username and password
router.post('/officelogin', function(request, response, next){
  var usrUsername = request.body.usernameInput;
  var usrPswrd = request.body.passwordInput;
  if(usrUsername && usrPswrd){
    query = `SELECT * FROM office_workers WHERE id = "${usrUsername}"`;
    conn.query(query, function(error, data){
      if(data.length > 0){
        for(var count = 0; count < data.length; count++){
          if(data[count].password == usrPswrd)
          {
            request.session.user_id = data[count].id;
            console.log(`User ${request.session.user_id} logged in...`);
            response.redirect('/office-portal');
          }else{
            response.send('Incorrect Password');
          }
        }
      }else{
        response.send('Incorrect Username');
      }
      response.end();
    });
  }else{
    response.send('Please Enter Login Info');
    response.end();
  }
});

// Route to admin page from office worker portal
router.get('/adminbtn', function(request, response, next){
  conn.query(`SELECT * FROM office_workers WHERE id = "${request.session.user_id}" AND admin = 1`, function(err, data2){

    if(data2[0]){
      response.redirect("/admin");
    }else{
      response.send("You do not have administrator privileges!")
      response.end();
    }
  })
});

// creates new quote
router.post('/create-quote', function(request, response, next){
  var customer_id = request.body.customer;
  var customer_email = request.body.customer_email;
  var user_id = request.session.user_id;

  if(customer_id && customer_email){
    let sql_create = `INSERT INTO quotes (customer_id, sa_id, customer_email) VALUES ("${customer_id}", "${user_id}", "${customer_email}");`;
    conn.query(sql_create, function(error, data){
      if(error) {
        response.send(error);
      }
      else
      {
        console.log('New quote created')
        response.redirect('/on-site-portal');
      }
    });

  }else{
    response.send('Please select a customer and enter a valid contact email.');
    response.end();
  }
});

// Renders 'view quote' page
router.get('/view-quote', (req, res) => {
  if(!view_quote_id) {
    res.redirect("/on-site-portal")
    return
  }

  conn.query(`SELECT * FROM quotes WHERE quote_id = "${view_quote_id}"`, (err, data1) => {
    if(err) res.send(err, data1);
    else {

      quote_info = JSON.stringify(data1);
      conn.query(`SELECT * FROM line_items WHERE quote_id = "${view_quote_id}"`, (err, data2) => {

        if(err) res.send(err, data2);
        else {
          line_items_info = JSON.stringify(data2);
          legacy_conn.query(`SELECT * FROM customers WHERE id = "${data1[0].customer_id}"`,
          (err, data3) => {

            if(err) res.send(err, data3);
            else {
              customer_info = JSON.stringify(data3);

              console.log('Pulling quote information to display...')
              
              res.render('pages/view-quote', {
                quote_info: quote_info,
                line_items_info: line_items_info,
                customer_info: customer_info
              })
            }
          })
        }
      })
    }
  })
  })

// Pulls quote and line item info, redirects to 'view quote' page
let quote_info, line_items_info, customer_info;
router.post('/viewquote', (req, res) => {
  view_quote_id = req.body.viewQuote;
  res.redirect('/view-quote');
});

let line_item, edit_customer_info, edit_quote_id;
router.get('/edit-line-item', (_, res) => res.render('pages/edit-line-item', {
  line_item: line_item,
  customer_info: edit_customer_info,
}));

router.post('/editlineitem', (req, res) => {
  quote_id = req.body.quote_id;
  customer_name = req.body.customer_name;
  return_page = req.body.return_page;

  if (req.body.edit) {
    let sql_pull = `SELECT * FROM line_items WHERE line_id = "${req.body.edit}" AND quote_id = "${quote_id}"`;
    conn.query(sql_pull, (err, data) => {
      if (err) res.send(err, data);
      else {
        line_item = JSON.stringify(data);
        let sql_customer = `SELECT * FROM customers WHERE id = "${req.body.customer_id}"`;
        legacy_conn.query(sql_customer, (err, data2) => {
          if (err) res.send(err, data2);
          else {
            edit_customer_info = JSON.stringify(data2);
            res.redirect('/edit-line-item');
          }
        });
      }
    });
  } else if (req.body.delete) {
    let sql_delete = `DELETE FROM line_items WHERE line_id = "${req.body.delete}" AND quote_id = "${req.body.quote_id}";`;
    conn.query(sql_delete, function(err, data) {
      if (err) res.send(err);
      else {
        let sql_total_price = `SELECT SUM(price) as 'price' FROM line_items WHERE quote_id = "${req.body.quote_id}"`;
        conn.query(sql_total_price, (err, data2) => {
          if (err) res.send(err, data2);
          else {
            let price = data2[0].price;
            let sql_update_price = `UPDATE quotes SET initial_total_price = "${price}" WHERE quote_id = "${req.body.quote_id}";`;

            conn.query(sql_update_price, function(err, data3) {
              if (err) res.send(err);
              else {
                console.log('Line item deleted');
                conn.query(`SELECT * FROM quotes WHERE quote_id = "${quote_id}"`, (err, quote_entry) => {
                  if(err) throw err;

                  let initial_price = Number(quote_entry[0].initial_total_price);
                  let discount = Number(quote_entry[0].discount);
                  let final_price = initial_price - discount;

                  conn.query(`UPDATE quotes set final_total_price = "${final_price}" WHERE quote_id = "${quote_id}"`, function(err) {
                    if (err) res.send(err);
                    else {
                    if (Number(quote_entry[0].initial_total_price) < Number(quote_entry[0].discount)) {
                      conn.query(`UPDATE quotes SET discount = '0', final_total_price = "${quote_entry[0].initial_total_price}" WHERE quote_id = "${quote_id}";`, (err) => {
                        if (err) throw err;
                        else {
                          console.log(`Error: Discount for quote ${quote_id} was greater than the updated initial total price. Discount has been reset to $0.00.`);
                        }
                      });
                  
                    }
                    res.redirect(return_page);
                  }
                });
                }
        )}});
          }
        });
      }
    });
  }
});


// submits input for updating line item in associate interface to post
router.post('/update-line-item', (req, res) => {
  if (!req.body.price || !req.body.description) {
    res.end('Please enter valid input.')
  }
  else if (isNaN(Number(req.body.price)))
  {
    res.end('Please enter a valid number for the price.')
  }
  else {
    let sql_update = `UPDATE line_items SET description = "${req.body.description}", price = '${req.body.price}', secret_note = "${req.body.hidden_note}" WHERE (line_id = "${req.body.line_id}") and (quote_id = "${req.body.quote_id}");`

    conn.query(sql_update, (err, data) => {
      if(err) res.send(err, data)
      else {
        console.log('Line item updated');
        let get_price = `SELECT SUM(price) as 'price' FROM line_items WHERE quote_id = "${req.body.quote_id}"`;
        conn.query(get_price, (err, data3) => {
          if(err) res.send(err, data3)
          else {
            let price = data3[0].price;
            let sql_update_price = `UPDATE quotes SET initial_total_price = "${price}" WHERE quote_id = "${req.body.quote_id}";`
            conn.query(sql_update_price, function(err, data2) {
              if(err) res.send(err);
              else {
                console.log('Total price updated');
                conn.query(`SELECT * FROM quotes WHERE quote_id = "${quote_id}"`, (err, quote_entry) => {
                  if(err) res.send(err);
                  else {
                    let initial_price = Number(quote_entry[0].initial_total_price);
                    let discount = Number(quote_entry[0].discount);
                    let final_price = initial_price - discount;
                    conn.query(`UPDATE quotes SET final_total_price = "${final_price}" WHERE quote_id = "${quote_id}";`, function(err) {
                      if (err) throw err;
                      else {
                        if (quote_entry[0].initial_total_price < quote_entry[0].discount) {
                          conn.query(`UPDATE quotes SET discount = '0', final_total_price = "${quote_entry[0].initial_total_price}" WHERE quote_id = "${quote_id}";`, (err) => {
                            if(err) throw err;
                            else {
                              console.log(`Error: Discount for quote ${quote_id} was greater than the updated initial total price. Discount has been reset to $0.00.`);
                            }
                          })
                        }
                        res.redirect(return_page);
                      }
                    });
                  }
                })
              }
          })
        }
      })
    }
  })
}})

// renders create-line-item page, redirects from view-quote page
let quote_id, customer_name, return_page;
router.get('/create-line-item', (req, res) => res.render('pages/create-line-item', {
  quote_id: quote_id,
  customer_name: customer_name,
  return_page: return_page
}));

router.post('/createlineitem', (req, res) => {
  quote_id = req.body.quote_id;
  view_quote_id = req.body.quote_id;
  customer_name = req.body.customer_name;
  return_page = req.body.return_page;
  res.redirect('/create-line-item');
});

// adds new line item, updates total price for quote, redirects to view-quote page
router.post('/add-line-item', (req, res, next) => {

  if (!req.body.price || !req.body.description) {
    res.end('Please enter valid input.')
  }
  else if (isNaN(Number(req.body.price)))
  {
    res.end('Please enter a valid number for the price.')
  }
  else {
  let sql_add = `INSERT INTO line_items (quote_id, description, price, secret_note) VALUES ("${req.body.quote_id}", "${req.body.description}", "${req.body.price}", "${req.body.hidden_note}");`

  conn.query(sql_add, function(err, data) {
    if(err) {
      res.send(err);
    }
    else {
      let sql_get_cost = `SELECT SUM(price) as 'price' FROM line_items WHERE quote_id = "${req.body.quote_id}"`;
      conn.query(sql_get_cost, (err, data2) => {
        if(err) res.send(err, data2);
        else {
          let sql_update_cost = `UPDATE quotes SET initial_total_price = "${data2[0].price}" WHERE quote_id = "${quote_id}";`
          conn.query(sql_update_cost, function(err, data3) {
            if(err) res.send(err, data3);
            else {
              console.log('New line item added');
              conn.query(`SELECT * FROM quotes WHERE quote_id = "${req.body.quote_id}"`, (err, quote_entry) => {
                if(err) throw err;
                else {
                  let initial_price = Number(quote_entry[0].initial_total_price);
                  let discount = Number(quote_entry[0].discount);
                  let final_price = initial_price - discount;

                  conn.query(`UPDATE quotes SET final_total_price = "${final_price}" WHERE quote_id = "${quote_id}";`, function(err) {
                    if (err) throw err;
                    else {
                      res.redirect(return_page);
                    }
                  });
                }
              })
            }
          })}})}})}})

// finalizes quote on sales associate interface
router.post('/finalize-quote', (req, res) => {
  let sql_finalize = `UPDATE quotes SET finalized = '1' WHERE quote_id = "${req.body.finalizeQuote}";`
  conn.query(sql_finalize, function(err, data) {
    if(err) res.send(err, data);
    else {
      console.log('Quote finalized');
      res.redirect('/on-site-portal');
    }
  })
})

// SQL query to pull customer names & ids from legacy DB
let customer_list;
let non_string_customers;
let sql1 = 'SELECT id, name FROM customers ORDER BY name;';
legacy_conn.query(sql1, (err, results1, fields) => {
  if(err) {
    throw err;
  }
  
  non_string_customers = results1
  
  // convert to JSON string, replace ' with escape char
  customer_list = JSON.stringify(results1);
  customer_list = customer_list.replaceAll("'", "\\'");
});


router.get('/admin', (_, res) => {
  conn.query("SELECT * FROM sales_assoc", (err, assoc) => {
    if(err) throw err

    res.render('pages/admin', {associates: assoc, customers: non_string_customers})
  })
})

//on-site portal page render
router.get('/on-site-portal', (request, res) => {
  let user_id = request.session.user_id;
  let sql = `SELECT * FROM quotes WHERE sa_id = '${user_id}' and finalized = 0;`;
  let quote_list;
  conn.query(sql, (err, results, fields) => {
    if(err) {
      throw err;
    }
    quote_list = JSON.stringify(results);
    res.render('pages/on-site-portal', {
      customer_list: customer_list,
      quote_list: quote_list,
      user_id: request.session.user_id
    });
  });
});

router.post('/delete-associate', (req, res) => {
  conn.query(`DELETE FROM sales_assoc WHERE id = "${req.body.associate}"`, (err) => {
    if(err) res.send(err)
    else res.send("Successfully deleted associate")
  })
})

router.post('/update-associate', (req, res) => {
  conn.query(`UPDATE sales_assoc SET id = "${req.body.new_vals[0]}", password = "${req.body.new_vals[1]}", first_name = "${req.body.new_vals[2]}", last_name = "${req.body.new_vals[3]}", address = "${req.body.new_vals[4]}", total_commission = ${parseFloat(req.body.new_vals[5])} WHERE id = "${req.body.old_id}"`, (err) => {
    if(err) res.send(err)
    else res.send("Successfully edited associate")
  })
})

router.post('/add-associate', (req, res) => {
  conn.query(`INSERT INTO sales_assoc VALUES ("${req.body['user-id']}", "${req.body['first-name']}", "${req.body['last-name']}", "${req.body['password']}", ${req.body['commission']}, "${req.body['address']}")`, () => {
    res.redirect('admin')
  })
})

// logout - ends session
router.get('/logout', function(request, response, next){
  console.log(`User ${request.session.user_id} logged out...`);
  request.session.destroy();
  response.redirect("/");
});

router.post('/search_quotes', (req, res) => {
  let args = 0
  let query = `SELECT * FROM quotes`
  if(req.body.assoc != "all") {
    query += ` WHERE sa_id = "${req.body.assoc}"`
    args++
  }

  if(req.body.cust != "all") {
    if(args == 0)
      query += ` WHERE`
    else
      query += ` AND`

    query += ` customer_id = ${req.body.cust}`
    args++
  }

  if(req.body.status != "all") {
    if(args == 0)
      query += ` WHERE`
    else
      query += ` AND`

    if(req.body.status == 'ordered') query += ' ordered = 1'
    else if(req.body.status == 'sanctioned') query += ' sanctioned = 1 AND ordered = 0'
    else if(req.body.status == 'finalized') query += ' finalized = 1 AND sanctioned = 0 AND ordered = 0'
    else query += ' finalized = 0 AND sanctioned = 0 AND ordered = 0'

    args++
  }

  if(req.body.from_date != '') {
    if(args == 0)
      query += ` WHERE`
    else
      query += ` AND`

    query += ` date_time >= '${req.body.from_date} 00:00:00'`

    args++
  }

  if(req.body.to_date != '') {
    if(args == 0)
      query += ` WHERE`
    else
      query += ` AND`

    query += ` date_time <= '${req.body.to_date} 23:59:59'`
    args++
  }
  
  conn.query(query, (err, data) => {
    if(err) throw err
  
    legacy_conn.query("SELECT * FROM customers", (err, cust) => {
      if(err) throw err
      else res.send({quotes: data, customers: cust})
    })
  })
})

// renders office portal page
router.get('/office-portal', (req, res) => {
  conn.query(`SELECT * FROM quotes WHERE finalized = '1' and sanctioned = '0' and ordered='0'`, (err, finalized_quotes) => {
    if (err) {throw err;}
    else {
      conn.query(`SELECT * FROM quotes WHERE finalized=1 and sanctioned=1 and ordered='0'`, (err, sanctioned_quotes) => {
        if(err) throw err;
        else {
          let finalized_quotes_string = JSON.stringify(finalized_quotes);
          let sanctioned_quotes_string = JSON.stringify(sanctioned_quotes);

          res.render('pages/office-portal', {
            customer_list: customer_list,
            finalized_quotes: finalized_quotes_string,
            sanctioned_quotes: sanctioned_quotes_string
      })}
    }
  )}
})})

// logic for view finalized quote
let view_quote_id;
router.post('/viewfinquote', (req, res) => {
  console.log(`Pulling information about finalized quote ${req.body.quote_id}`);
  view_quote_id = req.body.quote_id;
  res.redirect('/view-finalized-quote');
})

router.post('/viewsancquote', (req, res) => {
  console.log(`Pulling information about sanctioned quote ${req.body.quote_id}`);
  view_quote_id = req.body.quote_id;
  res.redirect('/view-sanctioned-quote');
})

router.post('/viewsearchquote', (req, res) => {
  console.log(`Pulling information about searched quote ${req.body.quote_id}`)
  view_quote_id = req.body.quote_id
  res.redirect('/view-search-quote')
})

router.get('/view-finalized-quote', (req, res) => {
  if(!view_quote_id) {
    res.redirect("/office-portal")
    return
  }
  console.log(view_quote_id);
  conn.query(`SELECT * FROM quotes WHERE quote_id = "${view_quote_id}";`, (err, view_quote) => {
    if(err) throw err;
    let view_quote_string = JSON.stringify(view_quote);
    console.log(view_quote);
    legacy_conn.query(`SELECT * FROM customers WHERE id = "${view_quote[0].customer_id}";`, (err, view_customer) => {
      if(err) throw err;

      let view_customer_string = JSON.stringify(view_customer);
      conn.query(`SELECT * FROM line_items WHERE quote_id = "${view_quote_id}";`, (err, view_line_items) => {
        if(err) throw err;

        let view_line_items_string = JSON.stringify(view_line_items);

        res.render('pages/view-finalized-quote', {
          quote_id: view_quote_id,
          quote_info: view_quote_string,
          customer_info: view_customer_string,
          line_items: view_line_items_string
        })
      })
    })
  })
})

router.get('/view-sanctioned-quote', (req, res) => {
  if(!view_quote_id) {
    res.redirect("/office-portal")
    return
  }

  conn.query(`SELECT * FROM quotes WHERE quote_id = "${view_quote_id}";`, (err, view_quote) => {
    if(err) throw err;
    let view_quote_string = JSON.stringify(view_quote);
    legacy_conn.query(`SELECT * FROM customers WHERE id = "${view_quote[0].customer_id}";`, (err, view_customer) => {
      if(err) throw err;

      let view_customer_string = JSON.stringify(view_customer);
      conn.query(`SELECT * FROM line_items WHERE quote_id = "${view_quote_id}";`, (err, view_line_items) => {
        if(err) throw err;

        let view_line_items_string = JSON.stringify(view_line_items);

        res.render('pages/view-sanctioned-quote', {
          quote_id: view_quote_id,
          quote_info: view_quote_string,
          customer_info: view_customer_string,
          line_items: view_line_items_string
        })
      })
    })
  })
})

router.get('/view-search-quote', (_, res) => {
  if(!view_quote_id) {
    res.redirect("/admin")
    return
  }

  conn.query(`SELECT * FROM quotes WHERE quote_id = "${view_quote_id}";`, (err, quote) => {
    if(err) throw err
    
    legacy_conn.query(`SELECT * FROM customers WHERE id = "${quote[0].customer_id}";`, (err, cust) => {
      if(err) throw err
      
      conn.query(`SELECT * FROM line_items WHERE quote_id = "${view_quote_id}";`, (err, line_items) => {
        if(err) throw err
        
        res.render('pages/view-search-quote', {
          quote_id: view_quote_id,
          quote_info: quote,
          customer_info: cust,
          line_items: line_items
        })
      })
    })
  })
})

// logic for update discount
router.post('/update-discount', (req, res) => {
  view_quote_id = req.body.quote_id;
  return_page = req.body.return_page;
  let discount_type = req.body.discount_type;
  let discount_amount = Number(req.body.discount_amount);
  let initial_total_price = Number(req.body.initial_total_price);

  console.log(`Quote ID: ${view_quote_id}, Return Page: ${return_page}, discount type: ${discount_type}, discount amount: ${discount_amount}, ${initial_total_price}`)

  if (!discount_amount || discount_amount === 0)
  {
    console.log('No input');
  }

  if (discount_type === "dollars") {
  let new_final_price = initial_total_price - discount_amount;
    conn.query(`UPDATE quotes SET discount = "${discount_amount}", final_total_price = "${new_final_price}" WHERE quote_id = "${view_quote_id}";`, (err) => {
      if(err) res.send(err);
    }
  )}
  else if (discount_type === "percent") {
    let discount_amount_dollars = (discount_amount/100) * initial_total_price;
    console.log(`Updated amount: ${discount_amount_dollars}`);
    let new_final_price = initial_total_price - discount_amount_dollars;
    conn.query(`UPDATE quotes SET discount = "${discount_amount_dollars}", final_total_price = "${new_final_price}" WHERE quote_id = "${view_quote_id}";`, (err) => {
      if(err) res.send(err);
    }
    )
  }
  res.redirect(return_page);
})

// logic for update discount
router.post('/update-additional-discount', (req, res) => {
  view_quote_id = req.body.quote_id;
  return_page = req.body.return_page;
  let discount_type = req.body.discount_type;
  let discount_amount = Number(req.body.discount_amount);
  let final_total_price = Number(req.body.final_total_price);

  console.log(`Quote ID: ${view_quote_id}, Return Page: ${return_page}, discount type: ${discount_type}, discount amount: ${discount_amount}, ${final_total_price}`)

  if (!discount_amount || discount_amount === 0)
  {
    console.log('No input to update discount.');
  }

  if (discount_type === "dollars") {
  let new_final_price = final_total_price - discount_amount;
    conn.query(`UPDATE quotes SET additional_discount = "${discount_amount}", order_price = "${new_final_price}" WHERE quote_id = "${view_quote_id}";`, (err) => {
      if(err) res.send(err);
    }
  )}
  else if (discount_type === "percent") {
    let discount_amount_dollars = (discount_amount/100) * final_total_price;
    console.log(`Updated amount: ${discount_amount_dollars}`);
    let new_final_price = final_total_price - discount_amount_dollars;
    conn.query(`UPDATE quotes SET additional_discount = "${discount_amount_dollars}", order_price = "${new_final_price}" WHERE quote_id = "${view_quote_id}";`, (err) => {
      if(err) res.send(err);
    }
    )
  }
  res.redirect(return_page);
})

// sanction quote
router.post('/sanction-quote', (req, res) => {
  view_quote_id = req.body.quote_id;

  conn.query(`SELECT final_total_price FROM quotes WHERE quote_id = "${view_quote_id}"`, (err, quote_price) => {
    if (err) throw err;
    else {

    let final_total_price = quote_price[0].final_total_price;
    console.log(final_total_price);

    conn.query(`UPDATE quotes SET sanctioned='1', order_price = "${final_total_price}" WHERE quote_id ="${view_quote_id}"`, (err) => {
      if(err) throw err;
      else {
        return_page = req.body.return_page;
        console.log(`Quote ${view_quote_id} has been sanctioned.`);
        res.redirect('/office-portal');
      }
    })
  }})
})

const axios = require("axios")

//processing system testing
router.post('/order-quote', (req, res) => {
  //Set view_quote_id to req.body.quote_id...

  //Query to update quote and redirect user...

  //Inside query, before redirect, send request to processing system...
  console.log(req.body.quote_id)
  axios.post('http://blitz.cs.niu.edu/PurchaseOrder/', {
    'order': req.body.quote_id,
    'associate': req.body.associate,
    'custid': req.body.custid,
    'amount': req.body.amount
  }).then(res => {
    console.log(res.data)

    //Use results to set commission in quote and total_commission in customer
    let commission = parseFloat('0.' + res.data.commission) * req.body.amount
    conn.query(`UPDATE quotes SET commission = ${commission} WHERE quote_id = "${req.body.quote_id}"`)
    conn.query(`UPDATE sales_assoc SET total_commission = total_commission + ${commission} WHERE id = "${req.body.associate}"`)
  })

  res.send("WORKING")
})

app.listen(3000)