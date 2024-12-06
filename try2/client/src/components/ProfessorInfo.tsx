import React from 'react';
import { ProfessorInfoProps } from '../types';

export const ProfessorInfo: React.FC<ProfessorInfoProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-48 h-48 flex-shrink-0">
          <img
            src={data.photoUrl}
            alt={data.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        <div className="flex-grow">
          <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
          <p className="text-xl text-gray-600 mb-4">{data.position}</p>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Research Areas</h2>
            <div className="flex flex-wrap gap-2">
              {data.researchAreas.map((area, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700">{data.shortBio}</p>
            <button className="text-blue-600 hover:text-blue-800 mt-2">
              Read More →
            </button>
          </div>
          
          <div className="text-gray-600">
            <a 
              href={`mailto:${data.email}`}
              className="hover:text-blue-600"
            >
              {data.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 