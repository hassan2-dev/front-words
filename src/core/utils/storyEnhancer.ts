/* eslint-disable @typescript-eslint/no-unused-vars */
// Utility to enhance story content and make it more engaging
export interface EnhancedStory {
  title: string;
  content: string;
  translation: string;
  words: any[];
  enhancedContent: string;
  enhancedTranslation: string;
}

export const enhanceStory = (story: any): EnhancedStory => {
  // Check if story is valid
  if (!story || typeof story !== 'object') {
    console.error('Invalid story object passed to enhanceStory:', story);
    throw new Error('Invalid story object');
  }

  const originalContent = story.content || '';
  const originalTranslation = story.translation || '';

  // تحسين العنوان
  const enhancedTitle = story.title && story.title.includes("قصة اليوم")
    ? story.title
    : `قصة اليوم - ${story.title || 'قصة جديدة'}`;

  // تحسين المحتوى الإنجليزي
  let enhancedContent = originalContent;

  // إضافة مقدمة أكثر تشويقاً
  if (!enhancedContent.includes("Once upon a time")) {
    enhancedContent = `Once upon a time, in a world full of learning and discovery, ${enhancedContent}`;
  }

  // إضافة خاتمة أكثر إلهاماً
  if (!enhancedContent.includes("journey")) {
    enhancedContent += `\n\nThis amazing journey of learning continues every day, making each word a stepping stone towards fluency and confidence in English. The student's dedication and passion for learning shine through every new word mastered.`;
  }

  // تحسين الترجمة العربية
  let enhancedTranslation = originalTranslation;

  // إضافة مقدمة عربية
  if (!enhancedTranslation.includes("في يوم من الأيام")) {
    enhancedTranslation = `في يوم من الأيام، في عالم مليء بالتعلم والاكتشاف، ${enhancedTranslation}`;
  }

  // إضافة خاتمة عربية
  if (!enhancedTranslation.includes("رحلة")) {
    enhancedTranslation += `\n\nهذه الرحلة المذهلة للتعلم تستمر كل يوم، مما يجعل كل كلمة لبنة نحو الطلاقة والثقة في اللغة الإنجليزية. إصرار الطالب وشغفه بالتعلم يتألقان من خلال كل كلمة جديدة يتقنها.`;
  }

  return {
    ...story,
    title: enhancedTitle,
    content: enhancedContent,
    translation: enhancedTranslation,
    enhancedContent,
    enhancedTranslation,
  };
};



