const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
const helpers = require('handlebars-helpers')();
const OpenAI = require("openai");
require('dotenv').config();

const api_key = process.env.OPENAI_API_KEY;
const openai = new OpenAI({apiKey:api_key});
const { createConnection, format } = require('mysql2/promise');

let app = express();

// Define Handlebars setup
app.set('view engine', 'hbs');
app.set('views', './views');

// Register handlebars-helpers
hbs.registerHelper(helpers);

// Set up wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// Register custom helpers
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});

app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));



let connection;

function formatToJson(completion) {
    // Get the content from the completion
    const content = completion.content;
    
    // Split content into sections by ###
    const sections = content.split('###').filter(Boolean);
    
    // Initialize result object
    const result = {
        sections: []
    };
    
    // Process each section
    sections.forEach(section => {
        // Split first line as title and rest as content
        const [title, ...contentLines] = section.trim().split('\n');
        
        // Process bullet points
        const points = contentLines
            .join('\n')
            .split('-')
            .filter(Boolean)
            .map(point => {
                // Remove markdown formatting
                return point
                    .replace(/\*\*/g, '') // Remove bold
                    .replace(/\*/g, '')   // Remove italic
                    .trim();
            });

        // Add section to result
        result.sections.push({
            title: title.trim(),
            points: points
        });
    });

    return result;
}

