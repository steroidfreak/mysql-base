const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const { createConnection } = require('mysql2/promise');

let app = express();
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));

wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

let connection;

async function main() {
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    app.get('/', (req,res) => {
        res.send('Hello, World!');
    });

    app.get('/customers', async (req, res) => {
        let [customers] = await connection.execute('SELECT * FROM Customers INNER JOIN Companies ON Customers.company_id = Companies.company_id');
        console.log(customers);
        res.render('customers/index', {
            'customers': customers
        })
    })

    app.get('/users', async (req, res) => {
        let [users] = await connection.execute('SELECT * FROM Users');
        console.log(users);
        res.render('blog/index', {
            'users': users
        })
    })

    app.get('/posts', async (req, res) => {
        let [posts] = await connection.execute('SELECT Users.username, Users.email, Posts.title, Posts.content, Posts.created_at FROM Posts JOIN Users ON Posts.user_id = Users.user_id');
        console.log(posts);
        res.render('blog/posts', {
            'posts': posts
        })
    })
    

    app.listen(3000, ()=>{
        console.log('Server is running')
    });
}

main();
