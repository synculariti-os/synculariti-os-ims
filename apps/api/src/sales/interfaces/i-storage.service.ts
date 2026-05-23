export const STORAGE_SERVICE_TOKEN = Symbol('STORAGE_SERVICE_TOKEN');

export interface IStorageService {
  downloadFile(path: string): Promise<string>;
}
