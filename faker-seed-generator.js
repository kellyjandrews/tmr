// faker-seed-generator.js
// A script to generate realistic seed data for Supabase using Faker

import { faker } from '@faker-js/faker';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Configuration
const CONFIG = {
  users: 50,               // Number of users to generate
  storesPercentage: 0.7,   // Percentage of users that have stores
  maxListingsPerStore: 150, // Maximum number of listings per store
  categoriesPerListing: 1, // Number of categories per listing
  outputFile: 'supabase/seed.sql',
};

// Helper to generate UUIDs (for consistency with Supabase)
function uuidv4() {
  return faker.string.uuid();
}

// Generate fixed category data structure
function generateCategories() {
  return [
    { id: uuidv4(), name: 'Wands', description: 'Magical implements for focusing and directing magical energy' },
    { id: uuidv4(), name: 'Potions', description: 'Brewed magical substances with various effects' },
    { id: uuidv4(), name: 'Grimoires', description: 'Magical books and texts' },
    { id: uuidv4(), name: 'Crystals', description: 'Powerful magical stones and gems' },
    { id: uuidv4(), name: 'Artifacts', description: 'Rare and powerful magical objects' },
    { id: uuidv4(), name: 'Magical Ingredients', description: 'Components used in magical crafting and brewing' },
  ]
  
}

// Generate users with auth data
function generateUsers(count) {
  const users = [];
  const profiles = [];
  const identities = [];
  
  for (let i = 0; i < count; i++) {
    const userId = uuidv4();
    const email = faker.internet.email().toLowerCase();
    const fullName = faker.person.fullName();
    
    // User entry
    users.push({
      id: userId,
      email: email,
      encrypted_password: '$2a$10$6aKm6yAIYgGKbZl7F4n.wOfKT8RUF9JrFl8.LkIBLfD/Ap3uMo/Vi', // Placeholder hash
      email_confirmed_at: faker.date.past(),
      raw_app_meta_data: JSON.stringify({ provider: 'email', providers: ['email'] }),
      raw_user_meta_data: JSON.stringify({ name: fullName }),
      created_at: faker.date.past(),
      instance_id: '00000000-0000-0000-0000-000000000000'
    });
    
    // Identity entry
    identities.push({
      provider_id: userId,
      user_id: userId,
      identity_data: JSON.stringify({ sub: userId, email: email }),
      provider: 'email',
      last_sign_in_at: faker.date.recent(),
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    });
    
    // Profile entry
    profiles.push({
      id: userId,
      email: email,
      full_name: fullName,
      avatar_url: Math.random() > 0.7 ? faker.image.avatar() : null,
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    });
  }
  
  return { users, identities, profiles };
}

// Generate store data
function generateStores(users, storePercentage) {
  const stores = [];
  const storeUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, Math.floor(users.length * storePercentage));
  
for (const user of storeUsers) {
   
      const storeName = generateMagicalStoreName();
      const storeSlug = generateSlug(storeName);
      
      stores.push({
        id: uuidv4(),
        user_id: user.id,
        name: storeName,
        slug: storeSlug,
        created_at: user.created_at,
        updated_at: faker.date.recent()
      });
}
  
  return stores;
}

// Generate listings for stores
function generateListings(stores, categories, maxListingsPerStore) {
  const listings = [];
  const allCategories = [...categories.mainCategories, ...categories.subCategories];
  
for (const store of stores) {
    
      // Random number of listings per store
      const numListings = faker.number.int({ min: 1, max: maxListingsPerStore });
      
      for (let i = 0; i < numListings; i++) {
        // Randomly select a category
        const category = faker.helpers.arrayElement(allCategories);
        
        // Generate listing
        listings.push({
          id: uuidv4(),
          store_id: store.id,
          name: generateMagicalItemName(category.name),
          description: generateMagicalDescription(category.name),
          price: Number.parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
          created_at: store.created_at,
          updated_at: faker.date.recent(),
          category_id: category.id,
          image_url: Math.random() > 0.5 ? faker.image.url() : null,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'pending', 'sold']), // Weighted towards active
          quantity: faker.number.int({ min: 1, max: 100 })
        });
      }

}
  
  return listings;
}

