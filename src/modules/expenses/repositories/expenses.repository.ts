import { prisma } from "../../../config/database";
import { Expense, ExpenseCategory } from "@prisma/client";

export interface ExpenseFilters {
  vehicleId?: string;
  tripId?: string;
  category?: ExpenseCategory;
}

export class ExpensesRepository {
  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async findAll(filters: ExpenseFilters): Promise<Expense[]> {
    return prisma.expense.findMany({
      where: {
        ...filters,
        deletedAt: null,
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async create(data: any): Promise<Expense> {
    return prisma.expense.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async update(id: string, data: any): Promise<Expense> {
    const updateData = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        trip: true,
      },
    });
  }

  async delete(id: string): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
