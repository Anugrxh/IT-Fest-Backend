const { Category } = require('../models');
const slugify = require('slugify');

// 1. Create Category (Admin Only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Generate slug from name (e.g., "Gaming & Esports" -> "gaming-and-esports")
    const slug = slugify(name, { lower: true, strict: true });

    const newCategory = await Category.create({
      name,
      description,
      slug
    });

    res.status(201).json({ status: 'success', data: newCategory });
  } catch (err) {
    // Handle duplicate name error
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

// 2. Get All Categories (Public)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({ 
      status: 'success', 
      results: categories.length, 
      data: categories 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Single Category by Slug (Public)
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ 
      where: { slug: req.params.slug } 
    });
    
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.status(200).json({ status: 'success', data: category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Update Category (Admin Only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) return res.status(404).json({ message: 'Category not found' });

    // If name is changing, regenerate the slug
    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }
    if (description) category.description = description;

    await category.save();

    res.status(200).json({ status: 'success', data: category });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 5. Delete Category (Admin Only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.destroy();

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    // Prevent deletion if events are linked to this category (Foreign Key Constraint)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Cannot delete category because it has related events.' 
      });
    }
    res.status(500).json({ error: err.message });
  }
};