const { getRepository } = require('typeorm');
const UserDocument = require('@models/UserDocument');

/**
 * User Document Repository
 * 
 * Handles database operations for user documents
 */
class UserDocumentRepository {
  /**
   * Get TypeORM repository
   */
  getRepository() {
    return getRepository('UserDocument');
  }

  /**
   * Create a new document record
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(documentData) {
    const repository = this.getRepository();
    const document = repository.create(documentData);
    return await repository.save(document);
  }

  /**
   * Find documents by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Array>} User documents
   */
  async findByUserId(userId) {
    const repository = this.getRepository();
    return await repository.find({
      where: {
        userId,
        deletedAt: null
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Find document by ID
   * @param {number} id - Document ID
   * @returns {Promise<Object>} Document
   */
  async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  /**
   * Find document by ID and user ID
   * @param {number} id - Document ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Document
   */
  async findByIdAndUserId(id, userId) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: {
        id,
        userId,
        deletedAt: null
      }
    });
  }

  /**
   * Count documents for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Document count
   */
  async countByUserId(userId) {
    const repository = this.getRepository();
    return await repository.count({
      where: {
        userId,
        deletedAt: null
      }
    });
  }

  /**
   * Soft delete a document
   * @param {number} id - Document ID
   * @returns {Promise<boolean>} Success status
   */
  async softDelete(id) {
    const repository = this.getRepository();
    const result = await repository.update(id, {
      deletedAt: new Date()
    });
    return result.affected > 0;
  }

  /**
   * Hard delete a document
   * @param {number} id - Document ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const repository = this.getRepository();
    const result = await repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Delete all documents for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteByUserId(userId) {
    const repository = this.getRepository();
    const result = await repository.delete({ userId });
    return result.affected || 0;
  }
}

module.exports = new UserDocumentRepository();




