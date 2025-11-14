import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

export const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: "You are Reggie, a witty and helpful AI assistant, inspired by Jarvis. Address the user as 'Sir'. Keep responses concise and helpful. You can search the web for information, manage timers, alarms, reminders, find music, and engage in general conversation on any topic.",
    tools: [{ googleSearch: {} }, { functionDeclarations: [setTimer, setAlarm, setReminder, findMusic] }],
  },
});