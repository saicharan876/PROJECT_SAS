const Groq = require('groq-sdk');

let groq = null;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not configured");
    return null;
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

/**
 * Sends a prompt to Groq and returns parsed JSON response.
 *
 * @param {string} systemInstruction - System prompt defining the AI's role and output schema.
 * @param {string} userPrompt - The user's input/question.
 * @returns {Promise<object>} Parsed JSON from the LLM.
 */
const generateJSON = async (systemInstruction, userPrompt) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not initialized');

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const text = response.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('LLM did not return valid JSON');
  }
};

/**
 * Sends a prompt and returns plain text (for ATS analysis summaries, etc.)
 */
const generateText = async (systemInstruction, userPrompt) => {
  const client = getGroqClient();
  if (!client) throw new Error('Groq client not initialized');

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

const generatePointsfromDescription = async (description)=>{
    const client = getGroqClient();
    if(!client){    
        return [
            ` Developed and implemented ${description}`,
            ` Collaborated with team members to deliver ${description}`,
            ` Improved efficiency through ${description}`,
        ];
    }
    try{
        const response = await client.chat.completions.create({
            model : 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            messages : [
                {
                    role : 'system', 
                    content : `You are a professional resume writer. 
                            Generate 3-5 concise, impactful bullet points for a resume based on the provided description. 
                            Each bullet point should start with a strong action verb.
                            
                            Return ONLY valid JSON:
                            {
                                "points": ["point1", "point2"]
                            }
                            `,
                }, 
                { 
                    role : 'user',
                    content : `Generate bullet points for ${description}`,
                }
            ], 
            temperature : 0.7,
        });
        const result = response.choices[0].message.content;
        try{
            const parsed = JSON.parse(result);
            return parsed.points ||[];
        }catch(error){
            return result.split("\n")
                .map(line=>line.trim().replace(/^[-•*]\s*/, ""))
                .filter(line => line.length>0)
        }
    }catch(error){
        console.log(error)
        return [`Developed and implemented ${description}`,
                `Collaborated with team members on ${description}`,
                `Improved efficiency through ${description}`
        ];
    }
};

const enhanceText = async (text) =>{
    const client = getGroqClient();

    if(!client){
        return `Enhanced ${text}`;
    }

    try{
        const response = await client.chat.completions.create({
            model : 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            messages : [
                {
                    role: 'system',
                        content: `
                                    You are a professional resume writer.

                                    STRICT RULES:
                                    - Input contains N lines.
                                    - Output MUST contain EXACTLY N bullet points.
                                    - Each input line → EXACTLY ONE improved bullet point.
                                    - DO NOT merge lines.
                                    - DO NOT add extra bullets.
                                    - DO NOT add explanations.
                                    - Each bullet MUST be a SINGLE line.
                                    - Start each bullet with a strong action verb.
                                    - Keep it concise (max 20 words).

                                    FORMAT:
                                    Return ONLY valid JSON:

                                    EXAMPLE:

                                    Input:
                                    Built APIs
                                    Worked on frontend

                                    Output:
                                    {
                                        "points" : 
                                        [
                                            "Built scalable and secure APIs for high-performance systems",
                                            "Developed responsive frontend interfaces using modern frameworks"
                                        ]
                                    }
                                `
                },
                {
                    role : 'user',
                    content : `Enhance this resume text : ${text}`,
                },
            ],
            temperature : 0.7,
        })

        const result = response.choices[0].message.content;

        try{
            const parsed = JSON.parse(result);
            return parsed.points || [];
        }catch(error){
            console.log("parse error", error);
            return result.split("\n")
                       .map(line=>line.trim().replace(/^[-•*]\s*/, ""))
                       .filter(line => line.length>0)
        }
    }catch(error){
        console.log(error)
        return text;
    }
};

const fallbackExtractor = (readme) => {
  return readme
    .split("\n")
    .filter(line =>
      line.length > 30 &&
      !line.startsWith("#") &&
      !line.toLowerCase().includes("install")
    )
    .slice(0, 3);
};

const pointsfromReadme = async (readme)=>{
    const client = getGroqClient();

    if(!client){
        return fallbackExtractor(readme);
    }

    try{
        const response = await client.chat.completions.create({
            model : 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            messages : [
                {
                    role: 'system',
                        content: `You are an expert resume writer.
                                Convert the GitHub README into 3-5 strong resume bullet points.

                                Rules:
                                - Start each bullet with an action verb (Built, Developed, Implemented)
                                - Focus on features, functionality, and impact
                                - Keep each bullet concise (1 line)
                                - Do NOT include installation steps or setup instructions

                                Return ONLY valid JSON:
                                {
                                    "points" : ["point1", "point2"]
                                }`
                },
                {
                    role : 'user',
                    content : `Generate Resume Bullet Points from this readme : ${readme.slice(0, 4000)}`,
                },
            ],
            temperature : 0.7,
        })

        const result = response.choices[0].message.content;
        try{
            const parsed = JSON.parse(result);
            return parsed.points ||[];
        }catch(error){
            return result
                .split("\n")
                .map(line => line.trim().replace(/^[-•*]\s*/, ""))
                .filter(line =>
                    line.length > 15 &&
                    !line.startsWith("#") &&
                    !line.toLowerCase().includes("install")
                )
                .slice(0, 5);
        }
    }catch(error){
        console.log(error);
        return fallbackExtractor(readme);
    }
}

module.exports = {
    generateJSON,
    generateText,
    getGroqClient, 
    generatePointsfromDescription,
    enhanceText,
    pointsfromReadme
};
