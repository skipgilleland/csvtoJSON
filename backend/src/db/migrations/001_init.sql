import pool from '../config/database';
import { QueryResult } from 'pg';

export interface Company {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  user_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCompanyDTO {
  name: string;
  email: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

export const CompanyModel = {
  async create({ name, email }: CreateCompanyDTO): Promise<Company> {
    const query = `
      INSERT INTO companies (name, email)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result: QueryResult<Company> = await pool.query(query, [name, email]);
    return result.rows[0];
  },

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{ companies: Company[]; total: number }> {
    let query = 'SELECT * FROM companies WHERE 1=1';
    const values: any[] = [];
    let valueIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${valueIndex} OR email ILIKE $${valueIndex})`;
      values.push(`%${search}%`);
      valueIndex++;
    }

    if (status) {
      query += ` AND status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    // Get total count
    const countQuery = query.replace('*', 'COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    const result: QueryResult<Company> = await pool.query(query, values);
    
    return {
      companies: result.rows,
      total
    };
  },

  async findById(id: string): Promise<Company | null> {
    const query = 'SELECT * FROM companies WHERE id = $1';
    const result: QueryResult<Company> = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<Company | null> {
    const query = 'SELECT * FROM companies WHERE email = $1';
    const result: QueryResult<Company> = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  async update(id: string, data: UpdateCompanyDTO): Promise<Company | null> {
    const validFields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => key);

    if (validFields.length === 0) return null;

    const setClause = validFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const values = validFields.map(field => data[field as keyof UpdateCompanyDTO]);

    const query = `
      UPDATE companies
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result: QueryResult<Company> = await pool.query(query, [id, ...values]);
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM companies WHERE id = $1 RETURNING *';
    const result: QueryResult<Company> = await pool.query(query, [id]);
    return result.rowCount > 0;
  },

  async updateUserCount(id: string, change: number): Promise<Company | null> {
    const query = `
      UPDATE companies
      SET user_count = user_count + $2
      WHERE id = $1 AND (user_count + $2) >= 0
      RETURNING *
    `;
    
    const result: QueryResult<Company> = await pool.query(query, [id, change]);
    return result.rows[0] || null;
  }
};