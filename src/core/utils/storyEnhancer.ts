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

// تحسين الكلمات لتكون أكثر تنوعاً
export const enhanceWords = (words: any[]): any[] => {
  return words.map((word, index) => {
    // إضافة جمل أكثر تشويقاً للكلمات الجديدة
    if (word.status === "UNKNOWN" && !word.sentence) {
      const enhancedWord = { ...word };

      // جمل محسنة حسب نوع الكلمة
      const enhancedSentences = {
        "snip": "The chef snips fresh herbs for the dish.",
        "Exposed": "The ancient ruins were exposed after the storm.",
        "Belongs": "This beautiful garden belongs to our family.",
        "Brotherhood": "The team showed true brotherhood during the game.",
        "Hit man": "The movie featured a mysterious hit man.",
        "Pass out": "The student will pass out the papers to everyone.",
        "king": "The wise king ruled his kingdom with fairness.",
        "from": "The letter came from my best friend.",
        "joker": "The joker made everyone laugh at the party.",
        "reading": "Reading books opens new worlds of imagination.",
        "letter": "She wrote a beautiful letter to her grandmother.",
        "kite": "The colorful kite flew high in the blue sky.",
      };

      if (enhancedSentences[word.word as keyof typeof enhancedSentences]) {
        enhancedWord.sentence = enhancedSentences[word.word as keyof typeof enhancedSentences];
        enhancedWord.sentenceAr = getArabicTranslation(enhancedWord.sentence);
      }

      return enhancedWord;
    }

    return word;
  });
};

// ترجمة بسيطة للجمل
const getArabicTranslation = (sentence: string): string => {
  const translations: { [key: string]: string } = {
    "The chef snips fresh herbs for the dish.": "الطاهي يقص الأعشاب الطازجة للطبق.",
    "The ancient ruins were exposed after the storm.": "تم كشف الآثار القديمة بعد العاصفة.",
    "This beautiful garden belongs to our family.": "هذه الحديقة الجميلة تعود لعائلتنا.",
    "The team showed true brotherhood during the game.": "أظهر الفريق أخوة حقيقية أثناء المباراة.",
    "The movie featured a mysterious hit man.": "الفيلم تضمن قاتلاً مأجوراً غامضاً.",
    "The student will pass out the papers to everyone.": "الطالب سيقوم بتوزيع الأوراق على الجميع.",
    "The wise king ruled his kingdom with fairness.": "حكم الملك الحكيم مملكته بالعدل.",
    "The letter came from my best friend.": "الرسالة جاءت من صديقي المفضل.",
    "The joker made everyone laugh at the party.": "المهرج جعل الجميع يضحكون في الحفلة.",
    "Reading books opens new worlds of imagination.": "قراءة الكتب تفتح عوالم جديدة من الخيال.",
    "She wrote a beautiful letter to her grandmother.": "كتبت رسالة جميلة لجدتها.",
    "The colorful kite flew high in the blue sky.": "طارت الطائرة الورقية الملونة عالياً في السماء الزرقاء.",
  };

  return translations[sentence] || sentence;
}; 