// Helper functions for generating magical content
function generateMagicalStoreName() {
  const prefixes = ['Enchanted', 'Mystic', 'Arcane', 'Celestial', 'Ethereal', 'Whispering', 'Ancient', 'Astral'];
  const nouns = ['Emporium', 'Bazaar', 'Workshop', 'Apothecary', 'Library', 'Atelier', 'Nexus', 'Storehouse'];
  
  if (Math.random() > 0.5) {
    return `The ${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(nouns)}`;
  } 
}

function generateMagicalItemName(categoryName) {
  const materials = ['Silver', 'Crystal', 'Obsidian', 'Oak', 'Dragonscale', 'Moonstone', 'Ancient', 'Enchanted'];
  const adjectives = ['Mystical', 'Glowing', 'Whispering', 'Arcane', 'Ethereal', 'Luminous', 'Celestial'];
  
  // Base name depending on category
  let baseName = '';
  if (categoryName.includes('Wand')) {
    baseName = 'Wand';
  } else if (categoryName.includes('Potion')) {
    baseName = faker.helpers.arrayElement(['Potion', 'Elixir', 'Brew', 'Draught', 'Tincture']);
  } else if (categoryName.includes('Grimoire') || categoryName.includes('book')) {
    baseName = faker.helpers.arrayElement(['Grimoire', 'Spellbook', 'Tome', 'Codex', 'Scripture']);
  } else if (categoryName.includes('Crystal')) {
    baseName = faker.helpers.arrayElement(['Crystal', 'Gem', 'Stone', 'Shard', 'Prism']);
  } else if (categoryName.includes('Artifact')) {
    baseName = faker.helpers.arrayElement(['Artifact', 'Relic', 'Talisman', 'Charm', 'Amulet']);
  } else if (categoryName.includes('Ingredient')) {
    baseName = faker.helpers.arrayElement(['Essence', 'Powder', 'Root', 'Dust', 'Extract']);
  } else {
    baseName = 'Item';
  }
  
  // 50% chance to include a material
  if (Math.random() > 0.5) {
    return `${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(materials)} ${baseName}`;
  } 
}

