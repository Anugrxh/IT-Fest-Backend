const { Event, Category, User } = require("../models");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        { model: Category, as: "category", attributes: ["name", "slug"] },
      ],
    });
    res
      .status(200)
      .json({ status: "success", results: events.length, data: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Category, as: "category" }],
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ status: "success", data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin Only
exports.createEvent = async (req, res) => {
  try {
    // Assuming you handled image upload in middleware and put url in req.file.path
    const newEvent = await Event.create(req.body);

    res.status(201).json({ status: "success", data: newEvent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
