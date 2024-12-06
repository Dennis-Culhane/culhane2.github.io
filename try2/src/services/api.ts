import { mockProfessor, mockArticles } from '../mockData';
import { Article, Professor } from '../types';

export const getProfessorInfo = async (): Promise<Professor> => {
  // 模拟 API 调用
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockProfessor), 500);
  });
};

export const getArticles = async (category?: string): Promise<Article[]> => {
  // 模拟 API 调用
  return new Promise((resolve) => {
    setTimeout(() => {
      if (category && category !== 'all') {
        return resolve(mockArticles.filter(article => article.category === category));
      }
      resolve(mockArticles);
    }, 500);
  });
}; 