const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite')
});

// Define Journal Entry model
const Entry = sequelize.define('Entries', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  aiComment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

sequelize.sync({ alter: true })
  .then(() => console.log('Database & tables created!'))
  .catch(err => console.error('Error creating database:', err));

// Function to generate AI comment using Python script
function generateAIComment(content) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['generate_comment.py', content]);
    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

// POST route to create a new journal entry
app.post('/api/entries', async (req, res) => {
  try {
    console.log('Received POST request:', req.body);
    const { title, content } = req.body;
    
    if (!title || !content) {
      console.log('Missing title or content');
      return res.status(400).json({ message: "Title and content are required" });
    }

    console.log('Generating AI comment...');
    const aiComment = await generateAIComment(content);
    console.log('AI comment generated:', aiComment);

    console.log('Creating entry in database...');
    const entry = await Entry.create({ title, content, aiComment });
    console.log('Entry created:', entry.toJSON());
    res.status(201).json(entry);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: "Failed to save entry", 
      error: error.message,
      stack: error.stack
    });
  }
});

// GET route to fetch all journal entries
app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.findAll({ order: [['createdAt', 'DESC']] });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
