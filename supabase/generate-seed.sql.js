import { faker } from '@faker-js/faker';
import fs from 'node:fs/promises';

const NUM_USERS = 20;
const NUM_ITEMS_PER_SHOP = 5;

// SQL escaping helper
function escapeSQLString(str) {
  return str.replace(/'/g, "''");
}

// Categories setup (using fixed UUIDs for reliable references)
const mainCategories = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Wands',
    description: 'Magical implements for focusing and directing magical energy',
    subcategories: [
      { id: '11111111-1111-1111-1111-111111111112', name: 'Wooden Wands', description: 'Traditional wands crafted from various woods', parent_id: '11111111-1111-1111-1111-111111111111' },
      { id: '11111111-1111-1111-1111-111111111113', name: 'Crystal Wands', description: 'Wands incorporating crystals and gems', parent_id: '11111111-1111-1111-1111-111111111111' },
      { id: '11111111-1111-1111-1111-111111111114', name: 'Artifact Wands', description: 'Ancient or historically significant wands', parent_id: '11111111-1111-1111-1111-111111111111' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Potions',
    description: 'Brewed magical substances with various effects',
    subcategories: [
      { id: '22222222-2222-2222-2222-222222222223', name: 'Healing Potions', description: 'Restorative and curative brews', parent_id: '22222222-2222-2222-2222-222222222222' },
      { id: '22222222-2222-2222-2222-222222222224', name: 'Transformation Potions', description: 'Potions that alter appearance or form', parent_id: '22222222-2222-2222-2222-222222222222' },
      { id: '22222222-2222-2222-2222-222222222225', name: 'Utility Potions', description: 'Practical magical solutions', parent_id: '22222222-2222-2222-2222-222222222222' }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Grimoires',
    description: 'Magical books and texts',
    subcategories: [
      { id: '33333333-3333-3333-3333-333333333334', name: 'Spellbooks', description: 'Collections of spells and incantations', parent_id: '33333333-3333-3333-3333-333333333333' },
      { id: '33333333-3333-3333-3333-333333333335', name: 'Ritual Texts', description: 'Guides for magical ceremonies', parent_id: '33333333-3333-3333-3333-333333333333' },
      { id: '33333333-3333-3333-3333-333333333336', name: 'Historical Texts', description: 'Ancient magical knowledge and history', parent_id: '33333333-3333-3333-3333-333333333333' }
    ]
  }
];

// Helper arrays for item generation
const conditions = ['Pristine', 'Slightly Used', 'Well-Worn', 'Ancient', 'Restored'];
const materials = ['Oak', 'Elder', 'Crystal', 'Dragon Bone', 'Phoenix Feather', 'Unicorn Hair'];
const adjectives = ['Mystical', 'Enchanted', 'Powerful', 'Mysterious', 'Arcane', 'Celestial'];
const shopTypes = ['Magical Emporium', 'Arcane Shop', 'Mystic Supplies', 'Enchanted Goods'];

function generateMagicalItem(category) {
  const material = faker.helpers.arrayElement(materials);
  const condition = faker.helpers.arrayElement(conditions).toLowerCase();
  const adjective = faker.helpers.arrayElement(adjectives);
  
  if (category.includes('Wands')) {
    return {
      name: `${adjective} ${material} Wand`,
      description: `A ${condition} wand crafted from ${material.toLowerCase()}. ${faker.lorem.sentence()}`
    };
  } 
  
  if (category.includes('Potions')) {
    return {
      name: `${adjective} ${faker.word.adjective()} Potion`,
      description: `A ${condition} bottle containing a ${faker.color.human()} liquid. ${faker.lorem.sentence()}`
    };
  }
  
  return {
    name: `${adjective} ${faker.word.noun()} Grimoire`,
    description: `A ${condition} tome bound in ${faker.color.human()} leather. ${faker.lorem.sentence()}`
  };
}

async function generateSeedFile() {
  let sql = '-- Generated Seed File\n\n';
  
  // Add categories
  sql += '-- Categories\n';
  for (const cat of mainCategories) {
    sql += `INSERT INTO public.categories (id, name, description, parent_id) VALUES
('${cat.id}', '${escapeSQLString(cat.name)}', '${escapeSQLString(cat.description)}', null);\n\n`;
    
    for (const sub of cat.subcategories) {
      sql += `INSERT INTO public.categories (id, name, description, parent_id) VALUES
('${sub.id}', '${escapeSQLString(sub.name)}', '${escapeSQLString(sub.description)}', '${sub.parent_id}');\n\n`;
    }
  }
  
  // Generate users and their shops
  sql += '-- Auth Users and Profiles\n';
  const users = [];
  
  for (let i = 0; i < NUM_USERS; i++) {
    const userId = faker.string.uuid();
    const email = faker.internet.email();
    const hashedPassword = 'SOME_HASHED_PASSWORD';
    const firstName = escapeSQLString(faker.person.firstName());
    const shopId = faker.string.uuid();
    const shopType = faker.helpers.arrayElement(shopTypes);
    const shopName = `${firstName}''s ${shopType}`;
    
    users.push({ userId, shopId });

    sql += `
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '${userId}',
      'authenticated',
      'authenticated',
      '${escapeSQLString(email)}',
      '${hashedPassword}',
      current_timestamp,
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      current_timestamp,
      current_timestamp,
      current_timestamp
    );\n\n`;

    sql += `
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      '${userId}',
      '${userId}',
      '{"sub":"${userId}","email":"${escapeSQLString(email)}"}',
      'email',
      current_timestamp,
      current_timestamp,
      current_timestamp
    );\n\n`;

    sql += `INSERT INTO public.profiles (id, email) VALUES 
('${userId}', '${escapeSQLString(email)}');\n\n`;
    
    sql += `INSERT INTO public.shops (id, user_id, name, description) VALUES
('${shopId}', '${userId}', '${escapeSQLString(shopName)}', '${escapeSQLString(faker.lorem.paragraph())}');\n\n`;
  }
  
  // Generate items for each shop
  sql += '-- Items\n';
  for (const user of users) {
    for (let i = 0; i < NUM_ITEMS_PER_SHOP; i++) {
      const randomCategory = faker.helpers.arrayElement(mainCategories);
      const subCategory = faker.helpers.arrayElement(randomCategory.subcategories);
      const item = generateMagicalItem(subCategory.name);
      const price = Number(faker.commerce.price({ min: 10, max: 1000 }));
      const quantity = faker.number.int({ min: 1, max: 10 });
      
      sql += `INSERT INTO public.items (id, shop_id, category_id, name, description, price, quantity) VALUES
('${faker.string.uuid()}', '${user.shopId}', '${subCategory.id}', '${escapeSQLString(item.name)}', '${escapeSQLString(item.description)}', ${price}, ${quantity});\n\n`;
    }
  }
  
  await fs.writeFile('./seed.sql', sql);
  console.log('Seed file generated successfully!');
}

generateSeedFile().catch(console.error);