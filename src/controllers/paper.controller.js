const paperService = require('../services/paper.service');

const createPaper = async (req, res) => {
    try {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        const newPaper = await paperService.addPaper(req.body);
        res.status(201).json(newPaper);
    } catch (error) {
        console.error('Full error:', error);
        res.status(500).json({ error: "Failed to add paper", details: error.message });
    }
};

const getPapers = async (req, res) => {
    try {
        const papers = await paperService.fetchPapers(req.query);
        res.status(200).json(papers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch papers", details: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const analytics = await paperService.fetchAnalytics();
        res.status(200).json(analytics);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics", details: error.message });
    }
};

module.exports = {
    createPaper,
    getPapers,
    getAnalytics
};