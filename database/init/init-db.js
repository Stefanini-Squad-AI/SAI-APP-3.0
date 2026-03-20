// MongoDB Initialization Script
// Runs automatically when the MongoDB container is first created.
// All operations are wrapped in try/catch so a partial run can be retried safely.

print('========================================');
print('TuCreditoOnline - Database Initialization');
print('========================================');

db = db.getSiblingDB('tucreditoonline');

// ── Collections ───────────────────────────────────────────────────────────────

print('Creating collections...');

try {
  db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'passwordHash', 'fullName', 'role', 'isActive', 'createdAt'],
        properties: {
          email:        { bsonType: 'string', description: 'Unique email address — required' },
          passwordHash: { bsonType: 'string', description: 'BCrypt password hash — required' },
          fullName:     { bsonType: 'string', description: 'Display name — required' },
          role:         { bsonType: 'string', enum: ['Admin', 'SuperAdmin', 'Analista'], description: 'Access role — required' },
          isActive:     { bsonType: 'bool',   description: 'Account enabled flag — required' },
          createdAt:    { bsonType: 'date' },
          updatedAt:    { bsonType: 'date' },
          deletedAt:    { bsonType: ['date', 'null'] },
          lastLogin:    { bsonType: ['date', 'null'] }
        }
      }
    }
  });
  print('  ✓ users');
} catch (e) { print('  ⚠ users already exists — skipping'); }

try {
  db.createCollection('credittypes', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'baseInterestRate', 'maxAmount', 'createdAt'],
        properties: {
          name:             { bsonType: 'string' },
          description:      { bsonType: 'string' },
          baseInterestRate: { bsonType: 'double' },
          minAmount:        { bsonType: 'double' },
          maxAmount:        { bsonType: 'double' },
          minTermMonths:    { bsonType: 'int' },
          maxTermMonths:    { bsonType: 'int' },
          isActive:         { bsonType: 'bool' },
          createdAt:        { bsonType: 'date' },
          updatedAt:        { bsonType: ['date', 'null'] },
          deletedAt:        { bsonType: ['date', 'null'] }
        }
      }
    }
  });
  print('  ✓ credittypes');
} catch (e) { print('  ⚠ credittypes already exists — skipping'); }

try {
  db.createCollection('creditrequests', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'requestedAmount', 'status', 'createdAt'],
        properties: {
          // Applicant identity
          fullName:              { bsonType: 'string' },
          identificationNumber:  { bsonType: 'string' },
          email:                 { bsonType: 'string' },
          phone:                 { bsonType: 'string' },
          address:               { bsonType: 'string' },
          // Financial profile
          employmentStatus:      { bsonType: 'string', enum: ['Employed', 'Self-Employed'] },
          monthlySalary:         { bsonType: ['double', 'int'] },
          yearsOfEmployment:     { bsonType: ['double', 'int'] },
          // Credit details
          creditType:            { bsonType: 'string' },
          useOfMoney:            { bsonType: 'string' },
          requestedAmount:       { bsonType: ['double', 'int'] },
          termYears:             { bsonType: ['double', 'int'] },
          interestRate:          { bsonType: ['double', 'int'] },
          monthlyPayment:        { bsonType: ['double', 'int'] },
          totalPayment:          { bsonType: ['double', 'int'] },
          totalInterest:         { bsonType: ['double', 'int'] },
          // Lifecycle
          status:                { bsonType: 'string', enum: ['Pending', 'Approved', 'Rejected'] },
          requestDate:           { bsonType: ['date', 'null'] },
          createdAt:             { bsonType: 'date' },
          updatedAt:             { bsonType: ['date', 'null'] },
          // Resolution data
          approvedDate:          { bsonType: ['date', 'null'] },
          approvedAmount:        { bsonType: ['double', 'int', 'null'] },
          approvedTermMonths:    { bsonType: ['int', 'null'] },
          rejectedDate:          { bsonType: ['date', 'null'] },
          remarks:               { bsonType: ['string', 'null'] }
        }
      }
    }
  });
  print('  ✓ creditrequests');
} catch (e) { print('  ⚠ creditrequests already exists — skipping'); }

