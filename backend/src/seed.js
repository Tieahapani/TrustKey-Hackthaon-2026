/**
 * Seed script — populates the database with sample listings for demo.
 * 
 * Usage:
 *   cd backend
 *   node src/seed.js
 * 
 * Requires MONGODB_URI in .env
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Listing = require('./models/Listing');
const User = require('./models/User');

const sampleListings = [
  {
    title: 'Sunny 2BR Apartment in Mission District',
    description: 'Beautiful sun-filled 2-bedroom apartment in the heart of the Mission District. Recently renovated with modern finishes, hardwood floors throughout, and a spacious open-concept kitchen. Walking distance to BART, restaurants, and shops. The unit features large windows with great natural light, a private balcony, and in-unit washer/dryer.',
    address: '2456 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    price: 3200,
    listingType: 'rent',
    photos: [],
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    amenities: ['In-Unit Laundry', 'Hardwood Floors', 'Balcony', 'Air Conditioning', 'Pet-Friendly'],
    propertyDetails: 'Pets allowed with $500 deposit. Street parking available, no garage. BART is 5 min walk (16th St Mission station). Move-in cost: first month + last month + $3200 security deposit. Lease term: 12 months minimum. Utilities: tenant pays electric and internet, water/gas included.',
    screeningCriteria: {
      minCreditScore: 680,
      minIncomeMultiplier: 3,
      noEvictions: true,
      noBankruptcy: true,
    },
  },
  {
    title: 'Modern Studio in Downtown Oakland',
    description: 'Sleek modern studio apartment in a newly built complex in downtown Oakland. Features floor-to-ceiling windows with stunning city views, in-building gym and rooftop terrace, secure parking garage, and 24/7 concierge. Perfect for young professionals.',
    address: '1200 Broadway',
    city: 'Oakland',
    state: 'CA',
    price: 1800,
    listingType: 'rent',
    photos: [],
    bedrooms: 0,
    bathrooms: 1,
    sqft: 500,
    amenities: ['Gym', 'Elevator', 'Doorman', 'Parking', 'Air Conditioning', 'Unfurnished'],
    propertyDetails: 'No pets allowed. One parking spot included ($200/mo value). Building has package lockers and bike storage. Lake Merritt is 3 blocks away. 12th St BART station is 2 min walk. Move-in: first + security deposit ($1800). Utilities not included.',
    screeningCriteria: {
      minCreditScore: 650,
      minIncomeMultiplier: 2.5,
      noEvictions: true,
      noBankruptcy: false,
    },
  },
  {
    title: 'Spacious 3BR Family Home in Palo Alto',
    description: 'Charming single-family home in a quiet Palo Alto neighborhood. Features 3 bedrooms, 2 bathrooms, a large backyard with mature fruit trees, attached 2-car garage, and a recently updated kitchen with granite countertops. Excellent school district (Palo Alto Unified).',
    address: '850 Middlefield Road',
    city: 'Palo Alto',
    state: 'CA',
    price: 5500,
    listingType: 'rent',
    photos: [],
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    amenities: ['Parking', 'Pet-Friendly', 'Dishwasher', 'Air Conditioning', 'Heating', 'Storage'],
    propertyDetails: 'Large fenced backyard, great for kids and pets. 2-car garage included. Near Stanford University (10 min drive). Close to California Ave shopping district. Gardener included. Pets welcome (2 max, no breed restrictions). Move-in: first month + $8000 security deposit. Lease: 12 months.',
    screeningCriteria: {
      minCreditScore: 720,
      minIncomeMultiplier: 3,
      noEvictions: true,
      noBankruptcy: true,
    },
  },
  {
    title: 'Luxury 1BR Condo with Bay Views',
    description: 'Stunning luxury condo on the waterfront with panoramic San Francisco Bay views. This 1-bedroom features high-end finishes including marble countertops, European appliances, smart home system, and a private terrace. Building amenities include infinity pool, spa, and valet parking.',
    address: '338 Spear Street',
    city: 'San Francisco',
    state: 'CA',
    price: 850000,
    listingType: 'sale',
    photos: [],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 780,
    amenities: ['Pool', 'Gym', 'Doorman', 'Elevator', 'Parking', 'Air Conditioning', 'Balcony'],
    propertyDetails: 'HOA: $650/month (includes water, trash, building amenities, earthquake insurance). 1 valet parking spot included. Storage unit in basement. Embarcadero BART is 5 min walk. Ferry Building marketplace next door. Smart home with Nest thermostat and keyless entry.',
    screeningCriteria: {
      minCreditScore: 750,
      minIncomeMultiplier: 0,
      noEvictions: false,
      noBankruptcy: true,
    },
  },
  {
    title: 'Cozy 1BR near UC Berkeley Campus',
    description: 'Affordable and cozy 1-bedroom apartment just 2 blocks from the UC Berkeley campus. Perfect for graduate students or young professionals. Features include hardwood floors, updated bathroom, shared laundry room, and a quiet tree-lined street.',
    address: '2530 Channing Way',
    city: 'Berkeley',
    state: 'CA',
    price: 1650,
    listingType: 'rent',
    photos: [],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
    amenities: ['Shared Laundry', 'Hardwood Floors', 'Heating'],
    propertyDetails: 'Cats only (no dogs). Street parking with residential permit. Downtown Berkeley BART is 5 min walk. Near Gourmet Ghetto restaurants. Water and trash included. Electric and internet paid by tenant. Move-in: first + last + $1650 deposit. Month-to-month after initial 12-month lease.',
    screeningCriteria: {
      minCreditScore: 620,
      minIncomeMultiplier: 2.5,
      noEvictions: true,
      noBankruptcy: false,
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a demo seller user if none exists
    let seller = await User.findOne({ email: 'demo-seller@homescreen.app' });
    if (!seller) {
      seller = await User.create({
        firebaseUid: 'demo-seller-uid-' + Date.now(),
        email: 'demo-seller@homescreen.app',
        name: 'Demo Seller',
        role: 'seller',
        phone: '(555) 123-4567',
      });
      console.log('Created demo seller');
    }

    // Clear existing listings from this seller
    await Listing.deleteMany({ sellerId: seller._id });
    console.log('Cleared old demo listings');

    // Insert sample listings
    const listings = await Listing.insertMany(
      sampleListings.map((l) => ({ ...l, sellerId: seller._id }))
    );
    console.log(`Seeded ${listings.length} listings`);

    // Also create a demo buyer
    let buyer = await User.findOne({ email: 'demo-buyer@homescreen.app' });
    if (!buyer) {
      buyer = await User.create({
        firebaseUid: 'demo-buyer-uid-' + Date.now(),
        email: 'demo-buyer@homescreen.app',
        name: 'Demo Buyer',
        role: 'buyer',
        phone: '(555) 987-6543',
      });
      console.log('Created demo buyer');
    }

    console.log('\nSeed complete! Sample listings:');
    listings.forEach((l) => {
      console.log(`  - ${l.title} (${l.city}) — $${l.price}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
