// MongoDB Initialization Script
// This script runs when the MongoDB container is first created

print('========================================');
print('TuCreditoOnline - Database Initialization');
print('========================================');

// Switch to the application database
db = db.getSiblingDB('tucreditoonline');

// Create collections with validation
print('Creating collections...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required'
        },
        updatedAt: {
          bsonType: 'date'
        },
        deletedAt: {
          bsonType: ['date', 'null']
        }
      }
    }
  }
});

// Create indexes
print('Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ deletedAt: 1 });

print('Database initialization completed successfully!');
print('========================================');
