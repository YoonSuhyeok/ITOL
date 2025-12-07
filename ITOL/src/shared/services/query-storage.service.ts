import { Store } from '@tauri-apps/plugin-store';
import type { SavedQuery } from '../components/settings-modal/types';

/**
 * 쿼리 저장소 서비스
 * Tauri Store를 사용하여 DB 쿼리를 로컬에 저장/불러오기
 */
class QueryStorageService {
  private store: Store | null = null;
  private readonly STORE_FILE = 'saved-queries.json';
  private readonly QUERIES_KEY = 'savedQueries';

  /**
   * Store 초기화
   */
  private async initStore(): Promise<Store> {
    if (!this.store) {
      this.store = await Store.load(this.STORE_FILE);
    }
    return this.store;
  }

  /**
   * 모든 저장된 쿼리 가져오기
   */
  async getAllQueries(): Promise<SavedQuery[]> {
    try {
      const store = await this.initStore();
      const queries = await store.get<SavedQuery[]>(this.QUERIES_KEY);
      return queries || [];
    } catch (error) {
      console.error('Failed to load queries:', error);
      return [];
    }
  }

  /**
   * 쿼리 저장
   */
  async saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt'>): Promise<SavedQuery> {
    try {
      const store = await this.initStore();
      const queries = await this.getAllQueries();
      
      const newQuery: SavedQuery = {
        ...query,
        id: `query-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      queries.push(newQuery);
      await store.set(this.QUERIES_KEY, queries);
      await store.save();

      return newQuery;
    } catch (error) {
      console.error('Failed to save query:', error);
      throw new Error('쿼리 저장에 실패했습니다.');
    }
  }

  /**
   * 쿼리 업데이트
   */
  async updateQuery(id: string, updates: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const store = await this.initStore();
      const queries = await this.getAllQueries();
      
      const index = queries.findIndex(q => q.id === id);
      if (index === -1) {
        throw new Error('Query not found');
      }

      queries[index] = {
        ...queries[index],
        ...updates
      };

      await store.set(this.QUERIES_KEY, queries);
      await store.save();
    } catch (error) {
      console.error('Failed to update query:', error);
      throw new Error('쿼리 업데이트에 실패했습니다.');
    }
  }

  /**
   * 쿼리 삭제
   */
  async deleteQuery(id: string): Promise<void> {
    try {
      const store = await this.initStore();
      const queries = await this.getAllQueries();
      
      const filteredQueries = queries.filter(q => q.id !== id);
      
      await store.set(this.QUERIES_KEY, filteredQueries);
      await store.save();
    } catch (error) {
      console.error('Failed to delete query:', error);
      throw new Error('쿼리 삭제에 실패했습니다.');
    }
  }

  /**
   * ID로 쿼리 가져오기
   */
  async getQueryById(id: string): Promise<SavedQuery | null> {
    try {
      const queries = await this.getAllQueries();
      return queries.find(q => q.id === id) || null;
    } catch (error) {
      console.error('Failed to get query by id:', error);
      return null;
    }
  }

  /**
   * 이름으로 쿼리 검색
   */
  async searchQueries(searchTerm: string): Promise<SavedQuery[]> {
    try {
      const queries = await this.getAllQueries();
      const lowerSearch = searchTerm.toLowerCase();
      
      return queries.filter(q => 
        q.name.toLowerCase().includes(lowerSearch) ||
        q.description?.toLowerCase().includes(lowerSearch) ||
        q.query.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Failed to search queries:', error);
      return [];
    }
  }

  /**
   * 데이터베이스 타입으로 필터링
   */
  async getQueriesByDatabaseType(dbType: string): Promise<SavedQuery[]> {
    try {
      const queries = await this.getAllQueries();
      return queries.filter(q => q.databaseType === dbType);
    } catch (error) {
      console.error('Failed to filter queries by database type:', error);
      return [];
    }
  }

  /**
   * 모든 쿼리 삭제 (초기화)
   */
  async clearAllQueries(): Promise<void> {
    try {
      const store = await this.initStore();
      await store.set(this.QUERIES_KEY, []);
      await store.save();
    } catch (error) {
      console.error('Failed to clear queries:', error);
      throw new Error('쿼리 초기화에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const QueryStorageServiceInstance = new QueryStorageService();
