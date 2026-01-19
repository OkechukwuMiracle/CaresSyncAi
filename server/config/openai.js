// const OpenAI = require('openai');

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const analyzePatientResponse = async (response) => {
//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `You are a medical AI assistant that analyzes patient responses to follow-up questions. 
//           Your task is to:
//           1. Summarize the patient's response in one clear sentence
//           2. Classify the response as one of three categories:
//              - "Fine": Patient is doing well, no concerns
//              - "Mild issue": Patient has minor concerns or questions
//              - "Urgent": Patient needs immediate medical attention
          
//           Return your analysis as a JSON object with the following structure:
//           {
//             "summary": "Brief summary of the response",
//             "status": "Fine|Mild issue|Urgent",
//             "confidence": 0.95,
//             "keywords": ["keyword1", "keyword2"]
//           }`
//         },
//         {
//           role: "user",
//           content: `Analyze this patient response: "${response}"`
//         }
//       ],
//       temperature: 0.3,
//       max_tokens: 200
//     });

//     const analysis = completion.choices[0].message.content;
//     return JSON.parse(analysis);
//   } catch (error) {
//     console.error('OpenAI API Error:', error);
//     return {
//       summary: "Unable to analyze response",
//       status: "Mild issue",
//       confidence: 0.0,
//       keywords: []
//     };
//   }
// };

// module.exports = {
//   openai,
//   analyzePatientResponse
// };






const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple rule-based fallback analysis
const fallbackAnalysis = (response) => {
  const lowerResponse = response.toLowerCase();
  
  // Urgent keywords
  const urgentKeywords = ['emergency', 'severe', 'unbearable', 'worse', 'bleeding', 'chest pain', 
    'can\'t breathe', 'difficulty breathing', 'unconscious', 'suicide', 'help', 'hospital'];
  
  // Mild issue keywords
  const mildKeywords = ['pain', 'discomfort', 'tired', 'headache', 'nausea', 'dizzy', 
    'concerned', 'worried', 'question', 'slight', 'mild'];
  
  // Fine keywords
  const fineKeywords = ['better', 'good', 'fine', 'well', 'improved', 'great', 'okay', 'ok'];
  
  let status = 'Mild issue'; // Default
  let confidence = 0.6;
  const keywords = [];
  
  // Check for urgent
  const hasUrgent = urgentKeywords.some(keyword => {
    if (lowerResponse.includes(keyword)) {
      keywords.push(keyword);
      return true;
    }
    return false;
  });
  
  if (hasUrgent) {
    status = 'Urgent';
    confidence = 0.85;
  } else {
    // Check for fine
    const hasFine = fineKeywords.some(keyword => {
      if (lowerResponse.includes(keyword)) {
        keywords.push(keyword);
        return true;
      }
      return false;
    });
    
    if (hasFine && !mildKeywords.some(k => lowerResponse.includes(k))) {
      status = 'Fine';
      confidence = 0.75;
    } else {
      // Check for mild
      mildKeywords.forEach(keyword => {
        if (lowerResponse.includes(keyword)) {
          keywords.push(keyword);
        }
      });
    }
  }
  
  // Generate simple summary
  const summary = response.length > 100 
    ? response.substring(0, 97) + '...' 
    : response;
  
  return {
    summary: `Patient reports: ${summary}`,
    status,
    confidence,
    keywords: keywords.slice(0, 5) // Limit to 5 keywords
  };
};

const analyzePatientResponse = async (response) => {
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.warn('⚠️ OpenAI API key not configured. Using fallback analysis.');
    return fallbackAnalysis(response);
  }
  
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
    console.error('OpenAI API Error:', error.message);
    
    // Check if it's a quota/billing error
    if (error.code === 'insufficient_quota' || error.status === 429) {
      console.warn('⚠️ OpenAI quota exceeded. Using fallback analysis. Please add credits to your OpenAI account.');
    }
    
    // Use fallback analysis
    console.log('Using fallback rule-based analysis...');
    return fallbackAnalysis(response);
  }
};

module.exports = {
  openai,
  analyzePatientResponse
};