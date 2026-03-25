const express = require('express');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const app = express();
const PORT = 3000;

app.use(express.json());

// Secret key for JWT signing (In a real app, use environment variables)
const SECRET_KEY = 'my_super_secret_key';

// In-memory data storage
let posts = [
    { id: 1, title: 'First Post', content: 'Hello World!' },
    { id: 2, title: 'Second Post', content: 'Express is awesome.' }
];

// User Login - Generates a JWT
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // For this lab, we'll allow any username and a fixed password
    if (password === 'password123') {
        const user = { username: username }; // User payload
        const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Check if the header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - Missing or malformed token' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden - Invalid or expired token' });
        }
        req.user = decoded; // Attach decoded user info to the request
        next();
    });
};


app.get('/', (req, res) => {
    res.send('Social Media API is running');
});

// GET /posts - Get all posts
app.get('/posts', (req, res) => {
    res.json(posts);
});

// GET /posts/:id - Get a single post
app.get('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).send('Post not found');
    res.json(post);
});

// POST /posts - Create a new post (Protected)
app.post('/posts', authenticate, (req, res) => {
    const newPost = {
        id: posts.length + 1,
        title: req.body.title,
        content: req.body.content
    };
    posts.push(newPost);
    res.status(201).json(newPost);
});

// PUT /posts/:id - Update a post (Protected)
app.put('/posts/:id', authenticate, (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).send('Post not found');

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    res.json(post);
});

// DELETE /posts/:id - Delete a post (Protected)
app.delete('/posts/:id', authenticate, (req, res) => {
    const index = posts.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).send('Post not found');

    const deletedPost = posts.splice(index, 1);
    res.json(deletedPost);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

