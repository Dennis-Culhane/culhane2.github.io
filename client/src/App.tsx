import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { BulkUploadTool } from './components/BulkUploadTool';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-xl font-bold text-gray-800">
                Academic Profile
              </a>
              <a 
                href="/admin"
                className="text-blue-600 hover:text-blue-800"
              >
                Admin
              </a>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<BulkUploadTool />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4">
            <p className="text-center">
              © {new Date().getFullYear()} Dennis P. Culhane. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}; 