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
// Register a custom helper to output JSON in the template
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});

let connection;

async function main() {
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    
    app.get('/', (req,res) => {
        // res.send('Hello, World!');
        res.render('blog/index');
    });

    app.get('/read', (req,res) => {
        res.render('blog/read');
    });

    // list out all users in the database
    app.get('/users', async (req, res) => {
        let [users] = await connection.execute('SELECT * FROM Users');
        console.log(users);
        res.render('blog/users', {
            'users': users
        })
    })

    // list out all posts in the database
    app.get('/posts', async (req, res) => {
        let [posts] = await connection.execute('SELECT Users.username, Users.email, Posts.title, Posts.content, Posts.created_at FROM Posts JOIN Users ON Posts.user_id = Users.user_id');
        console.log(posts);
        res.render('blog/posts', {
            'posts': posts
        })
    })

    // list out all comments in the database
    app.get('/comments', async (req, res) => {
        let [comments] = await connection.execute('SELECT Posts.title AS post_title,Comments.comment_text,Users.username,Comments.created_at FROM Comments JOIN Posts ON Comments.post_id = Posts.post_id JOIN Users ON Comments.user_id = Users.user_id');
        res.render('blog/comments', {
            'comments': comments
        })
    })

    // Route to display the 'read' page
    app.get('/read', async (req, res) => {
        res.send('Hello, World!');
    });
        
    
    
    

    

    

    app.listen(3000, ()=>{
        console.log('Server is running')
    });
}

main();
