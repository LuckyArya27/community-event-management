import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/event-category.entity';

const categoryRepository = AppDataSource.getRepository(Category);

async function getAllCategories(): Promise<Category[] | null> {
  const categories = await categoryRepository.find();
  return categories;
}

async function getCategoryById(category_id: string): Promise<Category | null> {
  const category = await categoryRepository.findOne({ where: { category_id } });
  return category;
}

async function getCategoryByName(category_name: string): Promise<Category | null> {
  const category = await categoryRepository.findOne({ where: { name: category_name } });
  return category;
}

async function createCategory(data: {name: string}): Promise<Category> {
  const newCategory = categoryRepository.create(data);
  return await categoryRepository.save(newCategory);
}

async function updateCategory(category: Category, updatedFields: Partial<Category>): Promise<Category> {
  categoryRepository.merge(category, updatedFields);
  return await categoryRepository.save(category);
}

async function deleteCategory(category_id: string): Promise<boolean> {
  const deletedCategory = await categoryRepository.delete(category_id);
  return deletedCategory.affected! > 0;
}

export {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory
};
