import querrymodel from '../models/query.model.js';

export const createQuery = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        const newQuery = new querrymodel({
            name,
            email,
            mobile: phone,
            subject,
            message,
        });

        await newQuery.save();

        res.status(201).json({ message: 'Query submitted successfully', query: newQuery });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const getAllQueries = async (req, res) => {
    try {
        const queries = await querrymodel.find().sort({ createdAt: -1 });
        res.status(200).json({ queries });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const getQueryById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = await querrymodel.findById(id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ query });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const deleteQueryById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = await querrymodel.findByIdAndDelete(id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ message: 'Query deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const markQueryAsResolved = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming user ID is available in req.user
        const { id } = req.params;
        const {note} = req.body;
        const query = await querrymodel.findById(id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        query.resolved = true;
        query.resolvedAt = { date: new Date(), by: userId, note: note || '' };

        await query.save();

        res.status(200).json({ message: 'Query marked as resolved', query });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};