async function main() {
    connection = await createConnection({
        'host': process.env.DB_HOST,
        'user': process.env.DB_USER,
        'database': process.env.DB_NAME,
        'password': process.env.DB_PASSWORD
    })

    
    app.get('/', (req,res) => {
        res.render('blog/index');
    });

    // list out all users in the database
    app.get('/users', async function(req, res){
        let [users] = await connection.execute('SELECT * FROM Users');
        res.render('blog/users', {
            'users': users
        })
    })

    // list out all posts in the database
    app.get('/posts', async function(req, res){
        let [posts] = await connection.execute('SELECT Users.username, Users.email, Posts.post_id, Posts.title, Posts.content, Posts.created_at FROM Posts JOIN Users ON Posts.user_id = Users.user_id');
        
        res.render('blog/posts', {
            'posts': posts
        })
    })

    // list out all comments in the database
    app.get('/comments', async function(req, res){
        let [comments] = await connection.execute('SELECT Posts.title AS post_title,Comments.comment_id,Comments.comment_text,Users.username,Comments.created_at FROM Comments JOIN Posts ON Comments.post_id = Posts.post_id JOIN Users ON Comments.user_id = Users.user_id');
        res.render('blog/comments', {
            'comments': comments
        })
    })

    // Route to display the 'blog main' page
    app.get('/read', async function(req, res){
        let [rows] = await connection.execute(`
            SELECT 
                Posts.post_id,
                Posts.title, 
                Posts.content, 
                Posts.created_at AS post_created_at, 
                Users.username AS post_author, 
                Comments.comment_text, 
                Comments.created_at AS comment_created_at, 
                CommentUsers.username AS comment_author
            FROM 
                Posts 
            JOIN 
                Users ON Posts.user_id = Users.user_id
            LEFT JOIN 
                Comments ON Posts.post_id = Comments.post_id
            LEFT JOIN 
                Users AS CommentUsers ON Comments.user_id = CommentUsers.user_id
            ORDER BY 
                Posts.created_at DESC, Comments.created_at DESC;
        `);

        const posts = rows.reduce((acc, row) => {
            let post = acc.find(p => p.post_id === row.post_id);
            if (!post) {
                post = {
                    post_id: row.post_id,
                    title: row.title,
                    content: row.content,
                    post_created_at: row.post_created_at,
                    post_author: row.post_author,
                    comments: []
                };
                acc.push(post);
            }

            if (row.comment_text) {
                post.comments.push({
                    comment_text: row.comment_text,
                    comment_created_at: row.comment_created_at,
                    comment_author: row.comment_author
                });
            }

            return acc;
        }, []);

        res.render('blog/read', { posts });
    });

    // New route to handle comment submissions
    app.post('/posts/:id/comments', async (req, res) => {
        const postId = req.params.id;
        const { comment_author, comment_text } = req.body;

        try {
            // First, check if the user exists
            let [users] = await connection.execute('SELECT user_id FROM Users WHERE username = ?', [comment_author]);
            
            let userId;
            if (users.length === 0) {
                // If user doesn't exist, create a new user
                const [result] = await connection.execute(
                    'INSERT INTO Users (username, email) VALUES (?, ?)',
                    [comment_author, `${comment_author}@example.com`] // Using a placeholder email
                );
                userId = result.insertId;
            } else {
                userId = users[0].user_id;
            }

            // Now insert the comment
            await connection.execute(
                'INSERT INTO Comments (post_id, user_id, comment_text) VALUES (?, ?, ?)',
                [postId, userId, comment_text]
            );

            // Redirect back to the read page
            res.redirect('/read');
        } catch (error) {
            console.error('Error submitting comment:', error);
            res.status(500).send('An error occurred while submitting the comment');
        }
    });

    // Handle GET request to /posts/:id/comments (in case of accidental navigation)
    app.get('/posts/:id/comments', (req, res) => {
        res.redirect('/read');
    });

    //Route to input new user form
    app.get('/newUser', async function (req, res) {
        const [newUser] = await connection.execute(`SELECT * FROM Users`);
        res.render('blog/newUser', {
            "newUser": newUser
        })
    });

    app.post('/newUser', async function (req, res) {
        try {
            const sql = `
                INSERT INTO Users (
                    username,
                    email
                ) VALUES (?, ?);
            `;
            
            const bindings = [
                req.body.username,
                req.body.email
            ];

            const [result] = await connection.execute(sql, bindings);
            
            // Redirect on success
            res.redirect('/users');
        } catch (error) {
            console.error('Error creating user:', error);
            
            let errorMessage = 'An error occurred while creating the user';
            if (error.code === 'ER_DUP_ENTRY') {
                errorMessage = 'This email address is already registered';
            }
            
            // Render the form again with error message
            res.render('blog/newUser', {  // Note the path includes 'blog/'
                error: errorMessage,
                formData: {
                    username: req.body.username,
                    email: req.body.email
                }
            });
        }
    });
    
    //Route to create a new Post
    app.get('/createPost', async function (req, res) {
        try {
            // Fetch users for the dropdown
            const [users] = await connection.execute('SELECT user_id, username FROM Users');
            // Render the form with the users list
            res.render('blog/createPost', { users: users, formData: null, error: null });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send('An error occurred');
        }
    });
    
    app.post('/createPost', async function (req, res) {
        try {
            const sql = `
                INSERT INTO Posts (
                    title,
                    content,
                    user_id
                ) VALUES (?, ?, ?);
            `;
            
            const bindings = [
                req.body.title,
                req.body.content,
                req.body.user_id
            ];
    
            // Execute the insert query
            const [result] = await connection.execute(sql, bindings);
            
            // Redirect to posts list page upon success
            res.redirect('/read');
        } catch (error) {
            console.error('Error creating post:', error);
            
            let errorMessage = 'An error occurred while creating the post';
            
            // Render the form again with an error message and form data
            res.render('blog/createPost', {  // Assuming you're using a 'blog/newPost' template
                error: errorMessage,
                formData: {
                    title: req.body.title,
                    content: req.body.content,
                    user_id: req.body.user_id
                }
            });
        }
    });

    // GET route to show edit form
    app.get('/users/:id/edit', async function(req, res){
        try {
            const [users] = await connection.execute(
                'SELECT * FROM Users WHERE user_id = ?',
                [req.params.id]
            );

            if (users.length === 0) {
                res.redirect('/users');
                return;
            }

            res.render('blog/editUser', {
                'user': users[0]
            });
        } catch (error) {
            console.error(error);
            res.redirect('/users');
        }
    });

    // POST route to handle the update
    app.post('/users/:id/edit', async function(req, res){
        try {
            const { username, email } = req.body;
            
            await connection.execute(
                'UPDATE Users SET username = ?, email = ? WHERE user_id = ?',
                [username, email, req.params.id]
            );

            res.redirect('/users');
        } catch (error) {
            console.error(error);
            const [users] = await connection.execute(
                'SELECT * FROM Users WHERE user_id = ?',
                [req.params.id]
            );
            
            res.render('blog/editUser', {
                'user': users[0],
                'error': 'Error updating user'
            });
        }
    });
    
    // Delete route to delete user
    app.get('/users/:user_id/delete', async function(req,res){
        // display a confirmation form 
        const [users] = await connection.execute(
            "SELECT * FROM Users WHERE user_id =?", [req.params.user_id]
        );
        const user = users[0];

        res.render('blog/deleteUser', {
            'user': users[0]
        })

    })

    app.post('/users/:user_id/delete', async function(req, res){
        await connection.execute(`DELETE FROM Users WHERE user_id = ?`, [req.params.user_id]);
        res.redirect('/users');
    })

    // route to edit Posts
    app.get('/posts/:post_id/edit', async function(req, res){
        try {
            const [posts] = await connection.execute(
                'SELECT * FROM Posts WHERE post_id = ?',
                [req.params.post_id]
            );

            if (posts.length === 0) {
                res.redirect('/posts');
                return;
            }

            res.render('blog/editPost', {
                'post': posts[0]
            });
        } catch (error) {
            console.error(error);
            res.redirect('/posts');
        }
    });

    app.post('/posts/:post_id/edit', async function(req, res){
            const { title, content } = req.body;
            
            await connection.execute(
                'UPDATE Posts SET title = ?, content = ? WHERE post_id = ?',
                [title, content, req.params.post_id]
            );

            res.redirect('/posts');
         
        
    });

    // route to delete post
    app.get('/posts/:post_id/delete', async function(req,res){
        // display a confirmation form 
        const [posts] = await connection.execute(
            "SELECT * FROM Posts WHERE post_id =?", [req.params.post_id]
        );
        const post = posts[0];

        res.render('blog/deletePost', {
            'post': posts[0]
        })

    })
    
    app.post('/posts/:post_id/delete', async function(req, res){
        await connection.execute(`DELETE FROM Posts WHERE post_id = ?`, [req.params.post_id]);
        res.redirect('/posts');
    })


    // route to edit Comments
    app.get('/comments/:comment_id/edit', async function(req, res){
            const [comments] = await connection.execute(
                'SELECT * FROM Comments WHERE comment_id = ?',
                [req.params.comment_id]
            );

            if (comments.length === 0) {
                res.redirect('/comments');
                return;
            }

            res.render('blog/editComment', {
                'comment': comments[0]
            });
         
        
    });

    app.post('/comments/:comment_id/edit', async function(req, res){
            const { comment_text } = req.body;
            
            await connection.execute(
                'UPDATE Comments SET comment_text = ? WHERE comment_id = ?',
                [comment_text, req.params.comment_id]
            );

            res.redirect('/comments');
         
        
    });

    // route to delete comment
    app.get('/comments/:comment_id/delete', async function(req,res){
        // display a confirmation form 
        const [comments] = await connection.execute(
            "SELECT * FROM Comments WHERE comment_id =?", [req.params.comment_id]
        );
        const comment = comments[0];

        res.render('blog/deleteComment', {
            'comment': comments[0]
        })

    })

    app.post('/comments/:comment_id/delete', async function(req, res){
        await connection.execute(`DELETE FROM Comments WHERE comment_id = ?`, [req.params.comment_id]);
        res.redirect('/comments');
    })

    app.get('/generate-content', async function(req, res){
        const title = req.query.title;
        
        // Here you can add your logic to generate content based on the title
        const completion = await openai.chat.completions.create({
            model:"gpt-4o-mini",
            messages :[{role:"system",content:"you are helpful assistant, keep the words down to 100, and use html syntax, after every paragraph do a <br>",
                role:"user", content:title,
        
            }],
        })
        
        const formattedContent = formatToJson(completion.choices[0].message);
        console.log(formattedContent);
        res.json(completion.choices[0].message);
    });
    

    app.listen(3001, ()=>{
        console.log('Server is running')
    });
}

main();
