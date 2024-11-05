// server.js
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
