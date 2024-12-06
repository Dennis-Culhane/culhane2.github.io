import React, { useState, useEffect } from 'react';
import { ArticleList } from '../components/ArticleList';
import { ProfessorInfo } from '../components/ProfessorInfo';
import { CategoryFilter } from '../components/CategoryFilter';
import { getProfessorInfo, getArticles } from '../services/api';
import { Article, Professor } from '../types';

export const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [professorInfo, setProfessorInfo] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profInfo, articlesList] = await Promise.all([
          getProfessorInfo(),
          getArticles(selectedCategory),
        ]);
        setProfessorInfo(profInfo);
        setArticles(articlesList);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4">
      <ProfessorInfo data={professorInfo} />
      
      <div className="my-8">
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <ArticleList articles={articles} />
    </div>
  );
}; 