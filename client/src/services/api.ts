import axios from 'axios';
import { Article, Professor } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProfessorInfo = async (): Promise<Professor> => {
  const response = await api.get('/professor');
  return response.data;
};

export const getArticles = async (category?: string): Promise<Article[]> => {
  const response = await api.get('/articles', {
    params: category && category !== 'all' ? { category } : undefined,
  });
  return response.data;
};

export const uploadArticles = async (formData: FormData): Promise<void> => {
  await api.post('/articles/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 