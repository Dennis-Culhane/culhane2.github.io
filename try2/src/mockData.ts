export const mockProfessor = {
  name: "Dennis P. Culhane",
  position: "Faculty Member",
  photoUrl: "https://via.placeholder.com/200",
  email: "dennis.culhane@example.edu",
  researchAreas: ["Homelessness", "Assisted Housing Policy", "Policy Analysis Research Methods"],
  biography: "完整的传记...",
  shortBio: "Dr. Dennis P. Culhane is a social science researcher with primary expertise in the area of homelessness and assisted housing policy."
};

export const mockArticles = [
  {
    _id: "1",
    title: "Understanding Homelessness Among Veterans",
    authors: ["Dennis P. Culhane", "Jane Doe"],
    category: "Homelessness",
    publicationDate: new Date("2023-05-20"),
    abstract: "This study explores the factors contributing to homelessness among veterans...",
    pdfUrl: "#",
    tags: ["veterans", "homelessness"]
  },
  {
    _id: "2",
    title: "Housing Policy Impact Analysis",
    authors: ["Dennis P. Culhane", "John Smith"],
    category: "Assisted Housing Policy",
    publicationDate: new Date("2023-03-15"),
    abstract: "An analysis of the impact of housing policies on community welfare...",
    pdfUrl: "#",
    tags: ["housing", "policy"]
  },
  {
    _id: "3",
    title: "Research Methods in Social Policy",
    authors: ["Dennis P. Culhane"],
    category: "Policy Analysis Research Methods",
    publicationDate: new Date("2023-01-10"),
    abstract: "A comprehensive overview of research methods in social policy analysis...",
    pdfUrl: "#",
    tags: ["research", "methods"]
  }
]; 