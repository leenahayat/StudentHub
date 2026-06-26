const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());

// Serve static files from Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// ===== In-Memory Database =====
let tasks = [
    {
        id: 1,
        title: 'Complete Project 2',
        description: 'Build the backend API for DecodeLabs',
        completed: false,
        priority: 'high',
        category: 'academic',
        dueDate: '2026-06-30',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        title: 'Study for Exams',
        description: 'Review all full-stack concepts',
        completed: false,
        priority: 'medium',
        category: 'academic',
        dueDate: '2026-07-05',
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        title: 'Submit Assignment',
        description: 'Submit the DecodeLabs project',
        completed: true,
        priority: 'high',
        category: 'academic',
        dueDate: '2026-06-25',
        createdAt: new Date().toISOString()
    }
];
let nextTaskId = 4;

// ===== Helper: Filter Tasks =====
function filterTasks(tasks, filters) {
    let filtered = [...tasks];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(term) ||
            (t.description && t.description.toLowerCase().includes(term))
        );
    }

    if (filters.status === 'active') {
        filtered = filtered.filter(t => !t.completed);
    } else if (filters.status === 'completed') {
        filtered = filtered.filter(t => t.completed);
    }

    if (filters.priority) {
        filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.category) {
        filtered = filtered.filter(t => t.category === filters.category);
    }

    return filtered;
}



// GET all tasks with filters
app.get('/api/tasks', (req, res) => {
    const filters = {
        search: req.query.search,
        status: req.query.status,
        priority: req.query.priority,
        category: req.query.category
    };

    const filtered = filterTasks(tasks, filters);
    res.json({
        tasks: filtered,
        total: tasks.length,
        filtered: filtered.length,
        stats: {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            active: tasks.filter(t => !t.completed).length,
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
        }
    });
});

// GET single task
app.get('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

// POST create task
app.post('/api/tasks', (req, res) => {
    const { title, description, priority, category, dueDate } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    const newTask = {
        id: nextTaskId++,
        title: title.trim(),
        description: description || '',
        completed: false,
        priority: priority || 'medium',
        category: category || 'general',
        dueDate: dueDate || '',
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT update task
app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, completed, priority, category, dueDate } = req.body;

    if (title !== undefined) {
        if (title.trim().length === 0) {
            return res.status(400).json({ error: 'Title cannot be empty' });
        }
        task.title = title.trim();
    }
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate;

    res.json(task);
});

// DELETE single task
app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });
    tasks.splice(index, 1);
    res.status(204).send();
});

// DELETE all completed tasks
app.delete('/api/tasks', (req, res) => {
    tasks = tasks.filter(t => !t.completed);
    res.status(204).send();
});



// Serve landing page for root
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Serve dashboard for /dashboard
app.get('/dashboard', function(req, res) {
    res.sendFile(path.join(__dirname, '../Frontend/dashboard.html'));
});

// Serve index.html for any other route (except API)
app.get(/^\/(?!api).*/, function(req, res) {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log(' Server running on http://localhost:' + PORT);
    console.log(' Landing: http://localhost:' + PORT);
    console.log(' Dashboard: http://localhost:' + PORT + '/dashboard');
});