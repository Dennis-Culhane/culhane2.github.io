import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [{ type: String, required: true }],
  category: { type: String, required: true },
  publicationDate: { type: Date, required: true },
  abstract: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Article = mongoose.model('Article', ArticleSchema); 