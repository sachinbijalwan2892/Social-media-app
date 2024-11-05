// routes/posts.js
const express = require('express');
const fs = require('fs-extra');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const postsFilePath = './data/posts.json';

const readPosts = async () => fs.readJSON(postsFilePath);
const writePosts = async (data) => fs.writeJSON(postsFilePath, data);

// Admin and Registered User: Create a post
router.post('/create', authenticateToken, authorizeRoles('admin', 'registered'), async (req, res) => {
    const { title, content } = req.body;

    // Validate input
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const posts = await readPosts();  // Read existing posts from JSON
        const newPost = { id: uuidv4(), userId: req.user.id, title, content, likes: [], comments: [] };
        
        posts.push(newPost);  // Add the new post to the list
        await writePosts(posts);  // Write updated posts back to JSON file

        res.status(201).json(newPost);  // Send response with new post data
    } catch (error) {
        console.error("Error creating post:", error);  // Log any errors for debugging
        res.status(500).json({ message: 'Failed to create post' });
    }
});


// Registered User: Update their own post
router.put('/update/:id', authenticateToken, authorizeRoles('registered'), async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const posts = await readPosts();
    const postIndex = posts.findIndex(post => post.id === id && post.userId === req.user.id);
    if (postIndex === -1) return res.status(403).json({ message: 'Unauthorized' });

    posts[postIndex] = { ...posts[postIndex], title, content };
    await writePosts(posts);
    res.json(posts[postIndex]);
});

// Admin: Delete any post, Registered User: Delete their own post
router.delete('/delete/:id', authenticateToken, authorizeRoles('admin', 'registered'), async (req, res) => {
    const { id } = req.params;
    const posts = await readPosts();
    const postIndex = posts.findIndex(post => post.id === id && (req.user.role === 'admin' || post.userId === req.user.id));
    if (postIndex === -1) return res.status(403).json({ message: 'Unauthorized' });

    posts.splice(postIndex, 1);
    await writePosts(posts);
    res.json({ message: 'Post deleted successfully' });
});

// Public: Read all posts
router.get('/', async (req, res) => {
    const posts = await readPosts();
    res.json(posts);
});

// Registered User: Like a post
router.post('/like/:id', authenticateToken, authorizeRoles('registered'), async (req, res) => {
    const { id } = req.params;
    const posts = await readPosts();
    const post = posts.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.likes.includes(req.user.id)) {
        post.likes.push(req.user.id);
        await writePosts(posts);
        res.json({ message: 'Post liked' });
    } else {
        res.json({ message: 'Post already liked' });
    }
});

// Registered User: Unlike a post
router.post('/unlike/:id', authenticateToken, authorizeRoles('registered'), async (req, res) => {
    const { id } = req.params;
    const posts = await readPosts();
    const post = posts.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.likes = post.likes.filter(userId => userId !== req.user.id);
    await writePosts(posts);
    res.json({ message: 'Post unliked' });
});

// Registered User: Comment on a post
router.post('/comment/:id', authenticateToken, authorizeRoles('registered'), async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const posts = await readPosts();
    const post = posts.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
        id: uuidv4(),
        userId: req.user.id,
        content,
        timestamp: new Date().toISOString()
    };
    post.comments.push(newComment);
    await writePosts(posts);
    res.status(201).json({ message: 'Comment added', comment: newComment });
});

// Public: Read all comments on a post
router.get('/comments/:id', async (req, res) => {
    const { id } = req.params;
    const posts = await readPosts();
    const post = posts.find(post => post.id === id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json(post.comments);
});

module.exports = router;
