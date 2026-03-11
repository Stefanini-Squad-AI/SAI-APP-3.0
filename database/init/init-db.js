// MongoDB Initialization Script
// Runs automatically when the MongoDB container is first created

print('========================================');
print('TuCreditoOnline - Database Initialization');
print('========================================');

db = db.getSiblingDB('tucreditoonline');

// ── Collections ───────────────────────────────────────────────────────────────

print('Creating collections...');

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'createdAt'],
      properties: {
        email:     { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        deletedAt: { bsonType: ['date', 'null'] }
      }
    }
  }
});

db.createCollection('credittypes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'baseInterestRate', 'maxAmount', 'createdAt'],
      properties: {
        name:             { bsonType: 'string' },
        baseInterestRate: { bsonType: 'double' },
        minAmount:        { bsonType: 'double' },
        maxAmount:        { bsonType: 'double' },
        minTermMonths:    { bsonType: 'int' },
        maxTermMonths:    { bsonType: 'int' },
        isActive:         { bsonType: 'bool' },
        createdAt:        { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('creditrequests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'requestedAmount', 'status', 'createdAt'],
      properties: {
        email:           { bsonType: 'string' },
        requestedAmount: { bsonType: 'double' },
        status:          { bsonType: 'string', enum: ['Pending', 'Approved', 'Rejected'] },
        createdAt:       { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('services');
db.createCollection('contactmessages');

// ── Indexes ───────────────────────────────────────────────────────────────────

print('Creating indexes...');

// Users
db.users.createIndex({ email: 1 },      { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ deletedAt: 1 });

// Credit types — isActive is filtered on every public page load
db.credittypes.createIndex({ isActive: 1 });
db.credittypes.createIndex({ name: 1 }, { unique: true });
db.credittypes.createIndex({ createdAt: 1 });

// Credit requests — status is the primary dashboard filter
db.creditrequests.createIndex({ status: 1 });
db.creditrequests.createIndex({ email: 1 });
db.creditrequests.createIndex({ createdAt: -1 });

// Contact messages
db.contactmessages.createIndex({ status: 1 });
db.contactmessages.createIndex({ createdAt: -1 });

// ── Seed Data ─────────────────────────────────────────────────────────────────

print('Seeding credit types...');

const now = new Date();

db.credittypes.insertMany([
  {
    name: 'Personal Credit',
    description: 'For personal expenses: travel, home improvements, emergencies and more.',
    baseInterestRate: 18.0,
    minAmount: 5000.0,
    maxAmount: 200000.0,
    minTermMonths: 12,
    maxTermMonths: 60,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  },
  {
    name: 'Express Credit',
    description: 'Same-day approval for small amounts. No collateral required.',
    baseInterestRate: 24.0,
    minAmount: 1000.0,
    maxAmount: 50000.0,
    minTermMonths: 6,
    maxTermMonths: 24,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  },
  {
    name: 'Consolidation Credit',
    description: 'Combine all your existing debts into one manageable monthly payment.',
    baseInterestRate: 15.0,
    minAmount: 10000.0,
    maxAmount: 300000.0,
    minTermMonths: 24,
    maxTermMonths: 120,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  },
  {
    name: 'Business Credit',
    description: 'Flexible financing to grow your business or cover operating costs.',
    baseInterestRate: 16.0,
    minAmount: 20000.0,
    maxAmount: 500000.0,
    minTermMonths: 12,
    maxTermMonths: 84,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  }
]);

print('');
print('========================================');
print('Initialization complete!');
print('');
print('Next step: create the first admin user via Swagger:');
print('  POST http://localhost:5000/swagger  →  /api/auth/register');
print('  { "email": "admin@example.com", "password": "Admin123!", "fullName": "Admin", "role": "Admin" }');
print('========================================');
