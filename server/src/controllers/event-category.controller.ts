import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import * as categoryDAO from "../dao/event-category.dao";
import { InternalServerError, UnauthorizedError } from "../error-handling";

const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryDAO.getAllCategories();
    return res.status(StatusCodes.OK).json(categories);
  } catch (error) {
    throw new InternalServerError("Failed to fetch categories", "CategoryFetchException");
  }
};

const createCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new UnauthorizedError("Only admins can create categories", "CategoryCreateException");
    }
    const { name } = req.body;
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Category name is required" });
    }
    const newCategory = await categoryDAO.createCategory({ name });
    return res.status(StatusCodes.CREATED).json(newCategory);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError("Failed to create category", "CategoryCreateException");
  }
};

const updateCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new UnauthorizedError("Only admins can update categories", "CategoryUpdateException");
    }
    const id = req.params.id as string;
    const { name } = req.body;
    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Category name is required" });
    }
    const category = await categoryDAO.getCategoryById(id);
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Category not found" });
    }
    const updatedCategory = await categoryDAO.updateCategory(category, { name });
    return res.status(StatusCodes.OK).json(updatedCategory);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError("Failed to update category", "CategoryUpdateException");
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new UnauthorizedError("Only admins can delete categories", "CategoryDeleteException");
    }
    const id = req.params.id as string;
    const category = await categoryDAO.getCategoryById(id);
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Category not found" });
    }
    await categoryDAO.deleteCategory(id);
    return res.status(StatusCodes.NO_CONTENT).json();
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError("Failed to delete category", "CategoryDeleteException");
  }
};

export {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
