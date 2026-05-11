import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Pick a current multimodal model; you can change this later if needed.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Returns true if the image looks safe for a student marketplace,
 * false if it contains sexual/explicit or obviously disallowed content.
 */
export async function isImageSafe(file) {
  // file is a Multer file with .buffer and .mimetype
  const base64 = file.buffer.toString("base64");

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "You are moderating an item listing image for a university marketplace. " +
              "If the image contains nudity, sexual content, fetish content, pornography, " +
              "or anything clearly inappropriate for college students, treat it as UNSAFE. " +
              "Otherwise it is SAFE.",
          },
          {
            inlineData: {
              mimeType: file.mimetype,
              data: base64,
            },
          },
        ],
      },
    ],
  });

  // Prefer explicit safety ratings if available
  const safetyRatings =
    result.response?.candidates?.[0]?.safetyRatings ??
    result.response?.promptFeedback?.safetyRatings ??
    [];

  // Basic rule: if Gemini thinks sexual/explicit content is medium+ or blocked, reject.
  const unsafe = safetyRatings.some((rating) => {
    const category = rating.category;
    const prob = rating.probability;

    const isSexualCategory =
      category === "HARM_CATEGORY_SEXUAL_CONTENT" ||
      category === "HARM_CATEGORY_SEXUALLY_EXPLICIT";

    const isLikely =
      prob === "MEDIUM" || prob === "HIGH" || prob === "VERY_LIKELY";

    return isSexualCategory && (isLikely || rating.blocked);
  });

  return !unsafe;
}