function generateMagicalDescription(categoryName) {
  const descriptions = [
    `A rare and powerful ${categoryName.toLowerCase()} crafted with exceptional magical properties.`,
    `This extraordinary ${categoryName.toLowerCase()} emanates an aura of ancient power.`,
    `Carefully crafted by master artisans, this ${categoryName.toLowerCase()} holds secrets of forgotten magic.`,
    `Discovered in the ruins of a lost civilization, this ${categoryName.toLowerCase()} contains mysterious energies.`,
    `Blessed by mystical entities, this ${categoryName.toLowerCase()} grants its owner exceptional abilities.`
  ];
  
  const effects = [
    'It whispers ancient secrets to those who know how to listen.',
    'When activated, it glows with an otherworldly light.',
    'Those who possess it report enhanced magical abilities.',
    'It seems to change its properties depending on the phase of the moon.',
    'Strange symbols appear on its surface when exposed to moonlight.'
  ];
  
  return `${faker.helpers.arrayElement(descriptions)} ${faker.helpers.arrayElement(effects)} ${faker.lorem.sentence()}`;
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')  // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

// Generate SQL for inserting data
function generateSQL(data) {
  let sql = `-- Generated seed data: ${new Date().toISOString()}\n\n`;
  sql += "BEGIN;\n\n";
  
  // Users
  sql += "-- Users\n";
  sql += "INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at) VALUES\n";
  sql += data.users.map(user => 
    `('${user.instance_id}', '${user.id}', 'authenticated', 'authenticated', '${user.email}', '${user.encrypted_password}', '${formatDate(user.email_confirmed_at)}', '${user.raw_app_meta_data}', '${user.raw_user_meta_data}', '${formatDate(user.created_at)}')`
  ).join(',\n');
  sql += ";\n\n";
  
  // Identities
  sql += "-- Identities\n";
  sql += "INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES\n";
  sql += data.identities.map(identity => 
    `('${identity.provider_id}', '${identity.user_id}', '${identity.identity_data}', '${identity.provider}', '${formatDate(identity.last_sign_in_at)}', '${formatDate(identity.created_at)}', '${formatDate(identity.updated_at)}')`
  ).join(',\n');
  // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
  sql += `;\n\n`;
  
  // Profiles
  sql += "-- Profiles\n";
  // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
  sql += `INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at) VALUES\n`;
  sql += data.profiles.map(profile => 
    `('${profile.id}', '${profile.email}', '${profile.full_name}', ${profile.avatar_url ? `'${profile.avatar_url}'` : 'NULL'}, '${formatDate(profile.created_at)}', '${formatDate(profile.updated_at)}')`
  ).join(',\n');
  sql += ";\n\n";
  
  // Categories
  sql += "-- Main Categories\n";
  sql += "INSERT INTO public.categories (id, name, description, parent_id, created_at, updated_at) VALUES\n";
  sql += data.categories.mainCategories.map(cat => 
    `('${cat.id}', '${cat.name}', '${cat.description}', NULL, NOW(), NOW())`
  ).join(',\n');
  sql += ";\n\n";
  
  sql += "-- Sub Categories\n";
  sql += "INSERT INTO public.categories (id, name, description, parent_id, created_at, updated_at) VALUES\n";
  sql += data.categories.subCategories.map(cat => 
    `('${cat.id}', '${cat.name}', '${cat.description}', '${cat.parent_id}', NOW(), NOW())`
  ).join(',\n');
  sql += ";\n\n";
  
  // Stores
  sql += "-- Stores\n";
  sql += "INSERT INTO public.stores (id, user_id, name, slug, created_at, updated_at) VALUES\n";
  sql += data.stores.map(store => 
    `('${store.id}', '${store.user_id}', '${store.name.replace(/'/g, "''")}', '${store.slug}', '${formatDate(store.created_at)}', '${formatDate(store.updated_at)}')`
  ).join(',\n');
  sql += ";\n\n";
  
  // Listings
  // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
      sql += `-- Listings\n`;
  sql += "INSERT INTO public.listings (id, store_id, name, description, price, created_at, updated_at, category_id, image_url, status, quantity) VALUES\n";
  sql += data.listings.map(listing => 
    `('${listing.id}', '${listing.store_id}', '${listing.name.replace(/'/g, "''")}', '${listing.description.replace(/'/g, "''")}', ${listing.price}, '${formatDate(listing.created_at)}', '${formatDate(listing.updated_at)}', '${listing.category_id}', ${listing.image_url ? `'${listing.image_url}'` : 'NULL'}, '${listing.status}', ${listing.quantity})`
  ).join(',\n');
  sql += ";\n\n";
  
  sql += "COMMIT;\n";
  return sql;
}

function formatDate(date) {
  return date.toISOString();
}

// Main function to generate all data
async function generateSeedData() {
  console.log('Generating seed data...');
  
  // Generate data
  const categories = generateCategories();
  const { users, identities, profiles } = generateUsers(CONFIG.users);
  const stores = generateStores(users, CONFIG.storesPercentage);
  const listings = generateListings(stores, categories, CONFIG.maxListingsPerStore);
  
  // Combine all data
  const allData = {
    users,
    identities,
    profiles,
    categories,
    stores,
    listings
  };
  
  // Generate SQL
  const sql = generateSQL(allData);
  
  // Ensure directory exists
  const dir = dirname(CONFIG.outputFile);
  if (!existsSync(dir)){
    mkdirSync(dir, { recursive: true });
  }
  
  // Write to file
  writeFileSync(CONFIG.outputFile, sql);
  
  console.log(`Seed data generated successfully to ${CONFIG.outputFile}`);
  console.log(`Generated: ${users.length} users, ${stores.length} stores, ${listings.length} listings`);
}

// Run the generator
generateSeedData().catch(console.error);