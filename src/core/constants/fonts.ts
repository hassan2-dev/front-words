// Font constants for the entire application
export const FONTS = {
    // Arabic fonts
    ARABIC: {
        PRIMARY: "font-arabic",
        BOLD: "font-arabic font-bold",
        LIGHT: "font-arabic font-light",
        MEDIUM: "font-arabic font-medium",
        SEMIBOLD: "font-arabic font-semibold",
        EXTRABOLD: "font-arabic font-extrabold",
    },

    // English fonts
    ENGLISH: {
        PRIMARY: "font-english",
        BOLD: "font-english font-bold",
        LIGHT: "font-english font-light",
        MEDIUM: "font-english font-medium",
        SEMIBOLD: "font-english font-semibold",
        EXTRABOLD: "font-english font-extrabold",
    },

    // Default fonts (mixed Arabic/English)
    DEFAULT: {
        PRIMARY: "font-sans",
        BOLD: "font-sans font-bold",
        LIGHT: "font-sans font-light",
        MEDIUM: "font-sans font-medium",
        SEMIBOLD: "font-sans font-semibold",
        EXTRABOLD: "font-sans font-extrabold",
    },

    // Headings
    HEADINGS: {
        H1: "font-arabic text-4xl font-bold",
        H2: "font-arabic text-3xl font-semibold",
        H3: "font-arabic text-2xl font-medium",
        H4: "font-arabic text-xl font-medium",
        H5: "font-arabic text-lg font-medium",
        H6: "font-arabic text-base font-medium",
    },

    // Body text
    BODY: {
        LARGE: "font-arabic text-lg",
        NORMAL: "font-arabic text-base",
        SMALL: "font-arabic text-sm",
        XSMALL: "font-arabic text-xs",
    },

    // Buttons
    BUTTONS: {
        PRIMARY: "font-arabic font-semibold",
        SECONDARY: "font-arabic font-medium",
        SMALL: "font-arabic text-sm font-medium",
    },

    // Input fields
    INPUT: {
        NORMAL: "font-arabic",
        PLACEHOLDER: "font-arabic text-gray-500",
    },

    // Navigation
    NAV: {
        PRIMARY: "font-arabic font-medium",
        ACTIVE: "font-arabic font-semibold",
    },

    // Cards
    CARD: {
        TITLE: "font-arabic text-lg font-semibold",
        SUBTITLE: "font-arabic text-sm font-medium",
        BODY: "font-arabic text-base",
    },

    // Alerts and notifications
    ALERT: {
        TITLE: "font-arabic font-semibold",
        MESSAGE: "font-arabic",
    },

    // Forms
    FORM: {
        LABEL: "font-arabic font-medium",
        INPUT: "font-arabic",
        ERROR: "font-arabic text-sm",
        HELP: "font-arabic text-sm",
    },

    // Tables
    TABLE: {
        HEADER: "font-arabic font-semibold",
        CELL: "font-arabic",
    },

    // Modals
    MODAL: {
        TITLE: "font-arabic text-xl font-bold",
        BODY: "font-arabic",
        FOOTER: "font-arabic font-medium",
    },

    // Sidebar
    SIDEBAR: {
        TITLE: "font-arabic font-semibold",
        ITEM: "font-arabic font-medium",
        SUBITEM: "font-arabic text-sm",
    },

    // Dashboard
    DASHBOARD: {
        TITLE: "font-arabic text-2xl font-bold",
        SUBTITLE: "font-arabic text-lg font-medium",
        CARD_TITLE: "font-arabic font-semibold",
        STAT_VALUE: "font-arabic text-2xl font-bold",
        STAT_LABEL: "font-arabic text-sm font-medium",
    },

    // Story reader specific
    STORY: {
        TITLE: "font-arabic text-3xl font-bold",
        SUBTITLE: "font-arabic text-lg",
        CONTENT: "font-arabic text-base leading-relaxed",
        TRANSLATION: "font-arabic text-base leading-relaxed",
        WORD: "font-arabic font-medium cursor-pointer",
        PROGRESS: "font-arabic font-medium",
    },

    // Chat and AI
    CHAT: {
        MESSAGE: "font-arabic text-base",
        USER_MESSAGE: "font-arabic text-base font-medium",
        AI_MESSAGE: "font-arabic text-base",
        INPUT: "font-arabic text-base",
    },

    // Profile
    PROFILE: {
        NAME: "font-arabic text-2xl font-bold",
        USERNAME: "font-arabic text-lg font-medium",
        BIO: "font-arabic text-base",
        STAT: "font-arabic font-semibold",
    },

    // Achievements
    ACHIEVEMENT: {
        TITLE: "font-arabic font-bold",
        DESCRIPTION: "font-arabic text-sm",
        PROGRESS: "font-arabic font-medium",
    },

    // Notifications
    NOTIFICATION: {
        TITLE: "font-arabic font-semibold",
        MESSAGE: "font-arabic text-sm",
        TIME: "font-arabic text-xs",
    },
} as const;

// Font weight constants
export const FONT_WEIGHTS = {
    LIGHT: "font-light",
    NORMAL: "font-normal",
    MEDIUM: "font-medium",
    SEMIBOLD: "font-semibold",
    BOLD: "font-bold",
    EXTRABOLD: "font-extrabold",
} as const;

// Font size constants
export const FONT_SIZES = {
    XS: "text-xs",
    SM: "text-sm",
    BASE: "text-base",
    LG: "text-lg",
    XL: "text-xl",
    "2XL": "text-2xl",
    "3XL": "text-3xl",
    "4XL": "text-4xl",
    "5XL": "text-5xl",
    "6XL": "text-6xl",
} as const;

// Utility function to combine font classes
export const combineFontClasses = (...classes: string[]): string => {
    return classes.filter(Boolean).join(" ");
};

// Utility function to get font class based on language
export const getFontClass = (language: "arabic" | "english" | "mixed" = "arabic", weight: keyof typeof FONT_WEIGHTS = "NORMAL"): string => {
    const fontFamily = language === "arabic" ? "font-arabic" : language === "english" ? "font-english" : "font-sans";
    return combineFontClasses(fontFamily, FONT_WEIGHTS[weight]);
}; 