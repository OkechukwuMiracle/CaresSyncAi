const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzePatientResponse = async (response) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical AI assistant that analyzes patient responses to follow-up questions. 
          Your task is to:
          1. Summarize the patient's response in one clear sentence
          2. Classify the response as one of three categories:
             - "Fine": Patient is doing well, no concerns
             - "Mild issue": Patient has minor concerns or questions
             - "Urgent": Patient needs immediate medical attention
          
          Return your analysis as a JSON object with the following structure:
          {
            "summary": "Brief summary of the response",
            "status": "Fine|Mild issue|Urgent",
            "confidence": 0.95,
            "keywords": ["keyword1", "keyword2"]
          }`
        },
        {
          role: "user",
          content: `Analyze this patient response: "${response}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const analysis = completion.choices[0].message.content;
    return JSON.parse(analysis);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      summary: "Unable to analyze response",
      status: "Mild issue",
      confidence: 0.0,
      keywords: []
    };
  }
};

module.exports = {
  openai,
  analyzePatientResponse
};
