import type { DatabaseClient } from '../db/database.js';
import type { Business, BusinessCategory } from '../types/domain.js';

export class BusinessRepository {
  constructor(private db: DatabaseClient) {}

  findAll(): Business[] {
    return this.db.queryAll<Business>('SELECT * FROM businesses ORDER BY id ASC');
  }

  findById(id: number): Business | null {
    return this.db.queryOne<Business>('SELECT * FROM businesses WHERE id = ?', [id]);
  }

  create(input: { name: string; category: BusinessCategory; address: string }): Business {
    const now = new Date().toISOString();
    const res = this.db.run(
      'INSERT INTO businesses (name, category, address, created_at) VALUES (?, ?, ?, ?)',
      [input.name, input.category, input.address, now],
    );
    return this.findById(res.lastInsertRowid)!;
  }
}
