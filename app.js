require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist', 'FrontEnd')));
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// ---------- MongoDB connection ----------
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// ---------- Mongoose schema & model ----------
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, default: '' },
    position: { type: String, default: '' },
    salary: { type: Number, default: 0 }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

// ---------- API routes ----------

// Get all employees
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ createdAt: -1 });
        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employee list' });
    }
});

// Get single employee by id
app.get('/api/employeelist/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee id' });
    }
    try {
        const emp = await Employee.findById(id);
        if (!emp) return res.status(404).json({ error: 'Employee not found' });
        res.json(emp);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Add new employee
app.post('/api/employeelist', async (req, res) => {
    const { name, location, position, salary } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const newEmp = new Employee({
            name,
            location: location || '',
            position: position || '',
            salary: salary ? Number(salary) : 0
        });
        const saved = await newEmp.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// Delete employee by id
app.delete('/api/employeelist/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee id' });
    }
    try {
        const deleted = await Employee.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully', id: deleted._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// Update employee by id
app.put('/api/employeelist/:id', async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee id' });
    }
    const { name, location, position, salary } = req.body;
    try {
        const updated = await Employee.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...(name !== undefined && { name }),
                    ...(location !== undefined && { location }),
                    ...(position !== undefined && { position }),
                    ...(salary !== undefined && { salary: Number(salary) })
                }
            },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Employee not found' });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Catch-all route for frontend
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'Frontend', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
