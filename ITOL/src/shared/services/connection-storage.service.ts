import { Store } from '@tauri-apps/plugin-store';
import type { SavedConnection } from '../components/settings-modal/types';

/**
 * 데이터베이스 커넥션 저장소 서비스
 * Tauri Store를 사용하여 DB 커넥션 정보를 로컬에 저장/불러오기
 */
class ConnectionStorageService {
  private store: Store | null = null;
  private readonly STORE_FILE = 'saved-connections.json';
  private readonly CONNECTIONS_KEY = 'savedConnections';

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
   * 모든 저장된 커넥션 가져오기
   */
  async getAllConnections(): Promise<SavedConnection[]> {
    try {
      const store = await this.initStore();
      const connections = await store.get<SavedConnection[]>(this.CONNECTIONS_KEY);
      return connections || [];
    } catch (error) {
      console.error('Failed to load connections:', error);
      return [];
    }
  }

  /**
   * 커넥션 저장
   */
  async saveConnection(connection: Omit<SavedConnection, 'id' | 'createdAt'>): Promise<SavedConnection> {
    try {
      const store = await this.initStore();
      const connections = await this.getAllConnections();
      
      const newConnection: SavedConnection = {
        ...connection,
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      connections.push(newConnection);
      await store.set(this.CONNECTIONS_KEY, connections);
      await store.save();

      return newConnection;
    } catch (error) {
      console.error('Failed to save connection:', error);
      throw new Error('커넥션 저장에 실패했습니다.');
    }
  }

  /**
   * 커넥션 업데이트
   */
  async updateConnection(id: string, updates: Partial<Omit<SavedConnection, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const store = await this.initStore();
      const connections = await this.getAllConnections();
      
      const index = connections.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error('Connection not found');
      }

      connections[index] = {
        ...connections[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await store.set(this.CONNECTIONS_KEY, connections);
      await store.save();
    } catch (error) {
      console.error('Failed to update connection:', error);
      throw new Error('커넥션 업데이트에 실패했습니다.');
    }
  }

  /**
   * 커넥션 삭제
   */
  async deleteConnection(id: string): Promise<void> {
    try {
      const store = await this.initStore();
      const connections = await this.getAllConnections();
      
      const filteredConnections = connections.filter(c => c.id !== id);
      
      await store.set(this.CONNECTIONS_KEY, filteredConnections);
      await store.save();
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw new Error('커넥션 삭제에 실패했습니다.');
    }
  }

  /**
   * ID로 커넥션 가져오기
   */
  async getConnectionById(id: string): Promise<SavedConnection | null> {
    try {
      const connections = await this.getAllConnections();
      return connections.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Failed to get connection by id:', error);
      return null;
    }
  }

  /**
   * 이름으로 커넥션 검색
   */
  async searchConnections(searchTerm: string): Promise<SavedConnection[]> {
    try {
      const connections = await this.getAllConnections();
      const lowerSearch = searchTerm.toLowerCase();
      
      return connections.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) ||
        c.description?.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Failed to search connections:', error);
      return [];
    }
  }

  /**
   * 데이터베이스 타입으로 필터링
   */
  async getConnectionsByDatabaseType(dbType: string): Promise<SavedConnection[]> {
    try {
      const connections = await this.getAllConnections();
      return connections.filter(c => c.connection.type === dbType);
    } catch (error) {
      console.error('Failed to filter connections by database type:', error);
      return [];
    }
  }

  /**
   * 모든 커넥션 삭제 (초기화)
   */
  async clearAllConnections(): Promise<void> {
    try {
      const store = await this.initStore();
      await store.set(this.CONNECTIONS_KEY, []);
      await store.save();
    } catch (error) {
      console.error('Failed to clear connections:', error);
      throw new Error('커넥션 초기화에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const ConnectionStorageServiceInstance = new ConnectionStorageService();
