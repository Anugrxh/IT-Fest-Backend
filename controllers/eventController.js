const { Event, Category, User } = require('../models');
const { Op } = require('sequelize'); // Sequelize operators

// 1. Get All Events (With Filtering & Pagination)
exports.getAllEvents = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    // Build Query
    const queryOptions = {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: User, as: 'Coordinator', attributes: ['name', 'email'] } // Optional: if you linked coordinator
      ],
      where: {},
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['dateTime', 'ASC']] // Show upcoming events first
    };

    // Filter by Category Slug (e.g. ?category=technical)
    if (category) {
      // We need to filter based on the included Category model
      // Note: This requires a slightly different query structure or fetching Category ID first
      // Simpler approach: Find category first
      const categoryDoc = await Category.findOne({ where: { slug: category } });
      if (categoryDoc) {
        queryOptions.where.categoryId = categoryDoc.id;
      }
    }

    // Search by Title
    if (search) {
      queryOptions.where.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Event.findAndCountAll(queryOptions);

    res.status(200).json({
      status: 'success',
      results: rows.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Single Event (Public)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'Coordinator', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Create Event (Admin Only)
exports.createEvent = async (req, res) => {
  try {
    // If middleware processed an image, it put the path in body
    const bannerUrl = req.body.bannerUrl || null;

    const newEvent = await Event.create({
      ...req.body,
      bannerUrl
    });

    res.status(201).json({ status: 'success', data: newEvent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 4. Update Event (Admin Only)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Handle Image Update
    let updateData = { ...req.body };
    
    // If a new file was uploaded, update the URL
    // (Optional: You could delete the old file from disk here using fs.unlink)
    if (req.body.bannerUrl) {
      updateData.bannerUrl = req.body.bannerUrl;
    }

    await event.update(updateData);

    res.status(200).json({ status: 'success', data: event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 5. Delete Event (Admin Only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.destroy();

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};