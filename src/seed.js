/**
 * Seed script — populates MongoDB with sample listings and uploads
 * property images to Vultr Object Storage.
 *
 * Usage:
 *   cd backend
 *   node src/seed.js
 *
 * Requires MONGODB_URI and VULTR_* env vars in .env
 */
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const Listing = require('./models/Listing');
const User = require('./models/User');

/* ------------------------------------------------------------------ */
/*  Vultr S3 client                                                    */
/* ------------------------------------------------------------------ */

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.VULTR_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VULTR_ACCESS_KEY,
    secretAccessKey: process.env.VULTR_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.VULTR_BUCKET_NAME || 'trustkey';

/**
 * Download an image from a URL and upload it to Vultr Object Storage.
 * Returns the public URL of the uploaded file.
 */
async function uploadImageToVultr(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
  const buffer = Buffer.from(response.data);
  const contentType = response.headers['content-type'] || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const key = `listings/${crypto.randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));

  return `${process.env.VULTR_ENDPOINT}/${BUCKET}/${key}`;
}

/* ------------------------------------------------------------------ */
/*  Unsplash image URLs (random architectural/interior photos)         */
/* ------------------------------------------------------------------ */

const PROPERTY_IMAGES = [
  // Modern apartments & lofts
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', // living room
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', // apartment interior
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // kitchen
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', // bedroom
  // Luxury homes
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // modern house exterior
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // luxury home
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // modern interior
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // pool house
  // Cozy spaces
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', // kitchen modern
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80', // bathroom
  'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800&q=80', // living room 2
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // modern exterior
  // City views & exteriors
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', // apartment building
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // modern villa
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', // suburban house
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // colorful house
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80', // condo exterior
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', // modern house 2
];

/* ------------------------------------------------------------------ */
/*  Sample listing data — covers all 6 frontend filter cities          */
/* ------------------------------------------------------------------ */

const sampleListings = [
  // ---- Austin ----
  {
    title: 'Modern Downtown Austin Loft',
    description: 'Stylish industrial loft in the heart of downtown Austin. Exposed brick walls, polished concrete floors, and floor-to-ceiling windows with skyline views. Walk to Rainey Street, Lady Bird Lake, and dozens of restaurants.',
    address: '301 Congress Ave',
    city: 'Austin',
    state: 'TX',
    price: 2800,
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    amenities: ['Gym', 'Pool', 'Parking', 'Air Conditioning', 'In-Unit Laundry', 'Balcony'],
    propertyDetails: 'Pet-friendly with deposit. Rooftop pool and lounge. 1 parking spot included.',
    screeningCriteria: { minCreditScore: 680, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [0, 2, 6],
  },
  {
    title: 'Charming 3BR Bungalow in East Austin',
    description: 'Renovated craftsman bungalow in trendy East Austin. Original hardwood floors, updated kitchen with quartz countertops, and a large fenced backyard with mature pecan trees. Close to the best coffee shops, tacos, and live music on the east side.',
    address: '1812 E 12th Street',
    city: 'Austin',
    state: 'TX',
    price: 425000,
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    amenities: ['Pet-Friendly', 'Hardwood Floors', 'Storage', 'Parking'],
    propertyDetails: 'Detached garage, fenced yard. Near Mueller development and Thinkery Museum.',
    screeningCriteria: { minCreditScore: 700, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [15, 14, 8],
  },

  // ---- Portland ----
  {
    title: 'Pearl District Luxury Condo',
    description: 'Upscale 2-bedroom condo in Portland\'s iconic Pearl District. European oak flooring, Bosch appliances, floor-to-ceiling windows, and a private terrace overlooking the city. Building features include a library lounge, rooftop garden, and bike storage.',
    address: '1255 NW 9th Ave',
    city: 'Portland',
    state: 'OR',
    price: 3500,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    amenities: ['Gym', 'Elevator', 'Doorman', 'Balcony', 'Air Conditioning', 'In-Unit Laundry'],
    propertyDetails: 'Concierge service. Walking distance to Powell\'s Books and Jamison Square.',
    screeningCriteria: { minCreditScore: 720, noEvictions: true, noBankruptcy: true, noCriminal: true, noFraud: false },
    _imageIndices: [1, 3, 9],
  },
  {
    title: 'Cozy Hawthorne Studio',
    description: 'Bright and efficient studio in the heart of Hawthorne Boulevard. Large bay window, bamboo floors, and a modern kitchenette. Steps from vintage shops, cafes, and the Hawthorne Bridge for easy bike commuting downtown.',
    address: '3420 SE Hawthorne Blvd',
    city: 'Portland',
    state: 'OR',
    price: 1350,
    listingType: 'rent',
    bedrooms: 0,
    bathrooms: 1,
    sqft: 450,
    amenities: ['Shared Laundry', 'Hardwood Floors', 'Heating'],
    propertyDetails: 'Cats allowed. Water and trash included. Bike-friendly neighborhood.',
    screeningCriteria: { minCreditScore: 600, noEvictions: true, noBankruptcy: false, noCriminal: false, noFraud: false },
    _imageIndices: [10, 0],
  },

  // ---- Miami ----
  {
    title: 'Oceanfront Penthouse in South Beach',
    description: 'Stunning 3-bedroom penthouse with wraparound terrace and panoramic Atlantic Ocean views. Italian marble floors, Gaggenau kitchen, and a private elevator entrance. Full-service building with beach club, infinity pool, spa, and valet.',
    address: '321 Ocean Dr',
    city: 'Miami',
    state: 'FL',
    price: 1850000,
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2800,
    amenities: ['Pool', 'Gym', 'Doorman', 'Elevator', 'Parking', 'Balcony', 'Air Conditioning'],
    propertyDetails: 'HOA $2,100/mo. 2 valet parking spots. Direct beach access. Smart home system.',
    screeningCriteria: { minCreditScore: 750, noEvictions: false, noBankruptcy: true, noCriminal: true, noFraud: true },
    _imageIndices: [5, 7, 6, 9],
  },
  {
    title: 'Brickell 1BR with City Views',
    description: 'Modern 1-bedroom in the financial heart of Miami. Floor-to-ceiling windows with Biscayne Bay and skyline views. Resort-style amenities including rooftop pool, co-working space, and a residents-only restaurant.',
    address: '1010 Brickell Ave',
    city: 'Miami',
    state: 'FL',
    price: 2900,
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750,
    amenities: ['Pool', 'Gym', 'Parking', 'Elevator', 'Air Conditioning'],
    propertyDetails: 'Valet and self-parking available. Metromover station adjacent to building.',
    screeningCriteria: { minCreditScore: 680, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [12, 1, 3],
  },

  // ---- Denver ----
  {
    title: 'RiNo Arts District Townhome',
    description: 'Contemporary 2-bedroom townhome in Denver\'s booming River North Arts District. Open floor plan with 12-foot ceilings, a chef\'s kitchen, and a private rooftop deck with mountain views. Walk to breweries, galleries, and the Platte River trail.',
    address: '2740 Walnut Street',
    city: 'Denver',
    state: 'CO',
    price: 3200,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    amenities: ['Parking', 'In-Unit Laundry', 'Balcony', 'Heating', 'Air Conditioning', 'Pet-Friendly'],
    propertyDetails: 'Attached 1-car garage. Rooftop deck with gas fire pit. Dog-friendly.',
    screeningCriteria: { minCreditScore: 700, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [4, 8, 11],
  },
  {
    title: 'Highland Ranch Family Home',
    description: 'Spacious 4-bedroom family home in sought-after Highlands neighborhood. Remodeled kitchen with Viking appliances, finished basement with home theater, and a beautifully landscaped yard. Top-rated Denver school district.',
    address: '3456 W 32nd Ave',
    city: 'Denver',
    state: 'CO',
    price: 675000,
    listingType: 'sale',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2600,
    amenities: ['Parking', 'Pet-Friendly', 'Storage', 'Dishwasher', 'Heating', 'Air Conditioning'],
    propertyDetails: '2-car garage, finished basement, mountain views from master bedroom.',
    screeningCriteria: { minCreditScore: 720, noEvictions: true, noBankruptcy: true, noCriminal: true, noFraud: false },
    _imageIndices: [14, 5, 2, 10],
  },

  // ---- San Francisco ----
  {
    title: 'Sunny 2BR in Mission District',
    description: 'Beautiful sun-filled 2-bedroom apartment in the heart of the Mission District. Recently renovated with modern finishes, hardwood floors throughout, and a spacious open-concept kitchen. Walking distance to BART, restaurants, and shops.',
    address: '2456 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    price: 3200,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    amenities: ['In-Unit Laundry', 'Hardwood Floors', 'Balcony', 'Air Conditioning', 'Pet-Friendly'],
    propertyDetails: 'Pets allowed with $500 deposit. 5 min walk to 16th St Mission BART.',
    screeningCriteria: { minCreditScore: 680, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [0, 2, 3],
  },
  {
    title: 'Luxury Bay View Condo',
    description: 'Stunning luxury condo on the waterfront with panoramic San Francisco Bay views. High-end finishes including marble countertops, European appliances, and smart home system. Building features infinity pool, spa, and valet parking.',
    address: '338 Spear Street',
    city: 'San Francisco',
    state: 'CA',
    price: 850000,
    listingType: 'sale',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 780,
    amenities: ['Pool', 'Gym', 'Doorman', 'Elevator', 'Parking', 'Air Conditioning', 'Balcony'],
    propertyDetails: 'HOA: $650/month. 1 valet parking spot included. Embarcadero BART 5 min walk.',
    screeningCriteria: { minCreditScore: 750, noEvictions: false, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [12, 6, 9, 7],
  },

  // ---- Charlotte ----
  {
    title: 'Uptown Charlotte High-Rise',
    description: 'Sleek 1-bedroom in a premier Uptown Charlotte high-rise. Floor-to-ceiling windows with city views, chef\'s kitchen with waterfall island, and spa-like bathroom. Steps from the Lynx light rail, Spectrum Center, and the best dining in Charlotte.',
    address: '210 E Trade Street',
    city: 'Charlotte',
    state: 'NC',
    price: 2200,
    listingType: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 820,
    amenities: ['Pool', 'Gym', 'Elevator', 'Parking', 'Air Conditioning', 'In-Unit Laundry'],
    propertyDetails: 'Concierge, rooftop pool, co-working lounge. 1 garage parking spot included.',
    screeningCriteria: { minCreditScore: 650, noEvictions: true, noBankruptcy: false, noCriminal: false, noFraud: false },
    _imageIndices: [13, 1, 8],
  },
  {
    title: 'South End Townhome with Rooftop',
    description: 'Brand new 3-bedroom townhome in Charlotte\'s vibrant South End. Open-concept living with 10-foot ceilings, quartz countertops, and a private rooftop terrace with skyline views. On the Rail Trail — walk or bike to breweries, shops, and light rail.',
    address: '1520 S Tryon Street',
    city: 'Charlotte',
    state: 'NC',
    price: 520000,
    listingType: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1900,
    amenities: ['Parking', 'Balcony', 'In-Unit Laundry', 'Air Conditioning', 'Heating', 'Pet-Friendly'],
    propertyDetails: '2-car garage. Rooftop terrace with gas grill hookup. South End Rail Trail access.',
    screeningCriteria: { minCreditScore: 700, noEvictions: true, noBankruptcy: true, noCriminal: false, noFraud: false },
    _imageIndices: [17, 4, 11, 2],
  },
];

/* ------------------------------------------------------------------ */
/*  Main seed function                                                 */
/* ------------------------------------------------------------------ */

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    /* ---- Create demo users ---- */
    let seller = await User.findOne({ email: 'demo-seller@trustkey.app' });
    if (!seller) {
      seller = await User.create({
        firebaseUid: 'demo-seller-uid-' + Date.now(),
        email: 'demo-seller@trustkey.app',
        name: 'Alex Johnson',
        role: 'seller',
        phone: '(555) 123-4567',
      });
      console.log('Created demo seller: Alex Johnson');
    } else {
      console.log('Demo seller already exists');
    }

    let buyer = await User.findOne({ email: 'demo-buyer@trustkey.app' });
    if (!buyer) {
      buyer = await User.create({
        firebaseUid: 'demo-buyer-uid-' + Date.now(),
        email: 'demo-buyer@trustkey.app',
        name: 'Sam Rivera',
        role: 'buyer',
        phone: '(555) 987-6543',
      });
      console.log('Created demo buyer: Sam Rivera');
    }

    /* ---- Clear old demo listings ---- */
    const deleted = await Listing.deleteMany({ sellerId: seller._id });
    console.log(`\nCleared ${deleted.deletedCount} old demo listings`);

    /* ---- Upload images to Vultr ---- */
    console.log('\nUploading property images to Vultr Object Storage...');
    const uploadedUrls = new Map(); // imageIndex -> vultrUrl (cache to avoid duplicates)

    // Collect all unique image indices needed
    const neededIndices = new Set();
    for (const listing of sampleListings) {
      for (const idx of listing._imageIndices) {
        neededIndices.add(idx);
      }
    }

    // Upload each unique image
    for (const idx of neededIndices) {
      const sourceUrl = PROPERTY_IMAGES[idx];
      try {
        console.log(`  [${idx}] Downloading & uploading...`);
        const vultrUrl = await uploadImageToVultr(sourceUrl);
        uploadedUrls.set(idx, vultrUrl);
        console.log(`  [${idx}] Done -> ${vultrUrl}`);
      } catch (err) {
        console.error(`  [${idx}] Failed: ${err.message}`);
        // Use original Unsplash URL as fallback
        uploadedUrls.set(idx, sourceUrl);
      }
    }

    /* ---- Create listings ---- */
    console.log('\nCreating listings...');
    const listingDocs = sampleListings.map((l) => {
      const { _imageIndices, ...data } = l;
      return {
        ...data,
        sellerId: seller._id,
        photos: _imageIndices.map((idx) => uploadedUrls.get(idx) || PROPERTY_IMAGES[idx]),
      };
    });

    const created = await Listing.insertMany(listingDocs);
    console.log(`\nSeeded ${created.length} listings:\n`);
    created.forEach((l) => {
      const priceStr = l.listingType === 'rent'
        ? `$${l.price.toLocaleString()}/mo`
        : `$${l.price.toLocaleString()}`;
      console.log(`  ${l.listingType === 'rent' ? 'RENT' : 'SALE'} | ${l.city}, ${l.state} | ${priceStr} | ${l.title}`);
    });

    console.log('\nSeed complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  }
}

seed();
