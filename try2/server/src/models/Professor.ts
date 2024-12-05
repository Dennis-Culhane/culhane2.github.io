import mongoose from 'mongoose';

const ProfessorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  photoUrl: { type: String, required: true },
  email: { type: String, required: true },
  researchAreas: [{ type: String }],
  biography: { type: String, required: true },
  shortBio: { type: String, required: true }
});

export const Professor = mongoose.model('Professor', ProfessorSchema); 