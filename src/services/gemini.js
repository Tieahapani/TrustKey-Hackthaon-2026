const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Ask Gemini a question about a property listing.
 * @param {Object} listing - The listing document from MongoDB
 * @param {string} question - The buyer's question
 * @returns {string} The AI's text answer
 */
async function askAboutProperty(listing, question) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const amenitiesList = listing.amenities?.length
    ? listing.amenities.join(', ')
    : 'Not specified';

  const prompt = `You are a helpful and friendly property assistant for the listing: "${listing.title}" at ${listing.address}, ${listing.city}, ${listing.state}.

Here is everything you know about this property:
- Price: $${listing.price}${listing.listingType === 'rent' ? '/month' : ''}
- Type: ${listing.listingType === 'rent' ? 'For Rent' : 'For Sale'}
- Bedrooms: ${listing.bedrooms}
- Bathrooms: ${listing.bathrooms}
- Square footage: ${listing.sqft || 'Not specified'}
- Amenities: ${amenitiesList}
- Description: ${listing.description}
- Additional details: ${listing.propertyDetails || 'None provided'}

Answer the buyer's question based ONLY on the information above. Be concise, friendly, and helpful.
If you don't have enough information to answer, say "I don't have that specific detail — I'd recommend contacting the seller directly."

Buyer's question: "${question}"`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

module.exports = { askAboutProperty };
