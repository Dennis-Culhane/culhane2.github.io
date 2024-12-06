export interface Professor {
  name: string;
  position: string;
  photoUrl: string;
  email: string;
  researchAreas: string[];
  biography: string;
  shortBio: string;
}

export interface Article {
  _id: string;
  title: string;
  authors: string[];
  category: string;
  publicationDate: Date;
  abstract: string;
  pdfUrl: string;
  tags: string[];
}

export interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export interface ArticleListProps {
  articles: Article[];
}

export interface ProfessorInfoProps {
  data: Professor | null;
} 