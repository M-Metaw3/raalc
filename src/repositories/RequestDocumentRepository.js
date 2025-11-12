const { getRepository } = require('typeorm');

/**
 * RequestDocumentRepository
 * 
 * Handles all database operations for RequestDocument entity
 */
class RequestDocumentRepository {
  /**
   * Get TypeORM repository
   */
  getRepository() {
    return getRepository('RequestDocument');
  }

  /**
   * Create a new document
   */
  async create(documentData) {
    const repository = this.getRepository();
    const document = repository.create(documentData);
    return await repository.save(document);
  }

  /**
   * Create multiple documents
   */
  async createMany(documentsData) {
    const repository = this.getRepository();
    const documents = repository.create(documentsData);
    return await repository.save(documents);
  }

  /**
   * Find document by ID
   */
  async findById(documentId) {
    return await this.getRepository().findOne({
      where: { id: documentId, deletedAt: null },
      relations: ['serviceRequest', 'uploader']
    });
  }

  /**
   * Find all documents for a request
   */
  async findByRequestId(requestId) {
    return await this.getRepository().find({
      where: { requestId, deletedAt: null },
      relations: ['uploader'],
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Count documents for a request
   */
  async countByRequestId(requestId) {
    return await this.getRepository().count({
      where: { requestId, deletedAt: null }
    });
  }

  /**
   * Delete document (soft delete)
   */
  async softDelete(documentId) {
    return await this.getRepository().update(
      { id: documentId },
      { deletedAt: new Date() }
    );
  }

  /**
   * Delete all documents for a request (soft delete)
   */
  async softDeleteByRequestId(requestId) {
    return await this.getRepository().update(
      { requestId },
      { deletedAt: new Date() }
    );
  }
}

module.exports = new RequestDocumentRepository();

