

import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";

const setTimer: FunctionDeclaration = {
  name: 'setTimer',
  description: 'Sets a timer for a specified duration.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      durationInSeconds: {
        type: Type.INTEGER,
        description: 'The duration of the timer in seconds.',
      },
      label: {
        type: Type.STRING,
        description: 'A label for the timer, e.g., "pizza".',
      },
    },
    required: ['durationInSeconds'],
  },
};

const setAlarm: FunctionDeclaration = {
  name: 'setAlarm',
  description: 'Sets an alarm for a specific time and date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      time: {
        type: Type.STRING,
        description: 'The time for the alarm in HH:MM:SS format (24-hour clock). e.g. 19:30:00 for 7:30 PM.',
      },
       date: {
        type: Type.STRING,
        description: 'The date for the alarm in YYYY-MM-DD format. Defaults to today or tomorrow if not specified.',
      },
      label: {
        type: Type.STRING,
        description: 'A label for the alarm, e.g., "wake up".',
      },
    },
    required: ['time'],
  },
};

const setReminder: FunctionDeclaration = {
    name: 'setReminder',
    description: 'Sets a reminder for a specific time, date, and subject.',
    parameters: {
        type: Type.OBJECT,
        properties: {
             time: {
                type: Type.STRING,
                description: 'The time for the reminder in HH:MM:SS format (24-hour clock). e.g. 09:00:00 for 9:00 AM.',
            },
            date: {
                type: Type.STRING,
                description: 'The date for the reminder in YYYY-MM-DD format. Defaults to today or tomorrow if not specified.',
            },
            subject: {
                type: Type.STRING,
                description: 'What to be reminded about, e.g., "Call mom".',
            },
        },
        required: ['time', 'subject'],
    },
};

const findMusic: FunctionDeclaration = {
  name: 'findMusic',
  description: 'Finds music on YouTube and provides a link to the search results.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The song title, artist, or album to search for. e.g., "Bohemian Rhapsody by Queen".',
      },
    },
    required: ['query'],
  },
};

const openApplication: FunctionDeclaration = {
    name: 'openApplication',
    description: 'Opens an application on the user\'s computer.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            applicationName: {
                type: Type.STRING,
                description: 'The name of the application to open. e.g., "Calculator", "Spotify", "VS Code".',
            },
        },
        required: ['applicationName'],
    },
};

const searchWeb: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Searches the web to answer questions about current events, facts, or any topic requiring up-to-date information.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query to find information about.',
      },
    },
    required: ['query'],
  },
};

const getCurrentTime: FunctionDeclaration = {
  name: 'getCurrentTime',
  description: 'Gets the current local time.',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No parameters
    required: [],
  },
};

const tools = [{ functionDeclarations: [setTimer, setAlarm, setReminder, findMusic, openApplication, searchWeb, getCurrentTime] }];
const systemInstruction = "You are Reggie, a witty and helpful AI assistant, inspired by Jarvis. Address the user as 'Sir'. Keep responses concise and helpful. You can manage timers, alarms, reminders, find music, open applications, search the web, and engage in general conversation on any topic.";

/**
 * Creates and returns a new chat session instance.
 * @param apiKey The user's Gemini API key.
 * @returns A Chat instance.
 */
export const createChatSession = (apiKey: string): Chat => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools,
      },
    });
};

/**
 * Performs a web search using the Gemini API with Google Search grounding.
 * @param apiKey The user's Gemini API key.
 * @param query The search query.
 * @returns An object containing the summary and sources.
 */
export const performSearch = async (apiKey: string, query: string) => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
            tools: [{googleSearch: {}}],
        },
    });
    
    const summary = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { summary, sources };
};