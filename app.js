const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Import multer for file uploads
const path = require('path');
const app = express();
const PORT = 3000;

// Configure EJS Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static folder for images

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const SECRET_KEY = 'my_super_secret_key';

// In-memory data storage
let posts = [
    { id: 1, title: 'First Post', content: 'Hello World!', image: null },
    { id: 2, title: 'Second Post', content: 'Express is awesome.', image: null }
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
    // Basic EJS render example (Dynamic HTML)
    res.render('index', { posts: posts });
});

app.get('/login-page', (req, res) => {
    res.render('login');
});

// Helper route to seed data for pagination testing
app.get('/seed', (req, res) => {
    for (let i = 3; i <= 20; i++) {
        posts.push({ id: i, title: `Post ${i}`, content: `Content for post ${i}`, image: null });
    }
    res.send('Seeded 18 mock posts for pagination testing!');
});


// GET /posts - Get all posts (With Pagination)
app.get('/posts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const resultPosts = posts.slice(startIndex, endIndex);
    res.json({
        page: page,
        limit: limit,
        totalItems: posts.length,
        totalPages: Math.ceil(posts.length / limit),
        data: resultPosts
    });
});
// GET /posts/:id - Get a single post
app.get('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).send('Post not found');
    res.json(post);
});

// POST /posts - Create a new post (Protected + Image Upload)
app.post('/posts', authenticate, upload.single('image'), (req, res) => {
    const newPost = {
        id: posts.length + 1,
        title: req.body.title,
        content: req.body.content,
        image: req.file ? `/uploads/${req.file.filename}` : null // Handle optional image upload
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

