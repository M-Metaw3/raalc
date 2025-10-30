const { getConnection } = require('typeorm');

/**
 * User Repository
 * Handles all database operations for User entity
 */
class UserRepository {
  constructor() {
    this.getRepository = () => getConnection().getRepository('User');
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const repository = this.getRepository();
    const user = repository.create(userData);
    return await repository.save(user);
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('user')
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('user.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('user.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find user by phone number
   * @param {string} phone - User phone number
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} User object or null
   */
  async findByPhone(phone, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('user')
      .where('user.phone = :phone', { phone })
      .andWhere('user.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('user.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find user by email or phone
   * @param {string} identifier - Email or phone number
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmailOrPhone(identifier, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('user')
      .where('user.email = :identifier', { identifier })
      .orWhere('user.phone = :identifier', { identifier })
      .andWhere('user.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('user.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find user by email verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmailVerificationToken(token) {
    const repository = this.getRepository();
    return await repository.createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .addSelect('user.emailVerificationExpires')
      .where('user.emailVerificationToken = :token', { token })
      .andWhere('user.emailVerificationExpires > :now', { now: new Date() })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Find user by password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} User object or null
   */
  async findByPasswordResetToken(token) {
    const repository = this.getRepository();
    return await repository.createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .addSelect('user.passwordResetExpires')
      .addSelect('user.password')
      .where('user.passwordResetToken = :token', { token })
      .andWhere('user.passwordResetExpires > :now', { now: new Date() })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Update user data
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Soft delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async softDelete(id) {
    const repository = this.getRepository();
    await repository.update(id, { deletedAt: new Date() });
    return true;
  }

  /**
   * Find all users with filtering
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated users
   */
  async findAll(filters = {}, page = 1, limit = 20) {
    const repository = this.getRepository();
    const skip = (page - 1) * limit;
    
    const query = repository.createQueryBuilder('user')
      .where('user.deletedAt IS NULL');
    
    if (filters.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }
    
    if (filters.search) {
      query.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    
    const [users, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Count all users
   * @returns {Promise<number>} Count
   */
  async count() {
    const repository = this.getRepository();
    return await repository.count({
      where: { deletedAt: null }
    });
  }

  /**
   * Update last login information
   * @param {number} userId - User ID
   * @param {string} ip - IP address
   * @returns {Promise<boolean>} Success status
   */
  async updateLastLogin(userId, ip) {
    const repository = this.getRepository();
    await repository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip
    });
    return true;
  }
}

module.exports = new UserRepository();
