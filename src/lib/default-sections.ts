export const defaultSections = [
  {
    title: 'Introduction',
    content: 'Introduction to the course',
    conversation: {
      title: 'Introduction',
      metadata: {
        prerequisites: [
          "Basic understanding of programming concepts",
          "Familiarity with Python (optional)",
          "Interest in artificial intelligence"
        ],
        learningGoals: [
          "Understand what machine learning is and its applications",
          "Learn about different types of AI systems",
          "Grasp the fundamental concepts of ML workflows"
        ],
        estimatedTime: "15 minutes"
      },
      dialogue: [
        {
          speaker: "expert",
          text: "Hello! I'm Dr. Sarah, and I'll be guiding you through this course on artificial intelligence. Today, we'll explore the fundamentals of machine learning and its real-world applications.",
          purpose: "introduction"
        },
        {
          speaker: "learner",
          text: "Hi Dr. Sarah! I'm Alex, and I'm really excited to learn about AI. I have some basic programming experience, but machine learning is completely new to me.",
          purpose: "introduction"
        }
      ]
    }
  }
]; 