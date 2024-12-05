import React from 'react';
import { Article } from '../types';
import { format } from 'date-fns';

interface ArticleListProps {
  articles: Article[];
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Published Works</h2>
      {articles.map((article) => (
        <div 
          key={article._id} 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-blue-600 mb-2">
            {article.title}
          </h3>
          <div className="text-sm text-gray-600 mb-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {article.category}
            </span>
            <span className="mx-2">•</span>
            {format(new Date(article.publicationDate), 'MMMM d, yyyy')}
          </div>
          <div className="text-gray-700 mb-2">
            Authors: {article.authors.join(', ')}
          </div>
          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.abstract}
          </p>
          <a
            href={article.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Download PDF →
          </a>
        </div>
      ))}
    </div>
  );
}; 