try {
  db.createCollection('services', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'displayOrder', 'isActive'],
        properties: {
          icon:         { bsonType: 'string' },
          title:        { bsonType: 'string' },
          description:  { bsonType: 'string' },
          displayOrder: { bsonType: 'int' },
          isActive:     { bsonType: 'bool' },
          createdAt:    { bsonType: ['date', 'null'] },
          updatedAt:    { bsonType: ['date', 'null'] }
        }
      }
    }
  });
  print('  ✓ services');
} catch (e) { print('  ⚠ services already exists — skipping'); }

try {
  db.createCollection('contactmessages', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'message', 'status', 'createdAt'],
        properties: {
          name:          { bsonType: 'string' },
          email:         { bsonType: 'string' },
          subject:       { bsonType: 'string' },
          message:       { bsonType: 'string' },
          // 0=New, 1=InProgress, 2=Replied, 3=Closed
          status:        { bsonType: 'int', minimum: 0, maximum: 3 },
          adminNotes:    { bsonType: ['string', 'null'] },
          respondedAt:   { bsonType: ['date', 'null'] },
          respondedBy:   { bsonType: ['string', 'null'] },
          closedAt:      { bsonType: ['date', 'null'] },
          closedBy:      { bsonType: ['string', 'null'] },
          createdAt:     { bsonType: 'date' }
        }
      }
    }
  });
  print('  ✓ contactmessages');
} catch (e) { print('  ⚠ contactmessages already exists — skipping'); }

// ── Indexes ───────────────────────────────────────────────────────────────────

print('Creating indexes...');

// users
try { db.users.createIndex({ email: 1 }, { unique: true }); } catch (e) { print('  ⚠ users.email index exists'); }
try { db.users.createIndex({ email: 1, isActive: 1 }); } catch (e) {}
try { db.users.createIndex({ role: 1 }); } catch (e) {}
try { db.users.createIndex({ createdAt: 1 }); } catch (e) {}
try { db.users.createIndex({ deletedAt: 1 }); } catch (e) {}
print('  ✓ users indexes');

// credittypes
try { db.credittypes.createIndex({ isActive: 1 }); } catch (e) {}
try { db.credittypes.createIndex({ name: 1 }, { unique: true }); } catch (e) { print('  ⚠ credittypes.name index exists'); }
try { db.credittypes.createIndex({ createdAt: 1 }); } catch (e) {}
print('  ✓ credittypes indexes');

// creditrequests
try { db.creditrequests.createIndex({ status: 1 }); } catch (e) {}
try { db.creditrequests.createIndex({ email: 1 }); } catch (e) {}
try { db.creditrequests.createIndex({ status: 1, createdAt: -1 }); } catch (e) {}
try { db.creditrequests.createIndex({ createdAt: -1 }); } catch (e) {}
print('  ✓ creditrequests indexes');

// services
try { db.services.createIndex({ isActive: 1, displayOrder: 1 }); } catch (e) {}
try { db.services.createIndex({ displayOrder: 1 }); } catch (e) {}
print('  ✓ services indexes');

// contactmessages
try { db.contactmessages.createIndex({ status: 1 }); } catch (e) {}
try { db.contactmessages.createIndex({ email: 1 }); } catch (e) {}
try { db.contactmessages.createIndex({ createdAt: -1 }); } catch (e) {}
print('  ✓ contactmessages indexes');

// ── Seed Data ─────────────────────────────────────────────────────────────────

print('Seeding credit types...');

const now = new Date();

try {
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
  print('  ✓ 4 credit types seeded');
} catch (e) { print('  ⚠ Credit types may already exist — skipping seed: ' + e.message); }

print('');
print('========================================');
print('Initialization complete!');
print('');
print('NOTE: The admin user is NOT seeded by this script.');
print('The backend application seeds it automatically on first startup.');
print('Default credentials are read from environment variables:');
print('  DefaultAdmin__Email    (default: admin@tucreditoonline.local)');
print('  DefaultAdmin__Password (default: Admin123!)');
print('');
print('Login endpoint: POST http://localhost:5000/api/auth/login');
print('========================================');
