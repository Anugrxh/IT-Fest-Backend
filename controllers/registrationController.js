const { sequelize, Registration, Event, User } = require('../models');

exports.registerForEvent = async (req, res) => {
  // Start a transaction to ensure atomic operations
  const t = await sequelize.transaction();

  try {
    const { eventId, teamName, memberIds } = req.body; 
    const leaderId = req.user.id;

    // 1. Fetch Event
    const event = await Event.findByPk(eventId, { transaction: t });
    if (!event) throw new Error('Event not found');

    // 2. Check if Leader is already registered for this event
    const existingReg = await Registration.findOne({
      where: { eventId, leaderId },
      transaction: t
    });
    if (existingReg) throw new Error('You are already registered for this event');

    // 3. Team Logic Validation
    let allMembers = [leaderId];
    
    if (event.isTeamEvent) {
      if (!memberIds || memberIds.length === 0) {
        throw new Error('This is a team event. Please add members.');
      }
      
      // Calculate total team size (Leader + Members)
      const teamSize = memberIds.length + 1; 
      
      if (teamSize < event.minTeamSize || teamSize > event.maxTeamSize) {
        throw new Error(`Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`);
      }
      
      // Merge leader and members for processing
      allMembers = [...allMembers, ...memberIds];
    }

    // 4. Create Registration Record
    const newRegistration = await Registration.create({
      eventId,
      leaderId,
      teamName: teamName || `${req.user.name}'s Team`,
      status: 'approved' // Or 'pending' if payment is required
    }, { transaction: t });

    // 5. Add Members to Junction Table
    // We must ensure the `addMembers` mixin exists. 
    // If you defined: Registration.belongsToMany(User, { as: 'Members' ... })
    // Then the method is `addMembers`.
    if (allMembers.length > 0) {
      await newRegistration.addMembers(allMembers, { transaction: t });
    }

    // 6. Commit Transaction
    await t.commit();

    res.status(201).json({ status: 'success', message: 'Registration successful', data: newRegistration });

  } catch (err) {
    // Rollback if anything fails
    await t.rollback();
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.findAll({
      where: { leaderId: req.user.id },
      include: [
        { model: Event, attributes: ['title', 'venue', 'dateTime'] },
        { model: User, as: 'Members', attributes: ['name', 'email'] } // See team members
      ]
    });
    res.status(200).json({ status: 'success', results: registrations.length, data: registrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};