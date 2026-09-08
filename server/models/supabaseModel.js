import supabase from '../config/supabase.js';

class SupabaseQuery {
  constructor(model, query, single = false) {
    this.model = model;
    this.query = query;
    this.single = single;
    this.populateFields = [];
    this.sortFields = null;
    this.limitVal = null;
    this.skipVal = null;
    this.selectFields = '*';
    this.excludeField = null;
  }

  populate(field, selectStr) {
    this.populateFields.push({ field, selectStr });
    return this;
  }

  sort(sortObj) {
    this.sortFields = sortObj;
    return this;
  }

  limit(limitVal) {
    this.limitVal = limitVal;
    return this;
  }

  skip(skipVal) {
    this.skipVal = skipVal;
    return this;
  }

  select(selectFields) {
    if (typeof selectFields === 'string') {
      if (selectFields.startsWith('-')) {
        this.excludeField = selectFields.slice(1);
      } else {
        this.selectFields = selectFields;
      }
    }
    return this;
  }

  async execute() {
    let q = supabase.from(this.model.tableName).select('*');
    
    // Apply filters
    const snakeQuery = this.model.toSnake(this.query);
    for (const [key, val] of Object.entries(snakeQuery)) {
      if (key === '$or') {
        q = q.or('status.eq.published,is_published.eq.true');
      } else if (key === '$text') {
        if (val.$search) {
          q = q.ilike('title', `%${val.$search}%`);
        }
      } else if (typeof val === 'object' && val !== null) {
        // Handle mongo-like operator objects if present
      } else {
        q = q.eq(key, val);
      }
    }

    if (this.sortFields) {
      for (const [k, v] of Object.entries(this.sortFields)) {
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        q = q.order(snakeKey, { ascending: v === 1 || v === 'asc' });
      }
    }

    if (this.skipVal !== null && this.limitVal !== null) {
      q = q.range(this.skipVal, this.skipVal + this.limitVal - 1);
    } else if (this.limitVal !== null) {
      q = q.limit(this.limitVal);
    }

    if (this.single) {
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      let camelData = this.model.toCamel(data);
      if (this.excludeField) {
        delete camelData[this.excludeField];
      }
      
      // Populate logic
      for (const pop of this.populateFields) {
        const refTable = this.model.relations[pop.field];
        if (refTable) {
          const foreignKey = pop.field === 'instructor' ? 'instructor_id' : `${pop.field}_id`;
          const foreignId = data[foreignKey];
          if (foreignId) {
            const { data: refData } = await supabase.from(refTable).select('*').eq('id', foreignId).maybeSingle();
            if (refData) {
              const refCamel = this.model.toCamel(refData);
              camelData[pop.field] = refCamel;
            }
          }
        }
      }
      return camelData;
    } else {
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      let camelData = this.model.toCamel(data || []);
      
      // Populate logic
      for (const pop of this.populateFields) {
        const refTable = this.model.relations[pop.field];
        if (refTable) {
          const foreignKey = pop.field === 'instructor' ? 'instructor_id' : `${pop.field}_id`;
          for (const item of camelData) {
            const snakeItem = this.model.toSnake(item);
            const foreignId = snakeItem[foreignKey];
            if (foreignId) {
              const { data: refData } = await supabase.from(refTable).select('*').eq('id', foreignId).maybeSingle();
              if (refData) {
                const refCamel = this.model.toCamel(refData);
                item[pop.field] = refCamel;
              }
            }
          }
        }
      }
      return camelData;
    }
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

export class SupabaseModel {
  constructor(tableName, relations = {}) {
    this.tableName = tableName;
    this.relations = relations;
  }

  toCamel(obj) {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(o => this.toCamel(o));
    if (typeof obj !== 'object') return obj;

    const newObj = {};
    for (const key of Object.keys(obj)) {
      const newKey = key === 'id' ? '_id' : key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      newObj[newKey] = this.toCamel(obj[key]);
    }
    
    // Decorate User models with helper methods
    if (this.tableName === 'users' && newObj.firstName && newObj.lastName) {
      newObj.fullName = `${newObj.firstName} ${newObj.lastName}`;
      const self = this;
      newObj.comparePassword = async function(candidatePassword) {
        const bcrypt = await import('bcryptjs');
        return await bcrypt.default.compare(candidatePassword, this.password || '');
      };
      newObj.save = async () => {
        const updateData = {};
        for (const [k, v] of Object.entries(newObj)) {
          if (typeof v !== 'function' && k !== '_id' && k !== 'fullName') {
            updateData[k] = v;
          }
        }
        await self.findByIdAndUpdate(newObj._id, updateData);
      };
    }
    
    return newObj;
  }

  toSnake(obj) {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(o => this.toSnake(o));
    if (typeof obj !== 'object') return obj;

    const newObj = {};
    for (const key of Object.keys(obj)) {
      if (key === '_id') {
        newObj['id'] = obj[key];
      } else {
        const newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        newObj[newKey] = this.toSnake(obj[key]);
      }
    }
    return newObj;
  }

  find(query = {}) {
    return new SupabaseQuery(this, query, false);
  }

  findOne(query = {}) {
    return new SupabaseQuery(this, query, true);
  }

  findById(id) {
    return new SupabaseQuery(this, { id }, true);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const snakeUpdate = this.toSnake(update);
    delete snakeUpdate.full_name;
    const { data, error } = await supabase.from(this.tableName).update(snakeUpdate).eq('id', id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return this.toCamel(data);
  }

  async findOneAndUpdate(query, update, options = {}) {
    const item = await this.findOne(query);
    if (!item) return null;
    return await this.findByIdAndUpdate(item._id, update, options);
  }

  async create(doc) {
    const snakeDoc = this.toSnake(doc);
    if (this.tableName === 'users' && snakeDoc.password) {
      const bcrypt = await import('bcryptjs');
      snakeDoc.password = await bcrypt.default.hash(snakeDoc.password, 12);
    }
    const { data, error } = await supabase.from(this.tableName).insert(snakeDoc).select().maybeSingle();
    if (error) throw new Error(error.message);
    return this.toCamel(data);
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }

  async deleteOne(query = {}) {
    const snakeQuery = this.toSnake(query);
    let q = supabase.from(this.tableName).delete();
    for (const [key, val] of Object.entries(snakeQuery)) {
      q = q.eq(key, val);
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { deletedCount: 1 };
  }
}
