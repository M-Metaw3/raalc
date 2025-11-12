const { getRepository } = require('typeorm');

/**
 * AdminCategoryRepository
 * 
 * Handles admin-category relationships
 * Used to verify if an admin/agent belongs to a specific category
 */
class AdminCategoryRepository {
  /**
   * Check if admin belongs to a category
   */
  async exists(adminId, categoryId) {
    // TODO: Implement based on your admin_categories junction table structure
    // This is a placeholder implementation
    
    // Option 1: If you have a junction table admin_categories
    const repository = getRepository('AdminCategory');
    const count = await repository.count({
      where: {
        adminId,
        categoryId
      }
    });
    return count > 0;

    // Option 2: If categories are stored as JSON array in Admin table
    // const AdminRepository = require('./AdminRepository');
    // const admin = await AdminRepository.findById(adminId);
    // if (!admin || !admin.categories) return false;
    // return admin.categories.includes(categoryId);

    // Option 3: If using many-to-many relationship through TypeORM
    // const admin = await getRepository('Admin').findOne({
    //   where: { id: adminId },
    //   relations: ['categories']
    // });
    // if (!admin || !admin.categories) return false;
    // return admin.categories.some(cat => cat.id === categoryId);
  }

  /**
   * Get all categories for an admin
   */
  async getCategoriesByAdminId(adminId) {
    const repository = getRepository('AdminCategory');
    return await repository.find({
      where: { adminId },
      relations: ['category']
    });
  }

  /**
   * Get all admins for a category
   */
  async getAdminsByCategoryId(categoryId) {
    const repository = getRepository('AdminCategory');
    return await repository.find({
      where: { categoryId },
      relations: ['admin']
    });
  }

  /**
   * Assign admin to category
   */
  async assignAdminToCategory(adminId, categoryId) {
    const repository = getRepository('AdminCategory');
    
    // Check if already exists
    const exists = await this.exists(adminId, categoryId);
    if (exists) {
      return null; // Already exists
    }

    const adminCategory = repository.create({
      adminId,
      categoryId,
      createdAt: new Date()
    });

    return await repository.save(adminCategory);
  }

  /**
   * Remove admin from category
   */
  async removeAdminFromCategory(adminId, categoryId) {
    const repository = getRepository('AdminCategory');
    return await repository.delete({
      adminId,
      categoryId
    });
  }
}

module.exports = new AdminCategoryRepository();

