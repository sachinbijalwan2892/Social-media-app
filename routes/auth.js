// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = 'your_secret_key';

const usersFilePath = './data/users.json';

// Helper function to read and write JSON files
const readUsers = async () => {
    try {
        return await fs.readJSON(usersFilePath);
    } catch (error) {
        // If the file doesn't exist or is empty, initialize it with an empty array
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            await writeUsers([]);  // Ensure the file is created as an empty array
            return [];
        }
        throw error; // Re-throw other errors
    }
};
const writeUsers = async (data) => fs.writeJSON(usersFilePath, data);

// Signup Route
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;
    const users = await readUsers();
    const existingUser = users.find(user => user.email === email);
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), email, password: hashedPassword, role };
    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = await readUsers();
    const user = users.find(user => user.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '10h' });
    res.json({ token });
});

module.exports = router;
